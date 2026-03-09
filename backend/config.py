import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    LINKEDIN_ACCESS_TOKEN: str = os.getenv("LINKEDIN_ACCESS_TOKEN", "")
    LINKEDIN_PERSON_ID: str = os.getenv("LINKEDIN_PERSON_ID", "")
    CHROMA_PERSIST_DIR: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./linkedin_agent.db")
    LLM_MODEL: str = "gemini-3.1-flash-lite-preview"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"


settings = Settings()
