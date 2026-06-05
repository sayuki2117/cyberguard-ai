# ===============================================================
# FILE: dependencies.py
# PURPOSE: FastAPI dependency injection.
#          Dependencies = reusable functions that FastAPI calls
#          automatically before running a route handler.
#          Here we validate JWT tokens so protected routes
#          automatically reject unauthenticated requests.
# ===============================================================

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import settings
from database import get_admin_db


# HTTPBearer extracts "Bearer <token>" from the Authorization header
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validate JWT token and return the current user's data.
    Any route that uses this dependency will automatically
    return 401 if the token is missing or invalid.
    """
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode and verify the JWT token
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Fetch fresh user profile from database
    db = get_admin_db()
    result = db.table("profiles").select("*").eq("id", user_id).single().execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    return result.data


async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Additional check: user must have role='admin'.
    Use this dependency on admin-only routes.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user
