# Habits Feature — Manual Testing Guide

## Overview

Step-by-step manual test plan for the **Habits** feature. Use on a physical device or simulator to confirm **Phases 1, 1.5, 2, 3, and 4**.

**Companion docs:**

| Doc | Purpose |
| --- | --- |
| [`habits-implementation.md`](../technical-design/habits/plan/habits-implementation.md) | Full product + engineering plan |
| [`habits-manual-qa-checklist.md`](../technical-design/habits/plan/habits-manual-qa-checklist.md) | Short checkbox sign-off sheet |
| [`habits-verification-log.md`](habits-verification-log.md) | Static/code verification + device QA log |

**Code reference:**

| Area | Location |
| --- | --- |
| Routes | `frontend/dailyflo/app/(tabs)/habits/` |
| UI | `frontend/dailyflo/components/features/habits/` (`tab/`, `list/`, `detail/`, `forms/`, `today/`) |
| Redux + API | `frontend/dailyflo/store/slices/habits/`, `frontend/dailyflo/services/api/habits.ts` |
| Backend | `backend/dailyflo/apps/habits/` |
| Onboarding | `frontend/dailyflo/components/features/onboarding/auth/hooks/useCompleteOnboardingAndExit.ts` |
| Reminders (Phase 4) | `frontend/dailyflo/services/notifications/habitReminderScheduler.ts` |

---

## Phase coverage

| Phase | Scope | Quick checklist | Detailed tests |
| --- | --- | --- | --- |
| **1 — MVP** | CRUD, logging, streaks, Today section, onboarding, global streak | #1–10, #17–19 | Tests 1–10, 17–19 |
| **1.5 — Custom frequency** | Custom days picker on create/edit | #20 | Test 20 |
| **2 — Detail + graphs** | Detail route, heatmap, trend, edit, delete | #11–16 | Tests 11–16 |
| **3 — Gamification** | Tab summary, `first_habit_completion`, unlock banner | #7–8, #21–22 | Tests 9, 21–22 |
| **4 — Reminders** | Local notification at `reminderTime` when due today | #23–25 | Tests 23–25 |

**Out of scope for v1:** quit/sobriety habits, Planner integration, `linked_habit` goals, push notifications.

---

## Before you start

1. **Signed-in test account** with Django API reachable.
2. **Habits tab enabled:** Browse → Settings → Navigation → Add → **Habits**.
3. **Backend running** with habits migrations applied (`python manage.py migrate`).
4. **User timezone** set in profile preferences.
5. **Phase 4 only:** OS notification permission granted; `preferences.notifications.enabled` true.

### Test session record

| Field | Value |
| --- | --- |
| Tester | |
| Date | |
| Branch | |
| Device / OS | |
| Build | dev client / Expo Go / EAS |
| Backend | local / staging |
| User timezone | |

---

## Quick sign-off checklist

| # | Phase | Area | Pass | Fail |
| --- | --- | --- | --- | --- |
| 1 | 1 | Habits tab loads (no route error) | ☐ | ☐ |
| 2 | 1 | Create binary daily habit | ☐ | ☐ |
| 3 | 1 | Create numeric habit with target | ☐ | ☐ |
| 4 | 1 | Frequency scheduling (due today only) | ☐ | ☐ |
| 5 | 1 | Binary complete + undo same day | ☐ | ☐ |
| 6 | 1 | Numeric +1 to target | ☐ | ☐ |
| 7 | 1 | Streak updates on list row | ☐ | ☐ |
| 8 | 1 | Today section shows due habits | ☐ | ☐ |
| 9 | 1 | Today check-off syncs with Habits tab | ☐ | ☐ |
| 10 | 1 | Onboarding creates Habit (not task) | ☐ | ☐ |
| 11 | 2 | Tap row → detail screen | ☐ | ☐ |
| 12 | 2 | Detail heatmap renders | ☐ | ☐ |
| 13 | 2 | Detail trend line renders | ☐ | ☐ |
| 14 | 2 | Detail streaks match list | ☐ | ☐ |
| 15 | 2 | Edit habit from detail | ☐ | ☐ |
| 16 | 2 | Delete habit from detail | ☐ | ☐ |
| 17 | 1 | Global streak includes habit day | ☐ | ☐ |
| 18 | 1 | Logout / re-login / restart persistence | ☐ | ☐ |
| 19 | 1 | Platform smoke (iOS or Android) | ☐ | ☐ |
| 20 | 1.5 | Custom frequency — Tue + Thu only | ☐ | ☐ |
| 21 | 3 | Tab summary `X/Y done` + best streak | ☐ | ☐ |
| 22 | 3 | `first_habit_completion` + unlock banner | ☐ | ☐ |
| 23 | 4 | Reminder fires when due today | ☐ | ☐ |
| 24 | 4 | Complete habit cancels today's reminder | ☐ | ☐ |
| 25 | 4 | Delete / logout cancel pending reminders | ☐ | ☐ |

