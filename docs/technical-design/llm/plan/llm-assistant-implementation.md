# LLM Assistant — Implementation Plan

**Purpose:** Step-by-step build order for the AI task assistant prototype (backend proxy + chat UI + confirm-first proposals).

**Learn first:** [Learning guide](../guide/README.md) — understand *why* each phase exists before coding. Especially [Lesson 2](../guide/02-backend-proxy-pattern.md) (backend), [Lesson 4](../guide/04-from-ai-output-to-app-actions.md) (confirm + CRUD), and [Lesson 6](../guide/06-setup-testing-and-ops.md) (test order).

**Related:** [Architecture](../llm-architecture.md) · [API setup checklist](./llm-api-setup-checklist.md) · [Proposal UI design](../design/proposal-confirmation-ui.md)

**Prerequisite:** Complete [API setup checklist](./llm-api-setup-checklist.md) before testing end-to-end.

---

## Why this build order?

Integrate **bottom-up** so you always know which layer failed:

1. Backend + curl — proves provider, prompt, and JSON (no mobile variables)  
2. Frontend service — proves JWT and URL  
3. Hook — proves state + Redux confirm path  
4. UI — proves UX  

See [Lesson 6](../guide/06-setup-testing-and-ops.md) for the full testing pyramid.

---

## Phase 0 — Your prep (parallel)

See [llm-api-setup-checklist.md](./llm-api-setup-checklist.md):

- Provider account + API key in `backend/dailyflo/.env`  
- `EXPO_PUBLIC_API_URL` in `frontend/dailyflo/.env`  
- Django on `0.0.0.0:8000`, app login working  

---

## Phase 1 — Backend foundation

**Goal:** Authenticated `POST /llm/assistant/` returns `{ reply, proposals, meta }`.

### 1.1 Create Django app `apps/llm/`

| File | Responsibility |
|------|----------------|
| `views.py` | `LlmAssistantView` — POST handler |
| `serializers.py` | Validate request messages; validate response shape |
| `urls.py` | `path('assistant/', ...)` |
| `services/provider.py` | Call OpenAI/Anthropic based on `LLM_PROVIDER` |
| `services/prompts.py` | System prompt: task assistant role + JSON schema |
| `services/task_context.py` | Query user's tasks + lists; build context block |

### 1.2 Wire project

- Add `'apps.llm'` to `INSTALLED_APPS` in `config/settings.py`  
- Add env vars: `LLM_PROVIDER`, provider keys, caps, timeout  
- Add `path('llm/', include('apps.llm.urls'))` in `config/urls.py`  
- Add provider SDK to `requirements.txt` (e.g. `openai`)  

### 1.3 View behaviour

1. Require `IsAuthenticated`.  
2. Parse `messages[]` from body.  
3. Build task snapshot (id, title, due_date, list name, is_completed) — **no full descriptions** unless needed later.  
4. Call provider with system prompt + user messages.  
5. Parse JSON; validate each proposal:  
   - `create` — valid title, enums for color/priority/routine  
   - `update` / `delete` — `taskId` exists and belongs to `request.user`  
6. Return normalised response; strip invalid proposals with explanation in `reply`.  

### 1.4 Manual test

Use curl from [API setup checklist](./llm-api-setup-checklist.md) Step 6.

**Done when:** curl returns valid JSON with at least one create proposal for “Create a task to …”.

---

## Phase 2 — Frontend API layer

**Goal:** Fix broken export; typed call to Django.

### 2.1 Types — `types/api/llm.ts`

Define:

- `AssistantRequest`, `AssistantResponse`  
- `TaskProposal`, `ProposalType` (`create` \| `update` \| `delete`)  
- Payload types aligned with `CreateTaskInput` / `UpdateTaskInput` from `types/common/Task.ts`  

### 2.2 Service — `services/api/llm.ts`

Follow pattern in `services/api/tasks.ts`:

```typescript
// flow: hook calls this → apiClient adds JWT → POST /llm/assistant/
class LlmApiService {
  async assistantChat(body: AssistantRequest): Promise<AssistantResponse> {
    const response = await apiClient.post('/llm/assistant/', body);
    return response.data;
  }
}

export function mapLlmErrorToUserMessage(error: unknown): string {
  // map network, 401, 503, validation to friendly strings
}
```

Already exported from `services/api/index.ts` — creating the file fixes the broken import.

