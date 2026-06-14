# Habits — manual QA checklist

**Purpose:** Short checkbox sign-off for habits QA. For full step-by-step scenarios, expected results, and troubleshooting, use **[`docs/testing/habits-manual-testing.md`](../../../testing/habits-manual-testing.md)**.

**Audience:** Anyone manually testing on iOS or Android (physical device or simulator).

**Status:** Draft — run against implementation phases in [`habits-implementation.md`](habits-implementation.md).

**Implementation reference (code):**

| Area | Location |
| --- | --- |
| Habits tab routes | `frontend/dailyflo/app/(tabs)/habits/` |
| Habits UI | `frontend/dailyflo/components/features/habits/` (`tab/`, `list/`, `detail/`, `forms/`, `today/`) |
| Today section | `frontend/dailyflo/components/features/habits/today/TodayHabitsSection.tsx` |
| Redux + API | `frontend/dailyflo/store/slices/habits/`, `frontend/dailyflo/services/api/habits.ts` |
| Backend | `backend/dailyflo/apps/habits/` |
| Global gamification | `backend/dailyflo/apps/gamification/`, `ActivityLog` habit_completed rows |
| Onboarding import | `frontend/dailyflo/components/features/onboarding/auth/hooks/useCompleteOnboardingAndExit.ts` |
| Habit reminders (Phase 4) | `frontend/dailyflo/services/notifications/habitReminderScheduler.ts` |

**API base:** `GET/POST/PATCH/DELETE /habits/*` (authenticated).

**See also:** [`habits-implementation.md`](habits-implementation.md) — full implementation plan.

---

## Before you start

| Requirement | Notes |
| --- | --- |
| **Signed in** | Test account with Habits tab added via **Browse → Settings → Navigation → Add → Habits** |
| **Backend running** | Django API reachable from the app |
| **User timezone** | Streaks and “today” use `preferences.timezone` (defaults UTC) |
| **Phase scope** | Skip sections marked Phase 2/3/4 until that phase ships |

**Not in v1 (skip or expect missing):**

- Quit / sobriety habits
- Habits on Planner timeline
- `linked_habit` goals
- Achievements beyond `first_habit_completion`

---

## Test session

| Field | Value |
| --- | --- |
| Tester | |
| Date | |
| Branch | |
| Device | |
| OS version | |
| Build | dev client / Expo Go / EAS |
| Test account email | |
| Backend environment | local / staging |
| User timezone set to | |

---

## 1. Habits tab — navbar access (Phase 1)

**Goal:** Habits tab is reachable and shows today’s list shell.

### 1a — Add Habits to navbar

1. **Browse → Settings → Navigation → Add**.
2. Tap **Habits**; save (leave Navigation settings).

**Expected**

- [ ] Habits appears on liquid tab bar.
- [ ] Tap Habits — no “screen does not exist” / not-found.
- [ ] Standalone tab transition (no browse-stack slide).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 1b — Empty state

**Precondition:** Account with no habits.

**Expected**

- [ ] Empty state copy (no crash).
- [ ] FAB or add affordance visible.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 2. Create habits (Phase 1)

### 2a — Binary daily habit

1. Open Habits tab → create (FAB).
2. Title: `Morning stretch`; tracking: **simple check-off**; frequency: **Daily**; save.

**Expected**

- [ ] Habit appears on today’s list.
- [ ] Row shows title; streak shows **0** or empty until first complete.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 2b — Numeric habit with target

1. Create habit: `Drink water`; tracking: **numeric**; target **8**; unit `glasses`; frequency **Daily**.

**Expected**

- [ ] Row shows progress (e.g. `0/8 glasses`).
- [ ] **+1** control increments value; completes at 8.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 2c — Frequency types (due today)

Create one habit per type; verify **only due today** appear on list (adjust device date or wait as needed):

| Frequency | Setup | Due today when |
| --- | --- | --- |
| Weekly | Pick Wednesday | Today is Wednesday |
| Weekdays | — | Mon–Fri only |
| Weekends | — | Sat–Sun only |
| Custom | Tue + Thu | Today matches selected day |
| X per week | Target 3/week | Heuristic surfaces on enough days (see implementation plan §3.4) |

**Expected**

- [ ] Non-due habits hidden from today list (not deleted).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 2d — Edit and delete

