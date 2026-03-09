import chromadb
from chromadb.utils.embedding_functions import GoogleGenerativeAiEmbeddingFunction
from backend.config import settings
from typing import Optional
import json
import os

# Initialize embedding function
embedding_fn = GoogleGenerativeAiEmbeddingFunction(
    api_key=settings.GOOGLE_API_KEY,
    model_name=settings.EMBEDDING_MODEL,
)

# Initialize ChromaDB client
client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
collection = client.get_or_create_collection(
    name="linkedin_posts",
    embedding_function=embedding_fn,
    metadata={"hnsw:space": "cosine"},
)


def seed_from_json(filepath: str = "data/past_posts.json"):
    """Seed ChromaDB with past posts from a JSON file if the collection is empty."""
    if collection.count() > 0:
        return

    if not os.path.exists(filepath):
        return

    with open(filepath, "r", encoding="utf-8") as f:
        posts = json.load(f)

    if not posts:
        return

    ids = [f"seed_{i}" for i in range(len(posts))]
    documents = [p["content"] for p in posts]
    metadatas = [{"topic": p.get("topic", ""), "date": p.get("date", "")} for p in posts]

    collection.add(ids=ids, documents=documents, metadatas=metadatas)


def retrieve_similar_posts(topic: str, k: int = 3) -> list[str]:
    """Retrieve the top-k most similar past posts from ChromaDB."""
    if collection.count() == 0:
        return []

    actual_k = min(k, collection.count())
    results = collection.query(query_texts=[topic], n_results=actual_k)
    return results["documents"][0] if results["documents"] else []


def store_post(content: str, topic: str = "", metadata: Optional[dict] = None):
    """Store a published post into ChromaDB for future retrieval."""
    import uuid

    doc_id = str(uuid.uuid4())
    meta = metadata or {}
    meta["topic"] = topic

    collection.add(ids=[doc_id], documents=[content], metadatas=[meta])
