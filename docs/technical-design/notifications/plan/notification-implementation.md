# Notifications — implementation plan

**Purpose:** Define how DailyFlo delivers **local** task reminders on iOS/Android, starting with one mandatory v1 behavior: a timed task fires a notification whose body reads **`{Task name} scheduled in {x} mins`**.

**Audience:** Engineers working in `frontend/dailyflo` (Expo Router, Redux Toolkit, `expo-notifications`).

**Status:** Phase 1 shipped in code — local mandatory 15‑min task reminders; see §8 Phase 1 checklist.

**See also:**

- [`../../onboarding/onboarding-backlog-reconciliation.md`](../../onboarding/onboarding-backlog-reconciliation.md) — onboarding permission step (shipped)
- [`../../authentication/design/logout-implementation.md`](../../authentication/design/logout-implementation.md) — session teardown (must cancel pending notifications on logout)
- [`../../api/plan/tasks/tasks-api-integration.md`](../../api/plan/tasks/tasks-api-integration.md) — task CRUD thunks (integration hooks)
- [`../../../development-journals/decisions-log.md`](../../../development-journals/decisions-log.md) — **toasts removed**; use OS notifications + haptics for off-screen feedback

---

## 1. Product goal (v1)

### 1.1 What ships first

| Requirement | v1 behavior |
| --- | --- |
| **Reminder type** | **Task start reminder** — one local notification per eligible task occurrence |
| **Copy** | **`{taskTitle} scheduled in {x} mins`** — `x` = whole minutes from **notification fire time** until **task start** (see §4.3) |
| **Mandatory** | Every **timed** task (has `dueDate` + `time`) gets **at least one** reminder without the user opening the alert picker. Default offset: **15 minutes before start** (matches existing `15-min` alert option). |
| **Delivery** | **Local** — `expo-notifications` `scheduleNotificationAsync` on device |
| **Permission** | Respect OS permission + `user.preferences.notifications` (enabled / due-date reminders). No schedule attempt when denied. |

### 1.2 Out of scope for v1

- Expo **push** tokens, Django push sender, APNs/FCM server delivery
- “End of task” / `value: -1` alert option
- Multiple simultaneous offsets when user selects several alerts (v1 schedules **mandatory 15‑min-before only**; alert picker selections can expand in v1.1)
- Recurring task **series** rescheduling beyond the **next** occurrence (v1: one-shot schedule for the task’s current `dueDate` + `time`; recurrence resync in v1.1)
- In-app toast success messages (product decision: removed — see decisions log)
- Web notifications

---

## 2. Current codebase baseline

### 2.1 Already shipped

| Area | Location | Notes |
| --- | --- | --- |
| OS permission (onboarding) | `app/(onboarding)/notifications.tsx`, `useOnboardingNotificationPrompt` | Native prompt + profile PATCH |
| Bootstrap | `services/notifications/notificationsSetup.ts`, `app/_layout.tsx` | Foreground handler + Android channel `dailyflo-reminders` |
| Permission helpers | `services/notifications/requestNotificationPermission.ts` | `get` / `request` permission snapshot |
| Profile flags | `UserPreferences.notifications.*`, `patchUserNotificationPreferences` | `enabled`, `dueDateReminders`, etc. |
| Task alert UI | `ALERT_OPTIONS`, `app/alert-select/`, quick-add / task form bell pill | User picks alert ids (`start`, `end`, `15-min`) — **not wired to OS schedule today** |
| Task metadata | `Task.metadata.reminders[]`, `TaskReminder` in `types/common/Task.ts` | Backend JSON field; edit path writes placeholder `scheduledTime: new Date()` — **not used for scheduling yet** |
| Package | `expo-notifications` in `package.json`, plugin in `app.json` | Requires **dev client rebuild** after native changes |

### 2.2 Gaps (what v1 must add)

1. **Scheduler service** — compute fire `Date`, call `scheduleNotificationAsync`, store Expo notification id
2. **Reschedule / cancel** on task create, update, delete, complete
3. **Cold-start reconciliation** — re-register schedules for upcoming tasks (optional v1.1; document now, implement if time)
4. **Copy formatter** — `{title} scheduled in {x} mins`
5. **Default alert** — apply `15-min` when user did not pick alerts but task is timed
6. **Logout cleanup** — cancel all pending local notifications + clear local id map

