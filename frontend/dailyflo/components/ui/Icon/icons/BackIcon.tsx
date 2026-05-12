/**
 * BackIcon — lucide-style arrow-left (stroke). Used for onboarding header back affordance.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type BackIconProps = {
  size?: number;
  color?: string;
};

export function BackIcon({ size = 24, color = '#000' }: BackIconProps) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m12 19-7-7 7-7" {...stroke} />
      <Path d="M19 12H5" {...stroke} />
    </Svg>
  );
}
