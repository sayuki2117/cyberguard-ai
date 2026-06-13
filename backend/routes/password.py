from fastapi import APIRouter, Depends, Request

from dependencies import get_current_user
from middleware.rate_limiter import limiter
from models.password import PasswordCheckRequest, PasswordCheckResponse
from services.password_service import analyse_password

router = APIRouter(prefix="/password", tags=["Password"])


@router.post("/check", response_model=PasswordCheckResponse)
@limiter.limit("30/minute")
async def check_password(
    request: Request,
    body: PasswordCheckRequest,
    current_user: dict = Depends(get_current_user),
):
    """Analyze password strength and return a score, suggestions, and a security tip."""
    return await analyse_password(body.password)
