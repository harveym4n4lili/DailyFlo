# Gamification — manual QA checklist

**Purpose:** Step-by-step device checklist for currently implemented gamification UI on branch `feat/gamification` — browse progress board, productivity hub, goals, achievements, and data persistence.

**Audience:** Anyone manually testing on iOS or Android (physical device or simulator).

**Implementation reference (code):**

| Area | Location |
| --- | --- |
| Browse progress board | `frontend/dailyflo/components/features/gamification/browse/` |
| Redux + API | `frontend/dailyflo/store/slices/gamification/`, `frontend/dailyflo/services/api/gamification.ts` |
| Backend | `backend/dailyflo/apps/gamification/` |
| Activity logs (streak source) | `backend/dailyflo/apps/tasks/views.py` → `ActivityLog` |

**API base:** `GET/POST/PATCH/DELETE /gamification/*` (authenticated).

---

## Before you start

| Requirement | Notes |
| --- | --- |
| **Signed in** | Test account with at least one list and tasks you can complete |
| **Backend running** | Django API reachable from the app (local or deployed) |
| **Browse tab** | Gamification UI lives on **Browse** home and browse stack routes |
| **User timezone** | Streaks use `preferences.timezone` on the user profile (defaults to UTC if unset) |
| **Fresh state (optional)** | For persistence tests, note account id and use Django admin or DB to verify rows |

**Not implemented in UI (skip or expect failure):**

- Settings → **Productivity → Goals** row (`onPress` is empty — use progress card **Productivity** or toolbar flows instead).
- **Edit goal** (PATCH exists in API; no edit screen).
- Progress card does **not** display `goalsOnTrack`, `completionsThisWeek`, or `unlockedAchievementCount` (API returns them; UI uses a subset).

---

## Test session

| Field | Value |
| --- | --- |
| Tester | |
| Date | |
| Branch | `feat/gamification` |
| Device | |
| OS version | |
| Build | dev client / Expo Go / EAS |
| Test account email | |
| Backend environment | local / staging |

---

## 1. Browse home — progress board

**Goal:** `BrowseProgressCard` shows streak, today’s tasks, and productivity link; data matches server activity.

**Entry:** Browse tab → top card (liquid glass + grouped list).

### 1a — Initial load

1. Log in and open **Browse**.
2. Wait for the progress board to load (spinner only on first load when summary is empty).

**Expected**

- [ ] Three rows visible: **Daily Streak**, **Today's Tasks**, **Productivity** (chart icon + chevron).
- [ ] No crash; lists below (“My Lists”) still work.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 1b — Daily Streak (no history)

**Precondition:** Account with **no** prior task completions (or use a new test user).

**Expected**

- [ ] Count shows **—** (em dash).
- [ ] No “day” / “days” unit.
- [ ] Hint: **Complete a task today to start your streak**.
- [ ] Longest shows **Longest: —** (or equivalent empty formatting).
- [ ] No new-best medal.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 1c — Daily Streak (active streak)

**Precondition:** Complete at least one task **today** (see §6). Return to Browse (pull focus or leave tab and return).

**Expected**

- [ ] Count shows today’s streak length (e.g. **1 day**).
- [ ] **Longest: N days** on the right of the count row.
- [ ] Hint hidden when streak &gt; 0 or user has `lastCompletionDate`.
- [ ] Typography: section label tertiary; count **body-large bold**; unit regular; pill-style count color matches quick-add label tone.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 1d — New personal best (medal)

**Precondition:** `currentStreak >= longestStreak` and both &gt; 0 (e.g. tie or beat prior longest).

**Expected**

- [ ] **Gold medal** icon beside day/days (not marple).
- [ ] Subtle glow (tight halo — not a large blur).
- [ ] VoiceOver / accessibility: new personal best streak (if tested).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 1e — Today's Tasks row

**Precondition:** Mix of completed today and incomplete tasks due today (or no due date).

**Expected**

- [ ] Left: completed count / goal (e.g. **2/5**).
- [ ] Right: **%** (rounded).
- [ ] Marple **progress bar** fill uses **marple 600**; track tinted behind fill.
- [ ] Goal denominator = completions today + incomplete due today (minimum 1) — **not** the same as UserGoal targets.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 1f — Productivity row

1. Tap **Productivity**.

**Expected**

- [ ] Navigates to productivity hub (§3).
- [ ] Back returns to Browse.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 1g — Cached summary while refetching

1. On Browse with loaded card, switch away and back quickly (or trigger refetch).

**Expected**

- [ ] Card stays visible during refetch (no full-card spinner unless summary was never loaded).
- [ ] Values update after refetch when data changed.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 2. Browse chrome — achievements shortcut

**Goal:** Achievements reachable without opening productivity hub.

### iOS

