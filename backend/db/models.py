from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone
import uuid

from backend.config import settings

Base = declarative_base()
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})


def generate_id():
    return str(uuid.uuid4())


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_id)
    topic = Column(String, nullable=False)
    user_notes = Column(Text, default="")
    status = Column(String, default="drafting")  # drafting, published
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    posts = relationship("Post", back_populates="session", order_by="Post.version")


class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=generate_id)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    changelog = Column(Text, default="")
    is_published = Column(Boolean, default=False)
    linkedin_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="posts")


# Create tables
Base.metadata.create_all(bind=engine)
