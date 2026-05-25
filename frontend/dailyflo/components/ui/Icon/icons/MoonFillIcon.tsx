/**
 * Moon fill — sleep anchor rows.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type MoonFillIconProps = {
  size?: number;
  color?: string;
};

export function MoonFillIcon({ size = 20, color = 'currentColor' }: MoonFillIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" accessibilityLabel="Moon">
      <Path
        fill={color}
        d="M17.293 13.293A8 8 0 0 1 6.707 2.707a8.001 8.001 0 1 0 10.586 10.586"
      />
    </Svg>
  );
}
