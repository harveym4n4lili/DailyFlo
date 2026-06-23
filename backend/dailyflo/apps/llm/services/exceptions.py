"""Custom errors for the LLM proxy layer."""


class LlmConfigurationError(Exception):
    """Missing API key or provider settings."""


class LlmProviderError(Exception):
    """Upstream Gemini (or other provider) call failed."""


class LlmTimeoutError(Exception):
    """Provider did not respond in time."""
