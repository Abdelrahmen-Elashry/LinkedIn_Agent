import httpx
from backend.config import settings


def publish_to_linkedin(
    content: str,
    access_token: str | None = None,
    person_id: str | None = None,
) -> dict:
    """
    Publish a text post to LinkedIn using the REST API.
    Returns {"success": True, "url": "..."} or {"success": False, "error": "..."}.

    If credentials are not configured, returns a mock success for local dev.
    """
    token = access_token or settings.LINKEDIN_ACCESS_TOKEN
    person = person_id or settings.LINKEDIN_PERSON_ID

    if not token or not person or token == "your-linkedin-access-token":
        # Mock mode for local development
        return {
            "success": True,
            "url": f"https://www.linkedin.com/feed/ (mock — credentials not configured)",
            "mock": True,
        }

    url = "https://api.linkedin.com/v2/ugcPosts"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }

    payload = {
        "author": f"urn:li:person:{person}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }

    try:
        response = httpx.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        post_id = response.headers.get("x-restli-id", "")
        return {
            "success": True,
            "url": f"https://www.linkedin.com/feed/update/urn:li:share:{post_id}/",
            "mock": False,
        }
    except httpx.HTTPStatusError as e:
        return {"success": False, "error": f"LinkedIn API error: {e.response.status_code} — {e.response.text}"}
    except Exception as e:
        return {"success": False, "error": str(e)}
