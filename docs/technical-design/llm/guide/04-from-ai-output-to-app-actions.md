# Lesson 4 — From AI output to app actions

**Previous:** [Lesson 3 — Prompts & JSON](./03-prompts-and-structured-output.md)  
**Next:** [Lesson 5 — Frontend wiring](./05-frontend-wiring.md)

---

## The trust model

Treat the LLM as a **smart intern**:

- Can draft good suggestions  
- Can be confidently wrong  
- Must not touch production data without a supervisor  

In DailyFlo, the **supervisor** is:

1. **Backend validation** — strip bad IDs and invalid fields  
2. **User review** — see proposal cards, edit fields  
3. **Explicit Confirm** — only then run `createTask` / `updateTask` / `deleteTask`

This pattern is called **human-in-the-loop** (HITL). It is the right default for delete/update features.

---

## Two kinds of LLM features

| Type | Example | Execute immediately? |
|------|---------|----------------------|
| **Read-only / copy** | “Suggest three titles for this task” | OK to show text only |
| **Write actions** | Create, edit, delete tasks | **Confirm first** |

DailyFlo v1 is **write actions** → always proposals + confirm.

---

## Proposal object (generic pattern)

Regardless of stack, a **proposal** usually contains:

```typescript
{
  id: string;           // id for this suggestion (not the task id)
  type: 'create' | 'update' | 'delete';
  summary: string;      // human-readable one-liner for UI
  payload: object;      // what you'd pass to your CRUD layer after edits
}
```

**Flow:**

```plaintext
LLM returns proposals[]
       ↓
UI renders editable forms from payload
       ↓
User edits locally (no server yet)
       ↓
User taps Confirm
       ↓
Your EXISTING CRUD runs (Redux → tasksApiService → /tasks/)
```

You are **not** building a second task API. You are building a **front door** that feeds the same CRUD you already trust.

---

## Why reuse existing CRUD (DailyFlo)

You already have:

- `createTask` thunk → `POST /tasks/`  
- `updateTask` thunk → `PATCH /tasks/{id}/`  
- `deleteTask` thunk → `DELETE /tasks/{id}/`  

After confirm:

```typescript
// create proposal
await dispatch(createTask(editedPayload)).unwrap();

// update proposal
await dispatch(updateTask({ id: taskId, updates: editedUpdates })).unwrap();

// delete proposal
await dispatch(deleteTask(taskId)).unwrap();
```

**Benefits:**

- One source of truth for business rules  
- Activity logs, notifications, gamification keep working  
- Same error handling as manual task edit  

---

## What happens on Confirm (step by step)

1. UI reads **edited** form state (not raw LLM payload if user changed fields).  
2. Hook dispatches Redux thunk.  
3. Thunk calls `tasksApiService` (normal API).  
4. Django saves to PostgreSQL.  
5. Redux updates `state.tasks`.  
6. UI marks proposal **confirmed** or shows error and allows retry.

The LLM is **not** called again on Confirm.

---

## Dismiss vs Confirm

| Action | LLM called again? | Database changed? |
|--------|-------------------|-------------------|
| **Dismiss** | No | No |
| **Confirm** | No | Yes (via CRUD) |
| **Send new chat message** | Yes | Not until new proposals confirmed |

---

## Validation layers (defence in depth)

| Layer | Catches |
|-------|---------|
| **System prompt** | “Don’t invent IDs” — reduces errors |
| **Backend after model** | Invalid UUID, wrong user’s task, bad enum |
| **Proposal form** | Empty title, bad date format |
| **Django task serializer** | Same validation as manual create |
| **User eyes** | Wrong task selected for delete |

If layer 3–5 fail, you still have serializer errors — show them on the card.

---

## Auto-execute (when you might skip confirm)

Some products auto-run **low-risk** actions (e.g. “add a tag”). DailyFlo **does not** auto-run create/update/delete in v1 because:

- Deletes are destructive  
- Wrong due dates are frustrating  
- Users need to learn what the AI understood  

You can relax this later for creates only — document the product decision if you do.

---

## Mapping proposal types to your types

DailyFlo maps directly to existing TypeScript:

| Proposal type | Payload maps to |
|---------------|-----------------|
| `create` | `CreateTaskInput` |
| `update` | `{ taskId, updates: Partial<UpdateTaskInput> }` |
| `delete` | `{ taskId }` |

When integrating another app, list your CRUD inputs first, then design the LLM JSON schema to match those inputs — **not** the other way around.

---

## Check yourself

1. Why call `createTask` instead of a new `aiCreateTask` endpoint?  
2. Name three validation layers.  
3. Should Confirm trigger another LLM request?

**Answers:** (1) Reuse one CRUD path and all side effects. (2) Prompt, backend parse, form/serializer, user review — any three. (3) No — only normal task API.

---

## DailyFlo pointer

Proposal UI: [design/proposal-confirmation-ui.md](../design/proposal-confirmation-ui.md).  
Tasks API pattern you reuse: [tasks-api-integration.md](../../api/plan/tasks/tasks-api-integration.md).
