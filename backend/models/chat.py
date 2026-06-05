# ===============================================================
# FILE: models/chat.py
# PURPOSE: Pydantic models for chat endpoints.
#          Pydantic automatically validates incoming request data
#          and converts it to the correct Python types.
#          Think of these as type-safe data containers.
# ===============================================================

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ChatMessageInput(BaseModel):
    """Data the user sends when posting a message."""

    content: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    """Data returned after the AI responds."""

    id: str
    role: str
    content: str
    sources: Optional[List[dict]] = None
    session_id: str
    created_at: datetime


class ChatSessionResponse(BaseModel):
    """A chat session summary."""

    id: str
    title: str
    created_at: datetime


class ConversationHistory(BaseModel):
    """A single message in conversation history."""

    role: str
    content: str