---

## 3. Architecture (v1 — local only)

```text
┌─────────────────────────────────────────────────────────────┐
│  Task CRUD (Redux thunks)                                    │
│  createTask / updateTask / deleteTask / completeTask         │
└──────────────────────────┬──────────────────────────────────┘
                           │ fulfilled / optimistic path
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  taskReminderScheduler (NEW)                                 │
│  - reads Task + user notification prefs + OS permission      │
│  - cancels old expo ids for taskId                           │
│  - schedules next local notification                         │
│  - persists taskId → expoNotificationId map (AsyncStorage) │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  expo-notifications                                          │
│  scheduleNotificationAsync / cancelScheduledNotificationAsync│
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                     OS shows banner
              "{title} scheduled in {x} mins"
```

**Why local first:** Matches offline-first product direction; no backend work; reuses onboarding permission + channel setup.

**Why not Redux for notification ids:** Expo owns scheduled notification identifiers; persist a lightweight **side map** in AsyncStorage so cancel/reschedule does not require scanning all scheduled notifications.

---

## 4. Scheduling rules

### 4.1 Eligibility

Schedule **only when all** are true:

| Check | Source |
| --- | --- |
| Platform | `Platform.OS !== 'web'` |
| OS permission | `getNotificationPermissionSnapshot().outcome === 'granted'` |
| User prefs | `user.preferences.notifications.enabled` and `dueDateReminders` (default true) |
| Task state | `!task.isCompleted`, `!task.softDeleted` |
| Timed task | `task.dueDate` set **and** `task.time` set (`HH:MM`) |
| Fire time in future | `fireDate.getTime() > Date.now()` |

If any check fails → **cancel** any existing schedule for that `taskId` and exit (no throw).

### 4.2 Task start datetime

Combine `dueDate` (calendar day) + `time` (`HH:MM`) in **local timezone**:

```text
taskStart = localDateFrom(dueDate YYYY-MM-DD, time HH:MM)
```

Use the same date/time merging rules as planner / Today list (`recurrenceUtils`, task grouping) — **do not invent a third parser**. Extract or reuse a shared helper if one exists; otherwise add `getTaskLocalStartDate(task): Date | null` under `utils/` or `services/notifications/`.

### 4.3 Mandatory offset (v1)

| Rule | Value |
| --- | --- |
| Default alert id | `'15-min'` (`ALERT_OPTIONS` — 15 minutes before start) |
| Applied when | Task is timed **and** (`metadata.reminders` empty **or** user did not pick alerts in draft — treat empty as “use mandatory default”) |
| Fire time | `taskStart - 15 minutes` |

**Copy at fire time:**

```text
body = `${task.title} scheduled in ${x} mins`
```

Where:

```text
x = max(0, roundWholeMinutes(taskStart - now))
```

Examples:

| Task start | Notification fires | Body |
| --- | --- | --- |
| 9:00 | 8:45 | `Standup scheduled in 15 mins` |
| 9:00 | 9:00 (if offset = 0 / “start”) | `Standup scheduled in 0 mins` → prefer **`Standup starting now`** (v1 copy exception when `x === 0`) |
| 9:00 | 8:50 (custom offset later) | `Standup scheduled in 10 mins` |

**Title (system):** `DailyFlo` or omit (body-only is fine on iOS/Android).

### 4.4 Identifier & payload

Each scheduled notification includes **data** for debugging and future deep links:

```typescript
{
  type: 'task_reminder',
  taskId: string,
  alertId: '15-min',      // v1 constant
  taskStartIso: string,   // ISO instant of task start
}
```

**Expo `identifier`:** deterministic string so reschedule is idempotent:

```text
dailyflo-task-{taskId}-15-min
```

On reschedule: `cancelScheduledNotificationAsync(identifier)` then schedule with same identifier.

---

## 5. Persistence — notification id map

**Key:** `@DailyFlo:taskLocalNotificationIds` (JSON)

