from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from backend.config import settings

REVISOR_SYSTEM_PROMPT = """You are a precise LinkedIn post editor. Your job is to apply ONLY the changes the user requested while preserving everything else.

**Rules:**
- Do NOT rewrite the entire post unless explicitly asked
- Preserve the user's original voice, tone, and style
- Apply the requested changes surgically and precisely
- After editing, provide a brief changelog of what you changed

**Current Draft:**
{current_draft}

**User's Feedback:**
{user_feedback}

Respond with the revised post first, then on a new line write "---CHANGELOG---" followed by a brief list of changes made."""

revisor_prompt = ChatPromptTemplate.from_messages([
    ("system", REVISOR_SYSTEM_PROMPT),
    ("human", "Please revise the post based on my feedback: {user_feedback}"),
])

revisor_llm = ChatGoogleGenerativeAI(
    model=settings.LLM_MODEL,
    google_api_key=settings.GOOGLE_API_KEY,
    temperature=0.4,
    streaming=True,
)

revisor_chain = revisor_prompt | revisor_llm
