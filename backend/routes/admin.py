# ===============================================================
# FILE: routes/admin.py
# PURPOSE: Admin-only endpoints for dashboard stats and activity.
# ===============================================================

from fastapi import APIRouter, Depends

from database import get_admin_db
from dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_stats(admin: dict = Depends(get_admin_user)):
    """Dashboard statistics for admin."""
    db = get_admin_db()

    users = db.table("profiles").select("id", count="exact").execute()
    messages = db.table("chat_messages").select("id", count="exact").execute()
    quizzes = db.table("quiz_results").select("id", count="exact").execute()
    sources = db.table("knowledge_sources").select("id", count="exact").execute()

    scores = db.table("quiz_results").select("percentage").execute()
    avg_score = 0.0
    if scores.data:
        avg_score = round(
            sum(r["percentage"] for r in scores.data) / len(scores.data), 1
        )

    return {
        "total_users": users.count or 0,
        "total_messages": messages.count or 0,
        "total_quizzes": quizzes.count or 0,
        "total_sources": sources.count or 0,
        "avg_quiz_score": avg_score,
    }


@router.get("/recent-activity")
async def get_recent_activity(admin: dict = Depends(get_admin_user)):
    """Get recent quiz activity."""
    db = get_admin_db()

    recent_quizzes = (
        db.table("quiz_results")
        .select("topic, difficulty, percentage, created_at, profiles(email)")
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )

    return {"recent_quizzes": recent_quizzes.data or []}
