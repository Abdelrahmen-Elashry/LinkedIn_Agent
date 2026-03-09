from langgraph.graph import StateGraph, END
from langgraph.types import interrupt, Command
from backend.graph.state import GraphState
from backend.tools.chromadb_tool import retrieve_similar_posts, store_post
from backend.agents.writer import writer_chain
from backend.agents.revisor import revisor_chain
from backend.agents.publisher import publish_and_store
from backend.db.session_store import save_post, mark_published, get_post_count


# ── Node Definitions ──────────────────────────────────────────────

def input_node(state: GraphState) -> dict:
    """Passthrough: validates and prepares input."""
    return {
        "topic": state["topic"],
        "user_notes": state.get("user_notes", ""),
        "version": 1,
    }


def retrieval_node(state: GraphState) -> dict:
    """Query ChromaDB for similar past posts."""
    posts = retrieve_similar_posts(state["topic"], k=3)
    return {"retrieved_posts": posts}


def writer_node(state: GraphState) -> dict:
    """Generate the first draft using the writer agent."""
    posts_text = "\n\n---\n\n".join(state.get("retrieved_posts", [])) or "No past posts available."

    result = writer_chain.invoke({
        "topic": state["topic"],
        "user_notes": state.get("user_notes", ""),
        "retrieved_posts": posts_text,
    })

    draft = result.content

    # Save draft to DB
    session_id = state.get("session_id", "")
    if session_id:
        version = get_post_count(session_id) + 1
        save_post(session_id, draft, version)

    return {"current_draft": draft, "version": state.get("version", 1)}


def human_review_node(state: GraphState) -> dict:
    """Interrupt execution and wait for human feedback."""
    feedback = interrupt({
        "draft": state["current_draft"],
        "message": "Please review the draft. Approve or request changes.",
    })

    if isinstance(feedback, dict):
        action = feedback.get("action", "approve")
        user_feedback = feedback.get("feedback", "")
    else:
        action = "approve"
        user_feedback = str(feedback) if feedback else ""

    return {"action": action, "user_feedback": user_feedback}


def revisor_node(state: GraphState) -> dict:
    """Revise the draft based on user feedback."""
    result = revisor_chain.invoke({
        "current_draft": state["current_draft"],
        "user_feedback": state["user_feedback"],
    })

    full_response = result.content
    changelog = ""

    if "---CHANGELOG---" in full_response:
        parts = full_response.split("---CHANGELOG---")
        revised = parts[0].strip()
        changelog = parts[1].strip() if len(parts) > 1 else ""
    else:
        revised = full_response.strip()

    # Save revised draft to DB
    session_id = state.get("session_id", "")
    if session_id:
        version = get_post_count(session_id) + 1
        save_post(session_id, revised, version, changelog)

    return {
        "current_draft": revised,
        "changelog": changelog,
        "version": state.get("version", 1) + 1,
    }


def publisher_node(state: GraphState) -> dict:
    """Publish to LinkedIn and store in ChromaDB."""
    result = publish_and_store(
        content=state["current_draft"],
        topic=state.get("topic", ""),
    )

    linkedin_url = result.get("url", "")

    # Update DB
    session_id = state.get("session_id", "")
    if session_id and linkedin_url:
        mark_published(session_id, linkedin_url)

    return {"linkedin_url": linkedin_url}


# ── Routing Logic ─────────────────────────────────────────────────

def route_after_review(state: GraphState) -> str:
    """Route based on user's action from the review node."""
    if state.get("action") == "revise":
        return "revisor_agent"
    return "publisher_agent"


# ── Build the Graph ───────────────────────────────────────────────

def build_graph():
    graph = StateGraph(GraphState)

    # Add nodes
    graph.add_node("input_node", input_node)
    graph.add_node("retrieval_node", retrieval_node)
    graph.add_node("writer_agent", writer_node)
    graph.add_node("human_review_node", human_review_node)
    graph.add_node("revisor_agent", revisor_node)
    graph.add_node("publisher_agent", publisher_node)

    # Set entry point
    graph.set_entry_point("input_node")

    # Linear flow: input → retrieval → writer → human_review
    graph.add_edge("input_node", "retrieval_node")
    graph.add_edge("retrieval_node", "writer_agent")
    graph.add_edge("writer_agent", "human_review_node")

    # Conditional: human_review → revisor OR publisher
    graph.add_conditional_edges(
        "human_review_node",
        route_after_review,
        {
            "revisor_agent": "revisor_agent",
            "publisher_agent": "publisher_agent",
        },
    )

    # Revisor loops back to human_review
    graph.add_edge("revisor_agent", "human_review_node")

    # Publisher ends the flow
    graph.add_edge("publisher_agent", END)

    return graph.compile(checkpointer=None)


def build_graph_with_checkpointer(checkpointer):
    graph = StateGraph(GraphState)

    graph.add_node("input_node", input_node)
    graph.add_node("retrieval_node", retrieval_node)
    graph.add_node("writer_agent", writer_node)
    graph.add_node("human_review_node", human_review_node)
    graph.add_node("revisor_agent", revisor_node)
    graph.add_node("publisher_agent", publisher_node)

    graph.set_entry_point("input_node")
    graph.add_edge("input_node", "retrieval_node")
    graph.add_edge("retrieval_node", "writer_agent")
    graph.add_edge("writer_agent", "human_review_node")
    graph.add_conditional_edges(
        "human_review_node",
        route_after_review,
        {
            "revisor_agent": "revisor_agent",
            "publisher_agent": "publisher_agent",
        },
    )
    graph.add_edge("revisor_agent", "human_review_node")
    graph.add_edge("publisher_agent", END)

    return graph.compile(checkpointer=checkpointer)
