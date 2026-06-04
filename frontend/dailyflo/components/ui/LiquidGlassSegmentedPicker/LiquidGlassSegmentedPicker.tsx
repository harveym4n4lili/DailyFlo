/**
 * android — doc uses Jetpack Compose segmented Picker (no glass). expo-ui 55 exposes SegmentedButton instead;
 * pressable pill fallback until compose Picker matches the reference doc.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';
import type { LiquidGlassSegmentedPickerProps } from './liquidGlassSegmentedPickerTypes';

const SEGMENT_INSET = 4;

export function LiquidGlassSegmentedPicker<T extends string>({
  options,
  value,
  onValueChange,
}: LiquidGlassSegmentedPickerProps<T>) {
  const themeColors = useThemeColors();

  return (
    <View style={[styles.shell, { backgroundColor: themeColors.background.primary() }]}>
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
              accessibilityLabel={option.label}
            >
              <Text
                style={[
                  getTextStyle('body-large'),
                  { color: selected ? themeColors.text.primary() : themeColors.text.secondary() },
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SEGMENT_INSET,
    gap: SEGMENT_INSET,
  },
  segmentTap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Paddings.formDataPillVertical - 2,
    paddingHorizontal: Paddings.formDataPillHorizontal - 2,
  },
});
