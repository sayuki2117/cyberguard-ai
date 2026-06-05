# ===============================================================
# FILE: rag/embeddings.py
# PURPOSE: Generate OpenAI embeddings for text.
#          Always uses OpenAI embeddings regardless of AI_PROVIDER
#          so dimensions are consistent (1536 for text-embedding-3-small).
# ===============================================================

from typing import List

from openai import AsyncOpenAI

from config import settings


_client = AsyncOpenAI(api_key=settings.openai_api_key)


async def get_embedding(text: str) -> List[float]:
    """Get embedding for a single text string."""
    response = await _client.embeddings.create(
        model=settings.openai_embedding_model,
        input=text.strip()[:8000],
    )
    return response.data[0].embedding


async def get_embedding_batch(texts: List[str]) -> List[List[float]]:
    """Get embeddings for multiple texts in one API call (more efficient)."""
    cleaned = [text.strip()[:8000] for text in texts if text.strip()]
    if not cleaned:
        return []

    response = await _client.embeddings.create(
        model=settings.openai_embedding_model,
        input=cleaned,
    )

    # Preserve order: OpenAI returns embeddings in input order.
    return [item.embedding for item in sorted(response.data, key=lambda item: item.index)]
