# ===============================================================
# FILE: routes/auth.py
# PURPOSE: Authentication endpoints.
#          We use Supabase Auth for the actual auth operations
#          and issue our own JWT for API access.
# ===============================================================

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from pydantic import BaseModel, EmailStr, Field

from config import settings
from database import get_admin_db
from dependencies import get_current_user


router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def create_jwt(user_id: str, email: str) -> str:
    """Create a signed JWT token for API authentication."""
    now = datetime.utcnow()
    expire = now + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": now,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    """Register a new user via Supabase Auth."""
    db = get_admin_db()

    try:
        # Create user in Supabase Auth.
        result = db.auth.admin.create_user(
            {
                "email": req.email,
                "password": req.password,
                "email_confirm": True,
                "user_metadata": {"full_name": req.full_name},
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    user = result.user
    token = create_jwt(str(user.id), user.email)

    # Fetch the auto-created profile (created by DB trigger).
    profile = db.table("profiles").select("*").eq("id", str(user.id)).single().execute()

    return AuthResponse(
        access_token=token,
        user=profile.data,
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Login with email and password."""
    db = get_admin_db()

    try:
        # Authenticate with Supabase.
        result = db.auth.sign_in_with_password(
            {
                "email": req.email,
                "password": req.password,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        ) from exc

    user = result.user
    token = create_jwt(str(user.id), user.email)
    profile = db.table("profiles").select("*").eq("id", str(user.id)).single().execute()

    return AuthResponse(
        access_token=token,
        user=profile.data,
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user's profile."""
    return current_user
