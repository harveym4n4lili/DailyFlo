/**
 * RepeatIcon – custom SVG icon (repeat / recurring).
 * Used for repeating tasks in the task creation form.
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export type RepeatIconProps = {
  size?: number;
  color?: string;
  style?: ViewStyle;
};

export function RepeatIcon({ size = 20, color = '#000', style }: RepeatIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style}>
      <Rect width={20} height={20} fill="none" />
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        strokeWidth={0}
        stroke={color}
        d="M4 2a1 1 0 0 1 1 1v2.101a7.002 7.002 0 0 1 11.601 2.566a1 1 0 1 1-1.885.666A5.002 5.002 0 0 0 5.999 7H9a1 1 0 0 1 0 2H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1m.008 9.057a1 1 0 0 1 1.276.61A5.002 5.002 0 0 0 14.001 13H11a1 1 0 1 1 0-2h5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-2.101a7.002 7.002 0 0 1-11.601-2.565a1 1 0 0 1 .61-1.277"
      />
    </Svg>
  );
}
