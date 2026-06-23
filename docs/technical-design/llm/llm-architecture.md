# LLM Assistant — Architecture

**Purpose:** DailyFlo-specific architecture for the AI task assistant — data flow, API contract, and file layout.

**Learn first:** If you are new to LLM integration, read the [learning guide](./guide/README.md) (lessons 1–6) before this doc. The guide teaches **general patterns**; this doc shows **where they land in DailyFlo**.

**Related:** [README](./README.md) · [Implementation plan](./plan/llm-assistant-implementation.md) · [API setup](./plan/llm-api-setup-checklist.md)

---

## How this doc relates to the guide

| Guide lesson | This doc section |
|--------------|------------------|
| [Lesson 2 — Backend proxy](./guide/02-backend-proxy-pattern.md) | §2, §7 |
| [Lesson 3 — Prompts & JSON](./guide/03-prompts-and-structured-output.md) | §5 (response schema) |
| [Lesson 4 — Output → actions](./guide/04-from-ai-output-to-app-actions.md) | §3 (Confirm → Redux) |
| [Lesson 5 — Frontend wiring](./guide/05-frontend-wiring.md) | §4, §6, §8 |

---

## 1. Glossary (read this first)

| Term | Meaning in DailyFlo |
|------|---------------------|
| **LLM** | Large Language Model — a hosted AI that understands natural language (e.g. GPT, Claude). We **call** one; we do not train our own. |
| **Provider** | The company/service that hosts the model (OpenAI, Anthropic, Google, etc.). |
| **Prompt** | Instructions + context + user message sent to the model in one request. |
| **Token** | Billing/length unit for LLM APIs. Shorter prompts and responses = lower cost. |
| **Structured output** | JSON the model returns in a fixed shape (e.g. list of task proposals), not free-form text only. |
| **Proposal** | One suggested action (create / update / delete) the AI returns; **not executed** until the user confirms. |
| **API service** | Frontend file (e.g. `services/api/llm.ts`) that talks to Django — same pattern as `services/api/tasks.ts`. |
| **Redux thunk** | Async function in Redux that calls an API service and updates global state — used for **confirmed** task changes only. |
| **Hook (`useAiAssistant`)** | React hook that holds **chat messages** and **proposals** in local state for the AI tab. |

---

## 2. Why the app never talks to the LLM directly

```plaintext
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Expo app        │  JWT    │  Django backend  │  API    │  LLM provider    │
│  (your phone)    │ ──────► │  (your server)   │ ──────► │  (OpenAI, etc.)  │
│                  │         │                  │  key    │                  │
│  NO provider key │         │  key in .env     │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

**Reasons:**

1. **Security** — Provider API keys must not ship in the mobile app (anyone could extract them).
2. **Consistency** — One place to validate requests, cap token usage, and log errors.
3. **Same auth as tasks** — The LLM route uses the same JWT Bearer token as `/tasks/`.

This matches how auth and tasks already work in [main architecture](../architecture.md).

---

## 3. End-to-end data flow

```plaintext
User types on AI tab
        │
        ▼
useAiAssistant.sendMessage()
        │
        ▼
llmApiService.assistantChat()     ← services/api/llm.ts
        │
        ▼
apiClient.post('/llm/assistant/') ← JWT added automatically (services/api/client.ts)
        │
        ▼
Django LlmAssistantView
        ├── verify user is logged in
        ├── load user's tasks + lists (minimal snapshot for context)
        ├── build system prompt + call provider
        ├── validate JSON proposals (task IDs, field enums)
        └── return { reply, proposals[], meta }
        │
        ▼
Hook appends assistant message + proposal cards to chat UI
        │
        ▼
User edits proposal fields (local state only)
        │
        ▼
User taps Confirm on one card
        │
        ▼
dispatch(createTask | updateTask | deleteTask)   ← existing tasksSlice thunks
        │
        ▼
tasksApiService → Django /tasks/ → PostgreSQL
        │
        ▼
