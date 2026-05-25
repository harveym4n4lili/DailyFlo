/**
 * auth landing wordmark — matches app mark svg (clip + path + stems); no web filters.
 * main shape fill from `markColorToken` (`resolveIntroContinueButtonPaint`); stems (the tick) use `stemFill` or fall back to `background.primary()` so they match the screen wash behind the icon.
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

import { useThemeColors } from '@/hooks/useColorPalette';

import type { IntroContinueButtonColorToken } from '../constants/types';
import { resolveIntroContinueButtonPaint } from '../scrollTransition';

const MARK_PATH =
  'M10.25 22.25C8.18672 22.2562 6.19649 21.4832 4.674 20.0841C3.15151 18.6851 2.20796 16.7622 2.0305 14.6969C1.85304 12.6316 2.45462 10.5747 3.71594 8.93419C4.97726 7.29368 6.80618 6.18936 8.83996 5.84027C15.5375 4.54166 17.3 3.92777 19.65 1C20.825 3.36111 22 5.93471 22 10.4444C22 16.9375 16.3835 22.25 10.25 22.25Z';

export type AuthLandingWordmarkIconProps = {
  size: number;
  borderRadius: number;
  markColorToken: IntroContinueButtonColorToken;
  /** tick rects — omit to use theme primary background (`useThemeColors().background.primary`) */
  stemFill?: string;
};

export function AuthLandingWordmarkIcon({
  size,
  borderRadius,
  markColorToken,
  stemFill,
}: AuthLandingWordmarkIconProps) {
  const themeColors = useThemeColors();
  const markFill = useMemo(
    () => resolveIntroContinueButtonPaint(themeColors, markColorToken),
    [themeColors, markColorToken],
  );
  // when no override: same color as the main app background so the check “cuts out” visually against the mango mark
  const tickFill = stemFill ?? themeColors.background.primary();

  return (
    <View
      style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}
      accessibilityRole="image"
      accessibilityLabel="DailyFlo app icon"
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G>
          <Path d={MARK_PATH} fill={markFill} />
          <Rect
            x={11.5658}
            y={16.384}
            width={2.09739}
            height={5.24347}
            rx={1}
            fill={tickFill}
            transform="rotate(135, 11.5658, 16.384)"
          />
          <Rect
            width={2.09739}
            height={10.3273}
            rx={1}
            fill={tickFill}
            transform="matrix(0.707107, 0.707107, 0.707107, -0.707107, 8.83944, 16.4275)"
          />
        </G>
      </Svg>
    </View>
  );
}