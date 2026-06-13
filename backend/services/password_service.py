# ═══════════════════════════════════════════════════════════════
# FILE: services/password_service.py
# PURPOSE: Password strength analysis.
#          Uses zxcvbn (the same library Dropbox uses) for
#          realistic crack time estimation, PLUS AI for
#          educational feedback and personalised suggestions.
#
# zxcvbn scores: 0=too guessable, 1=weak, 2=fair, 3=strong, 4=very strong
# ═══════════════════════════════════════════════════════════════

import math
import re
from typing import List

from models.password import PasswordCheckResponse
from services.openai_service import structured_completion

STRENGTH_LABELS = {0: "Very Weak", 1: "Weak", 2: "Fair", 3: "Strong", 4: "Very Strong"}
SCORE_MAP = {0: 10, 1: 25, 2: 50, 3: 75, 4: 95}

COMMON_PASSWORDS = [
    "password", "123456", "qwerty", "admin", "letmein",
    "welcome", "monkey", "dragon", "master", "login",
    "abc123", "password1", "iloveyou", "sunshine"
]

SEQUENTIAL_PATTERNS = [
    "0123", "1234", "2345", "3456", "4567",
    "5678", "6789", "abcd", "bcde", "cdef", "qwer", "asdf"
]

KEYBOARD_PATTERNS = [
    "qwert", "asdfg", "zxcvb", "yuiop", "1qaz", "qazw",
]


def _calculate_entropy(password: str) -> float:
    """
    Shannon entropy = measure of randomness/unpredictability.
    Higher entropy = harder to crack.
    Formula: H = L * log2(N) where L=length, N=charset size
    """
    charset = 0
    if re.search(r"[a-z]", password):
        charset += 26
    if re.search(r"[A-Z]", password):
        charset += 26
    if re.search(r"\d", password):
        charset += 10
    if re.search(r"[^a-zA-Z0-9]", password):
        charset += 32

    if charset == 0:
        return 0.0

    return len(password) * math.log2(charset)


def _estimate_crack_time_display(entropy: float) -> str:
    """Convert entropy into a friendly crack-time estimate."""
    if entropy <= 0:
        return "Instantly crackable"
    if entropy < 28:
        return "Less than a second"
    if entropy < 36:
        return "Seconds"
    if entropy < 60:
        return "Minutes to hours"
    if entropy < 80:
        return "Days to months"
    if entropy < 100:
        return "Years"
    if entropy < 120:
        return "Decades"
    return "Centuries or longer"


def _local_checks(password: str) -> dict:
    """Run instant local password checks without any API call."""
    common_patterns: List[str] = []
    password_lower = password.lower()

    for word in COMMON_PASSWORDS:
        if word in password_lower:
            common_patterns.append(f"common word: '{word}'")
            break

    for seq in SEQUENTIAL_PATTERNS:
        if seq in password_lower:
            common_patterns.append(f"sequential pattern: '{seq}'")
            break

    if re.search(r"(.)\1{2,}", password):
        common_patterns.append("repeated characters")

    if any(pattern in password_lower for pattern in KEYBOARD_PATTERNS):
        common_patterns.append("keyboard pattern")

    return {
        "length": len(password),
        "has_uppercase": bool(re.search(r"[A-Z]", password)),
        "has_lowercase": bool(re.search(r"[a-z]", password)),
        "has_numbers": bool(re.search(r"\d", password)),
        "has_symbols": bool(re.search(r"[^a-zA-Z0-9]", password)),
        "has_common_patterns": bool(common_patterns),
        "entropy": round(_calculate_entropy(password), 1),
        "common_patterns_found": common_patterns,
    }


