from fastapi import APIRouter, Depends, Request

from dependencies import get_current_user
from middleware.rate_limiter import limiter
from models.phishing import PhishingAnalysisRequest, PhishingAnalysisResponse
from services.phishing_service import analyse_phishing_email

router = APIRouter(prefix="/phishing", tags=["Phishing"])


@router.post("/analyse", response_model=PhishingAnalysisResponse)
@limiter.limit("20/minute")
async def analyse(
    request: Request,
    body: PhishingAnalysisRequest,
    current_user: dict = Depends(get_current_user),
):
    """Analyse an email for phishing indicators."""
    return await analyse_phishing_email(
        email_content=body.email_content,
        sender=body.sender_email,
    )
