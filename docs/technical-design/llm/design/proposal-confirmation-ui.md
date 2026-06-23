# Proposal Confirmation UI

**Purpose:** UX and component behaviour for AI **proposals** — the cards where users review, edit, and confirm (or dismiss) suggested task actions.

**Learn why:** [Lesson 4 — From AI output to app actions](../guide/04-from-ai-output-to-app-actions.md) — human-in-the-loop, reuse CRUD, validation layers.

**Related:** [Architecture](../llm-architecture.md) · [Implementation plan](../plan/llm-assistant-implementation.md)

**Product rule:** Nothing hits the database until the user taps **Confirm** on a specific proposal.

---

## 1. Where proposals appear in the chat

```plaintext
┌─────────────────────────────────────┐
│  AI                              ⚙  │  ← existing header chrome
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ You: Add milk tomorrow 9am  │    │  ← user bubble (right or neutral)
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Assistant: I can create one │    │  ← assistant bubble
│  │ task for you.               │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─ Proposal card ─────────────┐    │
│  │ CREATE · Buy milk tomorrow  │    │
│  │ [editable form fields]      │    │
│  │ [Dismiss]  [Confirm ✓]      │    │
│  └─────────────────────────────┘    │
│                                     │
│         (scroll area)               │
│                                     │
├─────────────────────────────────────┤
│  Message…              [Send]       │  ← existing composer
└─────────────────────────────────────┘
```

Proposals are **children of the assistant turn** — not mixed into the user bubble.

---

## 2. Proposal card anatomy

Every `AiProposalCard` shares:

| Section | Content |
|---------|---------|
| **Header** | Type chip (`Create` / `Update` / `Delete`) + one-line `summary` from LLM |
| **Body** | Type-specific form (pre-filled, editable) |
| **Footer** | **Dismiss** (secondary) · **Confirm** (primary) |

### States

| State | UI |
|-------|-----|
| `pending` | Full card; Confirm enabled when required fields valid |
| `confirming` | Confirm shows spinner; buttons disabled |
| `confirmed` | Collapsed row: “Created ‘Buy milk’” with checkmark |
| `failed` | Error text + optional Retry Confirm |
| `dismissed` | Card hidden or grey “Dismissed” row |

---

## 3. Create proposal form

**Pre-filled from:** `proposal.payload` (matches `CreateTaskInput`).

| Field | Control | Required |
|-------|---------|----------|
| Title | Text input | Yes |
| Due date | Date picker (reuse task form patterns if available) | No |
| Time | Time picker / text `HH:MM` | No |
| List | Picker from Redux lists | No (null = inbox) |
| Priority | 1–5 or simplified low/med/high | No |
| Color | Color swatches from `TaskColor` | No |

**Confirm:** `dispatch(createTask(formValues))`.

**Validation before Confirm:**

- Title non-empty after trim  
- Due date/time formats valid  

---

## 4. Update proposal form

**Pre-filled from:** `proposal.payload.updates`  
**Display:** Task title from Redux via `taskId` (fallback: “Unknown task” if missing).

Show **what changes**:

| Pattern | Example UI |
|---------|------------|
| Due date change | “Due: Mon 23 Jun → Fri 27 Jun” |
| Title change | Two-line or single editable title |
| Mark complete | Toggle with label “Mark as completed” |

Only show fields present in `updates` — do not expose full task editor.

**Confirm:** `dispatch(updateTask({ id: taskId, updates: formValues }))`.

---

## 5. Delete proposal form

**Display:**

- Destructive styling (red accent on Confirm, not on Dismiss)  
- Task title: “Delete ‘Old draft’?”  
- Short warning: “This cannot be undone from the AI tab.” (soft delete still applies server-side)

**Confirm:** `dispatch(deleteTask(taskId))`.

No extra checkbox for v1 — explicit Confirm on destructive button is enough for prototype.

---

## 6. Dismiss vs Confirm

| Action | Effect |
|--------|--------|
| **Dismiss** | Proposal marked dismissed; **no** Redux dispatch; **no** second LLM call |
| **Confirm** | Redux thunk runs; on success proposal collapses to confirmed state |

User can Dismiss some proposals and Confirm others from the same assistant message.

---

## 7. Editing before confirm

- Edits live in **hook local state** (`updateProposal`) — not sent back to the LLM.  
- Changing a field does not re-fetch from server until Confirm.  
- If user sends a **new** chat message, previous pending proposals stay visible but remain independent (v1: no auto-cancel of old proposals).

---

## 8. Loading and errors

### While waiting for LLM

- Disable composer send (or show inline spinner on send button)  
- Optional: “Thinking…” assistant placeholder bubble  

### LLM / network error

- Banner or inline message via `mapLlmErrorToUserMessage`  
- User message stays in history; no proposals appended  

### Confirm failed (Redux/API)

- Keep card expanded  
- Show error under footer: “Could not create task. Try again.”  
- Confirm button re-enabled for retry  

---

## 9. Accessibility

- Each card: `accessibilityLabel` including type and summary  
- Confirm: “Confirm create task Buy milk”  
- Dismiss: “Dismiss suggested create task”  
- Delete Confirm: accessibility hint mentions permanent action  

---

## 10. What we reuse from existing task UI

Look at these for patterns (pickers, styling) — do not duplicate business logic:

| Existing | Reuse for |
|----------|-----------|
| `TaskQuickAddForm` | Field layout inspiration for create |
| `TaskEditModalScreen` | Date/time/list pickers for update |
| `useTasks()` + lists slice | List picker + task title lookup |
| Theme / Typography constants | Visual consistency with Today/Planner |

Confirmed actions always go through **Redux thunks**, not direct `tasksApiService` calls from UI components.

---

## 11. Out of scope (v1 UI)

- Bulk “Confirm all” button  
- Undo after confirm (use normal task edit/delete elsewhere)  
- Inline diff view for every field on update  
- Voice input  
