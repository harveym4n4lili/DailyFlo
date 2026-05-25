# Logout implementation (DailyFlo)

**Purpose:** Describe how client-side logout works today: Redux cleanup, persistence, navigation to the auth landing screen, and **pitfalls we hit** integrating Browse Settings with Expo Router + native tabs.

**Audience:** Engineers working on `frontend/dailyflo` (Expo Router, Redux Toolkit, onboarding).

**Status:** Shipped. Entry point is **Browse → Settings → Log out** (with confirmation Alert).

---

## 1. Product behavior

After the user confirms log out:

1. **Session is cleared locally** — tokens, Redux auth state, tasks, and the onboarding-complete flag so the next sign-in repeats onboarding per current product rules.
2. **Settings closes** — the Browse **settings route** is peeled from the nested stack (`back` → browse index, or `replace` browse root if history is broken).
3. **Auth landing appears** — root stack aligns with **Today** underneath and **`/(onboarding)/auth`** is presented as a full-screen modal (same layering idea as cold start in `app/_layout.tsx`).
4. **No app reload required** — navigation runs through Expo Router’s **global imperative `router`** queue, not fragile `push`/`replace` chains fired from an unmounted screen.

---

## 2. Redux and storage (`logoutUser` thunk)

**Thunk:** [`frontend/dailyflo/store/slices/auth/authSlice.ts`](../../../../frontend/dailyflo/store/slices/auth/authSlice.ts) — `logoutUser`.

| Step | What happens |
|------|----------------|
| SecureStore | `clearAllTokens()` removes DailyFlo JWTs. |
| Auth slice | `dispatch(logout())` clears user, tokens, `isAuthenticated`, etc. |
| Tasks | Dynamic import `clearTasks()` so the previous user’s task list does not leak to the next account. |
| Onboarding gate | `AsyncStorage.removeItem('@DailyFlo:onboardingComplete')` forces the **auth + onboarding** path on next entry (matches root gate in `app/_layout.tsx`). |

The thunk is the **only** production caller path for “full” logout today (Settings dispatches it). **Do not** use `useAuth().logout` from [`store/hooks.ts`](../../../../frontend/dailyflo/store/hooks.ts) for this flow — that dispatches only the **`auth/logout` reducer**, which clears Redux memory but **does not** wipe SecureStore, tasks, or the onboarding AsyncStorage flag.

---

## 3. Navigation after logout

### 3.1 Why navigation is split (Settings peel + thunk-queued routes)

Browse **Settings** is a **nested stack modal** under `(tabs)/browse`.

Lessons learned:

- Calling **`router.dismissTo('/(tabs)/today')`** from browse/settings **does not** reliably unwind that nested modal the same way the root bootstrap does; finishing onboarding later could briefly resurface Settings, and **`GO_BACK` could fail** if the stack was inconsistent.
- Chaining **`replace(today)`** and **`push('/(onboarding)/auth')`** **only from the Settings component** failed in practice once **`router.back()`** unmounted that screen mid-chain — **`useRouter()` / `useGuardedRouter()`** navigations queued from teardown were flaky.
- **`dismissTo` immediately followed by `push`** matches known Expo Router / layout edge cases where the **second** action never applies (see expo issues around **`dismissTo` + navigate/push** in grouped layouts).

### 3.2 Current pattern (recommended)

| Layer | Responsibility |
|-------|----------------|
| **[`app/(tabs)/browse/settings.tsx`](../../../../frontend/dailyflo/app/(tabs)/browse/settings.tsx)** | Peel settings: **`router.back()`** if `router.canGoBack()`, else **`router.replace('/(tabs)/browse')`**. Brief delay (50 ms) so the browse stack can commit. Then **`await dispatch(logoutUser()).unwrap()`**. |
| **[`logoutUser`](../../../../frontend/dailyflo/store/slices/auth/authSlice.ts)** | After persistence + Redux cleanup succeeds (or fallback path after errors), call **`queueNavigateToTodayThenAuthLanding()`**. |
| **[`utils/navigation/queueLogoutAuthNavigation.ts`](../../../../frontend/dailyflo/utils/navigation/queueLogoutAuthNavigation.ts)** | **`import { router } from 'expo-router'`** (singleton). After ~120 ms timeout: **`InteractionManager.runAfterInteractions` → `requestAnimationFrame` → `router.replace('/(tabs)/today')`**, then nested **`InteractionManager` + `requestAnimationFrame` → `router.push('/(onboarding)/auth')`**. Mirrors the **staggered** replace/push rhythm documented in **`app/_layout.tsx`** onboarding bootstrap comments (avoid same-tick churn on native stack). |

