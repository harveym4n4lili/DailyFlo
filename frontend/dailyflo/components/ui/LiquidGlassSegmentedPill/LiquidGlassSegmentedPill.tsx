/**
 * ios: GlassView capsule + pressable segments (liquid glass).
 * android: solid primary shell, same segment layout.
 */

import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';

import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';

export type LiquidGlassSegmentOption<T extends string> = {
  value: T;
  label: string;
  accessibilityLabel?: string;
};

export type LiquidGlassSegmentedPillProps<T extends string> = {
  options: readonly LiquidGlassSegmentOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
};

export function LiquidGlassSegmentedPill<T extends string>({
  options,
  value,
  onValueChange,
}: LiquidGlassSegmentedPillProps<T>) {
  const themeColors = useThemeColors();
  const useGlass = Platform.OS === 'ios';
  const glassTint = themeColors.background.primary();

  const segments = (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segmentTap}
            onPress={() => onValueChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
          >
            <View style={styles.segmentInner}>
              <Text
                style={[
                  styles.segmentLabel,
                  getTextStyle('body-large'),
                  {
                    color: selected ? themeColors.text.primary() : themeColors.text.secondary(),
                  },
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  if (useGlass) {
    return (
      <View style={styles.bleedSlot}>
        <GlassView
          style={styles.glassShell}
          glassEffectStyle="clear"
          tintColor={glassTint as any}
          isInteractive={false}
        >
          {segments}
        </GlassView>
      </View>
    );
  }

  return (
    <View style={[styles.androidShell, { backgroundColor: themeColors.background.primary() }]}>
      {segments}
    </View>
  );
}

const SEGMENT_INSET = 4;

const styles = StyleSheet.create({
  bleedSlot: {
    margin: -Paddings.liquidGlassBleed,
    padding: Paddings.liquidGlassBleed,
    alignSelf: 'stretch',
    overflow: 'visible',
  },
  glassShell: {
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  androidShell: {
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SEGMENT_INSET,
    gap: SEGMENT_INSET,
    backgroundColor: 'transparent',
  },
  segmentTap: {
    flex: 1,
    minWidth: 0,
  },
  segmentInner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Paddings.formDataPillRadius - SEGMENT_INSET,
    paddingVertical: Paddings.formDataPillVertical - 2,
    paddingHorizontal: Paddings.formDataPillHorizontal - 2,
    backgroundColor: 'transparent',
  },
  segmentLabel: {
    textAlign: 'center',
  },
});
