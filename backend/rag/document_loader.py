# ===============================================================
# FILE: rag/document_loader.py
# PURPOSE: Load and chunk documents from various sources.
#          Chunking = splitting large documents into smaller
#          overlapping pieces so they fit in the AI's context
#          window and can be searched precisely.
# ===============================================================

import io
import re
from typing import List, Tuple

import docx
import httpx
import pypdf


def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50,
) -> List[str]:
    """
    Split text into overlapping chunks.
    chunk_size = words per chunk.
    chunk_overlap = words shared between adjacent chunks.
    Overlap ensures context isn't lost at chunk boundaries.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0.")
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be >= 0 and smaller than chunk_size.")

    words = text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk.strip())
        start += chunk_size - chunk_overlap

    return chunks


def load_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file."""
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page_num, page in enumerate(reader.pages):
        page_text = page.extract_text()
        if page_text:
            text += f"\n[Page {page_num + 1}]\n{page_text}"
    return text.strip()


def load_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file."""
    doc = docx.Document(io.BytesIO(file_bytes))
    text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
    return text.strip()


def load_txt(file_bytes: bytes) -> str:
    """Extract text from a plain text or Markdown file."""
    return file_bytes.decode("utf-8", errors="replace").strip()


async def load_url(url: str) -> str:
    """
    Fetch and extract text from a website URL.
    We strip HTML tags to get readable text content.
    """
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        response = await client.get(url, headers={"User-Agent": "CyberGuardAI/1.0"})
        response.raise_for_status()

    html = response.text
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:50000]


def get_file_chunks(
    file_bytes: bytes,
    file_extension: str,
) -> Tuple[str, List[str]]:
    """
    Load a file and return raw text + list of chunks.
    Returns: (full_text, [chunk1, chunk2, ...])
    """
    ext = file_extension.lower().lstrip(".")

    if ext == "pdf":
        text = load_pdf(file_bytes)
    elif ext == "docx":
        text = load_docx(file_bytes)
    elif ext in ("txt", "md"):
        text = load_txt(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")

    if not text:
        raise ValueError("Could not extract any text from the document.")

    chunks = chunk_text(text)
    return text, chunks
