# Lesson 5 — Frontend wiring (services, hooks, UI)

**Previous:** [Lesson 4 — Output → actions](./04-from-ai-output-to-app-actions.md)  
**Next:** [Lesson 6 — Setup, testing & ops](./06-setup-testing-and-ops.md)

---

## Map to what you already know

DailyFlo’s frontend already follows a clear pattern for tasks:

```plaintext
Component  →  dispatch(createTask)  →  tasksApiService  →  apiClient  →  Django
```

LLM adds a **parallel** path for chat only:

```plaintext
AI tab  →  useAiAssistant  →  llmApiService  →  apiClient  →  POST /llm/assistant/
```

Confirm still uses the **task** path from Lesson 4.

If you’ve read [tasks-api-integration.md](../../api/plan/tasks/tasks-api-integration.md), LLM service layer is the same idea with a different URL.

---

## Layer 1: API service (`services/api/llm.ts`)

**Purpose:** One file that knows how to call your LLM endpoint. Components never write raw URLs.

```typescript
// pattern — same family as tasks.ts
import apiClient from './client';
import type { AssistantRequest, AssistantResponse } from '@/types/api/llm';

class LlmApiService {
  async assistantChat(body: AssistantRequest): Promise<AssistantResponse> {
    // apiClient adds JWT from secure storage automatically
    const response = await apiClient.post('/llm/assistant/', body);
    return response.data;
  }
}

export default new LlmApiService();

export function mapLlmErrorToUserMessage(error: unknown): string {
  // axios error? 401? network? → short user-facing string
}
```

**Why a class/module:** Same as `TasksApiService` — keeps HTTP details out of UI and Redux.

---

## Layer 2: Types (`types/api/llm.ts`)

TypeScript interfaces document the contract between frontend and Django:

- `AssistantRequest` — `{ messages: { role, content }[] }`  
- `AssistantResponse` — `{ reply, proposals, meta }`  
- `TaskProposal`, payload variants  

When backend changes the JSON shape, you update types **once** and TypeScript shows what broke.

---

## Layer 3: Hook (`useAiAssistant`) — why not Redux?

| Data | Store in Redux? | Why |
|------|-----------------|-----|
| Tasks | Yes — many screens need them | Global source of truth |
| Chat messages | Not for v1 | Only AI tab cares |
| Pending proposals | Not for v1 | Temporary until confirm/dismiss |

A **hook** holds `useState` for messages, `isLoading`, `error`, and functions:

- `sendMessage(text)`  
- `updateProposal(...)`  
- `confirmProposal(...)` → **dispatches Redux thunks**  
- `dismissProposal(...)`  

When a second screen needs chat history, *then* consider an `aiSlice`.

---

## `sendMessage` flow (implement this mentally)

```typescript
async function sendMessage(text: string) {
  setIsLoading(true);
  setError(null);

  // 1. show user bubble immediately (optimistic UI)
  appendMessage({ role: 'user', content: text });

  try {
    // 2. call YOUR backend, not OpenAI
    const res = await llmApiService.assistantChat({
      messages: [{ role: 'user', content: text }],
    });

    // 3. show assistant bubble + attach proposals for cards
    appendMessage({
      role: 'assistant',
      content: res.reply,
      proposals: res.proposals,
    });
  } catch (e) {
    setError(mapLlmErrorToUserMessage(e));
  } finally {
    setIsLoading(false);
  }
}
```

---

## Layer 4: UI components

Split the AI tab so the screen file stays small:

| Component | Job |
|-----------|-----|
| `AiChatComposer` | Text input + send (you already have inline version) |
| `AiMessageList` | Scroll chat history |
| `AiMessageBubble` | Style user vs assistant |
| `AiProposalCard` | Form + Confirm + Dismiss |

The screen (`app/(tabs)/ai/index.tsx`) wires:

```typescript
const { messages, isLoading, error, sendMessage, confirmProposal, ... } = useAiAssistant();
```

---

## Loading and error UX (minimum viable)

| State | User sees |
|-------|-----------|
| `isLoading` | Disabled send or spinner on send button |
| Network error | “Couldn’t reach assistant. Check connection.” |
| 401 | “Session expired. Log in again.” (apiClient may refresh first) |
| 503 | “Assistant unavailable.” |
| Confirm in progress | Spinner on that card’s Confirm button |

Users wait longer for LLM than for `/tasks/` — always show activity.

---

## What NOT to put in the frontend

- Provider API keys  
- System prompts (keep on server)  
- Full task database dump as “context” (server builds context)  
- Direct `fetch('https://api.openai.com/...')`  

---

## End-to-end frontend checklist

- [ ] `llm.ts` service calls `/llm/assistant/` via `apiClient`  
- [ ] Types match backend JSON  
- [ ] Hook manages chat + proposals  
- [ ] Confirm dispatches existing task thunks  
- [ ] Errors mapped to friendly strings  
- [ ] Loading states on send and confirm  

---

## Check yourself

1. Why is `llmApiService` separate from `tasksApiService`?  
2. Why use a hook instead of a Redux slice for chat in v1?  
3. What function runs when the user taps Confirm on a create proposal?

**Answers:** (1) Different endpoint and response shape; single responsibility. (2) Chat is local to one tab for now. (3) `dispatch(createTask(...))` via hook.

---

## DailyFlo pointer

File layout: [architecture](../llm-architecture.md) §6.  
Build order: [implementation plan](../plan/llm-assistant-implementation.md) Phases 2–5.  
UI behaviour: [proposal-confirmation-ui.md](../design/proposal-confirmation-ui.md).
