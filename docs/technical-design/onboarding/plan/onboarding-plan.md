# Onboarding — Screen Architecture Plan

**Purpose:** Define how DailyFlo splits **education / trust** (introductory) from **setup / first win** (onboarding), how routing and persistence work with the existing root gate, and how engineers should extend the flow without turning one screen into a “god component.”

**Audience:** Engineers working in Expo Router + React Native (`frontend/dailyflo`).

**Status:** Living doc — update when routes or storage keys ship.

**See also:** [Onboarding UI architecture](../onboarding-architecture.md) — transparent native header; page indicator + Skip; intro body = horizontal `pagingEnabled` `ScrollView` with per-slide full-bleed bg + top-padded content (**§4**); no `Stack.Toolbar`.

---

## 1. Product split (two phases)

| Phase | Role | User expectation |
| --- | --- | --- |
| **Introductory** | Explain what DailyFlo is; light cognitive load | Horizontal paging (or similar); optional skip; **no heavy forms** |
| **Onboarding (setup)** | Defaults, preferences, first meaningful action | Linear or branching steps; explicit back; feels like “configuration” |

### Introductory (v1 target)

Four short beats (copy can change):

1. Welcome — what DailyFlo is  
2. Core value — what it does best  
3. AI — how assistance shows up (trust / boundaries)  
4. Recap — why it helps day-to-day  

Shared chrome: **page indicator**, optional **Skip**, primary **Continue** (last step proceeds into setup or finishes intro-only milestone).

### Onboarding / setup (v1 target — simplified)

After intro (or after Skip where product allows):

1. Entry — e.g. “Start by planning today” — **Start**  
2. Wake time  
3. Bed time  
4. Branch — **Build a habit** | **Create a task**  
   - **Habit path:** input (+ placeholders for future steps) → **Finish setup**  
   - **Task path:** time → duration → **Finish setup**  

Later iterations can add persistence-of-branch, feature flags for incomplete habit middle steps, etc.

---

## 2. Current codebase (baseline)

These facts should stay aligned with implementation:

- **Gate:** `frontend/dailyflo/app/_layout.tsx` reads AsyncStorage key **`@DailyFlo:onboardingComplete`**. If not `'true'`, the app **`router.replace('/(onboarding)')`** before auth routing logic proceeds.
- **Entry redirect:** `frontend/dailyflo/app/(onboarding)/index.tsx` is a `<Redirect href="/(onboarding)/introductory" />` — it only redirects; its header is suppressed in `(onboarding)/_layout.tsx` so it never flashes chrome.
- **Introductory screen:** `frontend/dailyflo/app/(onboarding)/introductory/index.tsx` — fully implemented horizontal pager with `ONBOARDING_INTRO_PAGE_COUNT` (currently **2**) sample slides (`IntroSamplePageOne`, `IntroSamplePageTwo`). `useCompleteOnboardingAndExit` writes `'true'` and calls `router.replace('/(tabs)')`.
- **Page count constant:** `frontend/dailyflo/components/features/onboarding/onboardingIntroConstants.ts` — update `ONBOARDING_INTRO_PAGE_COUNT` and add/remove page components in `introductory/pages/` when beats change.
- **Skip control:** Absolutely-positioned in-screen `Pressable` (not `headerRight`) — see [onboarding-architecture.md §3](../onboarding-architecture.md) for rationale.
- **Feature `index.ts`:** `frontend/dailyflo/components/features/onboarding/index.ts` — exports `OnboardingDotIndicator`, page components, hooks, and constants; route shells stay under `app/(onboarding)/`.

Any new phases (intro-only complete vs whole funnel complete) require either **new storage keys** or **explicit state machine** documentation below — do not overload one boolean without updating this doc.

---

## 3. Architectural principles

1. **Know where you are** — Prefer **URL-driven steps** for setup (deep links, sane back stack). Intro may stay **one route + internal pager index** if analytics does not require four distinct routes.

2. **Composition** — Shared chrome (indicator, skip, primary CTA) + thin step bodies (copy + inputs only).

3. **Variant by phase** — Avoid scattered `if (intro)` across many files; use a small shell (`IntroductoryShell` vs `SetupShell`) or layout groups so typography and navigation behavior stay consistent.

