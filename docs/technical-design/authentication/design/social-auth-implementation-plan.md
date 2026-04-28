# Social Auth — Implementation Plan (Google + Apple)

**What this is:** a numbered checklist of every task, in the order you do them.  
**Not a concept doc** — read `social-auth-plan.md` first if you want to understand *why* before doing *what*.  
**Audit status:** every task below is based on reading the live codebase (Apr 2026). Paths and gaps are verified.

Mark each task `[x]` as you complete it.

---

## Phase 1 — Before you write a single line of code

These must be done first. You cannot test anything without them.

### 1.1 — Google Cloud Console setup

- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Create a project (or select existing)
- [ ] APIs & Services → OAuth Consent Screen → fill in app name, support email, scopes (`openid`, `email`, `profile`)
- [ ] Credentials → Create OAuth 2.0 Client ID → type: **iOS**
  - Bundle ID: `com.yourteam.dailyflo` (match what you'll put in `app.json`)
  - Copy the **iOS Client ID** (format: `123456789.apps.googleusercontent.com`)
  - Copy the **Reversed Client ID** (format: `com.googleusercontent.apps.123456789`)
- [ ] Create a second OAuth 2.0 Client ID → type: **Android**
  - Package name: `com.yourteam.dailyflo`
  - SHA-1: run `./gradlew signingReport` or use `keytool` against your debug keystore
- [ ] Download `GoogleService-Info.plist` (iOS) → place at `frontend/dailyflo/GoogleService-Info.plist`
- [ ] Download `google-services.json` (Android) → place at `frontend/dailyflo/google-services.json`
- [ ] Add **both files** to `.gitignore` (they contain API keys)
- [ ] Create a `.env` file at `frontend/dailyflo/.env` (if it doesn't exist) with:
  ```
  EXPO_PUBLIC_GOOGLE_CLIENT_ID=<your iOS Client ID>
  ```
- [ ] Add `.env` to `.gitignore`
- [ ] Create a `.env` file at `backend/dailyflo/.env` (if it doesn't exist) with:
  ```
  GOOGLE_CLIENT_ID=<your iOS Client ID>
  ```

---

### 1.2 — Apple Developer Portal setup

> Requires an active Apple Developer Program membership ($99/year).

- [ ] Go to [developer.apple.com](https://developer.apple.com) → Certificates, IDs & Profiles
- [ ] Identifiers → find or create your App ID with bundle ID `com.yourteam.dailyflo`
  - [ ] Enable the capability: **Sign In with Apple**
  - [ ] Save
- [ ] Keys → Create a new key
  - [ ] Name it (e.g. `DailyFlo Sign In with Apple`)
  - [ ] Enable **Sign In with Apple** → Configure → assign to your App ID
  - [ ] Register the key
  - [ ] Download the **`.p8` file** — you can only download this once
  - [ ] Note the **Key ID** shown on the key detail page
- [ ] Note your **Team ID** — visible in the top-right of the developer portal
- [ ] Store the `.p8` file on your Django server only — **never commit it**
- [ ] Add to `backend/dailyflo/.env`:
  ```
  APPLE_TEAM_ID=<your Team ID>
  APPLE_CLIENT_ID=com.yourteam.dailyflo
  APPLE_KEY_ID=<your Key ID>
  APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_XXXXXXXX.p8
  ```

---

## Phase 2 — Backend (Django)

Do the full backend before touching the frontend. Test Django with Postman first.

### 2.1 — Install missing Python packages

```bash
cd backend/dailyflo
pip install google-auth cryptography requests
pip freeze > requirements.txt
```

> `PyJWT==2.9.0` is already in `requirements.txt` — do not reinstall.

---

### 2.2 — Update `INSTALLED_APPS` and run migration

In `backend/dailyflo/config/settings.py`:

- [ ] Add `'rest_framework_simplejwt.token_blacklist'` to `INSTALLED_APPS`

Then run:

```bash
python manage.py migrate
```

> This creates the blacklist tables. Without them the `ROTATE_REFRESH_TOKENS` setting will crash at runtime.

---

### 2.3 — Add `SIMPLE_JWT` config and social credential env vars

In `backend/dailyflo/config/settings.py`, add after the `REST_FRAMEWORK` dict:

- [ ] Add the following block:

```python
from datetime import timedelta
import os

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

GOOGLE_CLIENT_ID  = os.environ.get('GOOGLE_CLIENT_ID')
APPLE_TEAM_ID     = os.environ.get('APPLE_TEAM_ID')
APPLE_CLIENT_ID   = os.environ.get('APPLE_CLIENT_ID')
APPLE_KEY_ID      = os.environ.get('APPLE_KEY_ID')
```

> The `SECRET_KEY` and `DEBUG = True` in `settings.py` are dev-only — do not ship them. Leave for now; fix in a separate production-hardening task.

---

### 2.4 — Create the token verification service

- [ ] Create new file: `backend/dailyflo/apps/accounts/social_auth.py`
- [ ] Implement `verify_google_id_token(token: str) -> dict`
  - Uses `google.oauth2.id_token.verify_oauth2_token`
  - Passes `audience=settings.GOOGLE_CLIENT_ID`
  - Raises `ValueError` on any failure
- [ ] Implement `verify_apple_id_token(token: str) -> dict`
  - Fetches Apple JWKS from `https://appleid.apple.com/auth/keys`
  - Reads `kid` from JWT header
  - Matches key, converts with `RSAAlgorithm.from_jwk`
  - Calls `jwt.decode` with `audience=settings.APPLE_CLIENT_ID`, `issuer='https://appleid.apple.com'`
  - Raises `ValueError` on any failure

See `social-auth-plan.md` §3.3 for the full code.

---

### 2.5 — Write unit tests for the verification functions

- [ ] Create `backend/dailyflo/apps/accounts/tests/test_social_auth.py`
- [ ] Test `verify_google_id_token` with a valid token (use Google OAuth Playground to generate one)
- [ ] Test `verify_google_id_token` with an expired token → expect `ValueError`
- [ ] Test `verify_google_id_token` with wrong audience → expect `ValueError`
- [ ] Test `verify_apple_id_token` with a valid locally-signed RS256 JWT and mocked JWKS
- [ ] Test `verify_apple_id_token` with expired token → expect `ValueError`

> Run: `python manage.py test apps.accounts.tests.test_social_auth`

---

### 2.6 — Replace `SocialAuthSerializer`

In `backend/dailyflo/apps/accounts/serializers.py`:

- [ ] Replace the current `SocialAuthSerializer` class with:
  - `provider` — `ChoiceField(choices=['google', 'apple'])` — remove `facebook`
  - `id_token` — `CharField(required=True)` — rename from `access_token`
  - `first_name` — `CharField(required=False, allow_blank=True, default='')`
  - `last_name` — `CharField(required=False, allow_blank=True, default='')`
  - Remove `user_info` entirely — this was the security hole

---

### 2.7 — Replace `SocialAuthView`

In `backend/dailyflo/apps/accounts/views.py`:

- [ ] Import `verify_google_id_token` and `verify_apple_id_token` from `.social_auth`
- [ ] Replace the view body with:
  1. Validate serializer
  2. Call the correct verification function based on `provider`
  3. Return HTTP 401 if verification raises `ValueError`
  4. Check for email conflict — return HTTP 409 if `email` already belongs to a different `auth_provider`
  5. `get_or_create` user using `auth_provider` + `auth_provider_id` as keys; `defaults` = claims data
  6. `get_tokens_for_user(user)`
  7. Return 200 with `tokens`, `user`, `is_new_user`

See `social-auth-plan.md` §3.5 for the full code.

---

### 2.8 — Test backend with Postman

Before writing any frontend code, confirm Django works end-to-end:

- [ ] Get a real Google ID token: go to [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground), authorise with `openid email profile`, copy the `id_token` field
- [ ] POST to `http://192.168.0.99:8000/accounts/auth/social/` with:
  ```json
  {
    "provider": "google",
    "id_token": "<paste token here>"
  }
  ```
- [ ] Confirm response: `{ "tokens": { "access": "...", "refresh": "..." }, "user": {...}, "is_new_user": true }`
- [ ] POST again with the same token → `"is_new_user": false`, same user ID
- [ ] Test 409: register an email/password account with the same email first, then try social → confirm 409

> Do not proceed to Phase 3 until all three Postman tests pass.

---

## Phase 3 — Frontend (Expo)

### 3.1 — Install packages

```bash
cd frontend/dailyflo
npx expo install expo-auth-session expo-apple-authentication
```

> `expo-web-browser` is already installed — no change needed.

---

### 3.2 — Update `app.json`

- [ ] Add `"scheme": "dailyflo"` at the top level of the `expo` object
- [ ] Under `ios`: add `"usesAppleSignIn": true`
- [ ] Under `ios`: add `"googleServicesFile": "./GoogleService-Info.plist"`
- [ ] Under `android`: add `"googleServicesFile": "./google-services.json"`
- [ ] Add `"expo-apple-authentication"` to the `plugins` array

---

### 3.3 — Create the social auth service file

- [ ] Create `frontend/dailyflo/services/auth/socialAuth.ts`
- [ ] Implement `triggerGoogleSignIn(discovery)`:
  - Uses `AuthSession.AuthRequest` with `ResponseType.IdToken`
  - Calls `request.promptAsync(discovery)`
  - Returns `{ idToken: string }`
  - Throws if result is not `'success'`
- [ ] Implement `triggerAppleSignIn()`:
  - Calls `AppleAuthentication.signInAsync` with `FULL_NAME` and `EMAIL` scopes
  - Returns `{ idToken, firstName, lastName }`
  - Throws if `identityToken` is null
- [ ] Add `WebBrowser.maybeCompleteAuthSession()` at the top of the file

See `social-auth-plan.md` §4.5 for the full code.

---

### 3.4 — Rewrite the `socialAuth` Redux thunk

In `frontend/dailyflo/store/slices/auth/authSlice.ts`:

- [ ] Replace the entire `socialAuth` thunk body (currently all mock code returning fake tokens)
- [ ] New body:
  1. Call `authApiService.socialLogin({ provider, id_token, first_name, last_name })`
  2. Extract `tokens.access`, `tokens.refresh`, `user` from response
  3. Call `storeAccessToken`, `storeRefreshToken`, `storeTokenExpiry` (same as `loginUser` does)
  4. Return `{ user: transformApiUserToUser(user), accessToken, refreshToken, expiresAt, isNewUser }`
  5. Catch HTTP 409 → `rejectWithValue({ code: 'account_conflict', message: ... })`

See `social-auth-plan.md` §4.6 for the full code.

---

### 3.5 — Build the sign-in UI components

- [ ] Create a `GoogleSignInButton` component
  - Call `AuthSession.useAutoDiscovery('https://accounts.google.com')` at the top of the component
  - On press: call `triggerGoogleSignIn(discovery)` → `dispatch(socialAuth({ provider: 'google', idToken }))`
  - Handle loading and error states
- [ ] Create an `AppleSignInButton` component
  - Use `AppleAuthentication.AppleAuthenticationButton` — **must** use this component, no custom button allowed on App Store
  - On press: call `triggerAppleSignIn()` → `dispatch(socialAuth({ provider: 'apple', idToken, firstName, lastName }))`
  - Wrap in `AppleAuthentication.isAvailableAsync()` check — Apple Sign In is only available on iOS 13+; hide button on Android

---

### 3.6 — Wire the 409 account conflict case in UI

- [ ] When the `socialAuth` thunk returns a rejected action with `code === 'account_conflict'`:
  - Show an alert or inline message: "An account with this email already exists. Sign in with [provider] instead."
  - Do not navigate anywhere — stay on the current screen

---

### 3.7 — Add buttons to your sign-in / sign-up screens

- [ ] Place `GoogleSignInButton` on your welcome / sign-in screen
- [ ] Place `AppleSignInButton` below it (iOS only — conditionally rendered)
- [ ] Confirm that after a successful `socialAuth` dispatch, navigation goes to `/(tabs)` (this happens automatically via the `checkAuthStatus` / `isAuthenticated` path in `_layout.tsx` — no extra routing code needed)

---

## Phase 4 — Build and test on device

Expo Go cannot run social auth. You must build a dev client.

### 4.1 — Build dev client

```bash
# iOS (requires macOS + Xcode)
npx expo run:ios

# Android
npx expo run:android
```

---

### 4.2 — End-to-end test checklist (Google)

- [ ] Tap "Sign in with Google" → browser opens Google login
- [ ] Sign in with a Google account → browser redirects back to app
- [ ] App navigates to `/(tabs)` (main app)
- [ ] Sign out → return to welcome screen (not onboarding)
- [ ] Sign in again with same Google account → goes straight to tabs (no new user created)
- [ ] Test 409: create an email/password account with the same Google email, then try Google sign-in → see conflict error message

---

### 4.3 — End-to-end test checklist (Apple)

- [ ] Tap "Sign in with Apple" → native Apple sheet appears
- [ ] Sign in → app navigates to `/(tabs)`
- [ ] Sign out → return to welcome screen
- [ ] Sign in again → goes to tabs, no duplicate user
- [ ] Test on a second device: confirm `sub` is consistent (same user recognised)

---

## Phase 5 — Pre-production checklist (before any real users)

These are not needed to ship to TestFlight but must be done before public release.

- [ ] Remove `reset_token` and `uid` from `PasswordResetRequestView` response (currently exposed in response body — dev-only debugging aid)
- [ ] Set `CORS_ALLOW_ALL_ORIGINS = False` in `settings.py`; replace with explicit `CORS_ALLOWED_ORIGINS`
- [ ] Move `SECRET_KEY` out of `settings.py` — load from env var
- [ ] Set `DEBUG = False` in production environment
- [ ] Ensure the Apple `.p8` file is on the server only and in `.gitignore`
- [ ] Add `.env` files to `.gitignore` on both backend and frontend

---

## Reference: files changed in this feature

| File | What changes |
|------|--------------|
| `backend/dailyflo/requirements.txt` | Add `google-auth`, `cryptography`, `requests` |
| `backend/dailyflo/config/settings.py` | Add `SIMPLE_JWT`, `token_blacklist` app, social env vars |
| `backend/dailyflo/apps/accounts/social_auth.py` | **New** — verification functions |
| `backend/dailyflo/apps/accounts/serializers.py` | Rewrite `SocialAuthSerializer` |
| `backend/dailyflo/apps/accounts/views.py` | Rewrite `SocialAuthView` |
| `frontend/dailyflo/package.json` | Add `expo-auth-session`, `expo-apple-authentication` |
| `frontend/dailyflo/app.json` | Add scheme, Apple plugin, Google service files |
| `frontend/dailyflo/services/auth/socialAuth.ts` | **New** — sign-in trigger functions |
| `frontend/dailyflo/store/slices/auth/authSlice.ts` | Replace mock `socialAuth` thunk |

## Reference: files confirmed unchanged

| File | Why |
|------|-----|
| `apps/accounts/models.py` | Already has `auth_provider`, `auth_provider_id`, DB constraints |
| `apps/accounts/urls.py` | Route already exists |
| `services/auth/tokenStorage.ts` | Provider-agnostic |
| `services/api/client.ts` | Interceptors are provider-agnostic |
| `services/api/auth.ts` | `socialLogin` method already correct |
| `app/_layout.tsx` | Routing gate works for any auth method |

---

*For concept explanations, diagrams, and detailed code samples, see `social-auth-plan.md` in the same folder.*
