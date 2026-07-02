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


def _profiles_count(db) -> int:
    """Return the number of profiles, falling back to 0 if Supabase omits it."""
    try:
        result = db.table("profiles").select("id", count="exact").execute()
    except Exception:
        return 0
    return result.count or 0


def _get_attr_or_key(value, name: str):
    if isinstance(value, dict):
        return value.get(name)
    return getattr(value, name, None)


def _get_user_metadata(user) -> dict:
    metadata = _get_attr_or_key(user, "user_metadata") or _get_attr_or_key(
        user, "raw_user_meta_data"
    )
    return metadata or {}


def _ensure_profile(
    db,
    *,
    user_id: str,
    email: str,
    full_name: str | None,
    default_role: str = "user",
) -> dict:
    """
    Return a profile for the auth user, creating it when the DB trigger did not.
    This keeps registration/login from failing after Supabase Auth succeeds.
    """
    try:
        existing = (
            db.table("profiles")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Registration failed because the profiles table could not be read. "
                "Check the Supabase profiles table and service role key."
            ),
        ) from exc

    if existing.data:
        profile = existing.data[0]
        update_data = {"email": email}
        if full_name and profile.get("full_name") != full_name:
            update_data["full_name"] = full_name

        if update_data:
            updated = (
                db.table("profiles")
                .update(update_data)
                .eq("id", user_id)
                .execute()
            )
            if updated.data:
                return updated.data[0]

        return profile

    profile_data = {
        "id": user_id,
        "email": email,
        "full_name": full_name,
        "role": default_role,
    }
    try:
        created = db.table("profiles").insert(profile_data).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Account was created in auth, but saving the profile failed. "
                "Check that profiles has id, email, full_name, and role columns."
            ),
        ) from exc

    if created.data:
        return created.data[0]

    repaired = (
        db.table("profiles")
        .select("*")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if repaired.data:
        return repaired.data[0]

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Account created, but the user profile could not be saved.",
    )


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


def _auth_user_fields(user) -> tuple[str, str]:
    user_id = _get_attr_or_key(user, "id")
    email = _get_attr_or_key(user, "email")

    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication provider did not return a usable user.",
        )

    return str(user_id), str(email)


def _is_existing_user_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(
        phrase in message
        for phrase in (
            "already registered",
            "already exists",
            "already been registered",
            "user exists",
            "email_exists",
        )
    )


def _build_auth_response(db, *, user, full_name: str | None, default_role: str = "user"):
    user_id, email = _auth_user_fields(user)
    token = create_jwt(user_id, email)
    profile = _ensure_profile(
        db,
        user_id=user_id,
        email=email,
        full_name=full_name,
        default_role=default_role,
    )

    return AuthResponse(
        access_token=token,
        user=profile,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    """Register a new user via Supabase Auth."""
    db = get_admin_db()
    is_first_profile = _profiles_count(db) == 0

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
        if _is_existing_user_error(exc):
            try:
                result = db.auth.sign_in_with_password(
                    {
                        "email": req.email,
                        "password": req.password,
                    }
                )
            except Exception as login_exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "An account with this email already exists. "
                        "Sign in instead, or use the original password."
                    ),
                ) from login_exc

            return _build_auth_response(
                db,
                user=result.user,
                full_name=req.full_name,
                default_role="admin" if is_first_profile else "user",
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _build_auth_response(
        db,
        user=result.user,
        full_name=req.full_name,
        default_role="admin" if is_first_profile else "user",
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

    metadata = _get_user_metadata(result.user)
    return _build_auth_response(
        db,
        user=result.user,
        full_name=metadata.get("full_name"),
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user's profile."""
    return current_user
