/**
 * AppIcon — DailyFlo app mark (single path + stem rects). web defs may use filters; omitted for `react-native-svg`.
 */

import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const MARK_PATH =
  'M10.25 22.25C8.18672 22.2562 6.19649 21.4832 4.674 20.0841C3.15151 18.6851 2.20796 16.7622 2.0305 14.6969C1.85304 12.6316 2.45462 10.5747 3.71594 8.93419C4.97726 7.29368 6.80618 6.18936 8.83996 5.84027C15.5375 4.54166 17.3 3.92777 19.65 1C20.825 3.36111 22 5.93471 22 10.4444C22 16.9375 16.3835 22.25 10.25 22.25Z';

export type AppIconProps = {
  size?: number;
  /** main blob */
  mangoFill?: string;
  /** stem rects */
  creamFill?: string;
};

export function AppIcon({
  size = 24,
  mangoFill = '#FAE3B2',
  creamFill = '#FFFFFF',
}: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={MARK_PATH} fill={mangoFill} />
      <Rect
        x={11.5658}
        y={16.384}
        width={2.09739}
        height={5.24347}
        rx={1}
        fill={creamFill}
        transform="rotate(135, 11.5658, 16.384)"
      />
      <Rect
        width={2.09739}
        height={10.3273}
        rx={1}
        fill={creamFill}
        transform="matrix(0.707107, 0.707107, 0.707107, -0.707107, 8.83944, 16.4275)"
      />
    </Svg>
  );
}
