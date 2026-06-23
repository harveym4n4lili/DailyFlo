# Lesson 2 — The backend proxy pattern

**Previous:** [Lesson 1 — Foundations](./01-foundations.md)  
**Next:** [Lesson 3 — Prompts & structured output](./03-prompts-and-structured-output.md)

---

## The golden rule

> **The mobile/web app never holds the LLM provider API key.**

Instead:

```plaintext
Client  ──►  Your API (Django)  ──►  LLM provider
         JWT              API key in .env
```

This is called a **backend proxy** (or **BFF** — backend for frontend). It is the standard pattern for LLM integration in production apps.

---

## Why not call the LLM from the app?

| Reason | Explanation |
|--------|-------------|
| **Security** | Mobile apps can be decompiled; env vars can leak. |
| **Cost control** | Server can rate-limit, cap tokens, block abuse. |
| **Prompt control** | System instructions stay on server; users can’t easily tamper. |
| **Context assembly** | Server loads tasks/lists from DB — client shouldn’t send fake IDs. |
| **Provider swap** | Change OpenAI → Anthropic in one file; app URL unchanged. |

You already proxy **auth** and **tasks** through Django. LLM is the same idea with a different upstream.

---

## Three layers (learn this diagram)

```plaintext
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — Client (Expo / React Native)                     │
│  • Chat UI, loading states                                  │
│  • Calls YOUR endpoint only: POST /llm/assistant/           │
│  • Uses existing apiClient + JWT (same as tasks)            │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│  LAYER 2 — Your backend (Django view)                       │
│  • Is user logged in?                                       │
│  • Load task/list snapshot from YOUR database               │
│  • Build prompt, call provider, validate JSON               │
│  • Return stable JSON: { reply, proposals, meta }           │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│  LAYER 3 — Provider (OpenAI / Anthropic / etc.)             │
│  • Runs the model                                           │
│  • Bills you per token                                      │
│  • Knows nothing about DailyFlo’s database                  │
└─────────────────────────────────────────────────────────────┘
```

**Your job when integrating:** implement Layer 1 (service + UI) and Layer 2 (view + provider module). Layer 3 is someone else’s product — you only need an API key.

---

## What Layer 2 must do (checklist)

When a request hits `POST /llm/assistant/`:

1. **Authenticate** — reject if no valid JWT (same as `TaskViewSet`).
2. **Validate input** — message not empty, within max length.
3. **Fetch context** — query ORM for this user’s tasks/lists (minimal fields).
4. **Build messages** — system prompt + context block + user chat history.
5. **Call provider** — with timeout and `max_tokens` cap.
6. **Parse response** — expect JSON; handle malformed gracefully.
7. **Validate proposals** — task IDs exist and belong to user; enums valid.
8. **Return normalised JSON** — app never sees raw provider response.

Steps 6–7 are what separate “demo chatbot” from “app integration.”

---

## File structure (pattern for any Django project)

```plaintext
apps/llm/
  views.py           # HTTP: auth, call service, return Response
  serializers.py     # Request/response shapes
  urls.py
  services/
    provider.py      # ONLY file that imports openai/anthropic SDK
    prompts.py       # System prompt strings
    task_context.py  # DB → text/json for context
```

**Rule:** One module owns the provider SDK. If you scatter `openai.chat.completions.create` across views, swapping providers becomes painful.

---

## Pseudo-code: provider module (language-agnostic idea)

```python
# services/provider.py — conceptual

def call_assistant(*, system_prompt: str, messages: list, max_tokens: int) -> str:
    provider = settings.LLM_PROVIDER  # "openai" | "anthropic"

    if provider == "openai":
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "system", "content": system_prompt}, *messages],
            response_format={"type": "json_object"},  # structured output
            max_tokens=max_tokens,
            timeout=settings.LLM_REQUEST_TIMEOUT_SECONDS,
        )
        return response.choices[0].message.content

    # elif provider == "anthropic": ...
    raise ValueError(f"Unknown provider: {provider}")
```

The view does **not** know about OpenAI — it calls `call_assistant(...)`.

---

## Environment variables (pattern)

| Variable | Where | Example |
|----------|-------|---------|
| Provider key | Backend `.env` only | `OPENAI_API_KEY=sk-...` |
| Model name | Backend `.env` | `OPENAI_MODEL=gpt-4o-mini` |
| Your API URL | Frontend `.env` | `EXPO_PUBLIC_API_URL=http://192.168.x.x:8000` |

**Never** prefix provider keys with `EXPO_PUBLIC_` — that embeds them in the app bundle.

DailyFlo steps: [API setup checklist](../plan/llm-api-setup-checklist.md).

---

## Same auth as the rest of your API

The LLM route should use the **same** authentication as `/tasks/`:

```http
POST /llm/assistant/
Authorization: Bearer eyJ...
Content-Type: application/json
```

Your `apiClient` already attaches the Bearer token. The LLM service is just another `apiClient.post(...)` — same as `tasksApiService.createTask`.

---

## Errors the backend should map

| Situation | HTTP | Client message |
|-----------|------|----------------|
| Not logged in | 401 | “Please log in again” |
| Empty message | 400 | “Enter a message” |
| Provider down / bad key | 503 | “Assistant unavailable, try later” |
| Timeout | 504 | “Request timed out” |
| Valid request, no proposals | 200 | Reply text only ( OK for general chat ) |

Frontend: `mapLlmErrorToUserMessage()` — same idea as mapping axios errors for tasks.

---

## Check yourself

1. Why is the API key on Django, not in Expo?  
2. Name the three layers and one responsibility each.  
3. Which layer validates that a `taskId` belongs to the user?

**Answers:** (1) Security + cost + control. (2) Client = UI; Backend = auth/prompt/validate; Provider = model. (3) Layer 2 only — the provider never sees your DB.

---

## DailyFlo pointer

Endpoint: `POST /llm/assistant/` — [architecture](../llm-architecture.md) §5.  
Backend build steps: [implementation plan](../plan/llm-assistant-implementation.md) Phase 1.
