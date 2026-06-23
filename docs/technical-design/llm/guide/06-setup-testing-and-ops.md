# Lesson 6 — Setup, testing, and operations

**Previous:** [Lesson 5 — Frontend wiring](./05-frontend-wiring.md)  
**Next:** [Guide index](./README.md) · [DailyFlo API checklist](../plan/llm-api-setup-checklist.md)

---

## Integration order (works for any project)

Build and verify **one layer at a time**. Do not wire the UI until curl succeeds.

```plaintext
1. Provider account + backend .env
2. Backend endpoint returns JSON (curl + JWT)
3. Frontend service calls endpoint (console.log in app)
4. Hook + minimal UI (one message, show reply)
5. Proposal cards + confirm → CRUD
6. Prompt tuning + error polish
```

Skipping step 2 and jumping to the app makes debugging painful (is it network? auth? prompt? JSON?).

---

## Environment setup (recap)

| Secret / config | Location |
|-----------------|----------|
| `OPENAI_API_KEY` (or other) | `backend/.../.env` |
| Model name, caps, timeout | `backend/.../.env` |
| `EXPO_PUBLIC_API_URL` | `frontend/.../.env` |

Restart Django after `.env` changes. Restart Expo with cache clear after frontend env changes.

Full DailyFlo checklist: [llm-api-setup-checklist.md](../plan/llm-api-setup-checklist.md).

---

## Testing pyramid for LLM features

### Level 1 — Backend only (curl)

```bash
curl -X POST http://localhost:8000/llm/assistant/ \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Create a task to test LLM"}]}'
```

**Pass criteria:** HTTP 200, valid JSON, `proposals` array when appropriate.

Test also:

- No token → 401  
- Empty body → 400  
- Bad provider key → 503  

### Level 2 — Frontend service

Temporary button or dev screen:

```typescript
const res = await llmApiService.assistantChat({
  messages: [{ role: 'user', content: 'Hello' }],
});
console.log(res);
```

**Pass criteria:** Same JSON as curl; no CORS/auth surprises.

### Level 3 — Full UX

- Send message → see bubbles  
- Create proposal → edit title → Confirm → task in list  
- Delete proposal → Dismiss → no DB change  

---

## Debugging common failures

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Network error in app | Wrong `EXPO_PUBLIC_API_URL` | Match LAN IP; `runserver 0.0.0.0:8000` |
| 401 | Expired JWT | Log in again |
| Empty proposals, good reply | User asked general question | Expected; or tighten prompt |
| JSON parse error on server | Model ignored schema | JSON mode + clearer system prompt |
| Wrong task updated | Bad ID in context | Improve context; validate server-side |
| Slow forever | No timeout | Set 30s provider timeout |

**Dev tip:** Log raw model output **only in development** — never log full prompts with PII in production.

---

## Cost management

1. Use cheapest model while learning.  
2. Set `max_tokens` and max input length in settings.  
3. Watch provider dashboard weekly during active dev.  
4. Add rate limits before public launch (requests per user per hour).

Rough mental math:

```text
cost ≈ (requests per day) × (avg input + output tokens) × (price per token)
```

Prototype with 10–50 messages/day is usually cents on mini models.

---

## Security before launch

- [ ] Provider key only on server  
- [ ] LLM route requires auth  
- [ ] Task IDs validated against `request.user`  
- [ ] Human confirm for destructive actions  
- [ ] Privacy policy mentions data sent to AI provider  
- [ ] Rate limiting (recommended)  

---

## Generic “done” checklist (any stack)

**Backend**

- [ ] Authenticated LLM proxy endpoint  
- [ ] Provider module isolated  
- [ ] System prompt in code  
- [ ] JSON validated before response  
- [ ] Timeouts and token caps  

**Frontend**

- [ ] Service calls your API only  
- [ ] Loading + error states  
- [ ] Write actions require user confirm  
- [ ] Confirmed actions use existing CRUD  

**Ops**

- [ ] `.env` documented (not committed)  
- [ ] curl test documented  
- [ ] Cost monitoring plan  

---

## What you learned (full arc)

1. **LLM integration ≠ replacing your API** — it translates language into proposals.  
2. **Backend proxy** — keys and prompts on server; client uses JWT.  
3. **Prompts + context + JSON** — how you control behaviour.  
4. **Human confirm + existing CRUD** — how you stay safe.  
5. **Service + hook + UI** — same frontend patterns as tasks.  
6. **Test bottom-up** — curl first, then app.

You can apply this to other features later (habit suggestions, email drafts) by changing the system prompt and proposal schema — the **architecture stays the same**.

---

## DailyFlo next steps

1. Complete [API setup checklist](../plan/llm-api-setup-checklist.md).  
2. Follow [implementation plan](../plan/llm-assistant-implementation.md) phase by phase.  
3. Use [proposal UI doc](../design/proposal-confirmation-ui.md) when building cards.

When you’re ready to code, start with **Phase 1 (backend)** and curl until proposals return.
