from typing import List

from pydantic import BaseModel, Field


class TipItem(BaseModel):
    title: str
    icon: str
    category: str
    difficulty: str
    tip: str
    why_it_matters: str
    quick_win: str


class TipGenerateRequest(BaseModel):
    category: str = Field(default="general")
    tip_type: str = Field(default="daily")
    num_tips: int = Field(default=5, ge=1, le=10)
