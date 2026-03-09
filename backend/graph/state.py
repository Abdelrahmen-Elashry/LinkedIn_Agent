from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages


class GraphState(TypedDict):
    topic: str
    user_notes: str
    retrieved_posts: list[str]
    current_draft: str
    user_feedback: str
    action: str  # "approve" or "revise"
    linkedin_url: str
    changelog: str
    session_id: str
    version: int
    messages: Annotated[list, add_messages]
