/**
 * CompletedTasksSFSymbolIcon – SF Symbol on iOS, CompletedTasksIcon SVG elsewhere.
 * use this anywhere the app shows a “completed tasks” glyph (display settings, activity log, bulk complete, etc.).
 */

import React from 'react';
import { ViewStyle } from 'react-native';

import { SFSymbolIcon } from './SFSymbolIcon';
import { CompletedTasksIcon, CompletedTasksIconProps } from './icons/CompletedTasksIcon';

/** ios SF Symbol closest to our outline completed-tasks SVG */
export const COMPLETED_TASKS_SF_SYMBOL = 'checkmark.circle';

export type CompletedTasksSFSymbolIconProps = CompletedTasksIconProps & {
  style?: ViewStyle;
};

export function CompletedTasksSFSymbolIcon({
  size = 18,
  color = '#000',
  style,
}: CompletedTasksSFSymbolIconProps) {
  return (
    <SFSymbolIcon
      name={COMPLETED_TASKS_SF_SYMBOL}
      size={size}
      color={color}
      style={style}
      fallback={<CompletedTasksIcon size={size} color={color} />}
    />
  );
}
