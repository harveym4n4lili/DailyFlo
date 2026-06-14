# Habits Feature — Manual Testing Guide

## Overview

This guide is the step-by-step manual test plan for the **Habits** feature in DailyFlo. Use it to confirm Phase 1 (CRUD, logging, streaks, Today section, onboarding) and Phase 2 (detail screen, heatmap, trend chart, edit/delete) are working end-to-end on a real device or simulator.

**Companion docs:**

| Doc | Purpose |
| --- | --- |
| [`habits-implementation.md`](../technical-design/habits/plan/habits-implementation.md) | Full product + engineering plan |
| [`habits-manual-qa-checklist.md`](../technical-design/habits/plan/habits-manual-qa-checklist.md) | Short checkbox sign-off sheet |

**Code reference:**

| Area | Location |
| --- | --- |
| Routes | `frontend/dailyflo/app/(tabs)/habits/` |
| UI | `frontend/dailyflo/components/features/habits/` (`tab/`, `list/`, `detail/`, `forms/`, `today/`) |
| Redux + API | `frontend/dailyflo/store/slices/habits/`, `frontend/dailyflo/services/api/habits.ts` |
| Backend | `backend/dailyflo/apps/habits/` |
| Onboarding import | `frontend/dailyflo/components/features/onboarding/auth/hooks/useCompleteOnboardingAndExit.ts` |

---

## What is implemented (test now)

| Area | Status | Notes |
| --- | --- | --- |
| Habits navbar tab | **Shipped** | Add via Browse → Settings → Navigation |
| Create habit (FAB) | **Shipped** | Binary + numeric tracking |
| Frequencies in UI | **Shipped** | daily, weekdays, weekends, weekly, times per week |
| Custom day picker | **Not in UI** | Backend supports `custom`; skip UI test until form ships |
| Today tab section | **Shipped** | Due-today habits above tasks |
| Log / undo (binary) | **Shipped** | Tap checkbox toggles completion |
| Numeric +1 | **Shipped** | Increments until daily target |
| Per-habit streaks | **Shipped** | Current + longest on list + detail |
| Tab summary header | **Shipped** | `completed/scheduled` + best streak |
| Habit detail + graphs | **Shipped** | Heatmap + 30-day rolling trend |
| Edit habit | **Shipped** | From detail → edit route |
| Delete habit | **Shipped** | From detail with confirm alert |
| Onboarding → Habit | **Shipped** | No recurring onboarding task |
| Global streak (ActivityLog) | **Shipped** | `habit_completed` rows feed gamification |
| `first_habit_completion` achievement | **Not shipped** | Phase 3 — skip |
| Local habit reminders | **Not shipped** | Phase 4 — skip |

**Out of scope for v1 (do not expect):** quit/sobriety habits, Planner integration, `linked_habit` goals, push notifications.

---

## Before you start

### Requirements

1. **Signed-in test account** with Django API reachable from the app.
2. **Habits tab enabled:** Browse → Settings → Navigation → Add → **Habits** → save.
3. **Backend running** with habits migrations applied (`python manage.py migrate`).
4. **User timezone** set in profile preferences (streaks and “today” use this; default UTC).

### Recommended test data

Create a small set of habits up front:

| Habit | Tracking | Frequency | Purpose |
| --- | --- | --- | --- |
| Morning stretch | Binary | Daily | Basic check-off |
| Drink water | Numeric, target 8, unit `glasses` | Daily | +1 progress |
| Weekly review | Binary | Once a week (pick today’s weekday) | Schedule filter |
| Weekday only | Binary | Weekdays | Hidden Sat/Sun |
| Weekend walk | Binary | Weekends | Hidden Mon–Fri |
| 3× per week | Binary | 3 times per week | Flexible weekly heuristic |

### Test session record

| Field | Value |
| --- | --- |
| Tester | |
| Date | |
| Branch | |
| Device | |
| OS version | |
| Build | dev client / Expo Go / EAS |
| Test account | |
| Backend | local / staging |
| User timezone | |

---

## Quick sign-off checklist

Use this for a fast pass before release. Expand any failure in the detailed scenarios below.

