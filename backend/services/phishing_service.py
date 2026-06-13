# ═══════════════════════════════════════════════════════════════
# FILE: services/phishing_service.py
# PURPOSE: Analyses emails for phishing indicators.
#          Two-layer approach:
#          Layer 1 — Fast local regex/pattern checks (instant)
#          Layer 2 — Deep AI analysis (comprehensive)
#          Combining both = speed + accuracy
# ═══════════════════════════════════════════════════════════════

import re
from typing import List

from models.phishing import PhishingAnalysisResponse, PhishingIndicator
from services.openai_service import structured_completion

# ── Known phishing patterns ─────────────────────────────────────
URGENCY_PHRASES = [
    "act now", "urgent", "immediate action", "account suspended",
    "verify immediately", "within 24 hours", "limited time",
    "your account will be closed", "click here immediately",
    "confirm your identity", "unusual activity detected",
]

SUSPICIOUS_DOMAINS = [
    "bit.ly", "tinyurl", "t.co", "goo.gl", "ow.ly",
    "paypa1", "arnazon", "micros0ft", "app1e", "g00gle",
]

CREDENTIAL_REQUESTS = [
    "enter your password", "confirm your password",
    "provide your credit card", "social security",
    "bank account number", "pin number", "enter your ssn",
    "verify your account", "update your billing",
]


def _local_analysis(email_content: str, sender: str) -> List[PhishingIndicator]:
    """
    Fast local checks using regex and pattern matching.
    Returns a list of indicators found BEFORE the AI call.
    """
    indicators: List[PhishingIndicator] = []
    content_lower = email_content.lower()
    sender_lower = sender.lower() if sender else ""

    # ── Check 1: Urgency language ─────────────────────────────
    found_urgency = [p for p in URGENCY_PHRASES if p in content_lower]
    if found_urgency:
        indicators.append(PhishingIndicator(
            category="Urgency Language",
            description=f"Contains high-pressure language: {', '.join(found_urgency[:3])}",
            severity="medium"
        ))

    # ── Check 2: Suspicious links ──────────────────────────────
    urls = re.findall(r'https?://[^\s<>"\']+', email_content)
    for url in urls:
        for domain in SUSPICIOUS_DOMAINS:
            if domain in url.lower():
                indicators.append(PhishingIndicator(
                    category="Suspicious Links",
                    description=f"Contains suspicious/shortened URL: {url[:60]}",
                    severity="high"
                ))
                break

    # ── Check 3: Credential requests ──────────────────────────
    found_creds = [p for p in CREDENTIAL_REQUESTS if p in content_lower]
    if found_creds:
        indicators.append(PhishingIndicator(
            category="Credential Harvesting",
            description=f"Requests sensitive information: {found_creds[0]}",
            severity="critical"
        ))

    # ── Check 4: Sender domain mismatch ───────────────────────
    if sender_lower:
        free_providers = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
        major_brands = [
            "paypal", "amazon", "apple", "microsoft", "google",
            "netflix", "bank", "chase", "wells fargo",
        ]

        sender_has_brand = any(b in content_lower[:200] for b in major_brands)
        sender_is_free = any(p in sender_lower for p in free_providers)

        if sender_has_brand and sender_is_free:
            indicators.append(PhishingIndicator(
                category="Sender Mismatch",
                description=f"Email claims to be from a major brand but sent from: {sender}",
                severity="high"
            ))

    # ── Check 5: Excessive exclamation / ALL CAPS ─────────────
    caps_ratio = sum(1 for c in email_content if c.isupper()) / max(len(email_content), 1)
    if caps_ratio > 0.3:
        indicators.append(PhishingIndicator(
            category="Suspicious Formatting",
            description="Excessive use of UPPERCASE text — common manipulation tactic",
            severity="low"
        ))

    return indicators


async def analyse_phishing_email(
    email_content: str,
    sender: str = ""
) -> PhishingAnalysisResponse:
    """
    Full phishing analysis combining local checks + AI.
    """
    local_indicators = _local_analysis(email_content, sender)

    prompt = f"""
You are a cybersecurity expert specialising in phishing detection.
Analyse this email thoroughly.

Sender: {sender if sender else "Not provided"}

Email:
---
{email_content[:5000]}
---

Pre-detected indicators from local analysis:
{chr(10).join(f'- [{i.severity.upper()}] {i.category}: {i.description}' for i in local_indicators) or "None"}

Respond in this EXACT format:

RISK_LEVEL: [SAFE|LOW|MEDIUM|HIGH|CRITICAL]
RISK_SCORE: [0-100]
IS_PHISHING: [true|false]

ADDITIONAL_INDICATORS:
CATEGORY: [category name]
DESCRIPTION: [what you found]
SEVERITY: [low|medium|high|critical]
END_INDICATOR

LEGITIMATE_SIGNALS:
- [signal 1]
- [signal 2]

VERDICT:
[2-3 sentence plain English verdict]

ACTIONS:
- [action 1]
- [action 2]
- [action 3]

TIP:
[One educational cybersecurity tip related to this email type]
"""

    raw = await structured_completion(prompt, temperature=0.1)

    lines = raw.split("\n")
    result = {
        "risk_level": "MEDIUM",
        "risk_score": 50,
        "is_phishing": False,
        "additional_indicators": [],
        "legitimate_signals": [],
        "verdict": "",
        "actions": [],
        "tip": ""
    }

    section = None
    current_indicator: dict = {}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if line.startswith("RISK_LEVEL:"):
            result["risk_level"] = line.split(":", 1)[1].strip()
        elif line.startswith("RISK_SCORE:"):
            try:
                result["risk_score"] = int(re.search(r'\d+', line).group())
            except Exception:
                pass
        elif line.startswith("IS_PHISHING:"):
            result["is_phishing"] = "true" in line.lower()
        elif line == "ADDITIONAL_INDICATORS:":
            section = "indicators"
        elif line == "LEGITIMATE_SIGNALS:":
            section = "legitimate"
        elif line == "VERDICT:":
            section = "verdict"
        elif line == "ACTIONS:":
            section = "actions"
        elif line == "TIP:":
            section = "tip"
        elif line == "END_INDICATOR" and current_indicator:
            if current_indicator.get("description"):
                result["additional_indicators"].append(PhishingIndicator(
                    category=current_indicator.get("category", "Unknown"),
                    description=current_indicator.get("description", ""),
                    severity=current_indicator.get("severity", "medium")
                ))
            current_indicator = {}
        elif section == "indicators":
            if line.startswith("CATEGORY:"):
                current_indicator["category"] = line.split(":", 1)[1].strip()
            elif line.startswith("DESCRIPTION:"):
                current_indicator["description"] = line.split(":", 1)[1].strip()
            elif line.startswith("SEVERITY:"):
                current_indicator["severity"] = line.split(":", 1)[1].strip()
        elif section == "legitimate" and line.startswith("- "):
            result["legitimate_signals"].append(line[2:].strip())
        elif section == "verdict" and not line.endswith(":"):
            result["verdict"] += (" " + line) if result["verdict"] else line
        elif section == "actions" and line.startswith("- "):
            result["actions"].append(line[2:].strip())
        elif section == "tip" and not line.endswith(":"):
            result["tip"] += (" " + line) if result["tip"] else line

    all_indicators = local_indicators + result["additional_indicators"]

    return PhishingAnalysisResponse(
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        is_phishing=result["is_phishing"],
        indicators=all_indicators,
        legitimate_signals=result["legitimate_signals"],
        verdict=result["verdict"] or "Analysis complete.",
        recommended_actions=result["actions"],
        educational_tip=result["tip"]
    )
