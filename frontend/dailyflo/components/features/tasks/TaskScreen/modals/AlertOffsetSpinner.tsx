/**
 * Alert offset spinner — same native UIDatePicker wheel pattern as onboarding wake/sleep steps.
 * Left column: hours before task start. Right column: minutes (5-min steps).
 * iOS uses countdown mode; Android uses 24h time spinner interpreted as duration.
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
import { ONBOARDING_TASK_AGENDA_TIME_WHEEL_SPINNER_BAND_MIN_HEIGHT_PX } from '@/components/features/onboarding/onboarding/constants/pagerLayout';
import { ONBOARDING_SLIDES_TIME_WHEEL_ROW_LABEL_TEXT_STYLE } from '@/components/features/onboarding/onboarding/constants/typography';
import {
  ALERT_OFFSET_MAX_HOURS,
  ALERT_OFFSET_MINUTE_INTERVAL,
  getAlertOffsetMinuteWheelValues,
  offsetMinutesToPickerDate,
  pickerDateToOffsetMinutes,
} from './alertOptions';

export type AlertOffsetSpinnerProps = {
  /** total minutes before task start (0 = at start) */
  valueMinutes: number;
  onChangeMinutes: (minutes: number) => void;
  accessibilityLabel?: string;
};

const WEB_ROW_HEIGHT = 48;
const WEB_WINDOW_HEIGHT = WEB_ROW_HEIGHT * 5;

type WebWheelProps = {
  values: number[];
  selectedValue: number;
  formatLabel: (value: number) => string;
  onSelect: (value: number) => void;
  wheelLabelColor: string;
  accessibilityLabel: string;
};

/** one column of the web fallback — mirrors onboarding quarter-hour flatlist wheel */
function WebSpinnerColumn({
  values,
  selectedValue,
  formatLabel,
  onSelect,
  wheelLabelColor,
  accessibilityLabel,
}: WebWheelProps) {
  const listRef = useRef<FlatList<number>>(null);
  const selectedIndex = Math.max(0, values.indexOf(selectedValue));

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: selectedIndex * WEB_ROW_HEIGHT,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(id);
  }, [selectedIndex]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      let idx = Math.round(y / WEB_ROW_HEIGHT);
      idx = Math.max(0, Math.min(values.length - 1, idx));
      const snap = idx * WEB_ROW_HEIGHT;
      if (Math.abs(y - snap) > 0.5) {
        listRef.current?.scrollToOffset({ offset: snap, animated: true });
      }
      onSelect(values[idx] ?? values[0]);
    },
    [onSelect, values],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<number>) => (
      <View style={styles.webRow}>
        <Text style={[ONBOARDING_SLIDES_TIME_WHEEL_ROW_LABEL_TEXT_STYLE, { color: wheelLabelColor }]}>
          {formatLabel(item)}
        </Text>
      </View>
    ),
    [formatLabel, wheelLabelColor],
  );

  const padVertical = (WEB_WINDOW_HEIGHT - WEB_ROW_HEIGHT) / 2;

  return (
    <View style={styles.webColumn} accessibilityLabel={accessibilityLabel} accessibilityRole="adjustable">
      <View style={[styles.webWheelClip, { height: WEB_WINDOW_HEIGHT }]}>
        <FlatList
          ref={listRef}
          data={values}
          keyExtractor={(item) => String(item)}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: WEB_ROW_HEIGHT,
            offset: padVertical + WEB_ROW_HEIGHT * index,
            index,
          })}
          showsVerticalScrollIndicator={false}
          snapToInterval={WEB_ROW_HEIGHT}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: padVertical }}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollEndDrag={onMomentumScrollEnd}
          removeClippedSubviews={false}
        />
      </View>
    </View>
  );
}

/** web: side-by-side hour + minute wheels (same layout as native time / countdown spinner) */
function WebDualSpinner({
  valueMinutes,
  onChangeMinutes,
  wheelLabelColor,
}: Omit<AlertOffsetSpinnerProps, 'accessibilityLabel'> & { wheelLabelColor: string }) {
  const hours = Math.floor(valueMinutes / 60);
  const minutes = valueMinutes % 60;

  const hourValues = useMemo(
    () => Array.from({ length: ALERT_OFFSET_MAX_HOURS + 1 }, (_, index) => index),
    [],
  );
  const minuteValues = useMemo(() => getAlertOffsetMinuteWheelValues(), []);

  const clampedMinutes = minuteValues.includes(minutes)
    ? minutes
    : minuteValues.reduce((prev, curr) =>
        Math.abs(curr - minutes) < Math.abs(prev - minutes) ? curr : prev,
      );

  const setHours = useCallback(
    (nextHours: number) => {
      onChangeMinutes(nextHours * 60 + clampedMinutes);
    },
    [clampedMinutes, onChangeMinutes],
  );

  const setMinutes = useCallback(
    (nextMinutes: number) => {
      onChangeMinutes(hours * 60 + nextMinutes);
    },
    [hours, onChangeMinutes],
  );

  return (
    <View style={styles.dualWebRow}>
      <WebSpinnerColumn
        values={hourValues}
        selectedValue={hours}
        formatLabel={(value) => String(value)}
        onSelect={setHours}
        wheelLabelColor={wheelLabelColor}
        accessibilityLabel="Hours before task"
      />
      <WebSpinnerColumn
        values={minuteValues}
        selectedValue={clampedMinutes}
        formatLabel={(value) => value.toString().padStart(2, '0')}
        onSelect={setMinutes}
        wheelLabelColor={wheelLabelColor}
        accessibilityLabel="Minutes before task"
      />
    </View>
  );
}

/** ios countdown + android 24h time spinner — same module as onboarding questionnaire wheel */
function NativeDualSpinner({
  valueMinutes,
  onChangeMinutes,
  wheelLabelColor,
  accessibilityLabel = 'Hours and minutes before task',
}: AlertOffsetSpinnerProps & { wheelLabelColor: string }) {
  const { withOpacity } = useBrandColors();
  const colorScheme = useColorScheme();
  const themeVariant = colorScheme === 'dark' ? 'dark' : 'light';
  const pickerValue = useMemo(() => offsetMinutesToPickerDate(valueMinutes), [valueMinutes]);

  const handleChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (date) {
        onChangeMinutes(pickerDateToOffsetMinutes(date));
      }
    },
    [onChangeMinutes],
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
          value={pickerValue}
          mode={Platform.OS === 'ios' ? 'countdown' : 'time'}
          display="spinner"
          minuteInterval={ALERT_OFFSET_MINUTE_INTERVAL}
          is24Hour
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

export function AlertOffsetSpinner({
  valueMinutes,
  onChangeMinutes,
  accessibilityLabel = 'Hours and minutes before task',
}: AlertOffsetSpinnerProps) {
  const { getMarpleBrandColor } = useBrandColors();
  // marple 700 — same caption-tier tint as onboarding time wheels
  const wheelLabelColor = getMarpleBrandColor(700);

  if (Platform.OS === 'web') {
    return (
      <WebDualSpinner
        valueMinutes={valueMinutes}
        onChangeMinutes={onChangeMinutes}
        wheelLabelColor={wheelLabelColor}
      />
    );
  }

  return (
    <NativeDualSpinner
      valueMinutes={valueMinutes}
      onChangeMinutes={onChangeMinutes}
      wheelLabelColor={wheelLabelColor}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  dualWebRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  webColumn: {
    flex: 1,
    maxWidth: 140,
    alignItems: 'center',
  },
  webWheelClip: {
    width: '100%',
    overflow: 'hidden',
  },
  webRow: {
    height: WEB_ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
