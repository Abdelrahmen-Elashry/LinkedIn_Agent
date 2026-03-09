from pydantic import BaseModel
from typing import Optional


class GenerateRequest(BaseModel):
    topic: str
    user_notes: str = ""


class ReviseRequest(BaseModel):
    session_id: str
    feedback: str


class PublishRequest(BaseModel):
    session_id: str


class SessionResponse(BaseModel):
    session_id: str
    status: str
    current_draft: Optional[str] = None
    linkedin_url: Optional[str] = None


class PostResponse(BaseModel):
    content: str
    version: int
    is_published: bool
    linkedin_url: Optional[str] = None
    changelog: Optional[str] = None
