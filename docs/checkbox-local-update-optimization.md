# Preventing Backend Operations From Affecting UI Animations and State

This document explains how we prevent Redux/backend updates (e.g. when task 1's completion syncs) from interrupting or affecting the animations and display state of other tasks (e.g. task 2's checkbox tick, strikethrough, or layout).

## The Problem

When a user rapidly checks multiple tasks:

1. **Task 1** is checked → optimistic UI shows tick immediately → backend sync is delayed (1500ms via registry)
2. **Task 2** is checked → optimistic UI shows tick immediately → backend sync is delayed
3. **Task 1's backend sync completes** → Redux dispatches `updateTask` → entire store updates
4. **Parent re-renders** with new `tasks` array from Redux (Immer creates new object references)
5. **Task 2's TaskCard/TimelineItem re-renders** even though its data hasn't changed
6. **Result**: Task 2's checkbox animation stutters, strikethrough may reset, layout can jank

The root cause: when Redux updates, every task object gets a new reference. Components using reference equality (`prev.task !== next.task`) or no memoization re-render unnecessarily.

## The Solution

### 1. Value-based task comparison (`taskDisplayEquals`)

Instead of comparing tasks by reference, we compare by **display-relevant fields**:

- `utils/taskDisplayEquals.ts` – compares `id`, `title`, `isCompleted`, `color`, `icon`, `dueDate`, `time`, `duration`, `listId`, `routineType`, `softDeleted`
- Also compares `metadata.subtasks` (id + isCompleted) so the subtask counter updates when subtasks are completed

When task 1's backend completes, task 2's object is new but its content is unchanged. `taskDisplayEquals` returns `true` → we can skip re-render.

### 2. Memoized TaskCard with custom comparison

`TaskCard` uses `React.memo` with `taskCardPropsAreEqual`:

- Uses `taskDisplayEquals(prev.task, next.task)` instead of `prev.task !== next.task`
- When task 1's backend completes, task 2's memo returns "props equal" → no re-render
- Checkbox animations and strikethrough run uninterrupted

### 3. Memoized TimelineItem with custom comparison

`TimelineItem` uses `React.memo` with `timelineItemPropsAreEqual`:

- Compares `task` via `taskDisplayEquals`
- Compares layout props: `position`, `duration`, `pixelsPerMinute`, `startHour`, `isDraggedTask`, `overlapPosition`
- Callbacks are not compared (parent often passes inline functions) – we only avoid re-renders when task/layout data is unchanged

### 4. Subtask counter fix

When the whole task is checked, `metadata.subtasks` may not yet reflect completion. We use `displayCompleted` (optimistic state from the checkbox) to treat all subtasks as complete for the counter display:

```ts
completedSubtasksCount = displayCompleted ? subtasksCount : (task.metadata?.subtasks?.filter(st => st.isCompleted).length ?? 0);
```

## Flow Summary

| Step | What happens |
|------|--------------|
| User checks task 1 | Optimistic UI, tick + strikethrough animate, sync delayed |
| User checks task 2 | Same for task 2 |
| Task 1's sync fires (1500ms) | Redux updates, parent re-renders |
| Task 2's TaskCard | `taskDisplayEquals(prev.task, next.task)` → true → **skip re-render** |
| Task 2's TimelineItem | Same → **skip re-render** |
| Result | Task 2's animations and state remain unaffected |

## Key Files

- `utils/taskDisplayEquals.ts` – value-based task comparison
- `components/ui/card/TaskCard/TaskCard.tsx` – `taskCardPropsAreEqual` uses `taskDisplayEquals`
- `components/features/timeline/TimelineItem/TimelineItem.tsx` – `timelineItemPropsAreEqual` uses `taskDisplayEquals`
- `components/features/timeline/TimelineItem/TimelineItem.tsx` – subtask counter uses `displayCompleted`

## Related: Delayed backend sync

The checkbox uses a **pending sync registry** (`utils/pendingCheckboxSyncRegistry.ts`) to batch rapid taps and flush on tab switch. This reduces the number of Redux updates, but the memoization above ensures that when updates do occur, they don't affect sibling components.
