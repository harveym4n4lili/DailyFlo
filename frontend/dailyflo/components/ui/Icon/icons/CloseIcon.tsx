/**
 * CloseIcon – custom SVG icon (close / X).
 * Paste your SVG below: copy viewBox into Svg, and each <path d="..."> into Path d prop.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type CloseIconProps = {
  size?: number;
  color?: string;
  /** When true, render the solid variant (paste solid SVG path(s) in the solid block below). */
  isSolid?: boolean;
};

export function CloseIcon({ size = 24, color = '#000', isSolid = false }: CloseIconProps) {
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
      {/* ----- PASTE YOUR SVG PATH(S) BELOW ----- */}
      <Path
        d="M0 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ----- END PASTE ----- */}
    </Svg>
  );
}
