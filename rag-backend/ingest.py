import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

load_dotenv()

def run_enterprise_ingestion():
    # 1. Load all PDFs from a 'data' folder
    if not os.path.exists("./data"):
        os.makedirs("./data")
        print("📁 Created /data folder. Drop your PDFs there and run again.")
        return

    print("📄 Loading documents from ./data...")
    loader = DirectoryLoader("./data", glob="./*.pdf", loader_cls=PyPDFLoader)
    docs = loader.load()
    
    if not docs:
        print("⚠️ No PDFs found in ./data.")
        return

    # 2. Advanced Chunking strategy for Architecture accuracy
    # 1000 chars with 10% overlap is standard for technical docs
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    print(f"✂️ Split {len(docs)} documents into {len(chunks)} chunks.")

    # 3. Persistent Vector Store
    print("🧠 Generating Embeddings...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    
    vector_db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory="./chroma_db"
    )
    
    print("✅ Success! Modular RAG Database is ready.")

if __name__ == "__main__":
    run_enterprise_ingestion()