- Toolbar: search (left), **trophy** (achievements), gear (settings).

### Android

- Top row: search + trophy + settings.

**Steps**

1. From Browse, tap **trophy**.

**Expected**

- [ ] Opens **Achievements** stack screen.
- [ ] Back returns to Browse.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 3. Productivity hub

**Route:** `/(tabs)/browse/productivity`

**Goal:** Hub links work; no data loading on hub itself.

| # | Steps | Expected | Pass | Fail | Notes |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Open from progress card | Three rows: Goals, Achievements, Completed | ☐ | ☐ | |
| 3.2 | Tap **Goals** | Goals list screen | ☐ | ☐ | |
| 3.3 | Tap **Achievements** | Achievements list | ☐ | ☐ | |
| 3.4 | Tap **Completed** | Completed activity log (separate feature; not gamification API) | ☐ | ☐ | |

---

## 4. Goals

**Routes:** `/(tabs)/browse/goals`, `/(tabs)/browse/goal-create` (modal)

**Goal:** CRUD via UI matches API rules (max 5 active, soft delete, linked task).

### 4a — Empty state

1. Use account with **0** active goals.
2. Open Goals (hub or direct route).

**Expected**

- [ ] Empty copy: no goals yet, tap + (up to 5 active).
- [ ] FAB visible.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 4b — Create goal (any task completions)

1. FAB → **New Goal** modal.
2. Title: e.g. `Weekly focus`.
3. Target count: **3**.
4. Period: **weekly**.
5. Type: **Any task completions**.
6. Submit (checkmark / submit).

**Expected**

- [ ] Modal closes; goal appears in list.
- [ ] Row shows title, period label, `currentCount/targetCount`, progress bar.
- [ ] Browse summary refetches (goals totals in API — not shown on card).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 4c — Create linked goal

1. Create goal with type **Linked task only**.
2. Pick an **incomplete** task from the list (up to 20 shown).
3. Submit.

**Expected**

- [ ] Goal saved with linked task.
- [ ] Progress counts only completions for that task in the goal’s period.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 4d — Validation — linked task required

1. Choose **Linked task only** without selecting a task.
2. Submit.

**Expected**

- [ ] Alert blocks submit (select a task).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 4e — Max five active goals

1. Create goals until **5** active exist.
2. Attempt a **6th**.

**Expected**

- [ ] API/validation error surfaced in UI (no silent success).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 4f — Delete goal

1. Long-press a goal → **Remove** → confirm.

**Expected**

- [ ] Row removed from list.
- [ ] Goal inactive server-side (`is_active=False`).
- [ ] Summary refetches after delete.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 4g — Progress updates after completions

1. Note `currentCount` on a daily goal.
2. Complete a task that counts for that goal (any-task or linked).
3. Re-open **Goals** (focus refetch).

**Expected**

- [ ] `currentCount` increases; bar advances; **Done** / met state when `currentCount >= targetCount`.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 5. Achievements

**Route:** `/(tabs)/browse/achievements`

**Goal:** Catalog displays; unlocks persist; evaluator runs on fetch.

### 5a — Locked achievements

**Precondition:** New user or criteria not yet met.

**Expected**

- [ ] List of achievement titles/descriptions.
- [ ] Locked rows visually dimmed.
- [ ] Some rows show **progress label** (e.g. streak progress) where applicable.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 5b — First completion unlock

1. Complete **first ever** task for the account.
2. Open **Achievements** (or open Browse first — summary also runs evaluator).

**Expected**

- [ ] **First completion** (or equivalent seeded code) unlocked with checkmark/seal.
- [ ] `unlockedAt` set server-side.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 5c — Streak achievements

1. Build streak to **3** consecutive calendar days (user timezone).
2. Refetch achievements (screen focus).

**Expected**

- [ ] Streak-related achievements unlock at 3 / 7 / 30 per seed rules.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 5d — Stale list until refetch

1. Complete a task on **Today** tab without visiting Achievements.
2. Open Achievements.

**Expected**

- [ ] New unlocks appear after screen loads (focus fetch).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 6. Task completion → live summary update

**Goal:** Completing/uncompleting tasks refreshes gamification summary without requiring a full app restart.

### 6a — Complete task (away from Browse)

1. Note streak / today count on Browse.
2. Go to **Today** or **Planner**; complete a due task (normal complete flow).
3. Return to **Browse**.

**Expected**

- [ ] Today's Tasks count and bar update.
- [ ] Streak updates if completion is on a new calendar day in user TZ.
- [ ] Redux summary refetch triggered from `updateTask` when `isCompleted` changes.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 6b — Uncomplete task

1. Mark a completed task **incomplete** again.
2. Return to Browse.

**Expected**

- [ ] Today count and streak can **decrease** after refetch.
- [ ] No crash.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 6c — Recurring task occurrence

