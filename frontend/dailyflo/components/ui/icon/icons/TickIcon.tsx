/**
 * TickIcon – checkmark icon for checkboxes.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type TickIconProps = {
  size?: number;
  color?: string;
};

export function TickIcon({ size = 24, color = '#000' }: TickIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        stroke={color}
        strokeWidth={0.5}
        d="M18.71 7.21a1 1 0 0 0-1.42 0l-7.45 7.46l-3.13-3.14A1 1 0 1 0 5.29 13l3.84 3.84a1 1 0 0 0 1.42 0l8.16-8.16a1 1 0 0 0 0-1.47"
      />
    </Svg>
  );
}