| # | Area | Pass | Fail |
| --- | --- | --- | --- |
| 1 | Habits tab loads (no route error) | ☐ | ☐ |
| 2 | Create binary daily habit | ☐ | ☐ |
| 3 | Create numeric habit with target | ☐ | ☐ |
| 4 | Frequency scheduling (due today only) | ☐ | ☐ |
| 5 | Binary complete + undo same day | ☐ | ☐ |
| 6 | Numeric +1 to target | ☐ | ☐ |
| 7 | Streak updates on list row | ☐ | ☐ |
| 8 | Tab summary `X/Y done` | ☐ | ☐ |
| 9 | Today section shows due habits | ☐ | ☐ |
| 10 | Today check-off syncs with Habits tab | ☐ | ☐ |
| 11 | Tap row → detail screen | ☐ | ☐ |
| 12 | Detail heatmap renders | ☐ | ☐ |
| 13 | Detail trend line renders | ☐ | ☐ |
| 14 | Detail streaks match list | ☐ | ☐ |
| 15 | Edit habit from detail | ☐ | ☐ |
| 16 | Delete habit from detail | ☐ | ☐ |
| 17 | Onboarding creates Habit (not task) | ☐ | ☐ |
| 18 | Global streak includes habit day | ☐ | ☐ |
| 19 | Logout clears habits; re-login loads fresh | ☐ | ☐ |
| 20 | iOS + Android smoke (one platform minimum) | ☐ | ☐ |

---

## Detailed test scenarios

### Test 1 — Add Habits to navbar

**Goal:** Confirm the Habits tab is reachable from the liquid tab bar.

**Steps:**

1. Open **Browse → Settings → Navigation → Add**.
2. Tap **Habits** and leave Navigation settings.
3. Tap the **Habits** tab on the bottom bar.

**Expected:**

- Habits appears on the tab bar.
- Screen loads without “screen does not exist” or red error screen.
- Standalone tab transition (not a browse-stack slide).

**How to verify:** Visual check; no Metro bundler error in dev console.

---

### Test 2 — Empty state

**Goal:** New account with no habits shows a safe empty UI.

**Precondition:** Account with zero habits (or delete all habits first).

**Steps:**

1. Open Habits tab.

**Expected:**

- Empty state message or list placeholder (no crash).
- FAB or add button visible to create first habit.

---

### Test 3 — Create binary daily habit

**Goal:** `POST /habits/` creates a habit that appears on today’s list.

**Steps:**

1. Habits tab → FAB / create.
2. Title: `Morning stretch`.
3. Tracking: **simple check-off** (binary).
4. Frequency: **Every day**.
5. Pick a colour; save.

**Expected:**

- Modal closes; habit appears on Habits tab list.
- Row shows title and streak **0** (or empty) before first completion.
- `GET /habits/today/` includes the habit (check network tab if debugging).

---

### Test 4 — Create numeric habit

**Goal:** Numeric tracking shows progress and +1 control.

**Steps:**

1. Create habit: `Drink water`.
2. Tracking: **numeric**; target **8**; unit `glasses`.
3. Frequency: **Every day**; save.

**Expected:**

- Row shows progress like `0/8 glasses`.
- **+1** button increments value each tap.
- At 8, row shows complete state (checkbox-style done or filled increment button).

---

### Test 5 — Frequency scheduling

**Goal:** Only habits **due today** appear on Habits tab and Today section.

**Steps:**

For each frequency below, create one habit and note whether it appears **today**:

| Frequency | Setup | Should appear today when |
| --- | --- | --- |
| Every day | — | Always |
| Weekdays | — | Monday–Friday |
| Weekends | — | Saturday–Sunday |
| Once a week | Pick a weekday | Today matches that weekday |
| X times per week | Target 3/week | Heuristic surfaces habit on enough days to hit weekly target |

**Expected:**

- Non-due habits are **hidden** from today list (not deleted).
- Changing device date (simulator) or waiting until the matching day shows/hides the habit correctly.
- Habits still exist via create flow after changing date (soft scheduling, not deletion).

**Known gap:** `custom` (pick any Mon–Sun combo) is supported on the API but **not** in the create/edit form yet — skip UI test for custom until the form ships.

---

### Test 6 — Binary complete and undo

**Goal:** `POST /habits/{id}/log/` toggles completion; undo restores state.

**Steps:**

1. On a binary daily habit, tap the **checkbox** to complete.
2. Tap the checkbox again to undo (same day).

**Expected:**

