from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class QuizGenerateRequest(BaseModel):
    topic: str = Field(default="general")
    difficulty: str = Field(default="beginner")
    num_questions: int = Field(default=5, ge=3, le=10)


class QuizOption(BaseModel):
    key: str
    value: str


class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[QuizOption]
    correct: str
    explanation: str
    category: Optional[str] = None


class QuizResponse(BaseModel):
    topic: str
    difficulty: str
    total_questions: int
    questions: List[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    topic: str
    difficulty: str
    answers: Dict[str, str]
    questions: List[QuizQuestion]


class QuizResult(BaseModel):
    score: int
    total: int
    percentage: float
    passed: bool
    answers: List[dict]
