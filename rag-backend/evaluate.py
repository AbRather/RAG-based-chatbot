import json
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# Load the API key from the .env file in the current directory
load_dotenv()

def run_evaluation():
    # ARCHITECT CHECK: Ensure the key is loaded before proceeding
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ ERROR: OPENAI_API_KEY not found. Check your .env file.")
        return

    judge_llm = ChatOpenAI(model="gpt-4o", temperature=0)
    
    prompt = ChatPromptTemplate.from_template("""
        You are an AI Quality Assurance Architect. Grade the following RAG interaction.
        User Query: {query}
        AI Response: {response}
        User Rating: {rating}
        
        Provide a 1-sentence technical critique of the grounding and accuracy.
    """)

    print("📊 Starting Automated Evaluation of logged interactions...")
    
    try:
        with open("evaluation_log.jsonl", "r") as f:
            for line in f:
                data = json.loads(line)
                chain = prompt | judge_llm
                result = chain.invoke({
                    "query": data['query'], 
                    "response": data['response'], 
                    "rating": data['rating']
                })
                print(f"\n--- EVALUATION FOR: {data['query'][:30]}... ---")
                print(f"JUDGE VERDICT: {result.content}")
    except FileNotFoundError:
        print("⚠️ No evaluation_log.jsonl found. Rate some messages in the UI first!")

if __name__ == "__main__":
    run_evaluation()