UI shows success/failure on that card
```

**Important split:**

- **LLM path** — chat + proposals (hook + `llmApiService`).
- **Task mutation path** — only after Confirm (Redux + `tasksApiService`).

---

## 4. Layer responsibilities

| Layer | Location | Job |
|-------|----------|-----|
| **UI** | `app/(tabs)/ai/`, `components/features/ai/` | Message list, composer, proposal cards, Confirm/Dismiss |
| **Hook** | `hooks/useAiAssistant.ts` | Chat state, send, edit proposal, confirm → dispatch Redux |
| **LLM API service** | `services/api/llm.ts` | HTTP to `POST /llm/assistant/`; map errors to user messages |
| **HTTP client** | `services/api/client.ts` | Base URL, JWT, refresh on 401 |
| **Task Redux** | `store/slices/tasks/tasksSlice.ts` | create / update / delete after user confirms |
| **Task API service** | `services/api/tasks.ts` | Existing CRUD — unchanged contract |
| **Django LLM app** | `backend/dailyflo/apps/llm/` | Auth, prompt, provider call, response validation |
| **Django tasks app** | `backend/dailyflo/apps/tasks/` | Existing task persistence — unchanged |

---

## 5. API contract (v1)

**Endpoint:** `POST /llm/assistant/`  
(No `/api/v1/` prefix — matches existing DailyFlo routes like `/tasks/`.)

**Auth:** `Authorization: Bearer <access_token>` (same as tasks).

### Request

```json
{
  "messages": [
    { "role": "user", "content": "Add buy milk tomorrow at 9am" }
  ]
}
```

Future: optional `conversation_id` for persisted threads.

### Response

```json
{
  "reply": "I can create one task for you.",
  "proposals": [
    {
      "id": "prop-uuid",
      "type": "create",
      "summary": "Buy milk tomorrow at 9:00",
      "payload": {
        "title": "Buy milk",
        "dueDate": "2026-06-24T09:00:00.000Z",
        "time": "09:00",
        "listId": null,
        "priorityLevel": 3,
        "color": "blue",
        "routineType": "once"
      }
    }
  ],
  "meta": { "model": "gpt-4o-mini" }
}
```

**Proposal types:**

| `type` | `payload` shape | On Confirm |
|--------|-----------------|------------|
| `create` | Same fields as `CreateTaskInput` | `dispatch(createTask(payload))` |
| `update` | `{ taskId, updates }` | `dispatch(updateTask({ id: taskId, updates }))` |
| `delete` | `{ taskId }` | `dispatch(deleteTask(taskId))` |

Backend must verify `taskId` belongs to the logged-in user before returning update/delete proposals.

---

## 6. Frontend file layout (planned)

```plaintext
frontend/dailyflo/
├── app/(tabs)/ai/
│   └── index.tsx                    # AI tab — wires hook + components
├── components/features/ai/
│   ├── AiMessageList.tsx
│   ├── AiMessageBubble.tsx
│   ├── AiProposalCard.tsx
│   ├── AiProposalCreateForm.tsx
│   ├── AiProposalUpdateForm.tsx
│   ├── AiProposalDeleteForm.tsx
│   └── AiChatComposer.tsx
├── hooks/
│   └── useAiAssistant.ts
├── services/api/
│   └── llm.ts                       # missing today; exported from index.ts
└── types/api/
    └── llm.ts
```

---

## 7. Backend file layout (planned)

```plaintext
backend/dailyflo/apps/llm/
├── views.py              # POST /llm/assistant/
├── serializers.py        # request/response validation
├── urls.py
├── services/
│   ├── provider.py       # OpenAI / Anthropic / etc.
│   ├── prompts.py        # system prompt + JSON schema instructions
│   └── task_context.py   # build task + list snapshot for the user
└── apps.py
```

Registered in `config/urls.py`:

```python
path('llm/', include('apps.llm.urls'))
```

---

## 8. State management choice

| Data | Where it lives | Why |
|------|----------------|-----|
| Chat messages | `useAiAssistant` local state | Only the AI tab needs it for v1 |
| Proposal edits | Local state on each card / hook | Temporary until Confirm or Dismiss |
| Tasks in Redux | `tasksSlice` | Source of truth after Confirm; also used to show task titles on update/delete cards |

We **do not** add an `aiSlice` until multiple screens need shared chat history.

---

## 9. Security and privacy (v1)

- Provider API key only in `backend/dailyflo/.env` — never `EXPO_PUBLIC_*`.
- User message + a **minimal** task snapshot (id, title, dates, list names) is sent to the provider.
- LLM output is **untrusted** until Django validates proposals and the user confirms.
- Avoid logging full prompts in production.

---

## 10. Out of scope (v1)

- Training or fine-tuning a custom model
- On-device LLMs
- Auto-executing create/update/delete without confirmation
- Streaming responses (can add later)
- Conversation history persisted across app restarts (optional later)
