"""Parse duration values from LLM output into minutes (DailyFlo task field)."""

from __future__ import annotations

import re
from typing import Any


def parse_duration_minutes(value: Any) -> int | None:
    """
    Accept minutes as int or strings like "60", "1 hour", "30 min".
    Returns None when value cannot be parsed.
    """
    if value is None:
        return None

    if isinstance(value, bool):
        return None

    if isinstance(value, (int, float)):
        return max(0, int(value))

    text = str(value).strip().lower()
    if not text:
        return None

    # "1 hour", "1.5 hours", "1h"
    hour_match = re.match(r'^([\d.]+)\s*(h|hour|hours)?$', text)
    if hour_match and ('hour' in text or text.endswith('h')):
        return max(0, int(float(hour_match.group(1)) * 60))

    if 'hour' in text:
        num = re.search(r'([\d.]+)', text)
        if num:
            return max(0, int(float(num.group(1)) * 60))

    if 'min' in text:
        num = re.search(r'([\d.]+)', text)
        if num:
            return max(0, int(float(num.group(1))))

    try:
        return max(0, int(float(text)))
    except ValueError:
        return None
