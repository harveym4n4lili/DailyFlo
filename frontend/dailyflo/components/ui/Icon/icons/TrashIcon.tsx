/**
 * TrashIcon – trash can / delete icon (solid).
 */

import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

export type TrashIconProps = {
  size?: number;
  color?: string;
};

export function TrashIcon({ size = 20, color = '#000' }: TrashIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect width={20} height={20} fill="none" />
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 2a1 1 0 0 0-.894.553L7.382 4H4a1 1 0 0 0 0 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a1 1 0 1 0 0-2h-3.382l-.724-1.447A1 1 0 0 0 11 2zM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0zm5-1a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1z"
      />
    </Svg>
  );
}
