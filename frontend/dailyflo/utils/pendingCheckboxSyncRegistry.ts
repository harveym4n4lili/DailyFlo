/**
 * Pending Checkbox Sync Registry
 *
 * Checkbox components delay backend sync (Redux dispatch) to batch rapid taps.
 * When the user switches tabs, we flush all pending syncs immediately so nothing is lost.
 *
 * Flow: TaskCardCheckbox/TimelineCheckbox register a pending sync when user taps.
 * On tab switch, useFocusEffect cleanup calls flushAllPendingSyncs() which runs all pending syncs.
 */

type PendingSync = () => void;

const pending: Set<PendingSync> = new Set();

/** register a pending sync - called when checkbox schedules a delayed dispatch */
export function registerPendingCheckboxSync(fn: PendingSync): void {
  pending.add(fn);
}

/** unregister when sync runs (from timeout or flush) - prevents double-execution */
export function unregisterPendingCheckboxSync(fn: PendingSync): void {
  pending.delete(fn);
}

/** run all pending syncs immediately - call when user switches tabs */
export function flushAllPendingCheckboxSyncs(): void {
  const toRun = [...pending];
  pending.clear();
  toRun.forEach((fn) => fn());
}
