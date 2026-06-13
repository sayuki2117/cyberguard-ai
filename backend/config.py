# ===============================================================
# FILE: config.py
# PURPOSE: Central configuration using Pydantic Settings.
#          Pydantic Settings automatically reads from .env file
#          and validates each variable's type.
#          One place to manage all settings = easy to maintain.
# ===============================================================

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # -- OpenAI --------------------------------------------------
    # OpenAI is used for embeddings.
    openai_api_key: str
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-small"

    # -- OpenRouter ---------------------------------------------
    # OpenRouter is used for chat completion by default.
    openrouter_api_key: str
    openrouter_model: str = "openai/gpt-4o"

    # -- AI Provider --------------------------------------------
    ai_provider: Literal["openai", "openrouter"] = "openrouter"

    # -- Supabase -----------------------------------------------
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str

    # -- JWT -----------------------------------------------------
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # -- App -----------------------------------------------------
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"
    max_upload_size_mb: int = 10

    # -- Rate Limiting ------------------------------------------
    rate_limit_chat: str = "30/minute"
    rate_limit_analysis: str = "20/minute"
    rate_limit_upload: str = "5/minute"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


# lru_cache means settings are loaded once and cached
# (not re-read from disk on every request)
@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
