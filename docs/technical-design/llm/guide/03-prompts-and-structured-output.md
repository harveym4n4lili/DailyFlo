# Lesson 3 — Prompts, context, and structured output

**Previous:** [Lesson 2 — Backend proxy](./02-backend-proxy-pattern.md)  
**Next:** [Lesson 4 — From AI output to app actions](./04-from-ai-output-to-app-actions.md)

---

## What is a prompt?

A **prompt** is everything you send the model in one API call. Think of it as a brief you give a contractor:

- **What role they have** (system prompt)
- **Reference documents** (context — e.g. user’s tasks)
- **The latest instruction** (user message)

The model does not remember yesterday unless you send history again (or store it server-side and resend).

---

## Message roles (chat API shape)

Most providers use a list of messages:

```json
[
  { "role": "system", "content": "You are DailyFlo's task assistant..." },
  { "role": "user", "content": "Add buy milk tomorrow at 9am" }
]
```

| Role | Who writes it | Typical content |
|------|---------------|-----------------|
| **system** | Your backend (`prompts.py`) | Rules, JSON schema, tone, safety |
| **user** | End user | Natural language request |
| **assistant** | Model (previous turns) | Optional — for multi-turn chat |

For v1 DailyFlo you can send **system + latest user message**. Add assistant history when you want “remember what we said.”

---

## System prompt: what to include

A good system prompt for an **action assistant** usually has:

1. **Role** — “You help users manage tasks in DailyFlo.”  
2. **Output format** — “Return JSON with `reply` and `proposals` arrays.”  
3. **Schema** — Field names and types (`type`: create | update | delete).  
4. **Rules** — “Never invent task IDs”; “Only propose actions the user asked for.”  
5. **Examples** — One or two mini examples (optional but helps).  

Keep it **short**. Long prompts cost tokens and slow responses.

### Example fragment (illustrative)

```text
You are a task assistant. Respond ONLY with valid JSON:
{
  "reply": "string — friendly summary for the user",
  "proposals": [
    {
      "id": "unique-string",
      "type": "create" | "update" | "delete",
      "summary": "one line",
      "payload": { ... }
    }
  ]
}

Rules:
- Use task IDs ONLY from USER_TASKS below.
- If the user asks a general question, return proposals: [].
- For create, payload must include title.
```

---

## Context: giving the model your app’s data

The model **does not** know your database. You must inject a snapshot:

```text
USER_TASKS (JSON):
[
  { "id": "abc-123", "title": "Team standup", "dueDate": "2026-06-23", "listName": "Work" },
  { "id": "def-456", "title": "Buy milk", "dueDate": null, "listName": null }
]

USER_LISTS (JSON):
[
  { "id": "list-1", "name": "Work" },
  { "id": "list-2", "name": "Personal" }
]

Today's date: 2026-06-23 (Europe/London)
```

**Best practices:**

| Do | Don’t |
|----|--------|
| Send ids + titles + dates needed for edit/delete | Send full descriptions, notes, metadata for every task |
| Build context on the **server** from ORM | Trust the client to send task lists (can be forged) |
| Cap list size (e.g. 50 recent tasks) | Send thousands of rows |

DailyFlo: `task_context.py` builds this block.

---

## Structured output (why plain text isn’t enough)

If the model returns:

```text
Sure! I'll create a task for milk tomorrow.
```

your app **cannot** reliably turn that into `createTask({ title: "Buy milk", ... })`.

You need **JSON** with known fields. Two common approaches:

| Approach | How | Pros |
|----------|-----|------|
| **JSON mode** | Provider flag (`response_format: json_object`) + schema in system prompt | Simple, widely supported |
| **Tool / function calling** | Provider API defines functions; model returns tool calls | Strong typing, some providers prefer it |

DailyFlo v1: **JSON mode** + schema in system prompt — easiest to learn first.

---

## Parsing and validating (backend)

Never assume the model obeyed perfectly:

```python
# conceptual flow
raw = call_assistant(...)
try:
    data = json.loads(raw)
except JSONDecodeError:
    return {"reply": "I couldn't process that. Try again.", "proposals": []}

proposals = []
for p in data.get("proposals", []):
    if p["type"] == "update":
        if not Task.objects.filter(id=p["payload"]["taskId"], user=user).exists():
            continue  # drop invalid proposal
    proposals.append(normalise(p))

return {"reply": data.get("reply", ""), "proposals": proposals, "meta": {...}}
```

**Validate like user input from a stranger** — because it is.

---

## Tokens and cost (practical basics)

- **Input tokens** — system prompt + context + user message  
- **Output tokens** — model’s JSON reply  
- You pay for both (pricing on provider dashboard).

**Save money while learning:**

- Use a **small model** (`gpt-4o-mini`, Haiku, Flash).  
- Keep context minimal.  
- Set `max_tokens` cap (e.g. 1024).  
- Truncate user message (e.g. 4000 chars).

---

## Prompt iteration (how you improve quality)

1. Try a real user phrase in curl or the app.  
2. Read raw model output (server logs in dev only).  
3. If wrong: tighten system prompt rule, add example, or add missing context field.  
4. Re-test — prompts are **versioned code**; store them in `prompts.py`, not scattered strings.

---

## Check yourself

1. What’s the difference between system prompt and user message?  
2. Why build `USER_TASKS` on the server?  
3. Why use JSON instead of free-text replies for task actions?

**Answers:** (1) System = your rules; user = what they typed. (2) Client could fake IDs; server reads truth from DB. (3) App needs parseable fields to show proposal cards.

---

## DailyFlo pointer

Response schema: [architecture](../llm-architecture.md) §5.  
Prompt tuning phase: [implementation plan](../plan/llm-assistant-implementation.md) Phase 6.
