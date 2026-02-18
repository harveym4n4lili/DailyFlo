/**
 * ClockIcon – custom SVG icon (clock / time).
 * Paste your SVG below: copy viewBox into Svg, and each <path d="..."> into Path d prop.
 */

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export type ClockIconProps = {
  size?: number;
  color?: string;
  /** When true, render the solid variant (paste solid SVG path(s) in the solid block below). */
  isSolid?: boolean;
};

export function ClockIcon({ size = 24, color = '#000', isSolid = false }: ClockIconProps) {
  if (isSolid) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* ----- SOLID CLOCK SVG ----- */}
        <Rect width={24} height={24} fill="none" />
        <Path
          fill={color}
          stroke={color}
          strokeWidth={0.1}
          d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m3.5 12c-.3.5-.9.6-1.4.4l-2.6-1.5c-.3-.2-.5-.5-.5-.9V7c0-.6.4-1 1-1s1 .4 1 1v4.4l2.1 1.2c.5.3.6.9.4 1.4"
        />
        {/* ----- END SOLID SVG ----- */}
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M15 11h-2V7a1 1 0 0 0-2 0v5a1 1 0 0 0 1 1h3a1 1 0 0 0 0-2m-3-9a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2m0 18a8 8 0 1 1 8-8a8.01 8.01 0 0 1-8 8"
      />
    </Svg>
  );
}
