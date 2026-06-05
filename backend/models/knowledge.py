from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class URLIngestRequest(BaseModel):
    url: str = Field(..., description="Website URL or YouTube URL")
    title: str = Field(..., min_length=1, max_length=200)


class KnowledgeSourceResponse(BaseModel):
    id: str
    title: str
    source_type: str
    source_url: Optional[str]
    chunk_count: int
    is_indexed: bool
    created_at: datetime


class DeleteSourceRequest(BaseModel):
    source_id: str
