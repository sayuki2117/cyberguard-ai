from typing import List

from pydantic import BaseModel, Field


class PhishingAnalysisRequest(BaseModel):
    email_content: str = Field(..., min_length=10, max_length=10000)
    sender_email: str = Field(default="", max_length=254)


class PhishingIndicator(BaseModel):
    category: str
    description: str
    severity: str


class PhishingAnalysisResponse(BaseModel):
    risk_level: str
    risk_score: int
    is_phishing: bool
    indicators: List[PhishingIndicator]
    legitimate_signals: List[str]
    verdict: str
    recommended_actions: List[str]
    educational_tip: str
