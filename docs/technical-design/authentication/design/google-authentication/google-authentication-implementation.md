# Google authentication — implementation record (DailyFlo)

This document tracks **how Google Sign-In is implemented** in the DailyFlo app and backend as work lands. It complements the tutorial-style mental model in [`google-authentication.md`](./google-authentication.md).

**Status:** Pre-requisites and product decisions are below. **Implementation approach was revised** (see §0) after Google Cloud constraints blocked the first approach. Sections marked *TBD* will be filled as code merges (PRs, exact file paths).

---

## 0. Implementation approach (revised)

### 0.1 Why we moved away from `expo-auth-session` + Web OAuth client

An initial plan used **`expo-auth-session`** with a **custom URL scheme** redirect (`dailyflo://…`) and a **Web application** OAuth client (**Web client 1**).

That combination **does not work** in practice:

| Constraint | Implication |
|------------|-------------|
| **Web client redirect URI rules** | Authorized redirect URIs must be **`https://` on a public top-level domain** (or limited localhost cases). Google **rejects** registering `dailyflo://oauth2redirect` on a Web application client. |
| **Authorize errors** | The app then receives **`400 invalid_request`** (and sometimes policy-style copy) because the redirect / client-type pairing is not valid for that client. |
| **Google direction for mobile** | Expo’s current guide for real device builds points to **native** Google Sign-In ([`@react-native-google-signin/google-signin`](https://docs.expo.dev/guides/google-authentication/)) rather than browser OAuth with arbitrary custom schemes. |

### 0.2 Target architecture (v1 — iOS)

| Layer | Choice |
|--------|--------|
| **Google Cloud** | **DailyFlo iOS** OAuth 2.0 client, bound to bundle ID **`com.dailyflo.app`** (see `app.json`). **Web client 1** is **not** the client ID used for the on-device **`id_token`** in this flow (it may still exist for future web or server-only use). |
| **Mobile app** | **`@react-native-google-signin/google-signin`** (Expo config plugin + dev/EAS build). User signs in via the **native** Google UI; the library returns an **ID token** JWT. |
| **Env / plist** | **`EXPO_PUBLIC_GOOGLE_CLIENT_ID`** (if still used) and **`GoogleService-Info.plist` / plugin config** must align with the **iOS** client. Follow the library’s Expo setup docs. |
| **Django** | **`GOOGLE_CLIENT_ID`** (or equivalent in `social_auth` verification) must equal the **same iOS client ID** so JWT claim **`aud`** verifies. |

### 0.3 Engineering verification

After native sign-in works once: **decode the Google `id_token` payload** and confirm **`aud`** matches the **DailyFlo iOS** client ID string and Django settings **exactly**.

### 0.4 Code migration *TBD*

- **Replace** `triggerGoogleSignIn` in `services/auth/socialAuth.ts` (or adjacent module) with a native implementation that returns `{ idToken }` for the existing **`socialAuth`** Redux thunk and Django `POST /accounts/auth/social/`.
- **Remove or deprecate** `expo-auth-session` usage for Google only once native path ships (Apple may still use different APIs).
- Document exact files and PRs in **§2** when done.

---

## 1. Pre-requisite resolutions (agreed before build-out)

These items support the **native iOS** direction. They are **not** a substitute for verifying Google Cloud and plist on a real device.

### 1.1 OAuth client ID and `aud` (Google ↔ Django)

| Decision | Detail |
|----------|--------|
| **Source of truth for iOS** | **DailyFlo iOS** OAuth client in Google Cloud (not Web client 1 for the mobile `id_token`). |
| **Env alignment** | Frontend (SDK / plist / `EXPO_PUBLIC_*` as applicable) and backend **`GOOGLE_CLIENT_ID`** use the **iOS** client ID string that appears as **`aud`** on the token. |
| **Verification rule** | Django `verify_google_id_token` must use that same audience. |

**Engineering check (before shipping):** Decode one real `id_token` from a device and confirm `aud` matches the iOS client ID and Django **character-for-character**.

### 1.2 Redirect URIs and custom schemes (superseded for Google on iOS)

| Decision | Detail |
|----------|--------|
| **Native Google Sign-In** | Does **not** rely on registering **`dailyflo://…`** on a Web OAuth client. Flow is **bundle ID + iOS client** per Google / library docs. |
| **Legacy note** | Any doc or code referring **`AuthSession.makeRedirectUri`** + **Web client** for Google on iOS is **obsolete** for DailyFlo v1. |

### 1.3 Where engineers run Google Sign-In

| Decision | Detail |
|----------|--------|
| **Primary workflow** | **Dev / EAS builds** with native Google Sign-In modules (not Expo Go). Matches [Expo: Google authentication](https://docs.expo.dev/guides/google-authentication/). |

### 1.4 Platform scope

| Decision | Detail |
|----------|--------|
| **v1** | **Google only** on **iOS**. |
| **Soon after** | Apple Sign-In and email/password are **explicit follow-ups**. |

### 1.5 Mobile architecture (Redux, storage, entrypoint)

| Decision | Detail |
|----------|--------|
| **Google entrypoint** | **Auth landing** (or a small **`useGoogleAuthOnboarding`** hook): configure native SDK once, **`signIn()`**, read **`idToken`**, dispatch **`socialAuth`** — **no** OIDC `useAutoDiscovery` / **`promptAsync`** for Google once native path is live. |
| **Double-submit guard** | Single handler: skip if busy; wrap sign-in + API + navigation in **`try/finally`**. |
| **Redux `socialAuth` thunk** | Unchanged intent: **`AuthApiService.socialLogin`** → Django `POST /accounts/auth/social/` with **`id_token`** (snake_case on wire); **SecureStore** for DailyFlo JWTs like email login. |

### 1.6 User experience: errors, cancel, missing token

| Decision | Detail |
|----------|--------|
| **v1 UX** | **Cancel:** minimal UI. **Network / server errors:** short message + retry. **Missing `id_token`:** generic failure + log. |
| **Full error matrix** | **Backlog (auth section), priority**. |

### 1.7 Navigation after Google success

| Decision | Detail |
|----------|--------|
| **Post-login route** | **`/(onboarding)/slides`** after successful **`socialAuth`** and session hydration — not **Today** until onboarding completes. |

### 1.8 Returning users, cold start, and Today

| Decision | Detail |
|----------|--------|
| **Normal app use** | Authenticated user who **finished** onboarding lands on **Today** on cold start. |
| **Re-auth** | Slides-again behavior *TBD* (e.g. clear onboarding flag on logout). |

### 1.9 Dev-only “skip sign-in”

| Decision | Detail |
|----------|--------|
| **`__DEV__`** | Dev shortcut allowed; production differs — **backlog (auth)**. |

### 1.10 Onboarding completion and first task/habit

| Decision | Detail |
|----------|--------|
| **Target** | Questionnaire outcome persisted to user’s data via APIs. |
| **Preference** | Existing create endpoints first; failure handling *TBD*. |

### 1.11 Account linking

| Decision | Detail |
|----------|--------|
| **v1** | Backend defaults only. |
| **Backlog** | Explicit linking scenarios. |

---

## 2. Implementation log (*fill in as work merges*)

| Date | Change |
|------|--------|
| May 2026 | Added `@react-native-google-signin/google-signin`, `app.json` plugin (with existing `ios.googleServicesFile`). Replaced `expo-auth-session` Google flow in `services/auth/socialAuth.ts` (`triggerGoogleSignIn`). Updated `useGoogleAuthOnboarding` (no discovery hook). Removed `expo-auth-session` dependency. **Rebuild native app** (`npx expo run:ios` or EAS) after pulling. |
| *TBD* | Confirm Django `GOOGLE_CLIENT_ID` = **DailyFlo iOS** client ID; verify `id_token` `aud` on device. |

---

## 3. Related documents

- [`google-authentication.md`](./google-authentication.md) — concepts, `aud` / `sub`, trust boundaries  
- [Expo: Using Google authentication](https://docs.expo.dev/guides/google-authentication/) — native library + config  
- `docs/technical-design/authentication/plan/` — planning docs (as applicable)

---

*Last updated: May 2026 — revised for native iOS Google client; expo-auth-session + Web client path superseded.*
