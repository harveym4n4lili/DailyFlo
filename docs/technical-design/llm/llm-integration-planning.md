# LLM Integration — Overview

> **New to LLM integration?** Start with the [learning guide](./guide/README.md) — six lessons that teach how to integrate an LLM into any project, using DailyFlo as the worked example.

> **DailyFlo doc index:** [LLM README](./README.md) — feature overview, doc map, and build checklist.

This file is a **short overview**. Teaching content lives in `guide/`; implementation detail lives in `plan/` and `design/`.

---

## What we’re building

An **LLM-assisted task assistant** on the AI tab. Users chat in natural language; the model **proposes** create, update, or delete actions. The user **reviews, edits, and confirms** each proposal before Redux runs the same task CRUD the rest of the app uses.

We do **not** train a model. We call a hosted provider through Django so API keys stay off the device.

---

## Doc map

| Document | Purpose |
|----------|---------|
| [guide/README.md](./guide/README.md) | **Learn** — how to integrate an LLM (lessons 1–6) |
| [README.md](./README.md) | DailyFlo entry point, decisions, current vs target |
| [llm-architecture.md](./llm-architecture.md) | Data flow, API contract, file layout |
| [plan/llm-api-setup-checklist.md](./plan/llm-api-setup-checklist.md) | **Your** env setup: provider key, `.env`, curl tests |
| [plan/llm-assistant-implementation.md](./plan/llm-assistant-implementation.md) | Build order: backend → service → hook → UI |
| [design/proposal-confirmation-ui.md](./design/proposal-confirmation-ui.md) | Proposal cards, Confirm/Dismiss, forms |

---

## Current state

- **Frontend:** AI tab shell with composer ([`app/(tabs)/ai/index.tsx`](../../../frontend/dailyflo/app/(tabs)/ai/index.tsx)); send clears input only. `llmApiService` exported but [`llm.ts`](../../../frontend/dailyflo/services/api/llm.ts) not implemented.
- **Backend:** No LLM app or routes.
- **Tasks:** Full CRUD via Redux + Django — reused after user confirms proposals.

---

## Target state (v1)

- **Endpoint:** `POST /llm/assistant/` (JWT auth)
- **Response:** `{ reply, proposals[], meta }` with structured create/update/delete payloads
- **UX:** Chat + editable proposal cards + Confirm → `createTask` / `updateTask` / `deleteTask`
- **Secrets:** Provider key in `backend/dailyflo/.env` only

---

## Key concepts

| Term | Meaning |
|------|---------|
| **Provider** | OpenAI, Anthropic, etc. — Django calls it; the app does not. |
| **Proposal** | Suggested action JSON — not executed until Confirm. |
| **API service** | `services/api/llm.ts` — HTTP to Django (like `tasks.ts`). |
| **Hook** | `useAiAssistant` — chat + proposal state on the AI tab. |

---

## Out of scope (v1)

- Custom model training or on-device LLMs
- Auto-executing task changes without confirmation
- Streaming responses (optional later)

---

## Open questions (defer until after prototype)

| Topic | Notes |
|-------|-------|
| Provider | Env-switchable; pick one for dev (see setup checklist) |
| Rate limits | Optional Phase 7 |
| Conversation persistence | Optional later |