1. Edit habit title/color/frequency; save.
2. Delete habit (confirm).

**Expected**

- [ ] PATCH persists after refocus.
- [ ] Deleted habit removed from list; no ghost rows.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 3. Check-off and streaks (Phase 1)

### 3a — Binary complete

1. Tap binary habit row to complete.
2. Tap again to undo (if supported) or use undo action.

**Expected**

- [ ] Visual complete state toggles.
- [ ] `currentStreak` increments after first complete today.
- [ ] Undo restores streak if same-day only completion removed.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 3b — Numeric increment to target

1. Tap +1 on numeric habit until target reached.

**Expected**

- [ ] Row shows complete state at target.
- [ ] Partial progress visible before target.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 3c — Streak across days

**Precondition:** Complete habit today; advance clock to next calendar day (or test next day).

**Expected**

- [ ] Streak increments when completing consecutive scheduled days.
- [ ] Missing a scheduled day resets `currentStreak` (longest preserved).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 4. Today tab — Habits section (Phase 1)

**Goal:** Due-today habits appear in separate section above tasks.

### 4a — Section visibility

1. Create at least one habit due today.
2. Open **Today** tab.

**Expected**

- [ ] **Habits** section appears above task list.
- [ ] Same habits as Habits tab (due today only).
- [ ] Check-off on Today updates Habits tab (refocus or navigate).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 4b — No section when empty

**Precondition:** No habits due today (or no habits).

**Expected**

- [ ] Habits section hidden (no empty header crash).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 5. Habit detail — graphs (Phase 2)

**Entry:** Tap habit row → detail screen.

### 5a — Heatmap

**Precondition:** Habit with completions spanning multiple weeks.

**Expected**

- [ ] Grid renders (~365 days); completed days visually distinct.
- [ ] No crash on new habit (sparse data).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 5b — Trend line

**Expected**

- [ ] Rolling 7-day line visible over 30-day window.
- [ ] Rate drops after missed scheduled days (sanity check).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 5c — Streak on detail

**Expected**

- [ ] Current + longest streak match list row values.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 6. Onboarding import (Phase 1)

**Goal:** New account choosing **Build a habit** creates `Habit`, not recurring task.

1. Fresh install or new test account → complete onboarding questionnaire.
2. Choose **Build a habit**; enter goal + frequency; finish setup + sign in.

**Expected**

- [ ] One habit exists matching questionnaire title/frequency.
- [ ] **No** new recurring task tagged `onboarding-habit` on Today (habit→task path deprecated).
- [ ] Questionnaire still saved on profile preferences.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 7. Global gamification (Phase 1 + 3)

### 7a — Global streak includes habit day

1. Account with no task completions today; complete one habit today.
2. Open **Browse** progress card.

**Expected**

- [ ] Daily streak reflects habit completion day (≥ 1).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7b — Tab summary header (Phase 3)

**Expected**

- [ ] Habits tab header shows `completedCount/scheduledCount` for today.
- [ ] Best active streak among habits displayed.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 7c — `first_habit_completion` achievement (Phase 3)

1. Complete any habit for the first time on account.
2. Open **Browse → Achievements** (or productivity hub).

**Expected**

- [ ] **First habit** (or equivalent title) achievement unlocked.
- [ ] Persists after app restart.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 8. Local reminders (Phase 4)

**Precondition:** OS notification permission granted; `preferences.notifications.enabled` true.

1. Create habit due today with `reminder_time` ~2 minutes in future.
2. Background app; wait for notification.

**Expected**

- [ ] Local notification fires at reminder time.
- [ ] Deleting habit cancels pending notification.
- [ ] Logout cancels habit reminders (no orphan fires).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 9. Platform-specific

### iOS

- [ ] Dashboard overflow toolbar on Habits tab works.
- [ ] Habit detail scroll + safe area correct.

### Android

- [ ] Dashboard header chip on Habits tab.
- [ ] Habits tab switch uses `navigate` (no duplicate stack entries).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## Sign-off

| Role | Name | Date | Phase tested |
| --- | --- | --- | --- |
| Tester | | | |
| Reviewer | | | |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-07 | Initial draft aligned with habits-implementation.md |
| 2026-06-07 | Link to full manual testing guide at docs/testing/habits-manual-testing.md |