4. **Branching setup** — Model habit vs task as **`phase` + `branch`** (Redux slice, Zustand, or a tiny reducer). Persist only what you need for resume-after-kill.

5. **Gestures** — Intro: horizontal paging acceptable. Setup: prefer **explicit back** only (no horizontal swipe between steps) unless product explicitly wants it — reduces accidental data loss and confusing stack behavior.

---

## 4. Recommended route topology (Expo Router)

Nested groups keep onboarding out of `(tabs)` and allow different layouts per phase.

```text
app/
  (onboarding)/
    _layout.tsx                 # stack; transparent header, gestureEnabled: false
    index.tsx                   # <Redirect> to introductory (header suppressed)
    introductory/               # plain nested folder — no separate _layout
      index.tsx                 # pager / slides host (SHIPPED)
    (setup)/                    # optional group — name may be `setup` | `journey`
      _layout.tsx               # linear progress, back, optional skip
      index.tsx                 # “plan today” entry
      wake.tsx
      sleep.tsx
      next-choice.tsx           # habit | task
      habit-input.tsx
      task-time.tsx
      task-duration.tsx
      complete.tsx
```

**Alternative (smaller Router graph):** A single `(onboarding)/index.tsx` that internally switches intro pager vs setup wizard by client state — fewer files, worse deep-linking per intro slide.

---

## 5. Persistence & completion semantics

| Concern | Recommendation |
| --- | --- |
| **Today (shipped)** | One flag: `@DailyFlo:onboardingComplete` means “done with placeholder onboarding → tabs.” |
| **Intro vs setup** | Introduce **`@DailyFlo:introductoryComplete`** (or segment in a single JSON blob) if intro must finish before setup, or if Skip should jump to setup rather than tabs. |
| **Resume** | If setup has many steps, persist **`currentStepId`** + **`branch`** minimally in AsyncStorage or secure storage — document keys in `docs/` when added. |
| **Auth** | Root layout currently prioritizes onboarding flag over auth in some paths — when changing completion keys, re-read `_layout.tsx` comments so logged-out users are not trapped or skipped incorrectly. |

---

## 6. UI implementation notes (introductory pager)

Common choices in React Native:

- **`ScrollView`** `horizontal` + `pagingEnabled` — simple, no extra dependency; sync index on `onMomentumScrollEnd`.
- **`react-native-pager-view`** — more native paging feel on some Android devices; add dependency consciously.
- **Backdrop / motion** — If background or titles use motion separate from body copy, document the rule (e.g. fixed backdrop + crossfade vs fully paging cards) so the next contributor does not regress UX unintentionally.

Reuse **`ContinueButton`** (`@/components/ui/Button`) for the primary forward control unless design system adds an onboarding-specific CTA.

---

## 7. Onboarding (setup) implementation notes

- **Back:** `router.back()` within `(setup)` if each step is its own screen.
- **Progress:** Derive from route name + branch (and feature flags for placeholder steps).
- **State:** Align with app state — if the rest of DailyFlo uses Redux for domain state, a small **`onboardingSlice`** (phase, branch, draft answers) keeps ownership clear.

---

## 8. Accessibility & quality bar

- Intro pager: meaningful labels per step; consider announcing page changes for VoiceOver / TalkBack.
- Respect **reduce motion**: optional simpler transitions when system setting is on.
- **Skip** must match product policy (setup entry vs sign-in vs tabs) and be documented here when wired.

---

## 9. Open decisions (fill in as product locks)

- Does **Skip** on intro land on **setup**, **sign-in**, or **tabs**?
- Is **intro completion** required before showing setup, or can Skip bypass intro entirely?
- When does **`@DailyFlo:onboardingComplete`** flip to `true` — after setup only, or after intro for MVP?
- Analytics: per-slide intro events — **four routes** vs **one route + client events**?

---

## 10. Changelog

| Date | Change |
| --- | --- |
| 2026-04-29 | Doc recreated: two-phase model, route sketch, persistence table, aligned with current `_layout` gate and `(onboarding)/index` placeholder. |
| 2026-04-30 | §2: updated baseline — `index.tsx` is now a `<Redirect>`, introductory pager is fully shipped (2 sample slides). §4: corrected `(introductory)/` → `introductory/` (plain folder, no group). Skip control is in-screen, not `headerRight`. |
