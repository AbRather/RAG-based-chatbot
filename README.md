# 🏛️ Azure GenAI Workbench: Hybrid RAG Architecture

A production-grade Proof-of-Concept (PoC) demonstrating a decoupled, multi-model RAG (Retrieval-Augmented Generation) pipeline with continuous evaluation and telemetry.

## 🏗️ Architectural Overview
This project implements the **BFF (Backend-for-Frontend)** pattern to orchestrate complex GenAI workflows securely and efficiently.

* **Frontend (Next.js 14 & Tailwind CSS)**: A responsive, dark-mode workbench featuring stateful chat, dynamic model selection, and human-in-the-loop (HITL) feedback mechanisms.
* **Orchestration Layer (FastAPI & LangChain)**: A Python microservice managing session-aware memory, vector retrieval, and multi-model routing.
* **Hybrid Model Routing**: Dynamically switches between cloud-based inference (**GPT-4o**, **GPT-4o-mini**) and local, privacy-first inference (**Ollama / Llama 3**).
* **Vector Engine (ChromaDB)**: High-dimensional semantic search with metadata extraction for page-level grounding.

## 🌟 Key Engineering Features
1. **Grounded Traceability**: Eliminates hallucinations by providing exact source document names and page-level citations in the UI (e.g., `dessertation_afp.pdf (p.23)`).
2. **Automated QA & Telemetry**: Captures user upvote/downvote feedback directly into an `evaluation_log.jsonl` pipeline.
3. **Judge LLM Evaluator**: Includes a standalone `evaluate.py` script where a GPT-4 Judge critiques the RAG system's grounding accuracy based on user telemetry.
4. **Data Sanitization**: Implements strict `StrOutputParser` and metadata extraction to prevent common PyString formatting crashes during vector retrieval.

## 🚀 Getting Started
This architecture requires three terminal instances to mimic a microservices environment.

**1. Start the Orchestrator (Backend)**
```bash
cd rag-backend
python main.py