/**
 * horizontal weekday toggles — circular day chips with duration-slider padding, no full-width track bed.
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AUTH_LANDING_SLIDE_UI } from '@/components/features/onboarding/auth/constants/slideUiTokens';
import { resolveIntroContinueButtonPaint } from '@/components/features/onboarding/auth/scrollTransition';
import { useThemeColors } from '@/hooks/useColorPalette';

import {
  WEEKDAY_FULL_LABELS,
  WEEKDAY_SHORT_LABELS,
  WEEKDAY_VALUES_MON_FIRST,
  type WeekdayValue,
} from './weekdayCirclePickerConstants';
import {
  WEEKDAY_CIRCLE_PICKER_LETTER_TEXT_STYLE,
  WEEKDAY_PICKER_CIRCLE_SIZE,
  WEEKDAY_PICKER_INNER_PAD_HORIZONTAL,
  WEEKDAY_PICKER_TRACK_HEIGHT,
} from './weekdayCirclePickerLayout';

export type WeekdayCirclePickerMode = 'multi' | 'single';

export type WeekdayCirclePickerProps = {
  /** selected weekday indices — 0 = Monday through 6 = Sunday */
  selectedDays: number[];
  onChange: (days: number[]) => void;
  /** multi = tap toggles each day; single = tap picks exactly one day */
  mode?: WeekdayCirclePickerMode;
  style?: StyleProp<ViewStyle>;
};

export function WeekdayCirclePicker({
  selectedDays,
  onChange,
  mode = 'multi',
  style,
}: WeekdayCirclePickerProps) {
  const themeColors = useThemeColors();
  const selectedSet = useMemo(() => new Set(selectedDays), [selectedDays]);

  // unselected circles — same secondary fill as the duration slider trail band
  const unselectedFillColor = themeColors.background.secondary();

  // selected circle fill + label — same marple tokens as TaskDurationSlider thumb
  const selectedFillColor = useMemo(
    () => resolveIntroContinueButtonPaint(themeColors, AUTH_LANDING_SLIDE_UI.continueButtonBackground),
    [themeColors],
  );
  const selectedLabelColor = useMemo(
    () =>
      resolveIntroContinueButtonPaint(
        themeColors,
        AUTH_LANDING_SLIDE_UI.continueButtonIcon ?? 'primarySecondaryBlend',
      ),
    [themeColors],
  );

  const toggleDay = useCallback(
    (day: WeekdayValue) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (mode === 'single') {
        onChange([day]);
        return;
      }

      const next = new Set(selectedSet);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      onChange([...next].sort((a, b) => a - b));
    },
    [mode, onChange, selectedSet],
  );

  return (
    <View style={[styles.root, style]} accessibilityRole="adjustable">
      {/* same horizontal inset as OnboardingQuestionnaireDurationGlassSlider `innerPad` */}
      <View style={styles.innerPad}>
        <View style={styles.dayRow}>
          {WEEKDAY_VALUES_MON_FIRST.map((day, index) => {
            const isSelected = selectedSet.has(day);
            const letter = WEEKDAY_SHORT_LABELS[index];
            const fullLabel = WEEKDAY_FULL_LABELS[index];

            return (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                accessibilityRole="button"
                accessibilityLabel={fullLabel}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [
                  styles.dayCircle,
                  {
                    backgroundColor: isSelected ? selectedFillColor : unselectedFillColor,
                    borderColor: isSelected ? selectedFillColor : themeColors.border.secondary(),
                  },
                  pressed && styles.dayCirclePressed,
                ]}
              >
                <Text
                  style={[
                    WEEKDAY_CIRCLE_PICKER_LETTER_TEXT_STYLE,
                    {
                      color: isSelected
                        ? selectedLabelColor
                        : themeColors.text.secondary(),
                      opacity: isSelected ? 1 : 0.85,
                    },
                    Platform.OS === 'android' && styles.androidLetter,
                  ]}
                >
                  {letter}
                </Text>
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
  dayRow: {
    height: WEEKDAY_PICKER_TRACK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: WEEKDAY_PICKER_CIRCLE_SIZE,
    height: WEEKDAY_PICKER_CIRCLE_SIZE,
    borderRadius: WEEKDAY_PICKER_CIRCLE_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCirclePressed: {
    opacity: 0.88,
  },
  androidLetter: {
    textAlignVertical: 'center',
  },
});
