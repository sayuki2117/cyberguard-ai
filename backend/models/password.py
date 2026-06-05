from typing import List

from pydantic import BaseModel, Field


class PasswordCheckRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=128)


class PasswordCheckResponse(BaseModel):
    strength: str
    score: int
    zxcvbn_score: int
    crack_time_display: str
    length: int
    has_uppercase: bool
    has_lowercase: bool
    has_numbers: bool
    has_symbols: bool
    has_common_patterns: bool
    what_is_good: List[str]
    what_needs_work: List[str]
    suggestions: List[str]
    security_tip: str
