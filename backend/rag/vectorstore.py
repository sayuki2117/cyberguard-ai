# ===============================================================
# FILE: rag/vectorstore.py
# PURPOSE: Store and retrieve document embeddings in Supabase.
#          Embeddings = numerical representations of text that
#          capture semantic meaning. Similar text = similar numbers.
#          pgvector lets PostgreSQL store and search embeddings.
# ===============================================================

from typing import List, Optional

from database import get_admin_db

from .embeddings import get_embedding_batch


async def store_chunks(
    source_id: str,
    chunks: List[str],
    metadata: Optional[dict] = None,
) -> int:
    """
    Generate embeddings for all chunks and store in Supabase.
    Returns number of chunks stored.
    """
    db = get_admin_db()

    # Generate embeddings in batches to avoid rate limits.
    # We can embed up to 100 texts at once with OpenAI.
    batch_size = 20
    stored = 0

    for batch_start in range(0, len(chunks), batch_size):
        batch = chunks[batch_start : batch_start + batch_size]
        embeddings = await get_embedding_batch(batch)

        rows = []
        for i, (chunk, embedding) in enumerate(zip(batch, embeddings)):
            rows.append(
                {
                    "source_id": source_id,
                    "content": chunk,
                    "embedding": embedding,
                    "chunk_index": batch_start + i,
                    "metadata": metadata or {},
                }
            )

        db.table("document_chunks").insert(rows).execute()
        stored += len(rows)

    # Update chunk_count and is_indexed in knowledge_sources.
    db.table("knowledge_sources").update(
        {
            "chunk_count": stored,
            "is_indexed": True,
        }
    ).eq("id", source_id).execute()

    return stored


async def similarity_search(
    query: str,
    match_count: int = 5,
    match_threshold: float = 0.7,
) -> List[dict]:
    """
    Find the most relevant document chunks for a query.
    This is the core of RAG: finding what to inject into the AI prompt.

    Steps:
    1. Convert query to embedding.
    2. Find chunks with similar embeddings (cosine similarity).
    3. Return top matches.
    """
    from .embeddings import get_embedding

    query_embedding = await get_embedding(query)
    db = get_admin_db()

    # Call the PostgreSQL function created in schema.sql.
    result = db.rpc(
        "match_documents",
        {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": match_count,
        },
    ).execute()

    return result.data or []


def delete_source_chunks(source_id: str) -> None:
    """Delete all chunks for a knowledge source (for re-indexing)."""
    db = get_admin_db()
    db.table("document_chunks").delete().eq("source_id", source_id).execute()
    db.table("knowledge_sources").update(
        {
            "chunk_count": 0,
            "is_indexed": False,
        }
    ).eq("id", source_id).execute()
