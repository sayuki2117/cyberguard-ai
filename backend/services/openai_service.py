# ===============================================================
# FILE: services/openai_service.py
# PURPOSE: Unified AI service supporting both OpenAI and OpenRouter.
#          OpenRouter = a gateway to 100+ AI models using one API.
#          Switch between providers using the AI_PROVIDER env var.
# ===============================================================

import logging
from typing import List, Optional

from openai import AsyncOpenAI

from config import settings

logger = logging.getLogger("cyberguard")


def _get_client() -> AsyncOpenAI:
    """
    Return the correct AI client based on AI_PROVIDER env var.
    OpenRouter uses the same OpenAI SDK format but with a
    different base_url and API key.
    """
    if settings.ai_provider == "openrouter":
        if not settings.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter")
        logger.info("Using OpenRouter for chat completion; model=%s", settings.openrouter_model)
        return AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": settings.frontend_url,
                "X-Title": "CyberGuard AI",
            },
        )
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
    logger.info("Using OpenAI for chat completion; model=%s", settings.openai_model)
    return AsyncOpenAI(api_key=settings.openai_api_key)


def _get_model() -> str:
    if settings.ai_provider == "openrouter":
        return settings.openrouter_model
    return settings.openai_model


# -- Master system prompt ---------------------------------------
SYSTEM_PROMPT = """You are CyberGuard AI, an expert cybersecurity awareness trainer.

Your audience: students, small business owners, and beginners.

Your personality:
- Friendly, encouraging, never condescending
- Use clear language - explain technical terms when you use them
- Be concise but thorough
- Use emojis occasionally to keep it engaging
- Give practical, real-world applicable advice

Your expertise:
- Phishing detection and email security
- Password security and management
- Network security basics
- Malware and ransomware awareness
- Social engineering
- Data privacy and GDPR basics
- Small business security on a budget
- Secure remote working

Important rules:
- Always prioritise user safety
- Never provide information that could be used maliciously
- If you don't know something, say so clearly
- Ground your answers in the provided knowledge base context when available
"""


async def chat_completion(
    message: str,
    history: Optional[List[dict]] = None,
    context: Optional[str] = None,
    temperature: float = 0.7,
) -> str:
    """
    Generate a chat response.
    context = RAG-retrieved knowledge base content to inject.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject RAG context if available
    if context:
        messages.append(
            {
                "role": "system",
                "content": (
                    "Relevant knowledge base context:\n\n"
                    f"{context}\n\n"
                    "Use this context to inform your answer when relevant."
                ),
            }
        )

    # Add conversation history (last 10 to manage tokens)
    if history:
        messages.extend(history[-10:])

    messages.append({"role": "user", "content": message})

    client = _get_client()
    model = _get_model()

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1000,
            temperature=temperature,
        )
    except Exception as exc:
        if settings.ai_provider == "openrouter":
            logger.warning(
                "OpenRouter chat completion failed, falling back to OpenAI: %s",
                exc,
            )
            if not settings.openai_api_key:
                raise
            client = AsyncOpenAI(api_key=settings.openai_api_key)
            model = settings.openai_model
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1000,
                temperature=temperature,
            )
        else:
            raise

    return response.choices[0].message.content.strip()


async def get_embedding(text: str) -> List[float]:
    """
    Generate a vector embedding for a piece of text.
    OpenAI is used for embeddings regardless of the chat provider.
    """
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.embeddings.create(
        model=settings.openai_embedding_model,
        input=text.strip(),
    )
    return response.data[0].embedding


async def structured_completion(prompt: str, temperature: float = 0.2) -> str:
    """
    For structured outputs (phishing analysis, quiz generation).
    Lower temperature = more consistent, predictable responses.
    """
    client = _get_client()
    model = _get_model()

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1500,
            temperature=temperature,
        )
    except Exception as exc:
        if settings.ai_provider == "openrouter":
            logger.warning(
                "OpenRouter structured completion failed, falling back to OpenAI: %s",
                exc,
            )
            if not settings.openai_api_key:
                raise
            client = AsyncOpenAI(api_key=settings.openai_api_key)
            model = settings.openai_model
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1500,
                temperature=temperature,
            )
        else:
            raise

    return response.choices[0].message.content.strip()
