/**
 * CirclePlusIcon – circle outline with a plus inside.
 */

import React from 'react';
import Svg, { Circle, Rect, G, Path } from 'react-native-svg';

export type CirclePlusIconProps = {
  size?: number;
  color?: string;
};

export function CirclePlusIcon({ size = 24, color = '#000' }: CirclePlusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width={24} height={24} fill="none" />
      <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}>
        <Circle cx={12} cy={12} r={10} />
        <Path d="M8 12h8m-4-4v8" />
      </G>
    </Svg>
  );
}