---

## Phase 1 — MVP (tracking + Today)

### Test 1 — Add Habits to navbar

1. Browse → Settings → Navigation → Add → **Habits**.
2. Tap **Habits** on the tab bar.

**Expected:** Tab appears; screen loads; standalone tab transition (not browse-stack slide).

---

### Test 2 — Empty state

**Precondition:** No habits on account.

**Expected:** Empty state copy; FAB visible; no crash.

---

### Test 3 — Create binary daily habit

1. FAB → create. Title `Morning stretch`; **Check off when done**; **Every day**; save.

**Expected:** Habit on today's list; streak 0 before first complete.

---

### Test 4 — Create numeric habit

1. Create `Drink water`; numeric; target **8**; unit `glasses`; daily; save.

**Expected:** Row shows `0/8 glasses`; +1 increments; complete at target.

---

### Test 5 — Frequency scheduling

Create one habit per type; verify only **due today** appear:

| Frequency | Due today when |
| --- | --- |
| Every day | Always |
| Weekdays | Mon–Fri |
| Weekends | Sat–Sun |
| Once a week | Today matches picked weekday |
| X times per week | Heuristic surfaces enough days (see plan §3.4) |

**Expected:** Non-due habits hidden (not deleted). Change simulator date to verify show/hide.

---

### Test 6 — Binary complete and undo

1. Tap checkbox to complete; tap again to undo.

**Expected:** Optimistic toggle; streak updates; undo restores same-day state.

---

### Test 7 — Numeric increment

1. Tap +1 until target on numeric habit.

**Expected:** Partial progress visible; complete at target; no further increments when done.

---

### Test 8 — Streak across calendar days

1. Complete daily habit today; advance clock to next scheduled day; complete again.
2. Skip a scheduled day; verify `currentStreak` resets; `longestStreak` preserved.

---

### Test 9 — Today tab Habits section

1. Open **Today** with habits due today.
2. Complete one from Today section; switch to Habits tab.

**Expected:** Section above tasks; `Habits · X/Y` header; syncs with Habits tab. Section hidden when none due.

---

### Test 10 — Onboarding habit import

1. New account → onboarding → **Build a habit** → finish sign-in.

**Expected:** One `Habit` on Habits tab; no `onboarding-habit` recurring task; questionnaire saved on profile.

---

### Test 17 — Global gamification streak

**Precondition:** No task completions today.

1. Complete one habit; open Browse progress card.

**Expected:** Global daily streak ≥ 1; undo same day removes contribution if no other activity.

---

### Test 18 — Session and persistence

1. Log out; log back in; force-close and reopen.

**Expected:** No cross-user flash; data matches server after restart.

---

### Test 19 — Platform smoke

**iOS:** FAB toolbar, create/edit safe area, detail scroll + charts.

**Android:** Header chip, tab `navigate` (no duplicate stacks), usable tap targets.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## Phase 1.5 — Custom frequency UI

### Test 20 — Custom days picker

1. Create habit → frequency **Custom days**.
2. Select **Tuesday** and **Thursday** only; save.
3. Open edit form — confirm days persisted.
4. Verify list on Tue/Thu vs other weekdays (change simulator date if needed).

**Expected:**

- [ ] Habit due only on selected weekdays.
- [ ] Edit form reloads same selected days.
- [ ] Alert if saving with zero days selected.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## Phase 2 — Detail + graphs

### Test 11 — Navigate to habit detail

1. Tap habit **title/body** (not checkbox/+1) on Habits tab and Today section.

**Expected:** Opens `/(tabs)/habits/[habitId]`; streak cards + charts load.

