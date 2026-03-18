/**
 * PencilIcon – pencil/edit icon.
 * Used in Browse screen for Manage Projects.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type PencilIconProps = {
  size?: number;
  color?: string;
};

export function PencilIcon({ size = 24, color = '#000' }: PencilIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
