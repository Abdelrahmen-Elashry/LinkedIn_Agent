# LinkedIn Agent — Multi-Agent AI Post Generator

A production-grade multi-agent system that generates, iteratively revises, and auto-publishes LinkedIn posts through a dark-themed chat interface.

## Architecture

```
User Chat → FastAPI (SSE) → LangGraph Workflow → Gemini LLM
                                    │
                          ┌─────────┼─────────┐
                          ▼         ▼         ▼
                     ChromaDB   Writer    Revisor
                    (style DB)  Agent     Agent
                                          │
                                          ▼
                                    Publisher Agent
                                    → LinkedIn API
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Orchestration | LangGraph + LangChain |
| Backend API | FastAPI (Python) |
| Vector Memory | ChromaDB |
| LLM | Gemini 3.1 Flash Lite Preview |
| Embeddings | gemini-embedding-001 |
| Frontend | React + Vite + Tailwind CSS |
| Streaming | FastAPI SSE |
| Publishing | LinkedIn REST API (OAuth 2.0) |
| Database | SQLite via SQLAlchemy |

## Quick Start

### 1. Clone & Setup Environment

```bash
# Copy and fill in your API keys
cp .env.example .env
```

### 2. Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the backend
uvicorn backend.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Visit **http://localhost:5173** — the frontend proxies API calls to the backend at port 8000.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google AI API key for Gemini LLM + Embeddings |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn OAuth 2.0 access token |
| `LINKEDIN_PERSON_ID` | Your LinkedIn person URN |
| `CHROMA_PERSIST_DIR` | ChromaDB storage path (default: `./chroma_data`) |
| `DATABASE_URL` | SQLite connection string |

> **Note:** LinkedIn publishing runs in mock mode if credentials are not configured.

## Workflow

1. **Enter a topic** — Type your post topic and any notes
2. **AI generates draft** — Uses your past posts from ChromaDB to match your style
3. **Review & iterate** — Request changes or approve the draft
4. **Publish** — One-click publish to LinkedIn + auto-store for future style learning

## Folder Structure

```
├── backend/
│   ├── main.py              # FastAPI app + SSE routes
│   ├── agents/              # Writer, Revisor, Publisher
│   ├── graph/               # LangGraph workflow + state
│   ├── tools/               # ChromaDB + LinkedIn API
│   ├── db/                  # SQLAlchemy models + CRUD
│   ├── schemas.py           # Pydantic models
│   └── config.py            # Environment config
├── frontend/
│   └── src/
│       ├── components/      # ChatPanel, PostPreview, etc.
│       ├── hooks/           # useSSE streaming hook
│       ├── pages/           # App root layout
│       └── api/             # API client
├── data/
│   └── past_posts.json      # Seed data for ChromaDB
└── requirements.txt
```
