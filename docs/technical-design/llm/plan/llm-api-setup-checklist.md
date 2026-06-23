# LLM API Setup Checklist

**Purpose:** Steps **you** complete on your machine before (or in parallel with) implementing the LLM assistant. No code in this doc — only environment and verification.

**Learn why:** [Lesson 2 — Backend proxy](../guide/02-backend-proxy-pattern.md) (where keys go) · [Lesson 6 — Setup & testing](../guide/06-setup-testing-and-ops.md) (integration order)

**Related:** [Architecture](../llm-architecture.md) · [Implementation plan](./llm-assistant-implementation.md)

---

## Overview

The mobile app talks to **Django**. Django talks to the **LLM provider**. You need:

1. A provider account and API key  
2. Backend `.env` configured  
3. Frontend `.env` pointing at Django  
4. Django running on an address your phone/simulator can reach  
5. A logged-in user JWT to test with curl or Postman  

---

## Step 1 — Choose an LLM provider

Pick **one** hosted API for the prototype. The backend will use a single abstraction; you swap providers via env vars.

| Provider | Typical env vars | Notes |
|----------|------------------|-------|
| **OpenAI** | `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-4o-mini` | Good structured JSON; cheap mini model for dev |
| **Anthropic** | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL=claude-3-5-haiku-latest` | Strong instruction following |
| **Google Gemini** | `GOOGLE_AI_API_KEY`, `GEMINI_MODEL=gemini-2.0-flash` | Alternative if you already use Google Cloud |

**Recommendation for first integration:** OpenAI `gpt-4o-mini` — low cost, widely documented JSON mode.

### What to do

1. Sign up at the provider’s site.  
2. Enable billing (even small usage requires it).  
3. Create an API key.  
4. Store the key in a password manager — **never commit it to git**.

---

## Step 2 — Backend environment file

**File:** `backend/dailyflo/.env` (gitignored — create if missing)

### Example (OpenAI)

```env
# --- LLM (prototype) ---
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini

# Safety caps (optional but recommended)
LLM_MAX_INPUT_CHARS=4000
LLM_MAX_TOKENS=1024
LLM_REQUEST_TIMEOUT_SECONDS=30
```

### Example (Anthropic)

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here
ANTHROPIC_MODEL=claude-3-5-haiku-latest
LLM_MAX_INPUT_CHARS=4000
LLM_MAX_TOKENS=1024
LLM_REQUEST_TIMEOUT_SECONDS=30
```

### Settings wiring (implementation step)

When the Django `llm` app is added, `config/settings.py` will read these with `os.environ.get(...)`. Keys stay server-side only.

**Checklist:**

- [ ] `.env` exists in `backend/dailyflo/`  
- [ ] `.env` is listed in `.gitignore` (already is for `*.env`)  
- [ ] You did **not** paste the key into any frontend file or commit  

---

## Step 3 — Frontend environment file

**File:** `frontend/dailyflo/.env` (gitignored)

The app only needs the Django base URL — **not** the LLM key.

```env
EXPO_PUBLIC_API_URL=http://192.168.0.99:8000
```

Replace `192.168.0.99` with your PC’s LAN IP (same pattern as existing task API).

**Find your IP (Windows PowerShell):**

```powershell
ipconfig
```

Look for **IPv4 Address** on your active Wi‑Fi/Ethernet adapter.

**Checklist:**

- [ ] `EXPO_PUBLIC_API_URL` matches where Django runs  
- [ ] Phone/simulator is on the **same network** as your PC (physical device testing)  
- [ ] After changing `.env`, restart Expo (`npx expo start -c` clears cache)  

---

## Step 4 — Run Django for device access

From `backend/dailyflo/`:

```bash
python manage.py runserver 0.0.0.0:8000
```

`0.0.0.0` lets devices on your LAN connect (not just `localhost`).

**Checklist:**

- [ ] Server starts without errors  
- [ ] From browser on your PC: `http://localhost:8000/tasks/` returns 401 (expected without token)  
- [ ] From phone browser (optional): `http://<your-ip>:8000/` responds  

CORS is already permissive in dev (`CORS_ALLOW_ALL_ORIGINS = True` in settings).

---

## Step 5 — Get a JWT access token for manual API tests

The LLM endpoint requires the same login as tasks.

### Option A — Log in via the app

1. Run the Expo app and sign in.  
2. Use Django admin or debug logging to confirm requests work (tasks load).  

### Option B — curl login (email/password)

```bash
curl -X POST http://localhost:8000/accounts/auth/login/ \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"your@email.com\", \"password\": \"yourpassword\"}"
```

Response includes `access` and `refresh`. Copy `access`.

**Checklist:**

- [ ] You have a valid `access` token string  
- [ ] Token expires in ~15 minutes (refresh via app or `/accounts/auth/refresh/`)  

---

## Step 6 — Test the LLM endpoint (after backend is implemented)

Once `POST /llm/assistant/` exists:

```bash
curl -X POST http://localhost:8000/llm/assistant/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Create a task to call the dentist tomorrow\"}]}"
```

**Expected success:**

- HTTP `200`  
- JSON with `reply` (string) and `proposals` (array)  
- At least one `type: "create"` proposal with a `title`  

**Expected failures:**

| Status | Meaning |
|--------|---------|
| `401` | Missing or expired token |
| `400` | Invalid request body |
| `503` | Provider error or missing API key in `.env` |

---

## Step 7 — Verify tasks API still works

Before relying on AI confirmations, confirm normal CRUD works with the same token:

```bash
curl http://localhost:8000/tasks/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

You should see your task list JSON. Confirmed AI proposals will use the same `/tasks/` endpoints via Redux.

---

## Step 8 — Cost and usage awareness

- Each chat message = one provider API call (billed by tokens).  
- Dev caps in `.env` limit runaway cost (`LLM_MAX_TOKENS`, input char limit).  
- Use a **mini/haiku/flash** model during development.  
- Monitor usage in the provider dashboard weekly during active dev.  

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| App can’t reach API | Wrong IP or firewall | Match `EXPO_PUBLIC_API_URL`; allow port 8000 on Windows Firewall |
| `401` on all requests | Expired access token | Log in again or refresh token |
| `503` from `/llm/assistant/` | Bad/missing provider key | Check `backend/dailyflo/.env` and restart Django |
| Empty `proposals` | Model replied with chat only | Normal for general questions; try explicit “create a task…” |
| Import error for `llm` service | `llm.ts` not created yet | Expected until frontend Phase 2 in implementation plan |

---

## Quick checklist (printable)

- [ ] Provider account + API key  
- [ ] `backend/dailyflo/.env` with `LLM_PROVIDER` + key  
- [ ] `frontend/dailyflo/.env` with `EXPO_PUBLIC_API_URL`  
- [ ] Django `runserver 0.0.0.0:8000`  
- [ ] App login works; tasks load  
- [ ] curl to `/llm/assistant/` returns proposals (post-implementation)  
