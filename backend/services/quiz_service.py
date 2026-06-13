# ═══════════════════════════════════════════════════════════════
# FILE: services/quiz_service.py
# PURPOSE: Generate and score cybersecurity quizzes.
#          Uses AI to generate unique questions each time.
# ═══════════════════════════════════════════════════════════════

import re
from typing import Dict, List

from models.quiz import (
    QuizResponse,
    QuizQuestion,
    QuizOption,
    QuizSubmitRequest,
    QuizResult,
)
from services.openai_service import structured_completion

TOPIC_DESCRIPTIONS = {
    "general":   "general cybersecurity awareness and best practices",
    "phishing":  "phishing attacks, email security, and social engineering",
    "passwords": "password security, authentication, and credential management",
    "malware":   "malware types, ransomware, viruses, and protection methods",
    "network":   "network security, WiFi security, and VPNs",
    "privacy":   "online privacy, data protection, and GDPR basics",
    "business":  "cybersecurity for small businesses and remote workers",
    "social":    "social engineering attacks and manipulation tactics",
}


def _parse_quiz(raw: str) -> List[QuizQuestion]:
    """Parse structured quiz output into QuizQuestion objects."""
    questions: List[QuizQuestion] = []
    blocks = re.split(r'===QUESTION_START===', raw)

    for block in blocks:
        if '===QUESTION_END===' not in block:
            continue

        content = block.split('===QUESTION_END===')[0].strip()
        if not content:
            continue

        q: Dict[str, object] = {
            "id": len(questions) + 1,
            "question": "",
            "options": {},
            "correct": "",
            "explanation": "",
            "category": "General",
        }

        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue

            if line.startswith("ID:"):
                try:
                    q["id"] = int(re.search(r'\d+', line).group())
                except Exception:
                    pass
            elif line.startswith("QUESTION:"):
                q["question"] = line.split(":", 1)[1].strip()
            elif line.startswith(("A:", "B:", "C:", "D:")):
                key = line[0]
                text = line[2:].strip()
                q["options"][key] = text
            elif line.startswith("CORRECT:"):
                q["correct"] = line.split(":", 1)[1].strip().upper()[:1]
            elif line.startswith("EXPLANATION:"):
                q["explanation"] = line.split(":", 1)[1].strip()
            elif line.startswith("CATEGORY:"):
                q["category"] = line.split(":", 1)[1].strip()

        if q["question"] and q["correct"] and len(q["options"]) == 4:
            options = [
                QuizOption(key=k, value=v)
                for k, v in sorted(q["options"].items())
            ]
            questions.append(QuizQuestion(
                id=q["id"],
                question=q["question"],
                options=options,
                correct=q["correct"],
                explanation=q["explanation"],
                category=q["category"],
            ))

    return questions


async def generate_quiz(
    topic: str = "general",
    difficulty: str = "beginner",
    num_questions: int = 5,
) -> QuizResponse:
    """Generate a quiz using AI with structured output parsing."""
    topic_desc = TOPIC_DESCRIPTIONS.get(topic, TOPIC_DESCRIPTIONS["general"])

    difficulty_guidance = {
        "beginner": "basic awareness, recognition of threats, simple best practices. No technical jargon.",
        "intermediate": "how attacks work, security tools, configuration basics.",
        "advanced": "technical depth, CVEs, security frameworks, incident response.",
    }.get(difficulty, "basic awareness")

    prompt = f"""
Generate exactly {num_questions} multiple-choice cybersecurity quiz questions.

Topic: {topic_desc}
Difficulty: {difficulty} — focus on {difficulty_guidance}
Target audience: students, small business owners, beginners

Format EACH question EXACTLY like this (include ALL markers):

===QUESTION_START===
ID: [number 1 to {num_questions}]
QUESTION: [The question text]
A: [Option A text]
B: [Option B text]
C: [Option C text]
D: [Option D text]
CORRECT: [A, B, C, or D — single letter only]
EXPLANATION: [2 sentences: why the correct answer is right AND what the user should learn]
CATEGORY: [one of: Awareness / Threats / Best Practices / Tools / Compliance]
===QUESTION_END===

Rules:
- Wrong answers must be plausible, not obviously wrong
- Questions must be practical and scenario-based when possible
- Explanations must teach something new
- No repeated questions
- For beginner level: focus on what to DO, not deep technical how
"""

    raw = await structured_completion(prompt, temperature=0.7)
    questions = _parse_quiz(raw)

    return QuizResponse(
        topic=topic_desc,
        difficulty=difficulty,
        total_questions=len(questions),
        questions=questions,
    )


def score_quiz(request: QuizSubmitRequest) -> QuizResult:
    """Score a submitted quiz and build detailed results."""
    correct_count = 0
    answer_details = []

    for question in request.questions:
        q_id = str(question.id)
        user_answer = request.answers.get(q_id, "")
        is_correct = user_answer.upper() == question.correct.upper()

        if is_correct:
            correct_count += 1

        correct_text = next(
            (opt.value for opt in question.options if opt.key == question.correct),
            "",
        )
        user_text = next(
            (opt.value for opt in question.options if opt.key == user_answer.upper()),
            user_answer,
        )

        answer_details.append({
            "question_id": question.id,
            "question": question.question,
            "user_answer": user_answer,
            "user_text": user_text,
            "correct": question.correct,
            "correct_text": correct_text,
            "is_correct": is_correct,
            "explanation": question.explanation,
        })

    total = len(request.questions)
    percentage = round((correct_count / total) * 100, 1) if total > 0 else 0.0

    return QuizResult(
        score=correct_count,
        total=total,
        percentage=percentage,
        passed=percentage >= 60,
        answers=answer_details,
    )
