# ═══════════════════════════════════════════════════════════════
# FILE: services/tips_service.py
# PURPOSE: Generate personalised cybersecurity tips.
# ═══════════════════════════════════════════════════════════════

import re
from typing import List

from services.openai_service import structured_completion
from models.tips import TipItem

AUDIENCE_MAP = {
    "general":  "general internet users",
    "student":  "students and young people (16-25)",
    "business": "small business owners with limited IT budget",
    "beginner": "complete beginners to cybersecurity",
    "remote":   "remote workers and freelancers working from home",
}

TYPE_MAP = {
    "daily":    "practical daily habits everyone should adopt",
    "weekly":   "weekly security maintenance tasks",
    "beginner": "foundational security steps for complete beginners",
    "business": "essential security practices for small businesses",
}


def _parse_tips(raw: str) -> List[TipItem]:
    tips: List[TipItem] = []
    blocks = re.split(r'===TIP_START===', raw)

    for block in blocks:
        if '===TIP_END===' not in block:
            continue

        content = block.split('===TIP_END===')[0].strip()
        if not content:
            continue

        tip_data = {
            "title": "",
            "icon": "🛡️",
            "category": "General",
            "difficulty": "Easy",
            "tip": "",
            "why_it_matters": "",
            "quick_win": "",
        }

        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue

            for field in [
                "TITLE", "ICON", "CATEGORY", "DIFFICULTY",
                "TIP", "WHY_IT_MATTERS", "QUICK_WIN",
            ]:
                if line.startswith(f"{field}:"):
                    key = field.lower()
                    tip_data[key] = line.split(":", 1)[1].strip()
                    break

        if tip_data["title"] and tip_data["tip"]:
            tips.append(TipItem(**tip_data))

    return tips


async def generate_tips(
    category: str = "general",
    tip_type: str = "daily",
    num_tips: int = 5,
) -> List[TipItem]:
    audience = AUDIENCE_MAP.get(category, AUDIENCE_MAP["general"])
    tip_focus = TYPE_MAP.get(tip_type, TYPE_MAP["daily"])

    prompt = f"""
Generate exactly {num_tips} cybersecurity tips for {audience}.
Focus: {tip_focus}

Format EACH tip EXACTLY like this:

===TIP_START===
TITLE: [8 words or fewer — catchy and specific]
ICON: [single relevant emoji]
CATEGORY: [one of: Passwords / Phishing / Privacy / Network / Device / Social Media / Shopping / Business]
DIFFICULTY: [Easy / Medium / Advanced]
TIP: [2-3 sentences — practical, specific, actionable. No vague advice.]
WHY_IT_MATTERS: [One sentence explaining the real risk this prevents]
QUICK_WIN: [One specific action they can take TODAY]
===TIP_END===

Rules:
- Never use vague advice like "use a strong password" — be specific
- Each tip must give something the reader can act on immediately
- Tailor language complexity to the target audience
- Focus on free or low-cost solutions
"""

    raw = await structured_completion(prompt, temperature=0.8)
    return _parse_tips(raw)