---

### Test 12 — Detail heatmap

**Precondition:** Habit with some completion history.

**Expected:** ~365-day grid; completed days distinct; empty grid OK for new habit.

---

### Test 13 — Detail trend line

**Expected:** 30-day rolling 7-day SVG line visible; rate drops after missed days (sanity check).

---

### Test 14 — Detail streak consistency

**Expected:** Current + longest on detail match list row.

---

### Test 15 — Edit habit

1. Detail → **Edit**; change title, colour, frequency; save.

**Expected:** Persists; list updates; stats refetch; non-due frequency hides from today list.

---

### Test 16 — Delete habit

1. Detail → **Delete** → confirm.

**Expected:** Removed from all lists; cancel in alert keeps habit; no ghost rows.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## Phase 3 — Gamification polish

### Test 21 — Tab summary header

**Precondition:** ≥2 habits due today.

1. Complete one; open Habits tab.

**Expected:**

- [ ] `Today` + `completedCount/scheduledCount` (e.g. `1/2 done`).
- [ ] `best streak Nd` when any habit has active streak > 0.
- [ ] Header hidden when `scheduledCount` is 0.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### Test 22 — `first_habit_completion` achievement

**Precondition:** Account that has never completed a habit.

1. Complete any habit (Habits tab or Today).
2. Observe unlock banner (title + haptic).
3. Browse → Productivity → Achievements.

**Expected:**

- [ ] **First habit** unlocked with checkmark seal.
- [ ] Persists after restart.
- [ ] Does not unlock task-only **First step** unless a task was also completed.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## Phase 4 — Local reminders

**Precondition:** Notification permission + `preferences.notifications.enabled` true.

### Test 23 — Reminder fires when due

1. Create **daily** habit due today with **Daily reminder** on; time ~2 minutes ahead.
2. Background app; wait.

**Expected:**

- [ ] Notification: `{title} — time for your habit`.
- [ ] `__DEV__` console shows `[notifications] habit reminder scheduled`.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### Test 24 — Complete cancels reminder

1. With reminder scheduled for later today, complete the habit.

**Expected:** No notification fires after completion (reminder cancelled on log).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### Test 25 — Delete and logout cancel reminders

1. Create habit with reminder; delete habit before fire time.
2. Create another; log out before fire time.

**Expected:**

- [ ] No notification after delete.
- [ ] No habit notifications after logout (new login does not inherit old schedules).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## Optional — Backend API smoke

```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/habits/today/
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"API test","trackingType":"binary","frequencyType":"daily","color":"green"}' \
  http://localhost:8000/api/habits/
curl -X POST -H "Authorization: Bearer TOKEN" http://localhost:8000/api/habits/HABIT_ID/log/
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/habits/HABIT_ID/stats/
```

**Expected:** camelCase JSON; today habits include `reminderTime`; stats include heatmap + trend.

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Habits tab missing | Settings → Navigation → add Habits |
| Empty today list | `frequencyType` may not be due today |
| Streak wrong | User `preferences.timezone` |
| Detail charts blank | `GET /habits/{id}/stats/` in network tab |
| Reminder not scheduled | Empty `reminderTime`, not due today, time passed, or permission denied |
| Reminder after complete | Should not fire — cancelled on `logHabitProgress` |

---

## Code verification (before device QA)

Record in [`habits-verification-log.md`](habits-verification-log.md).

| Phase | Check |
| --- | --- |
| 1 | Django habits app; CRUD/today/log endpoints; Redux slice; Today section |
| 1.5 | `HabitCustomDaysPicker` + `custom` in `HABIT_FREQUENCIES` |
| 2 | `HabitStatsView`; detail UI; edit/delete routes |
| 3 | `first_habit_completion` fixture; unlock banner in `(tabs)/_layout` |
| 4 | `habitReminderScheduler.ts`; `reminderTime` on today API; logout cancel |

---

## Sign-off

| Role | Name | Date | Phases verified |
| --- | --- | --- | --- |
| Tester | | | 1, 1.5, 2, 3, 4 |
| Reviewer | | | |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-07 | Initial guide (Phases 1–2) |
| 2026-06-07 | Full phase coverage matrix; renumbered tests; Phases 1.5, 3, 4 |
