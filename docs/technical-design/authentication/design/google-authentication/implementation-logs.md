# Google Sign-In — implementation logs

Quick reference of **problems hit while wiring native Google auth** (plus closely related API/navigation fixes from the same effort). Each section is **symptom → cause → fix**.

For architecture and decisions, see [`google-authentication-implementation.md`](./google-authentication-implementation.md) and [`google-authentication.md`](./google-authentication.md).

---

## 1. EAS failing at “Read app config”

**Symptom:** EAS build failed during config load for `app.config.js` (or similar dynamic config).

**Cause:** Custom config logic threw or required files/env that were not present on the build worker.

**Fix:** Prefer **static `app.json`** for most fields. Where dynamic values are needed (see section 2), use a **small `app.config.js`** that never throws: derive values from env or plist with safe fallbacks.

---

## 2. “App is missing support for the following URL schemes” (iOS)

**Symptom:** After choosing a Google account, Google Sign-In reported missing URL schemes (often related to the iOS OAuth client / env).

**Cause:** iOS must register the **reversed client ID** (for example `com.googleusercontent.apps` plus your numeric-prefix client id) as a **URL scheme** so the OAuth return URL opens your app. A **minimal `GoogleService-Info.plist`** from Firebase may omit **`CLIENT_ID`** / **`REVERSED_CLIENT_ID`**. The Expo plugin also expects an explicit **`iosUrlScheme`** in some setups.

**Fix:**

- Keep **`GoogleService-Info.plist`** aligned with the **same iOS OAuth client** as **`EXPO_PUBLIC_GOOGLE_CLIENT_ID`** and Django; add **`CLIENT_ID`** and **`REVERSED_CLIENT_ID`** if the Firebase download does not include them.
- In **`app.config.js`**, pass **`iosUrlScheme`** to **`@react-native-google-signin/google-signin`** and set **`CFBundleURLTypes`** (app scheme + Google reversed scheme), using **`EXPO_PUBLIC_GOOGLE_CLIENT_ID`** on EAS when available, else **`REVERSED_CLIENT_ID`** from the plist.

Rebuild the **native** app after any plist or URL-scheme change.

---

## 3. Firebase plist vs Google Cloud (no Firebase before)

**Symptom:** Downloaded **`GoogleService-Info.plist`** only had Firebase-style keys (e.g. `GOOGLE_APP_ID`) and **no** OAuth **`CLIENT_ID`** / **`REVERSED_CLIENT_ID`**.

**Cause:** Firebase console exports vary; OAuth ids are tied to the **Google Cloud** iOS client. You can use DailyFlo without Firebase “auth”; the plist is still used for native wiring.

**Fix:** Treat **`EXPO_PUBLIC_GOOGLE_CLIENT_ID`** (iOS client from Google Cloud) as the sign-in source of truth. Either supplement the plist with **`CLIENT_ID`** / **`REVERSED_CLIENT_ID`** derived from that client, or rely on env-driven **`iosUrlScheme`** in **`app.config.js`** so EAS/local config still registers the scheme.

---

## 4. “No refresh token available” right after Google sign-in

**Symptom:** Native Google prompt succeeded, then the app errored with **No refresh token available** (axios / API layer).

**Cause:** **`POST /accounts/auth/social/`** was **not** treated as a public route on the shared API client. An **old DailyFlo access token** in SecureStore was sent on the social login request; the server could return **401**, and the response interceptor tried to **refresh** using a DailyFlo **refresh** token that did not exist yet for that session.

**Fix:** In **`services/api/client.ts`**, treat **`/auth/social/`** like login/register: **do not** attach **`Authorization`** for that path, and **do not** run the **401 → refresh** flow for it.

---

## 5. Django: “Token used too early” (Google verify)

**Symptom:** Backend returned an error such as: **`Token used too early`** (two unix times one second apart) when verifying the Google **`id_token`**.

**Cause:** **`google.auth`** compares token **`iat` / `nbf`** to the **server clock**. A typical Windows dev machine can be **1–2 seconds behind** coordinated time.

**Fix:** In **`verify_oauth2_token`** in **`apps/accounts/social_auth.py`**, set **`clock_skew_in_seconds`** (e.g. **60**) so small skew is allowed. Optionally sync OS time via NTP.

---

## 6. After onboarding: landed on auth again instead of Today

**Symptom:** Tapping **Finish setup** sent the user back to the **auth landing** screen.

**Cause:** Onboarding stack was **auth → slides (questionnaire)**. **`router.back()`** only popped **slides → auth**, not out of the full-screen onboarding modal.

**Fix:** Use **`router.dismissTo('/(tabs)/today')`** (or equivalent) after persisting onboarding completion so the **entire onboarding layer** dismisses and **Today** is focused.

*(Same integration pass as Google; not Google-specific, but it blocked the post-login path.)*

---

## 7. Finish setup: task/habit on Today

**Symptom:** User expected the onboarding **task or habit** to exist on **Today** after finishing.

**Cause:** Questionnaire answers were only stored locally; no **create task** API call.

**Fix:** Map stored answers to **`CreateTaskInput`**, **`dispatch(createTask)`** (and **`updateTask`** if the user marked the agenda item completed), then exit onboarding as in section 6. Redux **`createTask.fulfilled`** adds the row so **Today** can show it without an extra fetch.

*(Product/onboarding wiring; independent of Google token mechanics.)*

---

## Checklist before closing a Google auth change

| Check | Why |
|--------|-----|
| **`EXPO_PUBLIC_GOOGLE_CLIENT_ID`** on EAS matches **iOS** client | Same **`aud`** as Django **`GOOGLE_CLIENT_ID`** |
| **Native rebuild** after plist / `app.config` / plugin changes | URL schemes and native modules are compile-time |
| **Social path excluded** from bearer + refresh interceptor | Avoid false “no refresh token” after social |
| **Server clock** reasonable or **clock skew** enabled | Avoid “token used too early” |
| **Exit onboarding** with **dismissTo Today**, not a single **back()** | Avoid returning to auth inside the modal stack |
