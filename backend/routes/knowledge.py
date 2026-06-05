from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from config import settings
from database import get_admin_db
from dependencies import get_admin_user, get_current_user
from middleware.rate_limiter import limiter
from models.knowledge import URLIngestRequest
from rag.document_loader import get_file_chunks, load_url
from rag.vectorstore import delete_source_chunks, store_chunks
from rag.youtube_loader import get_youtube_transcript


router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


@router.post("/upload")
@limiter.limit("5/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    admin_user: dict = Depends(get_admin_user),
):
    """Upload a document (PDF/DOCX/TXT/MD) to the knowledge base."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(400, f"Unsupported file type. Allowed: {allowed}")

    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(400, f"File too large. Max: {settings.max_upload_size_mb}MB")

    db = get_admin_db()
    source_id = str(uuid.uuid4())

    db.table("knowledge_sources").insert(
        {
            "id": source_id,
            "title": title,
            "source_type": ext.lstrip("."),
            "file_size": len(content),
            "uploaded_by": admin_user["id"],
        }
    ).execute()

    try:
        _, chunks = get_file_chunks(content, ext)
        count = await store_chunks(
            source_id=source_id,
            chunks=chunks,
            metadata={"title": title, "source_type": ext.lstrip(".")},
        )

        return {"message": f"Uploaded and indexed {count} chunks.", "source_id": source_id}
    except Exception as exc:
        db.table("knowledge_sources").delete().eq("id", source_id).execute()
        raise HTTPException(
            500,
            f"Failed to process document: {str(exc)}",
        ) from exc


@router.post("/ingest-url")
@limiter.limit("5/minute")
async def ingest_url(
    request: Request,
    body: URLIngestRequest,
    admin_user: dict = Depends(get_admin_user),
):
    """Add a website URL or YouTube video to the knowledge base."""
    db = get_admin_db()
    source_id = str(uuid.uuid4())

    is_youtube = "youtube.com" in body.url or "youtu.be" in body.url
    source_type = "youtube" if is_youtube else "url"

    db.table("knowledge_sources").insert(
        {
            "id": source_id,
            "title": body.title,
            "source_type": source_type,
            "source_url": body.url,
            "uploaded_by": admin_user["id"],
        }
    ).execute()

    try:
        if is_youtube:
            _, chunks, meta = get_youtube_transcript(body.url)
        else:
            text = await load_url(body.url)
            from rag.document_loader import chunk_text

            chunks = chunk_text(text)
            meta = {"url": body.url}

        count = await store_chunks(
            source_id=source_id,
            chunks=chunks,
            metadata={**meta, "title": body.title},
        )

        source_name = "YouTube" if is_youtube else "URL"
        return {
            "message": f"Ingested {count} chunks from {source_name}.",
            "source_id": source_id,
        }
    except Exception as exc:
        db.table("knowledge_sources").delete().eq("id", source_id).execute()
        raise HTTPException(
            500,
            f"Failed to ingest source: {str(exc)}",
        ) from exc


@router.get("/sources")
async def list_sources(current_user: dict = Depends(get_current_user)):
    """List all knowledge base sources."""
    db = get_admin_db()
    result = db.table("knowledge_sources").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.delete("/sources/{source_id}")
async def delete_source(source_id: str, admin_user: dict = Depends(get_admin_user)):
    """Delete a knowledge source and all its chunks."""
    db = get_admin_db()
    delete_source_chunks(source_id)
    db.table("knowledge_sources").delete().eq("id", source_id).execute()
    return {"message": "Source deleted."}
