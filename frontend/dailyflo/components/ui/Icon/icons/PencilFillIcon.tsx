/**
 * PencilFillIcon — solid pencil / edit mark (20×20 artboard).
 * Onboarding task-agenda title row only; elsewhere keep stroke `PencilIcon`.
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export type PencilFillIconProps = {
  size?: number;
  color?: string;
};

export function PencilFillIcon({ size = 20, color = '#000' }: PencilFillIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        fill={color}
        d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828zm-2.207 2.207L3 14.172V17h2.828l8.38-8.379z"
      />
    </Svg>
  );
}