- Complete state toggles immediately (optimistic UI).
- Streak increments after first completion today.
- Undo on same day restores incomplete state and adjusts streak if that was the only completion driving it.
- Completing again does not duplicate `ActivityLog` rows for the same habit+day (check global streak sanity in Test 17).

---

### Test 7 — Numeric increment

**Goal:** Partial and full numeric progress behave correctly.

**Steps:**

1. On numeric habit with target 8, tap **+1** three times.
2. Continue until target reached.

**Expected:**

- Label shows `3/8`, then `8/8` at completion.
- Row not complete before target; complete at or above target.
- Further +1 taps ignored or disabled when already complete today.

---

### Test 8 — Streak across calendar days

**Goal:** Per-habit `currentStreak` and `longestStreak` follow schedule rules.

**Precondition:** Daily binary habit; complete today.

**Steps:**

1. Complete habit today; note `currentStreak` on row.
2. Advance simulator/device clock to **next calendar day** (or test next day manually).
3. Complete again on the scheduled day.
4. Skip a scheduled day without completing; check streak on the day after the miss.

**Expected:**

- Streak increments when completing on consecutive **scheduled** days.
- Missing a scheduled day resets `currentStreak` to 0 (or 1 after re-complete).
- `longestStreak` never decreases; reflects historical best.

---

### Test 9 — Tab summary header

**Goal:** `HabitTabSummaryHeader` reflects `GET /habits/today/` summary.

**Precondition:** At least two habits due today.

**Steps:**

1. Open Habits tab.
2. Complete one habit; leave one incomplete.

**Expected:**

- Header shows e.g. `Today` and `1/2 done` (or matching counts).
- If any habit has active streak > 0, `best streak Nd` appears.
- Header hidden when `scheduledCount` is 0.

---

### Test 10 — Today tab Habits section

**Goal:** Due-today habits render above tasks and stay in sync.

**Steps:**

1. Ensure at least one habit is due today.
2. Open **Today** tab.
3. Complete a habit from the Today section.
4. Switch to Habits tab (or refocus).

**Expected:**

- **Habits** grouped section appears above the task list.
- Header shows `Habits · X/Y` when summary available.
- Same habits as Habits tab (due today only).
- Completion on Today updates Habits tab without app restart.

**Empty case:** With no habits due today, the Habits section is **not rendered** (no empty header crash).

---

### Test 11 — Navigate to habit detail

**Goal:** Row tap opens per-habit analytics screen.

**Steps:**

1. On Habits tab, tap the **title/body** of a habit row (not the checkbox/+1).
2. Repeat from Today section habit row.

**Expected:**

- Navigates to `/(tabs)/habits/[habitId]`.
- Detail loads title, streak cards, and chart sections.
- Back returns to previous tab without crash.

---

### Test 12 — Detail heatmap

**Goal:** `GET /habits/{id}/stats/` heatmap renders from completion history.

**Precondition:** Habit with several completions over past weeks (log on multiple days or use test account with history).

**Steps:**

1. Open habit detail.
2. Scroll to **Consistency** section.

**Expected:**

- Grid renders for ~365 days.
- Completed days visually distinct from empty days.
- New habit with no history: grid renders without crash (mostly empty).

---

### Test 13 — Detail trend line

**Goal:** Rolling 7-day completion rate line displays over 30-day window.

**Steps:**

1. On same detail screen, view trend chart below heatmap.

**Expected:**

- SVG line chart visible (not blank/error).
- After missing scheduled days, rolling rate drops on subsequent points (sanity check over a few days of testing).

---

### Test 14 — Detail streak consistency

**Goal:** Detail streak cards match list row values.

**Steps:**

1. Note `currentStreak` and `longestStreak` on Habits tab row.
2. Open detail for same habit.

**Expected:**

- **Current streak** and **Longest streak** cards match list values (±0; refresh if just logged).

---

### Test 15 — Edit habit

**Goal:** `PATCH /habits/{id}/` updates habit from edit route.

**Steps:**

1. Habit detail → **Edit**.
2. Change title, colour, and frequency (e.g. daily → weekdays).
3. Save and return to detail.

**Expected:**

- Changes persist after save.
- List row reflects new title/colour on refocus.
- If frequency change makes habit not due today, it disappears from today list but remains in system.
- Stats refetch after edit (heatmap/trend still load).

---

### Test 16 — Delete habit

**Goal:** `DELETE /habits/{id}/` soft-deletes habit.

**Steps:**

