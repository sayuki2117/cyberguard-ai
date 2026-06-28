# ===============================================================
# FILE: main.py
# PURPOSE: FastAPI application entry point.
#          Registers all routers, middleware, and startup config.
# ===============================================================

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from middleware.rate_limiter import limiter
from middleware.security import SecurityHeadersMiddleware
from routes import admin, auth, chat, knowledge, password, phishing, quiz, tips


app = FastAPI(
    title="CyberGuard AI API",
    description="Production-grade Cybersecurity Awareness Trainer API",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

# Rate limiting.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Security headers.
app.add_middleware(SecurityHeadersMiddleware)

# CORS.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://cyberguard-aksg0vlt7-sayuki-s-projects.vercel.app",
        "https://cyberguard-ai-indol.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# API routes.
app.include_router(admin.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(password.router, prefix="/api")
app.include_router(phishing.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(tips.router, prefix="/api")


@app.get("/")
def root():
    return {
        "status": "CyberGuard AI API",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "environment": settings.environment,
    }
