# Notifications — manual QA checklist

**Purpose:** Step-by-step device checklist for Phase 1 local reminders before merging `feat/push-notifications`.

**Audience:** Anyone testing on iOS or Android.

**See also:** [`notification-implementation.md`](notification-implementation.md) — architecture, scheduling rules, and phase status.

---

## Before you start

| Requirement | Notes |
| --- | --- |
| **Dev client build** | Use a **development build** with `expo-notifications` native module — **not Expo Go** |
| **Signed in** | Log in with a test account that has wake/sleep times set in Settings |
| **OS permission** | Notifications **allowed** for DailyFlo (Settings → DailyFlo → Notifications) |
| **Profile prefs** | `preferences.notifications.enabled` and `dueDateReminders` on (default) |
| **Platform** | Physical device preferred; simulator OK if notifications are enabled |

**Quick timing tip:** Create a timed task **16–20 minutes** ahead to verify the default 15‑min alert in ~1 minute instead of waiting 15 minutes.

**Dev logs (optional):** In `__DEV__`, watch Metro for `[notifications] reminder scheduled` / `reminder skipped`.

---

## Test session

| Field | Value |
| --- | --- |
| Tester | |
| Date | |
| Branch | `feat/push-notifications` |
| Device | |
| OS version | |
| Build | dev client / EAS preview |

---

## 1. Timed task — default 15‑min reminder

**Goal:** New timed tasks get the mandatory 15‑minute-before alert with correct copy.

### Steps

1. Open Today or Planner and create a task **for today** with a time **~16–20 minutes** from now.
2. Do **not** change alerts — leave the default (15 min before).
3. Wait until the notification fires (~1 min if you used 16 min ahead).

### Expected

- [ ] One OS notification appears.
- [ ] Title: **DailyFlo**
- [ ] Body matches **`{Task name} scheduled in 15 mins`** (or **`{Task name} starting now`** if offset is 0).
- [ ] No app crash; task saves normally.

### Result

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 2. Custom alert offsets

**Goal:** User-selected alerts (e.g. 5 min, 10 min, start) schedule and fire with correct copy.

### Steps

1. Create or edit a timed task **~10–15 minutes** ahead.
2. Open **Alerts** → remove default if needed → **Add Alert** → pick **5 minutes before** (or another custom offset).
3. Save the task.
4. Wait for the notification at **T−5** (or your chosen offset).

### Expected

- [ ] Notification fires at the chosen offset (not only 15 min unless that alert is also selected).
- [ ] Body reflects minutes until start (e.g. **`Standup scheduled in 5 mins`**).
- [ ] Multiple selected alerts → one notification per offset (each at its own fire time).

### Result

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 3. Edit / complete / delete — cancel and reschedule

**Goal:** Changing or removing a task updates pending OS notifications.

### 3a — Edit time (reschedule)

1. Use the task from test **1** or create another timed task ~25 min ahead (default 15‑min alert).
2. Edit the task time to **+30 minutes** later.
3. Save.

**Expected**

- [ ] Old notification no longer fires at the original time.
- [ ] New notification scheduled for **new time − 15 min** (or your saved alerts).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 3b — Complete task (cancel)

1. Complete the timed task before its notification fires.

**Expected**

- [ ] No future notification for that task.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 3c — Delete task (cancel)

1. Create a timed task ~20 min ahead.
2. Delete it before the notification fires.

**Expected**

- [ ] No notification fires for the deleted task.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 4. Recurring — complete today → next occurrence schedules

**Goal:** After completing one occurrence, reminders target the **next** eligible day.

### Steps

1. Create a **daily** recurring task with a time **later today** (or tomorrow if easier).
2. Confirm a reminder is scheduled (dev log or wait for fire).
3. Mark **today’s occurrence** complete (Today or Planner — use the occurrence row, not “complete whole series” if prompted).
4. Pull to refresh or background/foreground the app (or edit any task) to trigger resync.
5. Optionally check tomorrow’s occurrence still has a pending reminder (dev log or wait).

### Expected

- [ ] Completing today does **not** leave a reminder for the completed occurrence.
- [ ] Next eligible occurrence gets a scheduled reminder (next day for daily).
- [ ] Tapping a recurring notification opens task edit with the correct **`occurrenceDate`** when applicable.

### Result

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 5. Wind Down — “Wind Down scheduled in 5 min”

**Goal:** Sleep anchor fires 5 minutes before the user’s sleep time.

### Steps

1. Settings → **Sleep** → set sleep time to **~6–8 minutes** from now (5‑min spinner steps).
2. Save schedule (triggers wind-down resync).
3. Background the app or lock the device.
4. Wait for the wind-down notification (~5 min before sleep time).

### Expected

- [ ] Notification body: **`Wind Down scheduled in 5 min`** (singular **min**, capital **D** in Wind Down).
- [ ] Fires **5 minutes before** the sleep time you set.
- [ ] Changing sleep time reschedules (optional retest: move sleep +10 min, confirm new fire time).

### Result

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 6. Tap notification → task edit or planner

**Goal:** Tapping a banner deep-links into the app.

### 6a — Task reminder

1. When a **task** notification appears, tap it (app killed or backgrounded).

**Expected**

- [ ] App opens to **`/task/[taskId]`** (task edit screen).
- [ ] Correct task is shown.
- [ ] Recurring task: correct occurrence context when `occurrenceDate` was scheduled.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 6b — Wind Down reminder

1. When a **Wind Down** notification appears, tap it.

**Expected**

- [ ] App opens to the **Planner** tab.

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

### 6c — Cold start (optional)

1. Force-quit the app.
2. Tap a recent task notification from the notification centre.

**Expected**

- [ ] App cold-starts and navigates to the task (not only the home screen).

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## 7. Logout — all reminders cleared

**Goal:** Pending DailyFlo notifications are cancelled on sign-out.

### Steps

1. Ensure at least one future task reminder and/or wind-down reminder is scheduled.
2. Browse → Settings → **Log out**.
3. Wait past any previously scheduled fire times (or inspect pending notifications in OS settings if available).

### Expected

- [ ] No DailyFlo task or wind-down notifications fire after logout for the previous user’s schedule.
- [ ] Logout completes without crash.

### Result

| Pass | Fail | Notes |
| --- | --- | --- |
| ☐ | ☐ | |

---

## Extra checks (recommended)

| # | Steps | Expected | Pass |
| --- | --- | --- | --- |
| A | Deny notification permission in OS Settings → create timed task | No crash; silent skip (no schedule) | ☐ |
| B | Create task with **date only** (no time) | No notification | ☐ |
| C | Create task with **Alerts** cleared (empty) | No notification | ☐ |
| D | Re-open app after overnight (recurring daily task) | Next day’s occurrence scheduled after fetch / foreground | ☐ |

---

## Sign-off

| Section | Pass | Fail | Blocker notes |
| --- | --- | --- | --- |
| 1. Default 15‑min | ☐ | ☐ | |
| 2. Custom offsets | ☐ | ☐ | |
| 3. Edit / complete / delete | ☐ | ☐ | |
| 4. Recurring | ☐ | ☐ | |
| 5. Wind Down | ☐ | ☐ | |
| 6. Tap to open | ☐ | ☐ | |
| 7. Logout | ☐ | ☐ | |

**Overall:** ☐ Ready to merge &nbsp;&nbsp; ☐ Blocked — issues logged below

**Issues / follow-ups:**

```
(write any failures, device-specific quirks, or tickets here)
```

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-05-23 | Initial checklist — Phase 1 step 7 manual QA for dev client (timed, alerts, CRUD, recurring, wind-down, tap, logout). |
