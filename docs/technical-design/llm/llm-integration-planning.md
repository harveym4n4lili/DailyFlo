# LLM Integration Planning Document

## Overview

This document is the technical design plan for adding **LLM-assisted features** to DailyFlo (e.g. task suggestions, goal breakdown, copy helpers). The app **does not** train a foundation model; it **calls an existing model** through the Django backend so API keys stay off the device and behaviour stays consistent.

### Current State

- **Frontend**: No LLM flows; tasks/auth follow Redux → API service → Django.
- **Backend**: No LLM endpoints or provider integration.
- **Secrets**: Pattern to follow: same as existing API auth (tokens server-side only).

### Target State

- **Frontend**: Feature screens call **only** DailyFlo Django endpoints; loading/error UX; output treated as untrusted text until validated.
- **Backend**: Authenticated routes proxy to a **single provider abstraction** (hosted API or self-hosted model [TBD]); timeouts, token limits, and minimal logging.
- **Data flow**: UI → Redux/thunk or hook → `llm` API service → Django → provider → JSON/text response → UI.

### Key Concepts (first-time LLM integration)

- **Provider**: The service that runs the model (e.g. hosted API). The app talks to **Django**, not to the provider directly.
- **Prompt**: System instructions + user text/context sent in one request; keep context small and intentional.
- **Tokens**: Billing and length units; cap `max_tokens` and input size to control cost and latency.

---

## Integration Architecture

### Data Flow Diagram

```
User action (Expo UI)
    ↓
API service method (e.g. services/api/llm.ts) + auth header
    ↓
POST /api/.../llm/...  (Django, JWT/session as today)
    ↓
Auth + rate limit + validate payload
    ↓
Provider client (server-only API key)
    ↓
LLM provider
    ↓
Normalised response { text | structured JSON } + error mapping
    ↓
Redux / local state → UI
```

### Component Responsibilities

- **UI**: Collect input, show loading/errors, display model output; no provider URLs or keys.
- **API service**: Typed requests to Django LLM routes; maps errors to user-safe messages.
- **Django views**: Auth, validation, prompt assembly, call provider, return stable JSON schema.
- **Provider module**: One place for SDK/HTTP calls, retries policy [TBD], timeouts.

---

## Backend Design (Django)

| Item | Decision / template |
|------|---------------------|
| **Base path** | `[TBD]` e.g. `/api/v1/llm/` |
| **Endpoints** | `[TBD]` e.g. `POST .../suggest-tasks/` — one route per product feature or one generic route with `feature` key |
| **Request body** | `{ "input": string, "context"?: object }` — shape fixed per endpoint |
| **Response body** | `{ "result": string \| object, "meta"?: { "model"?: string } }` |
| **Auth** | Same as existing API: require authenticated user |
| **Limits** | `[TBD]` max input chars, `max_tokens`, request timeout (e.g. 30s) |
| **Rate limiting** | `[TBD]` per user/day or per IP |

**Environment**: Provider API key in Django settings / secrets manager — never committed.

---

## Frontend Design (Expo)

| Item | Decision / template |
|------|---------------------|
| **Service file** | `[TBD]` e.g. `services/api/llm.ts` |
| **State** | Feature-local state or small slice [TBD]; avoid bloating global store until multiple features exist |
| **UX** | Spinner, retry on transient failure, empty states |

---

## Security & Privacy

- No provider credentials in the client bundle or repo.
- Log request ids and errors; avoid logging full user prompts in production unless required [TBD].
- Data sent to provider is subject to provider policy — document in privacy copy when feature ships.

---

## Cost & Observability

- **Cost**: Estimate from expected daily active users × calls × tokens [TBD].
- **Metrics** [optional v1]: count requests, latency, error rate server-side.

---

## Out of Scope (this plan)

- Training or fine-tuning a custom base model inside DailyFlo’s repo.
- On-device large models (revisit if product requires offline-first AI).

---

## Implementation Phases

### Phase 1 — Foundation

**Purpose**: Backend can call provider for one feature behind auth.

**Files / areas** [TBD]: Django app or module for LLM, settings for secret key, one endpoint, one provider implementation.

**Testing**: Manual call with token; invalid auth rejected; timeout handled.

---

### Phase 2 — First feature in the app

**Purpose**: One screen uses the new service end-to-end.

**Files / areas** [TBD]: `services/api/llm.ts`, screen + hook/thunk, strings/error handling.

**Testing**: Happy path, empty input, offline/network error.

---

### Phase 3 — Hardening [optional]

**Purpose**: Rate limits, structured output validation, analytics.

---

## Open Questions

| Topic | Options / notes |
|-------|-----------------|
| Provider | Hosted API vs self-hosted open weights |
| Features v1 | Which single user-facing feature ships first |
| Output format | Plain text vs JSON schema for structured tasks |
| Rate limits | Per user vs global |
