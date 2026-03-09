from backend.tools.linkedin_tool import publish_to_linkedin
from backend.tools.chromadb_tool import store_post


def publish_and_store(content: str, topic: str = "") -> dict:
    """Publish the post to LinkedIn and store it in ChromaDB for future style reference."""
    # Publish to LinkedIn
    result = publish_to_linkedin(content)

    if result.get("success"):
        # Store in ChromaDB for future style retrieval
        store_post(content=content, topic=topic)

    return result
