/**
 * liquid glass container for the browse progress board — same layering as planner
 * `PlannerContentGlassShell`. browse screen wash is `background.root()` (neutral 5);
 * this panel uses `background.primary()` for veil, tint, and android fill.
 */

import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';

import { useThemeColors } from '@/hooks/useColorPalette';
import {
  PROGRESS_BOARD_CARD_BORDER_RADIUS,
  PROGRESS_BOARD_GLASS_BORDER_WIDTH,
  PROGRESS_BOARD_GLASS_TINT_OPACITY,
  PROGRESS_BOARD_GLASS_VEIL_OPACITY,
} from './progressBoardUiTokens';

type ProgressBoardGlassShellProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ProgressBoardGlassShell({ children, style }: ProgressBoardGlassShellProps) {
  const themeColors = useThemeColors();
  const radius = PROGRESS_BOARD_CARD_BORDER_RADIUS;

  const cornerStyle = {
    borderRadius: radius,
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  };
  const innerCornerStyle = {
    borderRadius: Math.max(radius - PROGRESS_BOARD_GLASS_BORDER_WIDTH, 0),
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : null),
  };

  const glassVeil = themeColors.withOpacity(
    themeColors.background.primary(),
    PROGRESS_BOARD_GLASS_VEIL_OPACITY
  );
  const glassTint = themeColors.withOpacity(
    themeColors.background.primary(),
    PROGRESS_BOARD_GLASS_TINT_OPACITY
  );

  const inner = (
    <View style={[shellStyles.innerClip, innerCornerStyle]}>
      <View style={[shellStyles.veil, { backgroundColor: glassVeil }]} pointerEvents="none" />
      {children}
    </View>
  );

  return (
    <View
      style={[
        style,
        cornerStyle,
        shellStyles.outerBorder,
        { borderColor: themeColors.border.secondary() },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <GlassView
          style={[shellStyles.glass, innerCornerStyle]}
          glassEffectStyle="regular"
          tintColor={glassTint as any}
          isInteractive={false}
        >
          {inner}
        </GlassView>
      ) : (
        <View
          style={[
            shellStyles.glass,
            innerCornerStyle,
            { backgroundColor: themeColors.background.primary() },
          ]}
        >
          {inner}
        </View>
      )}
    </View>
  );
}

const shellStyles = StyleSheet.create({
  outerBorder: {
    borderWidth: PROGRESS_BOARD_GLASS_BORDER_WIDTH,
    overflow: 'visible',
  },
  glass: {
    overflow: 'visible',
  },
  innerClip: {
    position: 'relative',
    overflow: 'hidden',
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
  },
});
