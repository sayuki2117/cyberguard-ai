# ===============================================================
# FILE: routes/tips.py
# PURPOSE: Tips generation endpoint.
# ===============================================================

from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from dependencies import get_current_user
from middleware.rate_limiter import limiter
from services.tips_service import generate_tips

router = APIRouter(prefix="/tips", tags=["Tips"])


class TipsRequest(BaseModel):
    category: Optional[str] = "general"
    tip_type: Optional[str] = "daily"
    num_tips: Optional[int] = 5


@router.post("")
@limiter.limit("20/minute")
async def get_tips(
    request: Request,
    body: TipsRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate personalised cybersecurity tips."""
    tips = await generate_tips(
        category=body.category or "general",
        tip_type=body.tip_type or "daily",
        num_tips=max(3, min(10, body.num_tips or 5)),
    )
    return {
        "tips": tips,
        "category": body.category,
        "tip_type": body.tip_type,
    }
