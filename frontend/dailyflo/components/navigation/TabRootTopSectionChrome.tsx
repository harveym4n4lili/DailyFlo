/**
 * fixed blur + mini title row for main tab roots (inbox, today) — list scrolls underneath.
 * large screen title lives in the scroll view (ListCard bigTodayHeader) and fades on scroll.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AnimatedReanimated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';

/** toolbar row below safe area — matches topSectionRow height */
export const TAB_ROOT_TOP_SECTION_ROW_HEIGHT = 48;

/** blur anchor body below safe area (toolbar + fade tail) */
export const TAB_ROOT_TOP_SECTION_ANCHOR_HEIGHT = 64;

export type TabRootTopSectionChromeProps = {
  miniHeaderLabel: string;
  /** ui-thread opacity for the mini title — keep useAnimatedStyle inside this layer (not as a prop object) */
  miniHeaderOpacity: SharedValue<number>;
  /** left slot — close button or 44pt spacer */
  leftSlot?: React.ReactNode;
  /** right slot — select all, dashboard actions, etc. */
  rightSlot?: React.ReactNode;
};

export function TabRootTopSectionChrome({
  miniHeaderLabel,
  miniHeaderOpacity,
  leftSlot,
  rightSlot,
}: TabRootTopSectionChromeProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();

  // animated style must live on Animated.View here — passing the style object as a prop breaks in RN dev (react 19 prop diff)
  const miniHeaderStyle = useAnimatedStyle(() => ({
    opacity: miniHeaderOpacity.value,
  }));

  const screenWash = themeColors.background.primary();
  const topBlurGradientColors = themeColors.isDark
    ? [themeColors.withOpacity(screenWash, 0.55), themeColors.withOpacity(screenWash, 0)]
    : [screenWash, themeColors.withOpacity(screenWash, 0)];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        topSectionAnchor: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          overflow: 'hidden',
        },
        topSectionRow: {
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          height: TAB_ROOT_TOP_SECTION_ROW_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Paddings.screen,
        },
        topSectionCloseButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        miniHeader: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        },
        miniHeaderText: {
          ...typography.getTextStyle('heading-3'),
        },
      }),
    [insets.top, typography],
  );

  return (
    <View
      style={[styles.topSectionAnchor, { height: insets.top + TAB_ROOT_TOP_SECTION_ANCHOR_HEIGHT }]}
    >
      <BlurView
        tint={themeColors.isDark ? 'dark' : 'light'}
        intensity={1}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={topBlurGradientColors}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.topSectionRow} pointerEvents="box-none">
        {leftSlot ?? <View style={styles.topSectionCloseButton} pointerEvents="none" />}
        <AnimatedReanimated.View style={[styles.miniHeader, miniHeaderStyle]} pointerEvents="none">
          <Text style={[styles.miniHeaderText, { color: themeColors.text.primary() }]}>
            {miniHeaderLabel}
          </Text>
        </AnimatedReanimated.View>
        {rightSlot}
      </View>
    </View>
  );
}

/** full-width wash behind scroll content on tab roots */
export function TabRootScreenBackdrop() {
  const themeColors = useThemeColors();
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: themeColors.background.primary(), zIndex: -1 },
      ]}
      pointerEvents="none"
    />
  );
}
