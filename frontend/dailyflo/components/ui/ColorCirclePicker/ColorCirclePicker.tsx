/**
 * multi-row color grid — flex-wrap packs swatches; selection animates size + border via reanimated.
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useColorPalette';
import { getTaskColorValue } from '@/utils/taskColors';

import {
  colorCirclePickerLabel,
  DEFAULT_COLOR_CIRCLE_PICKER_COLORS,
} from './colorCirclePickerConstants';
import {
  COLOR_CIRCLE_PICKER_GAP,
  COLOR_CIRCLE_PICKER_INNER_PAD_HORIZONTAL,
  COLOR_CIRCLE_PICKER_OUTER_STROKE,
  COLOR_CIRCLE_PICKER_SELECTED_SIZE,
  COLOR_CIRCLE_PICKER_SIZE,
  COLOR_CIRCLE_PICKER_SLOT_SIZE,
  COLOR_CIRCLE_PICKER_SPRING,
} from './colorCirclePickerLayout';

type ColorSwatchProps<T extends string> = {
  color: T;
  isSelected: boolean;
  label: string;
  onPress: () => void;
};

function ColorSwatch<T extends string>({ color, isSelected, label, onPress }: ColorSwatchProps<T>) {
  const themeColors = useThemeColors();
  const fill = getTaskColorValue(color, 500);
  const ringColor = getTaskColorValue(color, 300);
  const selectedBorderColor = themeColors.background.secondary();

  // 0 = compact + color ring, 1 = expanded + secondary stroke
  const selection = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selection.value = withSpring(isSelected ? 1 : 0, COLOR_CIRCLE_PICKER_SPRING);
  }, [isSelected, selection]);

  const swatchStyle = useAnimatedStyle(() => {
    const size = interpolate(
      selection.value,
      [0, 1],
      [COLOR_CIRCLE_PICKER_SIZE, COLOR_CIRCLE_PICKER_SELECTED_SIZE],
    );

    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: COLOR_CIRCLE_PICKER_OUTER_STROKE,
      backgroundColor: fill,
      borderColor: interpolateColor(selection.value, [0, 1], [ringColor, selectedBorderColor]),
    };
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [styles.colorSlot, pressed && styles.colorCirclePressed]}
    >
      <Animated.View style={swatchStyle} />
    </Pressable>
  );
}

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
      <View style={styles.innerPad}>
        <View style={styles.colorGrid}>
          {colors.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              isSelected={color === selectedColor}
              label={getLabel(color)}
              onPress={() => selectColor(color)}
            />
          ))}
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
    paddingHorizontal: COLOR_CIRCLE_PICKER_INNER_PAD_HORIZONTAL,
    width: '100%',
  },
  colorGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLOR_CIRCLE_PICKER_GAP,
  },
  colorSlot: {
    width: COLOR_CIRCLE_PICKER_SLOT_SIZE,
    height: COLOR_CIRCLE_PICKER_SLOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCirclePressed: {
    opacity: 0.88,
  },
});
