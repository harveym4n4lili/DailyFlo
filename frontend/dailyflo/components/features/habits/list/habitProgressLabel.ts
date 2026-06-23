/**
 * shared copy for habit increment rows — "Today's progress" vs "Completions" on past/future days.
 * use resolveHabitProgressLabelVariant() so cards, detail, and list rows stay in sync.
 */

export type HabitProgressLabelVariant = 'today' | 'completions' | 'progress';

const LABEL_PREFIX: Record<HabitProgressLabelVariant, string> = {
  today: "Today's progress: ",
  completions: 'Completions: ',
  progress: 'Progress: ',
};

const LABEL_PHRASE: Record<HabitProgressLabelVariant, string> = {
  today: "Today's progress",
  completions: 'Completions',
  progress: 'Progress',
};

/** pick label variant from card/list context */
export function resolveHabitProgressLabelVariant(options: {
  /** live increment ring — today and due on the viewed day */
  isTodayInteractive?: boolean;
  /** planner/today segment when the calendar day is not today */
  isHistoricalDay?: boolean;
}): HabitProgressLabelVariant {
  if (options.isTodayInteractive) return 'today';
  if (options.isHistoricalDay) return 'completions';
  return 'progress';
}

export function getHabitProgressLabelPrefix(variant: HabitProgressLabelVariant): string {
  return LABEL_PREFIX[variant];
}

export function getHabitProgressLabelPhrase(variant: HabitProgressLabelVariant): string {
  return LABEL_PHRASE[variant];
}

/** voiceover / ring tap — "Today's progress 1 of 3. Tap to add one." */
export function formatHabitProgressAccessibilityLabel(
  variant: HabitProgressLabelVariant,
  current: number,
  target: number,
  action?: 'tap-reset' | 'tap-add',
): string {
  const core = `${getHabitProgressLabelPhrase(variant)} ${current} of ${target}`;
  if (action === 'tap-reset') return `${core}. Tap to reset.`;
  if (action === 'tap-add') return `${core}. Tap to add one.`;
  return core;
}

/** single-line subtitle — HabitListItem uses one text color */
export function formatHabitProgressInlineLabel(
  variant: HabitProgressLabelVariant,
  scoreLabel: string,
): string {
  return `${getHabitProgressLabelPrefix(variant)}${scoreLabel}`;
}
