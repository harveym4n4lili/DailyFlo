# LLM Assistant — Technical Design

**Purpose:** Design docs for DailyFlo’s AI tab — an LLM-assisted task assistant that can **propose** create, edit, and delete actions. The user **reviews, edits, and confirms** each proposal before anything changes in the database.

**Audience:** Engineers new to LLM integration. **Start with the learning guide**, then use the DailyFlo-specific docs to implement.

**Status:** Living docs — update when implementation ships or product decisions change.

---

## New to LLM integration? Start here

**[How to integrate an LLM — learning guide](./guide/README.md)** — six lessons that teach the general pattern (any app), using DailyFlo as the example:

| Lesson | Topic |
|--------|--------|
| [1 — Foundations](./guide/01-foundations.md) | LLM vs normal REST API; two-path mental model |
| [2 — Backend proxy](./guide/02-backend-proxy-pattern.md) | Why keys stay on the server; 3 layers |
| [3 — Prompts & JSON](./guide/03-prompts-and-structured-output.md) | System prompt, context, structured output |
| [4 — Output → actions](./guide/04-from-ai-output-to-app-actions.md) | Human confirm; reuse existing CRUD |
| [5 — Frontend wiring](./guide/05-frontend-wiring.md) | API service, hooks, UI (like tasks you know) |
| [6 — Setup & testing](./guide/06-setup-testing-and-ops.md) | Env, curl, debugging, cost |

Each lesson ends with **Check yourself** questions and links to DailyFlo files.

---

## What this feature does (plain English)

1. You type a message on the **AI tab** (e.g. “Add buy milk tomorrow at 9am”).
2. The app sends your message to **your Django backend** (not directly to OpenAI/Anthropic).
3. Django calls an **LLM provider** using a **server-only API key**.
4. The model returns a **friendly reply** plus **proposed actions** (structured JSON).
5. The app shows **proposal cards** you can edit (title, date, list, etc.).
6. When you tap **Confirm**, the app runs the **same Redux task actions** used everywhere else (`createTask`, `updateTask`, `deleteTask`).

Nothing is auto-deleted or auto-created without your confirmation.

--- 

## Doc map

### Learn (any project)

| Document | Purpose |
|----------|---------|
| [Guide index](./guide/README.md) | Curriculum — read lessons 1→6 in order |

### DailyFlo design & build

| # | Document | Purpose |
|---|----------|---------|
| 1 | [LLM architecture](./llm-architecture.md) | Data flow, API contract, file layout |
| 2 | [API setup checklist](./plan/llm-api-setup-checklist.md) | Your `.env`, curl tests, troubleshooting |
| 3 | [Implementation plan](./plan/llm-assistant-implementation.md) | Build phases for this repo |
| 4 | [Proposal confirmation UI](./design/proposal-confirmation-ui.md) | Editable cards, Confirm/Dismiss |

**Short overview:** [llm-integration-planning.md](./llm-integration-planning.md)

---

## Current vs target state

| Area | Today | After v1 |
|------|-------|----------|
| AI tab UI | Chat + proposals + Confirm/Dismiss wired | Polish forms (date pickers, list picker) |
| `services/api/llm.ts` | Calls `POST /llm/assistant/` | — |
| Django `apps/llm` | Gemini proxy at `/llm/assistant/` | Prompt tuning as you test |
| Task changes from AI | User confirms → Redux `createTask` / `updateTask` / `deleteTask` | — |

---

## Key decisions (locked for v1)

- **Confirm-first:** No task mutations until the user confirms a proposal.
- **Editable proposals:** Each card is a mini-form pre-filled from the LLM.
- **Reuse task CRUD:** Confirmed actions use [`tasksSlice`](../../../frontend/dailyflo/store/slices/tasks/tasksSlice.ts) — no duplicate task logic.
- **Local chat state:** `useAiAssistant` hook + component state (no new Redux slice yet).
- **Provider-agnostic backend:** Swap OpenAI / Anthropic / Gemini via env var; app never sees provider keys.

---

## Related project docs

- [Main architecture](../architecture.md) — stack, JWT auth, frontend ↔ backend
- [Tasks API integration](../api/plan/tasks/tasks-api-integration.md) — Redux → service → Django pattern you reuse after Confirm
- [Auth API integration](../authentication/plan/auth-api-integration.md) — JWT on every request including LLM routes
