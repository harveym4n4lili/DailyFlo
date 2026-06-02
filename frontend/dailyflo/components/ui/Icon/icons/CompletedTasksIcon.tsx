/**
 * CompletedTasksIcon – outline circle with checkmark (completed tasks).
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type CompletedTasksIconProps = {
  size?: number;
  color?: string;
};

export function CompletedTasksIcon({ size = 24, color = '#000' }: CompletedTasksIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </Svg>
  );
}
