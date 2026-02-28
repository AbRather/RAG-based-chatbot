import os
import json
import sys
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- SECURE CONFIGURATION MANAGEMENT ---
# Explicitly point to the .env file in your current directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

# ARCHITECT CHECK: Fail-fast if the API key is missing
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    print("❌ FATAL ERROR: OPENAI_API_KEY not found in .env file.")
    print(f"Checked path: {env_path}")
    sys.exit(1)

# Core AI & Orchestration Imports
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_ollama import ChatOllama
from langchain_chroma import Chroma
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# --- INITIALIZATION ---
app = FastAPI(title="Azure GenAI Workbench Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. State Management (Mimicking Cosmos DB Partitioning)
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

class ChatRequest(BaseModel):
    message: str
    modelId: str

class FeedbackRequest(BaseModel):
    rating: str
    query: str
    response: str

# 2. Main RAG Orchestration
@app.post("/api/chat")
async def handle_chat(payload: ChatRequest):
    try:
        # Step 1: Multi-Model Routing
        if payload.modelId == "ollama":
            llm = ChatOllama(model="llama3", temperature=0)
        elif payload.modelId == "gpt-4o-mini":
            llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=OPENAI_KEY)
        else:
            llm = ChatOpenAI(model="gpt-4o", temperature=0, api_key=OPENAI_KEY)

        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=OPENAI_KEY)
        vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

        # Step 2: Retrieval & Sanitization (Fixes PyString error)
        docs = retriever.invoke(payload.message)
        context_text = "\n\n".join([d.page_content for d in docs])
        sources = [{"file": os.path.basename(d.metadata.get('source', 'Unknown')), 
                    "page": d.metadata.get('page', 0) + 1} for d in docs]

        # Step 3: Prompt Orchestration
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a professional GenAI Architect. Use the context to answer precisely.\n\nContext: {context}"),
            ("placeholder", "{chat_history}"),
            ("human", "{input}"),
        ])

        # Step 4: Chain with History
        def create_chain():
            return qa_prompt | llm | StrOutputParser()

        history_chain = RunnableWithMessageHistory(
            create_chain(),
            get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
        )

        response = history_chain.invoke(
            {"input": payload.message, "context": context_text},
            config={"configurable": {"session_id": "demo-session"}}
        )

        return {
            "reply": response, 
            "sources": [dict(t) for t in {tuple(s.items()) for s in sources}]
        }
    except Exception as e:
        print(f"Orchestration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 3. Continuous Evaluation Loop
@app.post("/api/feedback")
async def handle_feedback(payload: FeedbackRequest):
    log_entry = {"timestamp": datetime.now().isoformat(), **payload.dict()}
    with open("evaluation_log.jsonl", "a") as f:
        f.write(json.dumps(log_entry) + "\n")
    return {"status": "Feedback logged for evaluation"}

if __name__ == "__main__":
    import uvicorn
    # Hardcoded to 127.0.0.1 for local bridge compatibility
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)