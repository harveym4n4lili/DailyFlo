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
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* ----- PASTE SOLID SVG PATH(S) BELOW ----- */}
        <Path d="M0 0" fill={color} />
        {/* ----- END PASTE SOLID ----- */}
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
