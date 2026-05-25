# Onboarding — backlog reconciliation

**Purpose:** Align `docs/development-journals/back-log.md` onboarding items with **current** Expo Router surfaces, auth, and questionnaires. Treat this as the technical source of truth until the journal backlog rows are rewritten.

**Audience:** Engineers owning onboarding + authentication.

**See also:**

- [`../plan/onboarding-plan.md`](./plan/onboarding-plan.md) — routes, persistence, open product decisions §9  
- [`../onboarding-architecture.md`](./onboarding-architecture.md) — transparent header / pager patterns  
- [`../../development-journals/back-log.md`](../../development-journals/back-log.md) — original backlog rows (often stale paths)  

---

## 1. What `back-log.md` still says (onboarding‑specific)

Located under **🔴 High Priority → Authentication API Integration**:

| Item | Declared status | Summary |
| --- | --- | --- |
| **Social Authentication Implementation Plan & Development** | Not Started | Google, Apple, **Facebook**; planning doc; wire `socialAuth`; old paths (`OnboardingActions`, `SignInModal`, etc.) |
| **Onboarding Reminders Message Functionality** | Not Started | Notification permission on **`app/(onboarding)/reminders.tsx`**; `handleAllow` in **`OnboardingActions.tsx`** |

The product backlog **last updated** line on that file is **2025-01-26** — many paths and statuses predate the current `(onboarding)/auth` + questionnaire + social landing work.

---

## 2. Verified against codebase (manual audit)

Use this matrix when rewriting `back-log.md`; items marked **implemented** supersede **Not Started** on that sheet.

| Backlog / doc claim | Verified status | Evidence (frontend unless noted) |
| --- | --- | --- |
| Social auth wired to Django `POST /accounts/auth/social/` | **Implemented** (Google + Apple) | `services/api/auth.ts` → `socialLogin`; `socialAuth` thunk in `store/slices/auth/authSlice.ts`; `SocialAuthView` in `backend/.../views.py`; `SocialAuthSerializer` restricts `provider` to **`google` \| `apple`** in `backend/.../serializers.py` |
| Facebook social login | **Not implemented** (type/model only) | `CustomUser.auth_provider` model allows `'facebook'`; TS `AuthProvider` includes `'facebook'`; serializer + view **do not** accept facebook — **no UI** |
| Email registration + login during onboarding | **Implemented** | `app/(onboarding)/auth/login.tsx`, `register.tsx`; `AuthLoginScreen` / `AuthRegisterScreen`; `loginUser` / `registerUser` thunks |
| Onboarding reminders / notification permission route | **Not implemented** | No `reminders.tsx` under `app/(onboarding)/`; no `requestPermissions`/notification onboarding under `(onboarding)/*` (grep sweep) |
| `OnboardingActions.tsx` handlers | **Not implemented** | No `components/features/onboarding/OnboardingActions.tsx` — **obsolete path** |
| Modal sign-in surfaces (`SignInModal`, `SocialAuthActions`) | **Not present** under `components/features/*` glob | Legacy-only references in constants comments; onboarding uses **Auth landing**, not modal module names from backlog |
| Questionnaire `/ slides` funnel | **Implemented** | `(onboarding)/_layout.tsx` registers `slides/index`; `OnboardingQuestionnaireFlow` |
| Duplicate questionnaire entry `(onboarding)` vs `app/onboarding/` | **Both exist** | `app/onboarding/index.tsx` re-exports same `OnboardingQuestionnaireFlow` (standalone/alternate route) |
| Wake / sleep persisted to Django **preferences** on finish | **Implemented** | `useCompleteOnboardingAndExit.ts` → `patchUserSchedulePreferences({ wakeTime, sleepTime })` after questionnaire answers; wheels live in onboarding questionnaire UI |
| First task/habit creation from questionnaire answers | **Implemented** | `useCompleteOnboardingAndExit.ts` → `buildCreateTaskInputFromOnboardingAnswers` + `createTask`; optional `updateTask` when task branch marked completed |
| Exit onboarding to **tabs** without landing on auth | **Implemented** | `router.dismissTo('/(tabs)/today')` in `useCompleteOnboardingAndExit.ts` |
| Returning users can **Skip** questionnaire | **Implemented** | `useIsReturningOnboardingUser.ts` + UX wired from slides header |
| Dedicated intro carousel **`app/(onboarding)/introductory`** per `onboarding-plan.md` §2 | **Not present in router** | `app/(onboarding)/` Stack is **`auth` + `slides/index` only** (no `introductory` segment in `app/` search) — **plan doc baseline is stale** |

