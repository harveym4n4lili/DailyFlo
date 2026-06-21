/**
 * Pending habit increment sync registry — batches rapid ring taps before API calls.
 * Mirrors pendingCheckboxSyncRegistry: flush when leaving a tab so logs are not lost.
 */

type PendingHabitSync = () => void;

const pending = new Set<PendingHabitSync>();

export function registerPendingHabitIncrementSync(fn: PendingHabitSync): void {
  pending.add(fn);
}

export function unregisterPendingHabitIncrementSync(fn: PendingHabitSync): void {
  pending.delete(fn);
}

export function flushAllPendingHabitIncrementSyncs(): void {
  const toRun = [...pending];
  pending.clear();
  toRun.forEach((fn) => fn());
}
