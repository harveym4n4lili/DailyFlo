/**
 * ParagraphIcon – custom SVG icon (paragraph / text lines).
 * Solid variant: three horizontal lines (paragraph symbol).
 */

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export type ParagraphIconProps = {
  size?: number;
  color?: string;
  /** When true, render the solid variant. Default true for this icon. */
  isSolid?: boolean;
};

export function ParagraphIcon({ size = 24, color = '#000', isSolid = true }: ParagraphIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect width={24} height={24} fill="none" />
      <Path
        fill={color}
        strokeWidth={1}
        stroke={color}
        d="M3 8h18c.6 0 1-.4 1-1s-.4-1-1-1H3c-.6 0-1 .4-1 1s.4 1 1 1m10 8H3c-.6 0-1 .4-1 1s.4 1 1 1h10c.6 0 1-.4 1-1s-.4-1-1-1m8-5H3c-.6 0-1 .4-1 1s.4 1 1 1h18c.6 0 1-.4 1-1s-.4-1-1-1"
      />
    </Svg>
  );
}