### 2.1 Snapshot summary (still valid)

- **Social sign-in:** Google + Apple shipped on **auth landing**; Facebook is **reserved in types/models only**.
- **Email:** form sheets after successful thunk match session state before navigating to slides (`completeOnboardingEmailAuth` pattern).
- **`back-log.md` stale paths:** `reminders.tsx`, `OnboardingActions.tsx`, modal-based social rows — replace with table above.

---

## 3. Required follow-ups (actionable)

### 3.1 Update `back-log.md` (process)

- Rewrite **Social auth** row: mark **Google + Apple implemented (onboarding path)** — see §2 matrix; backlog phrasing **“Not Started” is false** for those providers.
- Mark **Facebook** explicitly as **future / out of scope** unless product mandates it (backend serializer must gain `facebook` + token verification).
- Point **files** at real modules: `app/(onboarding)/auth/*`, `components/features/onboarding/auth/*`, `store/slices/auth/authSlice.ts`, `services/api/auth.ts`, Django `SocialAuthView`, etc.
- Either **implement** onboarding notifications step (below) **or delete** the reminders row.

### 3.2 Notifications / reminders step (optional product)

If product wants permission during onboarding:

- Add a **`(onboarding)`** route (e.g. `reminders.tsx` or rename to `notifications.tsx`) aligned with `_layout.tsx` stack.
- Request OS notification permission; persist outcome (AsyncStorage or profile JSON if backend needs it); navigate forward consistently with the questionnaire / finish flow.

If product defers notifications to **Settings** only:

- Remove or downgrade the backlog item and document “no onboarding permission screen.”

### 3.3 Facebook (only if required)

- Add **`facebook`** to `SocialAuthSerializer` choices, implement token verification server-side (no equivalent in repo today), and mirror Google/Apple client wiring; otherwise **explicitly omit** from MVP to avoid dangling backlog text.

### 3.4 Refresh **`onboarding-plan.md`** §2 baseline

- Document **`(onboarding)` Stack = `auth` + `slides`** (no standalone `introductory/` route unless reintroduced) and **`app/onboarding/`** questionnaire mirror.

---

## 4. Related work tracked elsewhere

Not duplicated as onboarding rows in `back-log.md` but relevant:

| Topic | Pointer |
| --- | --- |
| Intro vs setup, Skip semantics, `@DailyFlo:onboardingComplete` timing | [`plan/onboarding-plan.md`](./plan/onboarding-plan.md) §5, §9 |
| Profile PATCH / questionnaire fields beyond wake/sleep | Dev log (`docs/development-journals/dev-log.md`) May 2026 “Plans For Future” lines |
| Auth exit semantics (e.g. `dismissTo` Today vs `router.back`) | `docs/technical-design/authentication/design/google-authentication/implementation-logs.md` |
| Production hygiene (avoid logging raw auth payloads) | Security / release checklist — align with onboarding email sheets |

---

## 5. Changelog

| Date | Change |
| --- | --- |
| 2026-05 | Initial doc — reconciles high-level product backlog onboarding rows with shipped auth/questionnaire surfaces. |
| 2026-05 | Added §2 codebase verification matrix — marked social (Google/Apple), email, questionnaire, wake/sleep PATCH, finish task creation, Skip, dismissTo **implemented**; reminders + legacy components **not implemented**; Facebook + intro route **still open / doc drift**. |
