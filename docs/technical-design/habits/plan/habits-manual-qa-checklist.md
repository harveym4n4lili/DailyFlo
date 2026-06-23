# Habits — manual QA checklist

**Purpose:** Short checkbox sign-off for habits QA across **Phases 1, 1.5, 2, 3, and 4**.

**Full guide:** [`docs/testing/habits-manual-testing.md`](../../../testing/habits-manual-testing.md) — step-by-step scenarios, troubleshooting, API smoke.

**Verification log:** [`docs/testing/habits-verification-log.md`](../../../testing/habits-verification-log.md) — static checks + device QA record.

**Plan:** [`habits-implementation.md`](habits-implementation.md)

---

## Phase coverage

| Phase | Sections below | Exit criteria |
| --- | --- | --- |
| **1 — MVP** | §1–4, §6, §7a | Create, log, streaks, Today section, onboarding, global streak |
| **1.5 — Custom frequency** | §2c | Custom days picker; due only on selected weekdays |
| **2 — Detail + graphs** | §5 | Heatmap, trend, edit, delete from detail |
| **3 — Gamification** | §7b–7d | Tab summary, `first_habit_completion`, unlock banner |
| **4 — Reminders** | §8 | Local notification at `reminderTime` when due today |
| **5 — Detail pickers + save** | §10 | Root formSheet, stack pickers, Save vs auto-save |

---

## Before you start

| Requirement | Notes |
| --- | --- |
| **Signed in** | Habits tab via **Browse → Settings → Navigation → Add → Habits** |
| **Backend running** | Django API reachable; migrations applied |
| **User timezone** | Streaks / “today” use `preferences.timezone` |
| **Notifications (Phase 4)** | OS permission granted; `preferences.notifications.enabled` true |

**Not in v1:** quit habits, Planner integration, `linked_habit` goals, achievements beyond `first_habit_completion`.

---

## Test session

| Field | Value |
| --- | --- |
| Tester | |
| Date | |
| Branch | |
| Device / OS | |
| Build | |
| Test account | |
| Backend | |
| User timezone | |

---

## Phase 1 — MVP

### §1 Habits tab — navbar access

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 1a | Habits on tab bar; no route error; standalone transition | ☐ | ☐ |
| 1b | Empty state + FAB (no habits account) | ☐ | ☐ |

### §2 Create habits

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 2a | Binary daily habit on today's list | ☐ | ☐ |
| 2b | Numeric habit: progress + +1 to target | ☐ | ☐ |
| 2d | Weekly / weekdays / weekends / X per week — due today only | ☐ | ☐ |

### §3 Check-off and streaks

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 3a | Binary complete + undo; streak updates | ☐ | ☐ |
| 3b | Numeric +1 to target | ☐ | ☐ |
| 3c | Streak across days; miss resets current, longest preserved | ☐ | ☐ |

### §4 Today tab — Habits section

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 4a | Section above tasks; syncs with Habits tab | ☐ | ☐ |
| 4b | Section hidden when none due today | ☐ | ☐ |

### §6 Onboarding import

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 6 | Build a habit → `Habit` row; no onboarding recurring task | ☐ | ☐ |

### §7a Global streak (Phase 1)

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 7a | Habit complete day counts toward Browse progress streak | ☐ | ☐ |

---

## Phase 1.5 — Custom frequency UI

### §2c Custom days

1. Create habit → **Custom days** → select Tue + Thu → save.

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 2c | Due only on selected weekdays; edit form persists days | ☐ | ☐ |

---

## Phase 2 — Detail + graphs

**Entry:** Tap habit row body → detail screen.

### §5 Habit detail

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 5a | Heatmap ~365 days; no crash on sparse data | ☐ | ☐ |
| 5b | 30-day rolling 7-day trend line | ☐ | ☐ |
| 5c | Detail streaks match list row | ☐ | ☐ |
| 5d | Edit from detail — PATCH persists | ☐ | ☐ |
| 5e | Delete from detail — confirm; removed from lists | ☐ | ☐ |

---

## Phase 3 — Gamification polish

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 7b | Tab header `completedCount/scheduledCount` + best streak | ☐ | ☐ |
| 7c | **First habit** achievement unlocked on first complete | ☐ | ☐ |
| 7d | Unlock banner + haptic on first complete; persists after restart | ☐ | ☐ |

---

## Phase 4 — Local reminders

**Precondition:** OS notification permission + notifications enabled in profile.

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 8a | Reminder fires at `reminderTime` when habit due today | ☐ | ☐ |
| 8b | Completing habit today cancels pending reminder | ☐ | ☐ |
| 8c | Delete habit + logout cancel reminders (no orphan fires) | ☐ | ☐ |

---

## §10 Phase 5 — Detail pickers + task-style save

**Entry:** Tap habit card → root formSheet `/habit/[habitId]`.

| # | Check | Pass | Fail |
| --- | --- | --- | --- |
| 10a | Detail visible behind picker sheets (not blank) | ☐ | ☐ |
| 10b | Completion Count + Frequency + Reminder → auto-save | ☐ | ☐ |
| 10c | Color picker → auto-save (no Save for color alone) | ☐ | ☐ |
| 10d | Title / description → Save only | ☐ | ☐ |
| 10e | List row → list-select (draft label; no API PATCH yet) | ☐ | ☐ |
| 10f | Tab create + tab edit (reminder not wiped) | ☐ | ☐ |
| 10g | Today increment + delete from overflow | ☐ | ☐ |

---

## §9 Platform-specific

| Platform | Check | Pass | Fail |
| --- | --- | --- | --- |
| iOS | Dashboard toolbar; detail safe area + scroll | ☐ | ☐ |
| Android | Header chip; tab navigate (no duplicate stacks) | ☐ | ☐ |

---

## Sign-off

| Role | Name | Date | Phases tested |
| --- | --- | --- | --- |
| Tester | | | 1, 1.5, 2, 3, 4, 5 |
| Reviewer | | | |

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-07 | Initial draft |
| 2026-06-07 | Link to full testing guide |
| 2026-06-07 | Phase coverage table; §5d/5e edit-delete; §7d banner; §8a–8c reminders; Phase 1.5 §2c |
| 2026-06-22 | §10 Phase 5 detail pickers + task-style save |