1. Habit detail → **Delete**.
2. Confirm in alert.
3. Return to Habits tab and Today tab.

**Expected:**

- Alert asks for confirmation; cancel leaves habit intact.
- After delete, habit removed from all lists.
- Navigating back to old detail URL shows error or empty state (no ghost data).
- No crash on Habits or Today tab.

---

### Test 17 — Onboarding habit import

**Goal:** New users choosing **Build a habit** get a `Habit` row, not a recurring task.

**Steps:**

1. Fresh install or new test account.
2. Complete onboarding questionnaire.
3. Choose **Build a habit** path; enter goal title + frequency; finish sign-in.

**Expected:**

- One habit exists matching questionnaire title/frequency on Habits tab.
- **No** recurring task tagged `onboarding-habit` on Today.
- Questionnaire answers still saved on user profile preferences.

---

### Test 18 — Global gamification streak

**Goal:** Habit completion writes `ActivityLog` with `action_type='habit_completed'`.

**Precondition:** Account with **no task completions today**.

**Steps:**

1. Complete one habit today.
2. Open **Browse** progress / streak card (gamification summary).

**Expected:**

- Global daily streak reflects the habit completion day (≥ 1).
- Undoing habit completion same day removes streak contribution if no other activity that day.

---

### Test 19 — Session and persistence

**Goal:** Habits state respects auth lifecycle and survives restart.

**Steps:**

1. With habits loaded, **log out** from Settings.
2. Log back in as same user.
3. Force-close app; reopen.

**Expected:**

- Logout clears habits from Redux (no previous user’s habits flash).
- Re-login loads correct habits for that user.
- After restart, habits and today completions still match server data.

---

### Test 20 — Platform smoke

**Goal:** Core flows work on target platforms.

**iOS:**

- [ ] Habits tab dashboard overflow toolbar works.
- [ ] Create/edit modals respect safe area and header.
- [ ] Detail scroll + charts render in ScrollView.

**Android:**

- [ ] Habits tab header chip / navigation works.
- [ ] Switching to Habits tab does not stack duplicate entries.
- [ ] Checkbox and +1 tap targets are usable.

---

## Optional — Backend API smoke (curl / Postman)

Use when UI passes but you need to isolate backend behaviour. Replace `TOKEN` and `HABIT_ID`.

```bash
# Today's list + summary
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/habits/today/

# Create binary daily habit
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"API test","trackingType":"binary","frequencyType":"daily","color":"green"}' \
  http://localhost:8000/api/habits/

# Toggle log today
curl -X POST -H "Authorization: Bearer TOKEN" http://localhost:8000/api/habits/HABIT_ID/log/

# Stats (heatmap + trend)
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/habits/HABIT_ID/stats/
```

**Expected:** JSON uses camelCase fields; `stats` includes `heatmap.completedDates` and `trend.points[].rolling7DayRate` between 0 and 1.

---

## Phase 3 & 4 — skip until shipped

| Test | Phase | Status |
| --- | --- | --- |
| `first_habit_completion` achievement unlocks on first complete | 3 | Not implemented |
| Habits tab achievement / unlock feedback UI | 3 | Not implemented |
| Local notification at `reminder_time` when habit due | 4 | Not implemented |
| Delete habit cancels scheduled notification | 4 | Not implemented |
| Logout cancels all habit reminder notifications | 4 | Not implemented |

Re-run these sections when Phase 3/4 land; see [`habits-implementation.md`](../technical-design/habits/plan/habits-implementation.md) §12–13.

---

## Troubleshooting

| Symptom | Things to check |
| --- | --- |
| Habits tab missing | Navigation prefs — add Habits in Settings → Navigation |
| Empty today list but habit exists | Frequency may not be due today; check `frequencyType` |
| Streak wrong | User `preferences.timezone`; completion date is calendar day in that TZ |
| Detail charts blank | `GET /habits/{id}/stats/` response in network inspector |
| Today tab crash on load | Metro bundle — ensure `TodayHabitsSection` imports from `habits/today`, not detail charts |
| 401 on all habit calls | Auth token expired; re-login |

---

## Sign-off

| Role | Name | Date | Phases verified |
| --- | --- | --- | --- |
| Tester | | | Phase 1 + 2 |
| Reviewer | | | |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-07 | Initial manual testing guide for shipped Phase 1–2 habits MVP |
