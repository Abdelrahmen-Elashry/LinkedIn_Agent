import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from langgraph.checkpoint.memory import MemorySaver

from backend.config import settings
from backend.schemas import GenerateRequest, ReviseRequest, PublishRequest
from backend.graph.workflow import build_graph_with_checkpointer
from backend.db.session_store import (
    create_session, get_session, get_all_sessions,
    get_latest_post, save_post, get_post_count,
)
from backend.tools.chromadb_tool import seed_from_json, retrieve_similar_posts
from backend.agents.writer import writer_chain
from backend.agents.revisor import revisor_chain
from backend.agents.publisher import publish_and_store

# ── App Setup ─────────────────────────────────────────────────────

app = FastAPI(title="LinkedIn Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed ChromaDB on startup
@app.on_event("startup")
async def startup():
    seed_from_json()


# In-memory storage for session drafts (lightweight, alongside SQLite)
session_drafts: dict[str, str] = {}


# ── SSE Streaming Helpers ─────────────────────────────────────────

async def stream_writer(topic: str, user_notes: str, session_id: str):
    """Stream writer agent output token by token via SSE."""
    retrieved = retrieve_similar_posts(topic, k=3)
    posts_text = "\n\n---\n\n".join(retrieved) or "No past posts available."

    full_text = ""

    async for chunk in writer_chain.astream({
        "topic": topic,
        "user_notes": user_notes,
        "retrieved_posts": posts_text,
    }):
        token = chunk.content
        if token:
            full_text += token
            yield {
                "event": "token",
                "data": json.dumps({"token": token}),
            }

    # Save the complete draft
    version = get_post_count(session_id) + 1
    save_post(session_id, full_text, version)
    session_drafts[session_id] = full_text

    yield {
        "event": "done",
        "data": json.dumps({"draft": full_text, "session_id": session_id, "version": version}),
    }


async def stream_revisor(current_draft: str, feedback: str, session_id: str):
    """Stream revisor agent output token by token via SSE."""
    full_text = ""

    async for chunk in revisor_chain.astream({
        "current_draft": current_draft,
        "user_feedback": feedback,
    }):
        token = chunk.content
        if token:
            full_text += token
            yield {
                "event": "token",
                "data": json.dumps({"token": token}),
            }

    # Parse changelog
    changelog = ""
    revised = full_text
    if "---CHANGELOG---" in full_text:
        parts = full_text.split("---CHANGELOG---")
        revised = parts[0].strip()
        changelog = parts[1].strip() if len(parts) > 1 else ""

    # Save revised draft
    version = get_post_count(session_id) + 1
    save_post(session_id, revised, version, changelog)
    session_drafts[session_id] = revised

    yield {
        "event": "done",
        "data": json.dumps({
            "draft": revised,
            "changelog": changelog,
            "session_id": session_id,
            "version": version,
        }),
    }


# ── API Routes ────────────────────────────────────────────────────

@app.post("/api/generate")
async def generate_post(request: GenerateRequest):
    """Start a new session and stream the first draft."""
    session = create_session(topic=request.topic, user_notes=request.user_notes)

    return EventSourceResponse(
        stream_writer(request.topic, request.user_notes, session.id)
    )


@app.post("/api/revise")
async def revise_post(request: ReviseRequest):
    """Revise the current draft based on user feedback."""
    current_draft = session_drafts.get(request.session_id)

    if not current_draft:
        latest = get_latest_post(request.session_id)
        if latest:
            current_draft = latest.content
        else:
            raise HTTPException(status_code=404, detail="No draft found for this session")

    return EventSourceResponse(
        stream_revisor(current_draft, request.feedback, request.session_id)
    )


@app.post("/api/publish")
async def publish_post(request: PublishRequest):
    """Publish the current draft to LinkedIn."""
    current_draft = session_drafts.get(request.session_id)

    if not current_draft:
        latest = get_latest_post(request.session_id)
        if latest:
            current_draft = latest.content
        else:
            raise HTTPException(status_code=404, detail="No draft found for this session")

    session = get_session(request.session_id)
    topic = session.topic if session else ""

    result = publish_and_store(content=current_draft, topic=topic)

    if result.get("success"):
        from backend.db.session_store import mark_published
        mark_published(request.session_id, result.get("url", ""))
        return {
            "success": True,
            "linkedin_url": result.get("url", ""),
            "mock": result.get("mock", False),
        }
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Publishing failed"))


@app.get("/api/sessions")
async def list_sessions():
    """List all past sessions."""
    sessions = get_all_sessions()
    return [
        {
            "id": s.id,
            "topic": s.topic,
            "status": s.status,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in sessions
    ]


@app.get("/api/sessions/{session_id}")
async def get_session_detail(session_id: str):
    """Get session details including all post versions."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    latest = get_latest_post(session_id)
    return {
        "id": session.id,
        "topic": session.topic,
        "status": session.status,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "current_draft": latest.content if latest else None,
        "version": latest.version if latest else 0,
        "linkedin_url": latest.linkedin_url if latest else None,
    }
