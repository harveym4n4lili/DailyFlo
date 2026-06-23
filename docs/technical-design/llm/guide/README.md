# How to integrate an LLM — learning guide

**Purpose:** Teach LLM integration from zero. These guides explain **general patterns** that work in any app (web, mobile, backend). DailyFlo is used as the **worked example**, but the ideas transfer everywhere.

**Who this is for:** You’ve built normal REST APIs (tasks, auth) but haven’t wired up an LLM before.

---

## How to use this guide

Read the lessons **in order**. Each one builds on the last. After each lesson, skim the linked DailyFlo doc to see the same idea in *your* codebase.

| Lesson | Topic | You will understand… |
|--------|--------|----------------------|
| [1 — Foundations](./01-foundations.md) | What “LLM integration” actually means | How it differs from calling `/tasks/` |
| [2 — Backend proxy](./02-backend-proxy-pattern.md) | The 3-hop architecture | Why keys live on the server and what each layer does |
| [3 — Prompts & JSON](./03-prompts-and-structured-output.md) | Talking to the model | System prompts, context, structured output |
| [4 — Output → actions](./04-from-ai-output-to-app-actions.md) | Safe product design | Validation, human confirmation, reusing CRUD |
| [5 — Frontend wiring](./05-frontend-wiring.md) | Client-side patterns | API service, hooks, chat UI (maps to Redux/services you know) |
| [6 — Setup & testing](./06-setup-testing-and-ops.md) | Env, curl, cost, errors | What to configure and how to verify it works |

---

## After the guide

Apply what you learned to DailyFlo:

| DailyFlo doc | What it is |
|--------------|------------|
| [LLM README](../README.md) | Feature overview + doc map |
| [Architecture](../llm-architecture.md) | DailyFlo-specific data flow and file paths |
| [API setup checklist](../plan/llm-api-setup-checklist.md) | Your `.env` and curl steps |
| [Implementation plan](../plan/llm-assistant-implementation.md) | Build order for this project |
| [Proposal UI](../design/proposal-confirmation-ui.md) | Confirm-first UX |

---

## One-sentence summary

**LLM integration = your app calls your backend; your backend calls the AI; you treat the AI’s answer as a suggestion until your code (and the user) approve it.**
