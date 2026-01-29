/**
 * CalendarIcon – custom SVG icon (calendar).
 * Paste your SVG below: copy viewBox into Svg, and each <path d="..."> into Path d prop.
 */

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export type CalendarIconProps = {
  size?: number;
  color?: string;
  /** When true, render the solid variant (paste solid SVG path(s) in the solid block below). */
  isSolid?: boolean;
};

export function CalendarIcon({ size = 24, color = '#000', isSolid = false }: CalendarIconProps) {
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
        d="M8 2v4"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 2v4"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        width={18}
        height={18}
        x={3}
        y={4}
        rx={2}
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M3 10h18"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