def _build_password_review(checks: dict) -> dict:
    what_is_good: List[str] = []
    what_needs_work: List[str] = []
    suggestions: List[str] = []

    length = checks["length"]
    if length >= 12:
        what_is_good.append(f"Good length: {length} characters")
    elif length >= 8:
        what_needs_work.append(f"Too short: only {length} characters (aim for 12+)")
    else:
        what_needs_work.append(f"Very short: only {length} characters")

    if checks["has_uppercase"]:
        what_is_good.append("Contains uppercase letters")
    else:
        what_needs_work.append("Add uppercase letters (A-Z)")
        suggestions.append("Use at least one uppercase character")

    if checks["has_lowercase"]:
        what_is_good.append("Contains lowercase letters")
    else:
        what_needs_work.append("Add lowercase letters (a-z)")
        suggestions.append("Use at least one lowercase character")

    if checks["has_numbers"]:
        what_is_good.append("Contains numbers")
    else:
        what_needs_work.append("Add numbers (0-9)")
        suggestions.append("Include digits like 4 or 7")

    if checks["has_symbols"]:
        what_is_good.append("Contains special characters")
    else:
        what_needs_work.append("Add special characters (!@#$%^&*)")
        suggestions.append("Include symbols such as !, @, #, or %")

    if not checks["has_common_patterns"]:
        what_is_good.append("No obvious common patterns")
    else:
        what_needs_work.append(f"Common patterns found: {', '.join(checks['common_patterns_found'])}")
        suggestions.append("Avoid common words, sequences, and repeated characters")

    if checks["entropy"] > 50:
        what_is_good.append(f"High entropy: {checks['entropy']} bits")

    if checks["entropy"] <= 40 and "High entropy" not in what_is_good:
        suggestions.append("Increase entropy by adding different character types and length")

    return {
        "what_is_good": what_is_good,
        "what_needs_work": what_needs_work,
        "suggestions": suggestions,
    }


async def analyse_password(password: str) -> PasswordCheckResponse:
    """
    Full password analysis: local checks + zxcvbn simulation + AI feedback.
    NOTE: We simulate zxcvbn scoring locally to avoid importing the
    Python zxcvbn library which has C extension requirements.
    The frontend uses the JS zxcvbn library for the real score.
    """
    checks = _local_checks(password)

    score = 0
    if checks["length"] >= 8:
        score += 1
    if checks["length"] >= 12:
        score += 1
    if sum([
        checks["has_uppercase"],
        checks["has_lowercase"],
        checks["has_numbers"],
        checks["has_symbols"],
    ]) >= 3:
        score += 1
    if not checks["has_common_patterns"] and checks["entropy"] > 40:
        score += 1
    score = min(score, 4)

    strength = STRENGTH_LABELS[score]
    numeric_score = SCORE_MAP[score]
    crack_time_display = _estimate_crack_time_display(checks["entropy"])

    review = _build_password_review(checks)
    suggestions = review["suggestions"]

    prompt = f"""
You are a friendly cybersecurity trainer.
Evaluate this password and provide a short educational tip plus up to three personalised suggestions.
The password analysis is:
- Strength: {strength}
- Score: {numeric_score}/100
- zxcvbn_score: {score}
- Length: {checks['length']}
- Uppercase: {checks['has_uppercase']}
- Lowercase: {checks['has_lowercase']}
- Numbers: {checks['has_numbers']}
- Symbols: {checks['has_symbols']}
- Common patterns: {checks['common_patterns_found'] or 'None'}
- Entropy: {checks['entropy']} bits
- Crack time: {crack_time_display}

Respond in this EXACT format:
TIP: [One sentence security tip]
SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]
- [suggestion 3]
"""

    ai_tip = "Use a strong unique password and avoid predictable patterns."
    ai_suggestions: List[str] = []

    try:
        raw_response = await structured_completion(prompt, temperature=0.2)
        section = None
        for line in raw_response.splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("TIP:"):
                ai_tip = line.split(":", 1)[1].strip()
                section = None
            elif line == "SUGGESTIONS:":
                section = "suggestions"
            elif section == "suggestions" and line.startswith("- "):
                ai_suggestions.append(line[2:].strip())
    except Exception:
        ai_tip = "Use a strong unique password and avoid predictable patterns."

    if not ai_suggestions:
        ai_suggestions = suggestions[:3] or [
            "Use a longer passphrase instead of a short password.",
            "Avoid common words, repeated characters, and predictable sequences.",
            "Mix uppercase, lowercase, numbers, and symbols for stronger entropy."
        ]

    return PasswordCheckResponse(
        strength=strength,
        score=numeric_score,
        zxcvbn_score=score,
        crack_time_display=crack_time_display,
        length=checks["length"],
        has_uppercase=checks["has_uppercase"],
        has_lowercase=checks["has_lowercase"],
        has_numbers=checks["has_numbers"],
        has_symbols=checks["has_symbols"],
        has_common_patterns=checks["has_common_patterns"],
        what_is_good=review["what_is_good"],
        what_needs_work=review["what_needs_work"],
        suggestions=ai_suggestions,
        security_tip=ai_tip,
    )
