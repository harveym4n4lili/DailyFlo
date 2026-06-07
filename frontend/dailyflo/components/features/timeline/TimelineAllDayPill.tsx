/**
 * Planner timeline / all-day segment pill — quick-add label chrome; iOS uses liquid glass via QuickAddLabelOnlyPill.
 */

import React from 'react';

import { QuickAddLabelOnlyPill } from '@/components/features/tasks/quickAdd/QuickAddLabelOnlyPill';

export type TimelineAllDayPillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function TimelineAllDayPill({ label, selected, onPress, accessibilityLabel }: TimelineAllDayPillProps) {
  return (
    <QuickAddLabelOnlyPill
      label={label}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      // selected segment = solid blend fill; other = outlined hairline (same as quick-add suggestion chips)
      variant={selected ? 'primarySecondaryBlend' : 'outlined'}
      useLiquidGlassOnIos
    />
  );
}

export default TimelineAllDayPill;
