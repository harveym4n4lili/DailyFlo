/**
 * check from the app mark (same rect geometry as `AuthLandingWordmarkIcon`) — drawn in a solid fill (e.g. marple) for inline use after the landing slogan.
 */

import React from 'react';
import Svg, { Rect } from 'react-native-svg';

export type AuthLandingSloganTickProps = {
  size: number;
  fill: string;
};

export function AuthLandingSloganTick({ size, fill }: AuthLandingSloganTickProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityRole="image"
      accessibilityLabel="checkmark"
    >
      <Rect
        x={11.5658}
        y={16.384}
        width={2.09739}
        height={5.24347}
        rx={1}
        fill={fill}
        transform="rotate(135, 11.5658, 16.384)"
      />
      <Rect
        width={2.09739}
        height={10.3273}
        rx={1}
        fill={fill}
        transform="matrix(0.707107, 0.707107, 0.707107, -0.707107, 8.83944, 16.4275)"
      />
    </Svg>
  );
}
