/**
 * BellIcon – custom SVG icon (bell / notifications).
 * Paste your SVG below: copy viewBox into Svg, and each <path d="..."> into Path d prop.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type BellIconProps = {
  size?: number;
  color?: string;
  /** When true, render the solid variant (paste solid SVG path(s) in the solid block below). */
  isSolid?: boolean;
};

export function BellIcon({ size = 24, color = '#000', isSolid = false }: BellIconProps) {
  if (isSolid) {
    return (
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path
          fill={color}
          fillRule="evenodd"
          strokeWidth={0}
          stroke={color}
          d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6m0 16a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.268 21a2 2 0 0 0 3.464 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
