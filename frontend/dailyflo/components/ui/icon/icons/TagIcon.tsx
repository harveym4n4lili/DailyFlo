/**
 * TagIcon – tag/label icon for categorizing items.
 * used in Browse screen for tags filter.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type TagIconProps = {
  size?: number;
  color?: string;
};

export function TagIcon({ size = 24, color = '#000' }: TagIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318a2.25 2.25 0 0 0 .659 1.59l8.25 8.25a2.25 2.25 0 0 0 3.182 0l4.318-4.318a2.25 2.25 0 0 0 0-3.182l-8.25-8.25A2.25 2.25 0 0 0 9.568 3Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6h.008v.008H6V6Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
