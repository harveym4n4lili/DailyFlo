# Lesson 1 — Foundations: what is “LLM integration”?

**Previous:** [Guide index](./README.md)  
**Next:** [Lesson 2 — Backend proxy pattern](./02-backend-proxy-pattern.md)

---

## What you already know (normal API)

When DailyFlo **creates a task**, the flow is predictable:

```plaintext
UI  →  Redux thunk  →  tasksApiService  →  POST /tasks/  →  Database
```

- The **request body** is fixed: `{ title, dueDate, ... }`.
- The **response** is fixed: task JSON or an error code.
- **Your code** decides every field. The server validates and saves.

You’ve already integrated APIs. LLM integration adds **one new ingredient**: a step where **natural language** gets turned into structured data **by an external AI**, before your normal CRUD runs.

---

## What an LLM adds

An **LLM (Large Language Model)** is a hosted service that:

- Reads **plain English** (“add milk tomorrow at 9”)
- Returns **text or JSON** based on instructions you give it

You **do not** train it. You **call** it over HTTPS, like Stripe or Google Maps — but the response is **probabilistic** (not guaranteed identical every time) and must be **validated**.

---

## LLM integration vs normal API (comparison)

| | Normal REST (e.g. `/tasks/`) | LLM route (e.g. `/llm/assistant/`) |
|--|-------------------------------|-------------------------------------|
| **Who shapes the data?** | Your UI forms and TypeScript types | The model *suggests*; your backend + user finalize |
| **Input** | Strict JSON fields | User message + optional context |
| **Output** | Known schema from Django serializer | Text + JSON you asked for in the prompt |
| **Trust level** | Trust after auth + validation | **Never trust raw output** — always validate |
| **Cost** | Mostly server compute | Per-request token billing |
| **Latency** | Often &lt; 200ms | Often 1–10+ seconds |
| **Side effects** | Create/update DB immediately | Should **not** change DB until user confirms |

**Takeaway:** An LLM endpoint is not a replacement for `/tasks/`. It is a **translator** from language → proposed actions. Your existing CRUD stays the source of truth.

---

## The two paths in DailyFlo (mental model)

```plaintext
Path A — “Understand me” (LLM)
  User message  →  /llm/assistant/  →  reply + proposals[]

Path B — “Change data” (CRUD, unchanged)
  User confirms  →  createTask / updateTask / deleteTask  →  /tasks/
```

Most bugs happen when teams merge Path A and Path B into one step (auto-creating tasks from AI output with no review). DailyFlo **keeps them separate** on purpose.

---

## Core vocabulary (use these everywhere)

| Term | Simple definition |
|------|-------------------|
| **Provider** | Company that hosts the model (OpenAI, Anthropic, Google). |
| **Model** | Which brain you rent (e.g. `gpt-4o-mini`). Cheaper/smaller for dev. |
| **API key** | Secret password for the provider. **Server only.** |
| **Prompt** | Everything you send the model: rules + context + user message. |
| **System prompt** | Hidden instructions: “You are a task assistant. Return JSON…” |
| **User message** | What the person typed in chat. |
| **Context** | Extra data you attach (e.g. list of their tasks) so the model can reference real IDs. |
| **Token** | Chunks of text the provider counts for billing and limits. |
| **Structured output** | Forcing JSON shape so your code can parse proposals reliably. |
| **Proxy** | Your backend sitting between app and provider (see Lesson 2). |

---

## What “integration” means in practice (5 pieces)

Every serious LLM feature in a product usually has:

1. **Backend route** — authenticated HTTP endpoint your app calls  
2. **Provider client** — one module that talks to OpenAI/etc. with the API key  
3. **Prompt builder** — assembles system prompt + user data + message  
4. **Response validator** — parses JSON, checks IDs, strips bad proposals  
5. **Frontend UX** — chat UI, loading, errors, and **confirm before action**

Missing any piece causes pain: keys in the app (1–2), random JSON crashes (4), or users angry about wrong deletes (5).

---

## Common beginner mistakes

| Mistake | Why it’s bad | What to do instead |
|---------|--------------|-------------------|
| Put `OPENAI_API_KEY` in the React Native app | Anyone can extract it and spend your money | Backend proxy only |
| Call OpenAI directly from the phone “just for prototype” | Becomes production habit; key leaks | Same proxy from day one |
| Trust model JSON and `POST /tasks/` immediately | Wrong titles, wrong deletes, hallucinated IDs | Validate + user confirm |
| Send entire database as context | Cost, latency, privacy | Minimal snapshot (titles, ids, dates) |
| No timeout | UI hangs forever | 30s server timeout + friendly error |

---

## Check yourself (before Lesson 2)

1. Can you explain why `/llm/assistant/` is **not** a replacement for `/tasks/`?  
2. Can you name the two paths (LLM vs CRUD) in DailyFlo?  
3. Why is LLM output “untrusted” even when it looks correct?

**Answers:** (1) LLM suggests; tasks API persists. (2) Path A = proposals; Path B = confirm → Redux. (3) Models can hallucinate IDs, dates, or actions the user didn’t ask for.

---

## DailyFlo pointer

Feature overview: [LLM README](../README.md).  
Architecture diagram: [llm-architecture.md](../llm-architecture.md) §3.
