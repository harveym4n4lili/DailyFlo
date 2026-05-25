/**
 * time selection for onboarding wake/sleep steps.
 * ios/android: `DateTimePicker` spinner + `minuteInterval={15}` — uses real UIDatePicker / platform time wheels (same native module as rest of the app).
 * web: flatlist quarter-hour list (no native spinner).
 *
 * `brandRamp` comes from the slide’s row in `slideUiTokens` (`timeWheelBrandRamp`); tint always uses ramp step **700** (caption-tier).
 */

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  type ListRenderItemInfo,
} from 'react-native';

import { useBrandColors } from '@/hooks/useColorPalette';

import { ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_BAND_MIN_HEIGHT_PX } from '../constants/pagerLayout';
import { ONBOARDING_SLIDES_TIME_WHEEL_ROW_LABEL_TEXT_STYLE } from '../constants/typography';
import type { OnboardingSlidesTimeWheelBrandRamp } from '../constants/types';

export type OnboardingQuestionnaireTimeWheelProps = {
  value: Date;
  /** parents store a full `Date`; only hour/minute from the picked slot are meaningful */
  onChange: (next: Date) => void;
  /** plant / moss / sage — from slide `timeWheelBrandRamp`; wheel tint uses step **700** on that ramp */
  brandRamp: OnboardingSlidesTimeWheelBrandRamp;
  accessibilityLabel?: string;
};

type WheelSurfaceProps = Omit<OnboardingQuestionnaireTimeWheelProps, 'brandRamp'> & {
  wheelLabelColor: string;
};

/* ─── shared quarter-hour grid (web fallback) ─── */

const ROW_HEIGHT = 48;
const WINDOW_HEIGHT = ROW_HEIGHT * 5;
const SLOT_MS = 15 * 60 * 1000;
const SLOTS_PER_DAY = (24 * 60) / 15;

function quarterHourSlots(reference: Date): Date[] {
  const base = new Date(reference);
  base.setHours(0, 0, 0, 0);
  const slots: Date[] = [];
  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    slots.push(new Date(base.getTime() + i * SLOT_MS));
  }
  return slots;
}

function clampQuarterHourIndexFromDate(d: Date): number {
  let totalMin = d.getHours() * 60 + d.getMinutes();
  totalMin = Math.round(totalMin / 15) * 15;
  const maxMin = 23 * 60 + 45;
  totalMin = Math.max(0, Math.min(maxMin, totalMin));
  return totalMin / 15;
}

function formatQuarterHourLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** web-only scroll wheel — label color uses ramp step **700** (matches caption-tier tokens like `moss:700`) */
function QuarterHourWebFallback({
  value,
  onChange,
  wheelLabelColor,
  accessibilityLabel = 'Select time',
}: WheelSurfaceProps) {
  const listRef = useRef<FlatList<Date>>(null);

  const dayKey = `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keep `slots` stable for one calendar day so FlatList does not reset while scrolling
  const slots = useMemo(() => quarterHourSlots(value), [dayKey]);

  const selectedIndex = clampQuarterHourIndexFromDate(value);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: selectedIndex * ROW_HEIGHT,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [selectedIndex, slots]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      let idx = Math.round(y / ROW_HEIGHT);
      idx = Math.max(0, Math.min(slots.length - 1, idx));
      const snap = idx * ROW_HEIGHT;
      if (Math.abs(y - snap) > 0.5) {
        listRef.current?.scrollToOffset({ offset: snap, animated: true });
      }
      const picked = slots[idx];
      if (picked) {
        onChange(new Date(picked));
      }
    },
    [onChange, slots],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Date>) => (
      <View style={styles.row} accessibilityLabel={formatQuarterHourLabel(item)}>
        <Text style={[ONBOARDING_SLIDES_TIME_WHEEL_ROW_LABEL_TEXT_STYLE, { color: wheelLabelColor }]}>{formatQuarterHourLabel(item)}</Text>
      </View>
    ),
    [wheelLabelColor],
  );

  const padVertical = (WINDOW_HEIGHT - ROW_HEIGHT) / 2;

  return (
    <View
      style={styles.centerWrap}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
    >
      <View style={[styles.wheelClip, { height: WINDOW_HEIGHT }]}>
        <FlatList<Date>
          ref={listRef}
          data={slots}
          keyExtractor={(item) => String(item.getTime())}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: ROW_HEIGHT,
            offset: padVertical + ROW_HEIGHT * index,
            index,
          })}
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW_HEIGHT}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: padVertical }}
          onMomentumScrollEnd={onMomentumScrollEnd}
          removeClippedSubviews={false}
        />
      </View>
    </View>
  );
}

/** native spinner — ios gets theme-aware uidatepicker; android uses legacy design so `minuteInterval` sticks */
function NativeSpinnerWheel({
  value,
  onChange,
  wheelLabelColor,
  accessibilityLabel = 'Select time',
}: WheelSurfaceProps) {
  const { withOpacity } = useBrandColors();
  const colorScheme = useColorScheme();
  const themeVariant = colorScheme === 'dark' ? 'dark' : 'light';

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (date) {
        onChange(date);
      }
    },
    [onChange],
  );

  return (
    <View style={styles.centerWrap} accessibilityLabel={accessibilityLabel}>
      <View
        style={[
          styles.pickerClip,
          Platform.OS === 'ios' ? styles.pickerClipIOS : styles.pickerClipAndroid,
          Platform.OS === 'android' && {
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: withOpacity(wheelLabelColor, 0.45),
            borderRadius: 12,
          },
        ]}
      >
        <DateTimePicker
          value={value}
          mode="time"
          display="spinner"
          minuteInterval={15}
          onChange={handleChange}
          {...(Platform.OS === 'ios'
            ? {
                themeVariant,
                textColor: wheelLabelColor,
              }
            : {
                design: 'default' as const,
              })}
        />
      </View>
    </View>
  );
}

export function OnboardingQuestionnaireTimeWheel({
  brandRamp,
  ...rest
}: OnboardingQuestionnaireTimeWheelProps) {
  const { getPlantBrandColor, getMossBrandColor, getSageBrandColor, getMarpleBrandColor } = useBrandColors();
  const wheelLabelColor =
    brandRamp === 'plant'
      ? getPlantBrandColor(700)
      : brandRamp === 'moss'
        ? getMossBrandColor(700)
        : brandRamp === 'marple'
          ? getMarpleBrandColor(700)
          : getSageBrandColor(700);

  if (Platform.OS === 'web') {
    return <QuarterHourWebFallback wheelLabelColor={wheelLabelColor} {...rest} />;
  }
  return <NativeSpinnerWheel wheelLabelColor={wheelLabelColor} {...rest} />;
}

const styles = StyleSheet.create({
  centerWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelClip: {
    width: '30%',
    maxWidth: 280,
    overflow: 'hidden',
  },
  pickerClip: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickerClipIOS: {
    width: '100%',
    maxWidth: 320,
    height: ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_BAND_MIN_HEIGHT_PX,
  },
  pickerClipAndroid: {
    width: '100%',
    maxWidth: 320,
    minHeight: ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_BAND_MIN_HEIGHT_PX,
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
