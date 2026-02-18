/**
 * BracketsIcon – left and right bracket shapes ( [ ] ).
 * Solid variant: stroked brackets.
 */

import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

export type BracketsIconProps = {
  size?: number;
  color?: string;
  /** When true, render the solid variant (brackets stroke). */
  isSolid?: boolean;
};

export function BracketsIcon({ size = 24, color = '#000', isSolid = false }: BracketsIconProps) {
  if (isSolid) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect width={24} height={24} fill="none" />
        <Path
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width={24} height={24} fill="none" />
      <Path
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
        d="M16 3h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3"
      />
    </Svg>
  );
}
