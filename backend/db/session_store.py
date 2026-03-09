from sqlalchemy.orm import sessionmaker
from backend.db.models import engine, Session, Post
from typing import Optional

SessionLocal = sessionmaker(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_session(topic: str, user_notes: str = "") -> Session:
    db = SessionLocal()
    try:
        session = Session(topic=topic, user_notes=user_notes)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    finally:
        db.close()


def save_post(session_id: str, content: str, version: int, changelog: str = "") -> Post:
    db = SessionLocal()
    try:
        post = Post(
            session_id=session_id,
            content=content,
            version=version,
            changelog=changelog,
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        return post
    finally:
        db.close()


def mark_published(session_id: str, linkedin_url: str):
    db = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        if session:
            session.status = "published"

        latest_post = (
            db.query(Post)
            .filter(Post.session_id == session_id)
            .order_by(Post.version.desc())
            .first()
        )
        if latest_post:
            latest_post.is_published = True
            latest_post.linkedin_url = linkedin_url

        db.commit()
    finally:
        db.close()


def get_session(session_id: str) -> Optional[Session]:
    db = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        return session
    finally:
        db.close()


def get_all_sessions() -> list:
    db = SessionLocal()
    try:
        sessions = db.query(Session).order_by(Session.created_at.desc()).all()
        return sessions
    finally:
        db.close()


def get_latest_post(session_id: str) -> Optional[Post]:
    db = SessionLocal()
    try:
        post = (
            db.query(Post)
            .filter(Post.session_id == session_id)
            .order_by(Post.version.desc())
            .first()
        )
        return post
    finally:
        db.close()


def get_post_count(session_id: str) -> int:
    db = SessionLocal()
    try:
        return db.query(Post).filter(Post.session_id == session_id).count()
    finally:
        db.close()
