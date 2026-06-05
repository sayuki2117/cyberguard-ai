# ===============================================================
# FILE: rag/retriever.py
# PURPOSE: The full RAG pipeline.
#          RAG = Retrieval-Augmented Generation.
#          Steps:
#          1. User asks a question.
#          2. We search the knowledge base for relevant chunks.
#          3. We inject those chunks into the AI prompt.
#          4. AI answers using both its training and our knowledge.
#          This gives us factual, grounded, up-to-date answers.
# ===============================================================

from typing import List, Optional, Tuple

from database import get_admin_db

from .vectorstore import similarity_search


async def retrieve_context(
    query: str,
    match_count: int = 5,
) -> Tuple[Optional[str], List[dict]]:
    """
    Search the knowledge base and build a context string for the AI.

    Returns:
      context_text: formatted string to inject into AI prompt.
      sources: list of source metadata for citations.
    """
    matches = await similarity_search(
        query=query,
        match_count=match_count,
        match_threshold=0.65,
    )

    if not matches:
        return None, []

    context_parts = []
    sources = []
    db = get_admin_db()

    for match in matches:
        context_parts.append(match["content"])

        # Fetch source metadata for citation.
        source_id = match.get("source_id")
        if source_id:
            source_result = (
                db.table("knowledge_sources")
                .select("title, source_type, source_url")
                .eq("id", source_id)
                .single()
                .execute()
            )

            if source_result.data:
                sources.append(
                    {
                        "title": source_result.data["title"],
                        "source_type": source_result.data["source_type"],
                        "source_url": source_result.data.get("source_url"),
                        "similarity": round(match.get("similarity", 0), 2),
                    }
                )

    context_text = "\n\n---\n\n".join(context_parts)
    return context_text, sources