1. Complete a **recurring** task for a specific occurrence date.
2. Check Browse streak / today.

**Expected**

- [ ] `ActivityLog` uses `occurrence_date` for streak/day bucketing (not only `created_at`).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 7. Persistence testing

**Goal:** Prove server-side data survives app restarts, logout/login, and matches UI — not only in-memory Redux.

Use Django **admin** or DB read access when noted. Tables: `ActivityLog`, gamification `UserGoal`, `UserAchievement`, `AchievementDefinition`.

### 7a — ActivityLog written on complete

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Complete a task in the app | |
| 2 | Inspect DB/admin for user | New row: `action_type='completed'`, correct `task_id`, `occurrence_date` if recurring |

**Expected**

- [ ] Log row exists and belongs to test user.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7b — Streak survives app restart

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Build streak ≥ 2 days (completions on consecutive days) | |
| 2 | Force-quit app; reopen; log in; open Browse | Streak and longest match pre-quit values |

**Expected**

- [ ] Values recomputed from logs — same as before quit (no client-only streak storage).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7c — UserGoal survives restart

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Create a goal | Note goal id/title in admin |
| 2 | Kill app; reopen; open Goals | Same goal listed with correct title/target/period |

**Expected**

- [ ] Goal row still `is_active=True` in DB.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7d — Deleted goal stays deleted

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Delete goal in app | |
| 2 | Restart app; open Goals | Goal absent |
| 3 | Admin | `is_active=False` (not hard-deleted) |

**Expected**

- [ ] Soft delete persisted; does not reappear.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7e — UserAchievement survives restart

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Unlock an achievement (e.g. first completion) | |
| 2 | Kill app; reopen; open Achievements | Still unlocked |
| 3 | Admin | `UserAchievement` row with `unlocked_at` |

**Expected**

- [ ] Unlock not lost across sessions.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7f — Logout clears client gamification cache

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Load Browse with populated progress board | |
| 2 | Log out | |
| 3 | Log in as **same** user; open Browse | Fresh fetch; no stale **other user** data |
| 4 | Log in as **different** user | No previous user’s streak/goals visible |

**Expected**

- [ ] `clearGamification()` on logout; no cross-account bleed in Redux.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7g — Same account, second device or fresh install (optional)

| Step | Action | Verify |
| --- | --- | --- |
| 1 | On device A, complete tasks and create a goal | |
| 2 | On device B (or simulator), log in as same user | Browse + Goals + Achievements match server |

**Expected**

- [ ] All gamification state sourced from API/DB, not device-local only.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7h — Summary is not stored as a snapshot

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Note `currentStreak` on Browse | |
| 2 | In admin, delete today’s completion log (or uncomplete in app) | |
| 3 | Refetch Browse (tab focus) | Streak/today counts drop |

**Expected**

- [ ] Summary always derived from current logs — no frozen summary table.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7i — Goal progress recomputed from logs

| Step | Action | Verify |
| --- | --- | --- |
| 1 | Goal `targetCount=2`, period daily, `currentCount=0` | |
| 2 | Complete two qualifying tasks today | |
| 3 | Open Goals | `currentCount=2`, met |

**Expected**

- [ ] `currentCount` not manually stored on `UserGoal` — recomputed on `GET /gamification/goals/`.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 8. Regression / edge cases

| # | Scenario | Expected | Pass |
| --- | --- | --- | --- |
| 8.1 | Offline complete (if supported) then online | Summary catches up on reconnect + Browse focus | ☐ |
| 8.2 | Browse with API error | Error handled; no white screen | ☐ |
| 8.3 | Goals screen API error | Error message shown | ☐ |
| 8.4 | Achievements screen API error | Error message shown | ☐ |
| 8.5 | Settings → Productivity → Goals | **No navigation** (known stub) | ☐ |

---

## Sign-off

| Section | Pass | Fail | Blocker notes |
| --- | --- | --- | --- |
| 1. Progress board | ☐ | ☐ | |
| 2. Browse toolbar | ☐ | ☐ | |
| 3. Productivity hub | ☐ | ☐ | |
| 4. Goals | ☐ | ☐ | |
| 5. Achievements | ☐ | ☐ | |
| 6. Task → summary | ☐ | ☐ | |
| 7. Persistence | ☐ | ☐ | |
| 8. Edge cases | ☐ | ☐ | |

**Overall:** ☐ Ready to merge &nbsp;&nbsp; ☐ Blocked — issues logged below

**Issues / follow-ups:**

```
(write failures, steps to reproduce, screenshots, ticket links)
```

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-03 | Initial checklist — browse progress board, productivity hub, goals, achievements, task invalidation, persistence (ActivityLog, UserGoal, UserAchievement, logout). |
