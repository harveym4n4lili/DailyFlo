/**
 * SaveIcon – custom SVG icon (save / checkmark).
 * Paste your SVG below: copy viewBox into Svg, and each <path d="..."> into Path d prop.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type SaveIconProps = {
  size?: number;
  color?: string;
  /** When true, render the solid variant (paste solid SVG path(s) in the solid block below). */
  isSolid?: boolean;
};

export function SaveIcon({ size = 24, color = '#000', isSolid = false }: SaveIconProps) {
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
        fill={color}
        d="m17.71 11.29l-5-5a1 1 0 0 0-.33-.21a1 1 0 0 0-.76 0a1 1 0 0 0-.33.21l-5 5a1 1 0 0 0 1.42 1.42L11 9.41V17a1 1 0 0 0 2 0V9.41l3.29 3.3a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42"
      />
    </Svg>
  );
}
