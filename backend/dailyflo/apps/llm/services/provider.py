"""
Gemini provider client — the only module that talks to Google Generative AI.

API key lives in Django settings (GOOGLE_AI_API_KEY), never in the mobile app.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from django.conf import settings

from apps.llm.services.exceptions import LlmConfigurationError, LlmProviderError, LlmTimeoutError

logger = logging.getLogger(__name__)


def _ensure_gemini_configured() -> None:
    if settings.LLM_PROVIDER != 'gemini':
        raise LlmConfigurationError(
            f'LLM_PROVIDER is "{settings.LLM_PROVIDER}"; this build expects "gemini".'
        )
    if not settings.GOOGLE_AI_API_KEY:
        raise LlmConfigurationError('GOOGLE_AI_API_KEY is not set in backend .env')


def call_assistant(*, system_prompt: str, user_content: str) -> str:
    """
    Call Gemini and return raw JSON text from the model.

    Uses JSON response mode so the app can parse proposals reliably.
    """
    _ensure_gemini_configured()

    try:
        import google.generativeai as genai
    except ImportError as exc:
        raise LlmConfigurationError(
            'google-generativeai package is not installed. Run pip install -r requirements.txt'
        ) from exc

    genai.configure(api_key=settings.GOOGLE_AI_API_KEY)

    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=system_prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type='application/json',
            max_output_tokens=settings.LLM_MAX_TOKENS,
        ),
    )

    try:
        response = model.generate_content(
            user_content,
            request_options={'timeout': settings.LLM_REQUEST_TIMEOUT_SECONDS},
        )
    except Exception as exc:
        message = str(exc).lower()
        if 'timeout' in message or 'deadline' in message:
            raise LlmTimeoutError('Gemini request timed out') from exc
        logger.exception('Gemini API call failed')
        raise LlmProviderError('Gemini API call failed') from exc

    text = getattr(response, 'text', None) or ''
    if not text.strip():
        raise LlmProviderError('Gemini returned an empty response')

    return text


def parse_assistant_json(raw: str) -> dict[str, Any]:
    """Parse model JSON; salvage fenced/body JSON; safe fallback on failure."""
    text = (raw or '').strip()
    if not text:
        return _formatting_error_reply()

    # strip optional markdown code fences the model sometimes adds anyway
    if text.startswith('```'):
        lines = text.splitlines()
        if lines and lines[0].startswith('```'):
            lines = lines[1:]
        if lines and lines[-1].strip() == '```':
            lines = lines[:-1]
        text = '\n'.join(lines).strip()

    data = _loads_json_lenient(text)
    if data is None:
        logger.warning('LLM returned non-JSON content: %s', text[:500])
        return _formatting_error_reply(
            'I had trouble formatting that response. Try asking again with fewer tasks at once, '
            'for example: "Set duration to 60 minutes for each of tomorrow\'s tasks."'
        )

    if not isinstance(data, dict):
        return _formatting_error_reply()

    reply = data.get('reply')
    if not isinstance(reply, str):
        reply = str(reply) if reply is not None else ''

    proposals = data.get('proposals')
    if not isinstance(proposals, list):
        proposals = []

    return {'reply': reply.strip(), 'proposals': proposals}


def _formatting_error_reply(custom: str | None = None) -> dict[str, Any]:
    return {
        'reply': custom
        or 'I had trouble formatting that response. Please try again with a shorter or more specific request.',
        'proposals': [],
    }


def _loads_json_lenient(text: str) -> dict[str, Any] | None:
    """Try strict parse, then extract outermost { ... } object."""
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    start = text.find('{')
    end = text.rfind('}')
    if start == -1 or end <= start:
        return None

    snippet = text[start : end + 1]
    try:
        parsed = json.loads(snippet)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None
