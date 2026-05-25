/**
 * ArrowLongRightIcon — heroicons outline long arrow (stroke). `stroke` follows `color` (e.g. continue FAB chevron).
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type ArrowLongRightIconProps = {
  size?: number;
  color?: string;
};

export function ArrowLongRightIcon({ size = 24, color = '#000' }: ArrowLongRightIconProps) {
  const stroke = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" {...stroke} />
    </Svg>
  );
}