Using the **global** `router` object enqueues **`ROUTER_LINK`** actions on Expo’s **`routingQueue`**, flushed from root layout via **`useImperativeApiEmitter`** — navigation no longer depends on Settings staying mounted.

### 3.3 Settings chrome (close affordance)

**[`IosBrowseModalCloseStackToolbar`](../../../../frontend/dailyflo/components/navigation/IosBrowseModalStackToolbars.tsx)** and Android **[`MainCloseButton`](../../../../frontend/dailyflo/app/(tabs)/browse/settings.tsx)** use a resilient **`handleCloseSettings`**: **`back`** when possible, else **`replace('/(tabs)/browse')`** to avoid **`GO_BACK` was not handled** when history is orphaned.

---

## 4. Post-logout onboarding and Today

Behavior is unchanged from existing onboarding hooks:

- **Auth landing:** `/(onboarding)/auth`.
- After sign-in, flows continue into slides (e.g. Google via [`useGoogleAuthOnboarding`](../../../../frontend/dailyflo/components/features/onboarding/auth/hooks/useGoogleAuthOnboarding.ts)).
- **Finish setup:** [`useCompleteOnboardingAndExit`](../../../../frontend/dailyflo/components/features/onboarding/auth/hooks/useCompleteOnboardingAndExit.ts) persists `@DailyFlo:onboardingComplete`, optional task create, and **`router.dismissTo('/(tabs)/today')`** to dismiss the full-screen onboarding modal.

---

## 5. Related documentation and tests

- Manual auth / onboarding expectations: [`docs/testing/step6-auth-status-check-testing.md`](../../../testing/step6-auth-status-check-testing.md) (logout, cold start without session).
- Onboarding persistence and root gate notes: [`docs/technical-design/onboarding/plan/onboarding-plan.md`](../../onboarding/plan/onboarding-plan.md).
- API client auto-logout dispatch (401 path): **[`frontend/dailyflo/services/api/client.ts`](../../../../frontend/dailyflo/services/api/client.ts)** — uses `{ type: 'auth/logout' }` reducer only; tokens cleared elsewhere (`clearAllTokens`). Not the same as full **`logoutUser`** lifecycle.

---

## 6. Optional hardening (not required for MVP)

Tracked for follow-up **only if** QA finds gaps:

| Concern | Possible follow-up |
|--------|---------------------|
| Stale onboarding questionnaire snapshot | Remove `ONBOARDING_QUESTIONNAIRE_ANSWERS_STORAGE_KEY` in **`logoutUser`**. |
| Server-side refresh revocation | **`POST /accounts/auth/logout/`** with refresh token before **`clearAllTokens()`** (pattern sketched in `AuthService.ts`; not wired to thunk yet). |
| Stale lists in Redux | **`clearLists`** (or equivalent) on logout if lists slice survives user switch visibly wrong. |

---

## 7. File checklist (quick reference)

| File | Role |
|------|------|
| `app/(tabs)/browse/settings.tsx` | Logout UI, Alert, peel browse/settings, `dispatch(logoutUser())`. |
| `store/slices/auth/authSlice.ts` | **`logoutUser` thunk**, calls queue helper after cleanup. |
| `utils/navigation/queueLogoutAuthNavigation.ts` | **`queueNavigateToTodayThenAuthLanding`**. |
| `app/_layout.tsx` | Reference for staggered **`replace`** + **`push`** onboarding bootstrap. |