```typescript
type TaskLocalNotificationMap = {
  [taskId: string]: {
    [alertId: string]: string; // expo notification identifier (same as deterministic id in v1)
  };
};
```

**Write:** after successful `scheduleNotificationAsync`  
**Delete:** on cancel, task delete, complete, logout  
**Read:** before cancel to avoid orphaned OS schedules

---

## 6. Integration points

### 6.1 Redux thunks (primary)

Hook **after** API success in `store/slices/tasks/tasksSlice.ts`:

| Thunk | Action |
| --- | --- |
| `createTask.fulfilled` | `syncTaskReminders(createdTask)` |
| `updateTask.fulfilled` | `syncTaskReminders(updatedTask)` |
| `deleteTask.fulfilled` | `cancelTaskReminders(taskId)` |
| `updateTask` when `isCompleted: true` | `cancelTaskReminders(taskId)` |

Implementation options (pick one in PR):

- **A (recommended):** call scheduler from thunk `.fulfilled` listeners in the same file (keeps side effect next to CRUD)
- **B:** middleware `taskReminderMiddleware` listening for fulfilled actions (cleaner separation)

Avoid scheduling from UI components — single ownership in service layer.

### 6.2 Auth lifecycle

| Event | Action |
| --- | --- |
| `logoutUser.fulfilled` | `cancelAllTaskReminders()` + clear AsyncStorage map |
| `loginUser.fulfilled` / `checkAuthStatus.fulfilled` | **v1.1:** `rescheduleAllFromTasks(tasks)` after `fetchTasks` |
| Onboarding permission granted | no-op until tasks exist; next CRUD sync handles schedule |

### 6.3 App bootstrap (v1.1)

After `fetchTasks` on cold start, if permission granted:

```text
for each task in next 7 days with time → syncTaskReminders(task)
```

Guards against OS clearing schedules on reinstall (AsyncStorage map may be empty).

---

## 7. Proposed file layout

```text
frontend/dailyflo/
  services/notifications/
    notificationsSetup.ts              # exists — channel + foreground handler
    requestNotificationPermission.ts   # exists
    taskReminderScheduler.ts           # NEW — sync/cancel + schedule
    taskReminderCopy.ts                # NEW — "{title} scheduled in {x} mins"
    taskReminderStorage.ts             # NEW — AsyncStorage id map
    taskReminderEligibility.ts         # NEW — permission + prefs + task checks
    taskReminderDateMath.ts            # NEW — dueDate + time → Date, fire offset
  store/
    (optional) middleware/taskReminderMiddleware.ts
  types/
    notifications.ts                   # NEW — payload + map types (optional)
```

**Do not** add Django endpoints in v1.

---

## 8. Implementation phases

### Phase 0 — Prerequisites (done / verify)

- [x] `expo-notifications` installed + plugin in `app.json`
- [x] Dev client rebuilt with native module
- [x] Onboarding permission step + profile PATCH
- [x] Confirm `preferences.notifications.dueDateReminders` respected in scheduler

### Phase 1 — Mandatory 15‑minute reminder (MVP)

1. [x] **`taskReminderDateMath`** — `getTaskLocalStartDate`, `getReminderFireDate`
2. [x] **`taskReminderCopy`** — `formatTaskReminderBody(title, taskStart, now)`
3. [x] **`taskReminderStorage`** — read/write/clear map
4. [x] **`taskReminderScheduler`** — sync / cancel / cancelAll
5. [x] **Wire thunks** — create / update / delete / duplicate (complete cancels via eligibility)
6. [x] **Wire logout** — `logoutUser` path
7. [ ] **Manual QA** — create timed task 20+ min in future → notification at T−15

**Acceptance:**

- Timed task created → one local notification scheduled
- Task time changed → old notification cancelled, new one scheduled
- Task deleted or completed → notification cancelled
- Permission denied → no crash; silent skip
- Body matches **`{name} scheduled in {x} mins`** (or **`starting now`** when `x === 0`)

### Phase 1.1 — Alert picker parity

