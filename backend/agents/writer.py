from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from backend.config import settings

WRITER_SYSTEM_PROMPT = """You are an expert LinkedIn ghostwriter. Your job is to write a compelling LinkedIn post that sounds exactly like the user based on their past posts.

**Rules:**
- Match the user's tone, vocabulary, emoji usage, and paragraph style from their past posts
- Use a strong opening hook that grabs attention
- Keep the post between 150–300 words unless the user's style says otherwise
- Infer formatting (line breaks, bullets, emojis) from the past posts
- Make it feel authentic and personal, not corporate or generic
- End with a thought-provoking question or clear call-to-action if the user's style includes them

**User's Past Posts for Style Reference:**
{retrieved_posts}

**Topic:** {topic}

**User's Notes/Ideas:** {user_notes}

Write the LinkedIn post now. Output ONLY the post text, nothing else."""

writer_prompt = ChatPromptTemplate.from_messages([
    ("system", WRITER_SYSTEM_PROMPT),
    ("human", "Write a LinkedIn post about: {topic}"),
])

writer_llm = ChatGoogleGenerativeAI(
    model=settings.LLM_MODEL,
    google_api_key=settings.GOOGLE_API_KEY,
    temperature=0.7,
    streaming=True,
)

writer_chain = writer_prompt | writer_llm
