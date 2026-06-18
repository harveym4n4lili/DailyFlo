/**
 * horizontal color toggles — circular swatches with the same row layout as WeekdayCirclePicker.
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  WEEKDAY_PICKER_CIRCLE_SIZE,
  WEEKDAY_PICKER_INNER_PAD_HORIZONTAL,
  WEEKDAY_PICKER_TRACK_HEIGHT,
} from '@/components/ui/WeekdayCirclePicker/weekdayCirclePickerLayout';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTaskColorValue } from '@/utils/taskColors';

import {
  colorCirclePickerLabel,
  DEFAULT_COLOR_CIRCLE_PICKER_COLORS,
} from './colorCirclePickerConstants';

/** inset ring width on selected swatch — drawn inside the 44px circle using background.secondary() */
const SELECTED_INSET_BORDER_WIDTH = 4;

const COLOR_CIRCLE_INNER_SIZE =
  WEEKDAY_PICKER_CIRCLE_SIZE - SELECTED_INSET_BORDER_WIDTH * 2;
const COLOR_CIRCLE_INNER_RADIUS = COLOR_CIRCLE_INNER_SIZE / 2;

export type ColorCirclePickerProps<T extends string = string> = {
  /** which color is currently selected — single-select only */
  selectedColor: T;
  /** parent updates form state when user taps a swatch */
  onChange: (color: T) => void;
  /** list of color ids to show — defaults to task/habit palette */
  colors?: readonly T[];
  /** optional custom a11y label per color id */
  getLabel?: (color: T) => string;
  style?: StyleProp<ViewStyle>;
};

export function ColorCirclePicker<T extends string = string>({
  selectedColor,
  onChange,
  colors = DEFAULT_COLOR_CIRCLE_PICKER_COLORS as readonly T[],
  getLabel = colorCirclePickerLabel as (color: T) => string,
  style,
}: ColorCirclePickerProps<T>) {
  const themeColors = useThemeColors();

  const selectColor = useCallback(
    (color: T) => {
      if (color === selectedColor) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(color);
    },
    [onChange, selectedColor],
  );

  return (
    <View style={[styles.root, style]} accessibilityRole="radiogroup">
      {/* same horizontal inset as WeekdayCirclePicker / duration slider */}
      <View style={styles.innerPad}>
        <View style={styles.colorRow}>
          {colors.map((color) => {
            const isSelected = color === selectedColor;
            const label = getLabel(color);

            return (
              <Pressable
                key={color}
                onPress={() => selectColor(color)}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.colorCircle,
                  pressed && styles.colorCirclePressed,
                ]}
              >
                {isSelected ? (
                  <>
                    {/* secondary ring sits behind the inset fill so the stroke reads inside the circle */}
                    <View
                      style={[
                        styles.colorCircleRing,
                        { backgroundColor: themeColors.background.secondary() },
                      ]}
                    />
                    <View
                      style={[
                        styles.colorCircleInsetFill,
                        { backgroundColor: getTaskColorValue(color) },
                      ]}
                    />
                  </>
                ) : (
                  <View
                    style={[
                      styles.colorCircleFill,
                      { backgroundColor: getTaskColorValue(color) },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  innerPad: {
    paddingHorizontal: WEEKDAY_PICKER_INNER_PAD_HORIZONTAL,
    width: '100%',
  },
  colorRow: {
    height: WEEKDAY_PICKER_TRACK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorCircle: {
    width: WEEKDAY_PICKER_CIRCLE_SIZE,
    height: WEEKDAY_PICKER_CIRCLE_SIZE,
    borderRadius: WEEKDAY_PICKER_CIRCLE_SIZE / 2,
    overflow: 'hidden',
  },
  colorCircleFill: {
    width: '100%',
    height: '100%',
    borderRadius: WEEKDAY_PICKER_CIRCLE_SIZE / 2,
  },
  colorCircleRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: WEEKDAY_PICKER_CIRCLE_SIZE / 2,
  },
  colorCircleInsetFill: {
    position: 'absolute',
    top: SELECTED_INSET_BORDER_WIDTH,
    left: SELECTED_INSET_BORDER_WIDTH,
    width: COLOR_CIRCLE_INNER_SIZE,
    height: COLOR_CIRCLE_INNER_SIZE,
    borderRadius: COLOR_CIRCLE_INNER_RADIUS,
  },
  colorCirclePressed: {
    opacity: 0.88,
  },
});
