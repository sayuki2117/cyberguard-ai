# ===============================================================
# FILE: routes/quiz.py
# PURPOSE: Quiz generation and scoring endpoints.
# ===============================================================

from fastapi import APIRouter, Depends, HTTPException, Request

from database import get_admin_db
from dependencies import get_current_user
from middleware.rate_limiter import limiter
from models.quiz import (
    QuizGenerateRequest,
    QuizResponse,
    QuizResult,
    QuizSubmitRequest,
)
from services.quiz_service import generate_quiz, score_quiz

router = APIRouter(prefix="/quiz", tags=["Quiz"])

VALID_TOPICS = [
    "general",
    "phishing",
    "passwords",
    "malware",
    "network",
    "privacy",
    "business",
    "social",
]
VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"]


@router.post("/generate", response_model=QuizResponse)
@limiter.limit("10/minute")
async def get_quiz(
    request: Request,
    body: QuizGenerateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a new cybersecurity quiz."""
    if body.topic not in VALID_TOPICS:
        raise HTTPException(400, "Invalid topic.")
    if body.difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(400, "Invalid difficulty.")

    return await generate_quiz(
        topic=body.topic,
        difficulty=body.difficulty,
        num_questions=max(3, min(10, body.num_questions)),
    )


@router.post("/submit", response_model=QuizResult)
@limiter.limit("30/minute")
async def submit_quiz(
    request: Request,
    body: QuizSubmitRequest,
    current_user: dict = Depends(get_current_user),
):
    """Submit quiz answers and save results."""
    result = score_quiz(body)

    db = get_admin_db()
    db.table("quiz_results").insert({
        "user_id": current_user["id"],
        "topic": body.topic,
        "difficulty": body.difficulty,
        "score": result.score,
        "total": result.total,
        "percentage": result.percentage,
        "answers": result.answers,
    }).execute()

    return result


@router.get("/history")
@limiter.limit("30/minute")
async def get_history(request: Request, current_user: dict = Depends(get_current_user)):
    """Get user's quiz history."""
    db = get_admin_db()
    result = (
        db.table("quiz_results")
        .select("id, topic, difficulty, score, total, percentage, created_at")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return result.data or []
