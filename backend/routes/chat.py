from fastapi import APIRouter, Depends, Request

from database import get_admin_db
from dependencies import get_current_user
from middleware.rate_limiter import limiter
from models.chat import ChatMessageInput
from rag.retriever import retrieve_context
from services.openai_service import chat_completion


router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/message")
@limiter.limit("30/minute")
async def send_message(
    request: Request,
    body: ChatMessageInput,
    current_user: dict = Depends(get_current_user),
):
    """Send a chat message and get an AI response with RAG context."""
    db = get_admin_db()
    user_id = current_user["id"]

    # Session management: create a new session if none provided.
    session_id = body.session_id
    if not session_id:
        session_result = (
            db.table("chat_sessions")
            .insert(
                {
                    "user_id": user_id,
                    "title": body.content[:50],
                }
            )
            .execute()
        )
        session_id = session_result.data[0]["id"]

    # Fetch conversation history.
    history_result = (
        db.table("chat_messages")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at")
        .limit(20)
        .execute()
    )

    history = [
        {"role": message["role"], "content": message["content"]}
        for message in (history_result.data or [])
    ]

    # RAG: retrieve relevant knowledge base context.
    context, sources = await retrieve_context(body.content)

    # AI response.
    ai_reply = await chat_completion(
        message=body.content,
        history=history,
        context=context,
    )

    # Save messages to database.
    db.table("chat_messages").insert(
        [
            {
                "session_id": session_id,
                "user_id": user_id,
                "role": "user",
                "content": body.content,
            },
            {
                "session_id": session_id,
                "user_id": user_id,
                "role": "assistant",
                "content": ai_reply,
                "sources": sources,
            },
        ]
    ).execute()

    return {
        "reply": ai_reply,
        "session_id": session_id,
        "sources": sources,
    }


@router.get("/sessions")
async def get_sessions(current_user: dict = Depends(get_current_user)):
    """Get all chat sessions for the current user."""
    db = get_admin_db()
    result = (
        db.table("chat_sessions")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get all messages in a chat session."""
    db = get_admin_db()
    result = (
        db.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .eq("user_id", current_user["id"])
        .order("created_at")
        .execute()
    )
    return result.data or []
