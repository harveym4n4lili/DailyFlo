/**
 * − / count / + row for how many times a habit must be completed each day.
 * tap the number to type a value on the keyboard; −/+ still adjust by one.
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { SFSymbolIcon } from '@/components/ui/Icon';
import {
  WEEKDAY_PICKER_CIRCLE_SIZE,
  WEEKDAY_PICKER_INNER_PAD_HORIZONTAL,
  WEEKDAY_PICKER_TRACK_HEIGHT,
} from '@/components/ui/WeekdayCirclePicker/weekdayCirclePickerLayout';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import {
  MAX_HABIT_COMPLETIONS_PER_DAY,
  MIN_HABIT_COMPLETIONS_PER_DAY,
} from './habitFormUtils';

/** constant inset between circles and value — matches habit form compact section spacing */
const VALUE_CONTROL_GAP = Paddings.sectionCompact;

/** wide enough for max value (99) at heading-3 — stops −/+ shifting when digits change */
const VALUE_COUNT_SLOT_WIDTH = 52;

const STEP_ICON_SIZE = Paddings.groupedListIconSize;

/** same press fade as grouped list headers / header icon buttons */
const STEP_TOUCH_ACTIVE_OPACITY = 0.7;

function clampCompletionsPerDay(raw: number): number {
  return Math.min(MAX_HABIT_COMPLETIONS_PER_DAY, Math.max(MIN_HABIT_COMPLETIONS_PER_DAY, raw));
}

function parseDraftDigits(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 0) return null;
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

type HabitCompletionsPerDayStepperProps = {
  value: number;
  onChange: (next: number) => void;
};

export function HabitCompletionsPerDayStepper({ value, onChange }: HabitCompletionsPerDayStepperProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const inputRef = useRef<TextInput>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const canDecrement = value > MIN_HABIT_COMPLETIONS_PER_DAY;
  const canIncrement = value < MAX_HABIT_COMPLETIONS_PER_DAY;

  const circleFill = themeColors.background.secondary();
  const circleBorder = themeColors.border.secondary();

  const circleStyle = useMemo(
    () => ({
      backgroundColor: circleFill,
      borderColor: circleBorder,
    }),
    [circleFill, circleBorder],
  );

  // keep draft in sync when −/+ changes while the field is not focused
  useEffect(() => {
    if (!isEditing) {
      setDraft(String(value));
    }
  }, [value, isEditing]);

  const countInputStyle = useMemo(
    () => [
      typography.getTextStyle('heading-3'),
      styles.countInput,
      {
        color: themeColors.text.primary(),
        ...(Platform.OS === 'android' && {
          includeFontPadding: false,
          textAlignVertical: 'center' as const,
        }),
      },
    ],
    [typography, themeColors],
  );

  const commitDraft = useCallback(
    (text: string) => {
      const parsed = parseDraftDigits(text);
      const next = parsed == null ? MIN_HABIT_COMPLETIONS_PER_DAY : clampCompletionsPerDay(parsed);
      onChange(next);
      setDraft(String(next));
    },
    [onChange],
  );

  const handleChangeText = useCallback((text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 2);
    setDraft(digits);
    const parsed = parseDraftDigits(digits);
    if (parsed != null) {
      onChange(clampCompletionsPerDay(parsed));
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    commitDraft(draft);
  }, [commitDraft, draft]);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
    setDraft(String(value));
  }, [value]);

  const handleDecrement = useCallback(() => {
    if (!canDecrement) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    inputRef.current?.blur();
    onChange(value - 1);
  }, [canDecrement, onChange, value]);

  const handleIncrement = useCallback(() => {
    if (!canIncrement) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    inputRef.current?.blur();
    onChange(value + 1);
  }, [canIncrement, onChange, value]);

  return (
    <View style={styles.root} accessibilityRole="adjustable" accessibilityLabel="Completions per day">
      <View style={styles.innerPad}>
        <View style={styles.controlRow}>
          <View style={styles.controlCluster}>
            <TouchableOpacity
              onPress={handleDecrement}
              disabled={!canDecrement}
              activeOpacity={STEP_TOUCH_ACTIVE_OPACITY}
              accessibilityRole="button"
              accessibilityLabel="Decrease completions per day"
              style={[styles.stepCircle, circleStyle, !canDecrement && styles.stepCircleDisabled]}
            >
              <SFSymbolIcon
                name="minus"
                size={STEP_ICON_SIZE}
                color={themeColors.text.primary()}
                fallback={<Ionicons name="remove" size={STEP_ICON_SIZE} color={themeColors.text.primary()} />}
              />
            </TouchableOpacity>

            <View style={styles.countSlot}>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={handleChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={2}
                selectTextOnFocus
                accessibilityLabel="Completions per day"
                accessibilityHint="Enter how many times to complete this habit each day"
                style={countInputStyle}
                selectionColor="#FFFFFF"
                cursorColor="#FFFFFF"
                selectionHandleColor="#FFFFFF"
                underlineColorAndroid="transparent"
              />
            </View>

            <TouchableOpacity
              onPress={handleIncrement}
              disabled={!canIncrement}
              activeOpacity={STEP_TOUCH_ACTIVE_OPACITY}
              accessibilityRole="button"
              accessibilityLabel="Increase completions per day"
              style={[styles.stepCircle, circleStyle, !canIncrement && styles.stepCircleDisabled]}
            >
              <SFSymbolIcon
                name="plus"
                size={STEP_ICON_SIZE}
                color={themeColors.text.primary()}
                fallback={<Ionicons name="add" size={STEP_ICON_SIZE} color={themeColors.text.primary()} />}
              />
            </TouchableOpacity>
          </View>
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
  controlRow: {
    height: WEEKDAY_PICKER_TRACK_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countSlot: {
    width: VALUE_COUNT_SLOT_WIDTH,
    marginHorizontal: VALUE_CONTROL_GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countInput: {
    width: '100%',
    paddingVertical: Paddings.none,
    paddingHorizontal: Paddings.none,
    margin: 0,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  stepCircle: {
    width: WEEKDAY_PICKER_CIRCLE_SIZE,
    height: WEEKDAY_PICKER_CIRCLE_SIZE,
    borderRadius: WEEKDAY_PICKER_CIRCLE_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDisabled: {
    opacity: 0.35,
  },
});