**Done when:** TypeScript compiles; service can be imported without error.

---

## Phase 3 — `useAiAssistant` hook

**Goal:** Central logic for the AI tab without a new Redux slice.

**File:** `hooks/useAiAssistant.ts`  
Export from `hooks/index.ts`.

### State

```typescript
messages: ChatMessage[]     // user + assistant bubbles
isLoading: boolean
error: string | null
```

Each `ChatMessage` can attach `proposals: TaskProposal[]` on assistant messages.

### Functions

| Function | Behaviour |
|----------|-----------|
| `sendMessage(text)` | Append user msg → call `llmApiService` → append assistant msg + proposals |
| `updateProposal(msgId, proposalId, payload)` | Local edit before confirm |
| `confirmProposal(msgId, proposalId)` | Dispatch Redux thunk based on `type`; mark proposal confirmed/failed |
| `dismissProposal(msgId, proposalId)` | Remove/hide without API call |

### Confirm → Redux mapping

```typescript
// create
await dispatch(createTask(editedPayload)).unwrap();

// update
await dispatch(updateTask({ id: taskId, updates })).unwrap();

// delete
await dispatch(deleteTask(taskId)).unwrap();
```

Import thunks from `store/slices/tasks/tasksSlice.ts`.  
Use `useTasks()` to resolve task titles for update/delete cards.

**Done when:** Hook unit-tested manually from a throwaway screen or AI tab stub.

---

## Phase 4 — UI components

**Goal:** Chat + editable proposal cards. See [proposal-confirmation-ui.md](../design/proposal-confirmation-ui.md) for UX detail.

**Folder:** `components/features/ai/`

| Component | Role |
|-----------|------|
| `AiChatComposer.tsx` | Extract composer from AI tab (input + send) |
| `AiMessageList.tsx` | Scrollable history |
| `AiMessageBubble.tsx` | User vs assistant styling |
| `AiProposalCard.tsx` | Wrapper: type chip, summary, form, Confirm/Dismiss |
| `AiProposalCreateForm.tsx` | Editable create fields |
| `AiProposalUpdateForm.tsx` | Editable update fields + current task label |
| `AiProposalDeleteForm.tsx` | Delete warning + task title |

Use existing design tokens: `useThemeColors`, `useTypography`, `Paddings`.

**Done when:** Components render with mock proposals in isolation.

---

## Phase 5 — Wire AI tab

**File:** `app/(tabs)/ai/index.tsx`

Changes:

1. Replace empty `spacer` with `AiMessageList`.  
2. Use `useAiAssistant()`.  
3. `handleSend` → `sendMessage(trimmed)` instead of only clearing input.  
4. Show loading on send button; disable while `isLoading`.  
5. Show error text from `mapLlmErrorToUserMessage`.  
6. Keep existing keyboard/tab bar layout.  

**Done when:** Full flow on device: type → see reply + cards → edit → Confirm → task appears in Today/Inbox.

---

## Phase 6 — Prompt tuning

**File:** `backend/.../services/prompts.py`

Iterate on real phrases you use:

- “Add … tomorrow at 9” → create with dueDate + time  
- “Move standup to Friday” → update with correct taskId from snapshot  
- “Delete the old draft task” → delete proposal  
- “What’s a good morning routine?” → `reply` only, `proposals: []`  

Rules to enforce in system prompt:

- Never invent task IDs  
- Only propose actions the user asked for  
- Use ISO dates and `HH:MM` time  

---

## Phase 7 — Optional hardening (post-prototype)

- Per-user rate limit (e.g. 30 req/hour)  
- Persist `conversation_id` in AsyncStorage  
- Streaming assistant text (SSE)  
- Manual QA checklist doc (mirror `habits-manual-qa-checklist.md`)  

---

## File change summary

| Area | Files |
|------|-------|
| Backend | `apps/llm/*`, `config/urls.py`, `config/settings.py`, `requirements.txt` |
| Frontend API | `services/api/llm.ts`, `types/api/llm.ts` |
| Frontend logic | `hooks/useAiAssistant.ts` |
| Frontend UI | `components/features/ai/*`, `app/(tabs)/ai/index.tsx` |
| Docs | Update README when shipped |

---

## Suggested order (one line)

**Prep env → Django endpoint + curl → llm.ts + types → hook → UI components → wire AI tab → prompt tuning**
