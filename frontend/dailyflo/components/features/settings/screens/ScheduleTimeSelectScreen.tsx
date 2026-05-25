/**
 * ScheduleTimeSelectScreen
 *
 * liquid glass form sheet for editing wake or sleep time from settings.
 * mirrors MonthSelectScreen: transparent ios background + scroll body inside browse stack sheet.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettingsScheduleTimeSelect } from '@/app/SettingsScheduleSelectContext';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import type { ScheduleTimeKind } from '@/app/SettingsScheduleSelectContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { patchUserSchedulePreferences } from '@/store/slices/auth/authSlice';
import { timeToMinutes } from '@/components/features/timeline/timelineUtils';
import {
  coerceWakeSleepHHMM,
  DEFAULT_SLEEP_HHMM,
  DEFAULT_WAKE_HHMM,
  scheduleDateToSnappedHHMM,
} from '@/utils/preferenceScheduleTimes';

/** sheet titles — align with settings calendar rows ("Wake up" / "Sleep") + "time" */
const SCHEDULE_TIME_SHEET_TITLE: Record<ScheduleTimeKind, string> = {
  wake: 'Wake up time',
  sleep: 'Sleep time',
};

/** ios uidatepicker spinner band — fixed width + clip keeps wheels visually centered in the sheet */
const SCHEDULE_TIME_PICKER_MAX_WIDTH = 320;
const SCHEDULE_TIME_PICKER_BAND_HEIGHT = 216;

export function ScheduleTimeSelectScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const colorSchemeRN = useColorScheme();
  const dispatch = useAppDispatch();
  const isSaving = useAppSelector((state) => state.auth.isUpdatingProfile);
  const { consumeScheduleTimeSelect } = useSettingsScheduleTimeSelect();

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass ? 'transparent' : themeColors.background.secondary();

  // top inset for glass form sheet (no native header) — matches browse modal rhythm + safe area
  const scrollPaddingTop = useMemo(
    () => Paddings.screen + Paddings.groupedListHeaderContentGap,
    [],
  );
  const titleTextStyle = useMemo(
    () => [
      getTypographyStyle('heading-3', typographyPlatform),
      { color: themeColors.text.primary() },
    ],
    [themeColors, typographyPlatform],
  );
  const actionLabelStyle = useMemo(
    () => ({
      cancel: [
        getTypographyStyle('body-medium', typographyPlatform),
        { color: themeColors.text.secondary() },
      ],
      save: [
        getTypographyStyle('button-secondary', typographyPlatform),
        { color: themeColors.text.primary() },
      ],
    }),
    [themeColors, typographyPlatform],
  );

  const [payload, setPayload] = useState<ReturnType<typeof consumeScheduleTimeSelect>>(null);
  const [draftTime, setDraftTime] = useState<Date>(() => new Date());
  const hasConsumedRef = useRef(false);

  useEffect(() => {
    if (hasConsumedRef.current) return;
    hasConsumedRef.current = true;
    const next = consumeScheduleTimeSelect();
    setPayload(next);
    if (next) {
      setDraftTime(next.draftTime);
    } else {
      const id = setTimeout(() => router.back(), 100);
      return () => clearTimeout(id);
    }
  }, [consumeScheduleTimeSelect, router]);

  const onDraftChange = useCallback((_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDraftTime(date);
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const handleSave = useCallback(async () => {
    if (!payload) return;
    const snapped = scheduleDateToSnappedHHMM(draftTime);
    const nextWake =
      payload.kind === 'wake'
        ? snapped
        : coerceWakeSleepHHMM(payload.wakeTime, DEFAULT_WAKE_HHMM);
    const nextSleep =
      payload.kind === 'sleep'
        ? snapped
        : coerceWakeSleepHHMM(payload.sleepTime, DEFAULT_SLEEP_HHMM);

    if (timeToMinutes(nextWake) >= timeToMinutes(nextSleep)) {
      Alert.alert('Check times', 'Wake time needs to come before bedtime for the planner timeline window.');
      return;
    }

    try {
      await dispatch(patchUserSchedulePreferences({ wakeTime: nextWake, sleepTime: nextSleep })).unwrap();
      router.back();
    } catch (err: unknown) {
      const detail = typeof err === 'string' ? err : '';
      Alert.alert(
        'Could not save schedule',
        detail.length > 0 ? detail : 'Try again shortly when you have a stable connection.',
      );
    }
  }, [payload, draftTime, dispatch, router]);

  if (payload === null) {
    return <View style={[styles.container, { backgroundColor }]} />;
  }

  const title = SCHEDULE_TIME_SHEET_TITLE[payload.kind];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: scrollPaddingTop,
            paddingBottom: insets.bottom + Paddings.modalBottomExtra,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[titleTextStyle, styles.title]}
          accessibilityRole="header"
          accessibilityLabel={title}
        >
          {title}
        </Text>

        <View style={styles.pickerSection}>
          <View
            style={[
              styles.pickerClip,
              Platform.OS === 'ios' ? styles.pickerClipIOS : styles.pickerClipAndroid,
            ]}
          >
            <DateTimePicker
              value={draftTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minuteInterval={15}
              onChange={onDraftChange}
              style={styles.picker}
              {...(Platform.OS === 'ios'
                ? {
                    themeVariant: colorSchemeRN === 'dark' ? ('dark' as const) : ('light' as const),
                    textColor: themeColors.text.primary(),
                  }
                : { design: 'default' as const })}
            />
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.secondaryButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing schedule time"
          >
            <Text style={actionLabelStyle.cancel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void handleSave()}
            disabled={isSaving}
            style={[
              styles.primaryButton,
              { backgroundColor: themeColors.background.secondary(), borderColor: themeColors.border.secondary() },
              isSaving ? { opacity: 0.45 } : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Save ${title.toLowerCase()}`}
          >
            {isSaving ? (
              <ActivityIndicator color={themeColors.text.primary()} />
            ) : (
              <Text style={actionLabelStyle.save}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Paddings.screen,
  },
  title: {
    marginBottom: Paddings.listItemVertical,
  },
  pickerSection: {
    width: '100%',
    alignItems: 'center',
  },
  pickerClip: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickerClipIOS: {
    width: SCHEDULE_TIME_PICKER_MAX_WIDTH,
    height: SCHEDULE_TIME_PICKER_BAND_HEIGHT,
  },
  pickerClipAndroid: {
    width: '100%',
    maxWidth: SCHEDULE_TIME_PICKER_MAX_WIDTH,
    minHeight: SCHEDULE_TIME_PICKER_BAND_HEIGHT,
  },
  picker: {
    alignSelf: 'center',
    ...(Platform.OS === 'ios'
      ? { width: SCHEDULE_TIME_PICKER_MAX_WIDTH }
      : { width: '100%', maxWidth: SCHEDULE_TIME_PICKER_MAX_WIDTH }),
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: Paddings.sectionCompact,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    minWidth: 110,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