- Map each selected `ALERT_OPTIONS` id to offset minutes (`start` → 0, `15-min` → 15, skip `end` until designed)
- Schedule one notification per selected alert (unique identifier per alertId)
- Persist selections in `metadata.reminders` with real `scheduledTime` (fix placeholder `new Date()` in edit auto-save)

### Phase 1.2 — Cold-start resync

- After tasks fetch, reconcile schedules vs map
- Handle app reinstall (empty map, OS may still have stale ids — cancel-all then rebuild)

### Phase 2 — Recurring tasks

- On each occurrence completion or day rollover, schedule **next** occurrence only
- Coordinate with `routineType` + `recurrence_completions` / planner occurrence logic

### Phase 3 — Push (future)

- Register Expo push token → Django user profile
- Server sends remote notifications when app killed (optional complement to local)
- EAS push key already provisioned during iOS build

---

## 9. Platform notes

### iOS

- Permission from onboarding / Settings
- Foreground: `configureForegroundNotificationHandler` already shows banner
- **64** pending local notification limit — v1 well under cap

### Android

- Channel: `dailyflo-reminders` (exists)
- POST_NOTIFICATIONS granted at runtime (Android 13+)
- Pass `channelId: ANDROID_DEFAULT_CHANNEL_ID` in schedule content

### Expo API sketch (v1)

```typescript
await Notifications.scheduleNotificationAsync({
  identifier: `dailyflo-task-${task.id}-15-min`,
  content: {
    title: 'DailyFlo',
    body: formatTaskReminderBody(task.title, taskStart, fireDate),
    data: { type: 'task_reminder', taskId: task.id, alertId: '15-min', taskStartIso: taskStart.toISOString() },
    sound: true,
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: fireDate,
    channelId: ANDROID_DEFAULT_CHANNEL_ID, // android only
  },
});
```

(Exact trigger shape — match `expo-notifications` SDK 55 types at implementation time.)

---

## 10. Testing plan

### Manual (required for v1)

| # | Steps | Expected |
| --- | --- | --- |
| 1 | Grant notification permission | Permission granted |
| 2 | Create task today + time **in 20 min** | Notification at **T−15** with correct copy |
| 3 | Edit task time +30 min | Old cancelled; new fires at new T−15 |
| 4 | Complete task | No future notification |
| 5 | Delete task | No future notification |
| 6 | Deny permission in OS Settings | Create task → no crash, no schedule |
| 7 | Log out | All pending DailyFlo task notifications cancelled |

### Device tips

- Use a **physical device** or simulator with notifications enabled
- Shorten test window by creating task **16 min** ahead (fires in ~1 min)
- Xcode / Android Studio log: `expo-notifications` schedule errors

### Automated (later)

- Unit tests: `taskReminderDateMath`, `taskReminderCopy` (pure functions)
- Mock `expo-notifications` in scheduler tests

---

## 11. Open decisions

| # | Question | v1 recommendation |
| --- | --- | --- |
| 1 | All-day tasks (date, no `time`) | **No notification** in v1 |
| 2 | `x === 0` copy | **`{title} starting now`** instead of “0 mins” |
| 3 | Default offset if user picks `start` only | v1 ignores picker; **always 15‑min mandatory** until Phase 1.1 |
| 4 | Tap notification → navigation | v1: open app (default). v1.1: deep link to task detail via `taskId` in `data` |
| 5 | Quiet hours / sleep window | Defer — respect `wakeTime`/`sleepTime` in Phase 2 |
| 6 | Onboarding first task | Onboarding `createTask` should schedule like any other timed task |

---

## 12. Backlog alignment

After Phase 1 ships, update `docs/development-journals/back-log.md`:

- Add **✅ Completed:** Local task reminder scheduling (mandatory 15‑min)
- Add **Not Started:** Alert picker multi-offset scheduling (Phase 1.1)
- Add **Not Started:** Push token + server delivery (Phase 3)
- Archive or update onboarding notifications row (permission step done)

---

## 13. Changelog

| Date | Change |
| --- | --- |
| 2026-05 | Initial plan — v1 mandatory local task reminder, `{title} scheduled in {x} mins`, integration with existing alert metadata and expo-notifications bootstrap. |
