/**
 * habit detail body — root formSheet modal shell (matches TaskScreenContent layout: drag pill + scroll + overflow menu).
 * content layout: title → heatmap + legend → today's progress → grouped list (frequency | completion count | list) → alert pill → description.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { ActionContextMenu, type ActionContextMenuItem } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { DashedSeparator } from '@/components/ui/borders';
import { Paddings } from '@/constants/Paddings';
import { getTypographyStyle } from '@/constants/Typography';
import { flushAllPendingHabitIncrementSyncs } from '@/utils/pendingHabitIncrementSyncRegistry';
import { getTaskColorValue } from '@/utils/taskColors';
import { useHabits } from '@/store/hooks';
import { useHabitIncrementPress } from '@/hooks/useHabitIncrementPress';
import { HabitHeatmap } from './HabitHeatmap';
import { HabitProgressBar } from '../list/HabitProgressBar';
import { HabitProgressRing } from '../list/HabitProgressRing';
import { getHabitIncrementDisplay } from '../list/habitIncrementDisplay';
import { getHabitProgressRingColors } from '../list/habitProgressRingColors';
import {
  HABIT_DETAIL_INCREMENT_COLOR_BADGE_ICON_SIZE,
  HABIT_DETAIL_INCREMENT_COLOR_BADGE_SIZE,
  HABIT_DETAIL_INCREMENT_SIZE,
  HABIT_DETAIL_INCREMENT_PLUS_ICON_SIZE,
  HABIT_DETAIL_INCREMENT_PLUS_STROKE_WIDTH,
  HABIT_DETAIL_INCREMENT_RING_STROKE_WIDTH,
  HABIT_DETAIL_INCREMENT_TICK_ICON_SIZE,
  HABIT_DETAIL_PROGRESS_BAR_TOP_GAP,
  HABIT_DETAIL_TITLE_RING_SIZE,
  HABIT_DETAIL_TITLE_RING_STROKE_WIDTH,
} from '../list/habitCardUiTokens';
import {
  completionsPerDayFromHabit,
  getHabitAlertPillLabel,
  getHabitFrequencyDisplayLabel,
} from '../forms/habitFormUtils';
import { HabitDescriptionSection } from '../forms/HabitDescriptionSection';
import { SFSymbolIcon, RepeatIcon, BellIcon } from '@/components/ui/Icon';
import type { HabitColor, HabitTodayItem } from '@/types/api/habits';

const HEADER_STRIP_HEIGHT = 48;
const SCROLL_PADDING_TOP = HEADER_STRIP_HEIGHT + 8;

type HabitDetailScreenContentProps = {
  habitId: string;
  /** dismisses the root formSheet — passed from HabitDetailModalScreen */
  onClose: () => void;
};

export function HabitDetailScreenContent({ habitId, onClose }: HabitDetailScreenContentProps) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const {
    detailHabit,
    detailStats,
    todayHabits,
    isDetailLoading,
    detailError,
    fetchHabit,
    fetchHabitStats,
    fetchToday,
    deleteHabit,
    clearHabitDetail,
    updateHabit,
  } = useHabits();

  // local description draft — synced from redux detailHabit, PATCH on blur when text changed
  const [description, setDescription] = useState('');
  const [descriptionHydrated, setDescriptionHydrated] = useState(false);
  const [descriptionFieldKey, setDescriptionFieldKey] = useState(0);
  const savedDescriptionRef = useRef('');

  // reset hydration when opening a different habit in the same sheet instance
  useEffect(() => {
    setDescriptionHydrated(false);
    setDescriptionFieldKey(0);
  }, [habitId]);

  useEffect(() => {
    if (!detailHabit || detailHabit.id !== habitId || descriptionHydrated) return;
    const serverText = detailHabit.description ?? '';
    setDescription(serverText);
    savedDescriptionRef.current = serverText.trim();
    setDescriptionHydrated(true);
  }, [detailHabit, habitId, descriptionHydrated]);

  // load habit + stats whenever this sheet gains focus; flush pending log syncs on leave
  useFocusEffect(
    useCallback(() => {
      void fetchToday();
      void fetchHabit(habitId);
      void fetchHabitStats(habitId);
      return () => {
        flushAllPendingHabitIncrementSyncs();
        clearHabitDetail();
      };
    }, [habitId, fetchToday, fetchHabit, fetchHabitStats, clearHabitDetail]),
  );

  const title = detailHabit?.title ?? 'Habit';
  // habit color 300 — title + grouped-list row icons share the same accent tint
  const titleColor = useMemo(
    () => getTaskColorValue(detailHabit?.color ?? 'green', 300),
    [detailHabit?.color],
  );
  const groupedListIconColor = titleColor;

  // same heading-2 + platform Inter stack as TaskScreenContent title input
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const titleStyle = useMemo(
    () => [
      getTypographyStyle('heading-2', typographyPlatform),
      { color: titleColor, maxHeight: 68 },
    ],
    [titleColor, typographyPlatform],
  );

  const styles = useMemo(() => createStyles(themeColors, typography), [themeColors, typography]);

  // grouped-list chrome matches task detail FormDetailSection (date / time / inbox rows)
  const habitDetailListProps = useMemo(
    () => ({
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      separatorColor: themeColors.border.primary(),
      separatorInsetRight: Paddings.groupedListContentHorizontal,
      separatorVariant: 'solid' as const,
      borderRadius: 24,
      minimalStyle: false,
      separatorConsiderIconColumn: true,
      iconColumnWidth: 30,
      contentMinHeight: 0,
    }),
    [themeColors],
  );

  // daily goal from stored habit — shown as read-only "Completion Count" row
  const completionsPerDay = useMemo(() => {
    if (!detailHabit) return null;
    return completionsPerDayFromHabit(detailHabit.trackingType, detailHabit.targetValue);
  }, [detailHabit]);

  const completionCountValue = useMemo(() => {
    if (completionsPerDay == null) return '';
    return completionsPerDay === 1 ? '1 completion' : `${completionsPerDay} completions`;
  }, [completionsPerDay]);

  const frequencyValue = useMemo(() => {
    if (!detailHabit) return '';
    return getHabitFrequencyDisplayLabel(
      detailHabit.frequencyType,
      (detailHabit.frequencyConfig ?? {}) as Record<string, unknown>,
    );
  }, [detailHabit]);

  // reminder pill — habits store one optional daily reminderTime (empty = off)
  const alertPillLabel = useMemo(
    () => getHabitAlertPillLabel(detailHabit?.reminderTime),
    [detailHabit?.reminderTime],
  );

  // merge today's list row with detail record so increment + heatmap stay in sync on this screen
  const todayRow: HabitTodayItem | null = useMemo(() => {
    const fromToday = todayHabits.find((h) => h.id === habitId);
    if (fromToday) return fromToday;
    if (!detailHabit) return null;
    return {
      id: detailHabit.id,
      title: detailHabit.title,
      iconKey: detailHabit.iconKey,
      color: detailHabit.color,
      trackingType: detailHabit.trackingType,
      targetValue: detailHabit.targetValue,
      loggedValue: 0,
      unitLabel: detailHabit.unitLabel,
      isCompleteToday: false,
      currentStreak: detailStats?.currentStreak ?? 0,
      longestStreak: detailStats?.longestStreak ?? 0,
      frequencyType: detailHabit.frequencyType,
      reminderTime: detailHabit.reminderTime ?? '',
      heatmap: detailStats?.heatmap ?? { startDate: '', days: 365, completedDates: [], dayScores: {} },
    };
  }, [todayHabits, habitId, detailHabit, detailStats]);

  const heatmapBase = detailStats?.heatmap;
  const { handleIncrement, displayHabit } = useHabitIncrementPress(todayRow ?? undefined, {
    heatmapBase,
  });

  const incrementDisplay = displayHabit ? getHabitIncrementDisplay(displayHabit) : null;
  const heatmapToShow = displayHabit?.heatmap ?? heatmapBase;
  const ringColors = useMemo(
    () => getHabitProgressRingColors(detailHabit?.color ?? 'green'),
    [detailHabit?.color],
  );
  const progressRatio =
    incrementDisplay && incrementDisplay.target > 0
      ? incrementDisplay.current / incrementDisplay.target
      : 0;
  const showTodayProgress = Boolean(todayRow && incrementDisplay);

  const handleEdit = useCallback(() => {
    // edit stays on the habits tab stack modal — push after closing detail so sheets do not stack awkwardly
    onClose();
    router.push(`/(tabs)/habits/${habitId}/edit` as any);
  }, [router, habitId, onClose]);

  const handleDescriptionBlur = useCallback(() => {
    if (!detailHabit) return;
    const trimmed = description.trim();
    if (trimmed === savedDescriptionRef.current) return;

    void (async () => {
      try {
        // partial PATCH — only description so frequency / color / etc stay untouched
        await updateHabit(habitId, { description: trimmed });
        savedDescriptionRef.current = trimmed;
      } catch (e) {
        Alert.alert('Could not save description', e instanceof Error ? e.message : 'Try again');
        setDescription(savedDescriptionRef.current);
        // Description keeps its own local state — bump key so it remounts with reverted text
        setDescriptionFieldKey((key) => key + 1);
      }
    })();
  }, [description, detailHabit, habitId, updateHabit]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete habit', 'This habit will be removed from your lists.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteHabit(habitId);
              onClose();
            } catch (e) {
              Alert.alert('Could not delete', e instanceof Error ? e.message : 'Try again');
            }
          })();
        },
      },
    ]);
  }, [habitId, deleteHabit, onClose]);

  const actionsMenuItems = useMemo((): ActionContextMenuItem[] => {
    return [
      {
        id: 'edit',
        label: 'Edit habit',
        icon: 'create-outline',
        onPress: handleEdit,
      },
      {
        id: 'delete',
        label: 'Delete habit',
        destructive: true,
        systemImage: 'trash.fill',
        iconComponent: (color) => (
          <Ionicons name="trash-outline" size={20} color={color} />
        ),
        onPress: handleDelete,
      },
    ];
  }, [handleEdit, handleDelete]);

  const incrementAccessibilityLabel =
    showTodayProgress && incrementDisplay
      ? displayHabit!.isCompleteToday
        ? `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}. Tap to reset.`
        : `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}. Tap to add one.`
      : undefined;

  const titleRingAccessibilityLabel =
    showTodayProgress && incrementDisplay
      ? `Today's progress ${incrementDisplay.current} of ${incrementDisplay.target}`
      : undefined;

  // drag pill sizing — same as TaskScreenContent / ModalHeader
  const iosVersion =
    Platform.OS === 'ios'
      ? typeof Platform.Version === 'string'
        ? parseInt(Platform.Version.split('.')[0], 10)
        : Math.floor(Platform.Version as number)
      : 0;
  const isNewerIOS = iosVersion >= 15;
  const pillWidth = isNewerIOS ? 36 : 42;
  const pillHeight = isNewerIOS ? 5 : 6;
  const pillRadius = isNewerIOS ? 2 : 3;

  const screenBg = { backgroundColor: themeColors.background.primary() };

  if (isDetailLoading && !detailHabit) {
    return (
      <View style={[styles.container, styles.centered, screenBg]}>
        <ActivityIndicator color={themeColors.text.secondary()} />
      </View>
    );
  }

  if (detailError && !detailHabit) {
    return (
      <View style={[styles.container, styles.centered, screenBg]}>
        <Text style={[styles.errorText, { color: themeColors.text.secondary() }]}>{detailError}</Text>
      </View>
    );
  }

  if (!detailHabit) return null;

  return (
    // collapsable: false — RNScreens formSheet expects scroll + header overlay as two stable subviews
    <View style={[styles.container, screenBg]} collapsable={false}>
      <ScrollView
        style={[styles.scroll, screenBg]}
        contentContainerStyle={[styles.scrollContent, { paddingTop: SCROLL_PADDING_TOP }]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          {showTodayProgress && incrementDisplay ? (
            <View style={styles.titleRingWrap}>
              <HabitProgressRing
                current={incrementDisplay.current}
                target={incrementDisplay.target}
                isComplete={displayHabit!.isCompleteToday}
                color={ringColors.progress}
                trackColor={ringColors.track}
                size={HABIT_DETAIL_TITLE_RING_SIZE}
                strokeWidth={HABIT_DETAIL_TITLE_RING_STROKE_WIDTH}
                showCenterLabel={false}
                showCenterPlus={false}
                showRing
                accessibilityLabel={titleRingAccessibilityLabel}
              />
              <Pressable
                onPress={handleEdit}
                style={[
                  styles.colorPaletteBadge,
                  { backgroundColor: themeColors.background.darkOverlay() },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Change habit color"
                hitSlop={Paddings.touchTargetSmall}
              >
                <Ionicons
                  name="color-palette"
                  size={HABIT_DETAIL_INCREMENT_COLOR_BADGE_ICON_SIZE}
                  color={themeColors.text.primary()}
                />
              </Pressable>
            </View>
          ) : null}
          <View
            style={[
              styles.titleInputWrap,
              !(showTodayProgress && incrementDisplay) && styles.titleInputWrapNoRing,
            ]}
          >
            <Text style={titleStyle} numberOfLines={2}>
              {title}
            </Text>
            {/* dashed underline — same spacing as TaskScreenContent title row */}
            <DashedSeparator style={styles.titleDashedSeparator} />
            <View style={styles.titleSpacer} />
          </View>
        </View>

        {detailStats && heatmapToShow ? (
          <View style={styles.sectionBreak}>
            <HabitHeatmap heatmap={heatmapToShow} color={detailHabit.color} showLegend />
          </View>
        ) : (
          <View style={[styles.statsLoading, styles.sectionBreak]}>
            <ActivityIndicator color={themeColors.text.secondary()} />
          </View>
        )}

        {showTodayProgress && incrementDisplay ? (
          <View style={[styles.todayProgressSection, styles.sectionBreak]}>
            <Text style={styles.todayScore}>
              <Text style={[styles.todayScore, { color: themeColors.text.tertiary() }]}>
                Today&apos;s progress:{' '}
              </Text>
              <Text style={[styles.todayScore, { color: themeColors.text.secondary() }]}>
                {incrementDisplay.scoreLabel}
              </Text>
            </Text>
            <View style={styles.progressRow}>
              <View style={styles.progressBarWrap}>
                <HabitProgressBar
                  progress={progressRatio}
                  fillColor={ringColors.progress}
                  trackColor={ringColors.track}
                />
              </View>
              <View style={styles.incrementSlotWrap}>
                <HabitProgressRing
                  onPress={handleIncrement}
                  style={styles.incrementSlot}
                  accessibilityLabel={incrementAccessibilityLabel}
                  current={incrementDisplay.current}
                  target={incrementDisplay.target}
                  isComplete={displayHabit!.isCompleteToday}
                  color={ringColors.progress}
                  trackColor={ringColors.track}
                  iconColor={ringColors.icon}
                  size={HABIT_DETAIL_INCREMENT_SIZE}
                  strokeWidth={HABIT_DETAIL_INCREMENT_RING_STROKE_WIDTH}
                  plusIconSize={HABIT_DETAIL_INCREMENT_PLUS_ICON_SIZE}
                  plusStrokeWidth={HABIT_DETAIL_INCREMENT_PLUS_STROKE_WIDTH}
                  tickIconSize={HABIT_DETAIL_INCREMENT_TICK_ICON_SIZE}
                  showCenterLabel={false}
                  showCenterPlus
                  showRing={false}
                />
              </View>
            </View>
          </View>
        ) : null}

        {detailHabit && completionsPerDay != null ? (
          <View style={[styles.detailFormSection, styles.sectionBreak]}>
            <View style={styles.groupedCard}>
              <GroupedList containerStyle={styles.listContainer} {...habitDetailListProps}>
                <FormDetailButton
                  key="frequency"
                  iconComponent={
                    <SFSymbolIcon
                      name="repeat"
                      size={18}
                      color={groupedListIconColor}
                      fallback={
                        <RepeatIcon size={18} color={groupedListIconColor} />
                      }
                    />
                  }
                  label="Frequency"
                  value={frequencyValue}
                  onPress={handleEdit}
                  showChevron
                />

                <FormDetailButton
                  key="completion-count"
                  iconComponent={
                    <SFSymbolIcon
                      name="number.circle"
                      size={18}
                      color={groupedListIconColor}
                      fallback={
                        <Ionicons name="ellipse-outline" size={18} color={groupedListIconColor} />
                      }
                    />
                  }
                  label="Completion Count"
                  value={completionCountValue}
                  onPress={handleEdit}
                  showChevron
                />

                <FormDetailButton
                  key="list"
                  iconComponent={
                    <SFSymbolIcon
                      name="tray.fill"
                      size={18}
                      color={groupedListIconColor}
                      fallback={
                        <Ionicons name="file-tray" size={18} color={groupedListIconColor} />
                      }
                    />
                  }
                  label="List"
                  value="Habits"
                  onPress={handleEdit}
                  showChevron
                />
              </GroupedList>
            </View>

            {/* bell pill below grouped list — same chrome as task FormDetailSection alerts row */}
            <View style={styles.pillRow}>
              <Pressable
                style={styles.alertPillTapArea}
                hitSlop={{
                  top: Paddings.touchTarget,
                  bottom: Paddings.touchTarget,
                  left: Paddings.touchTarget,
                  right: Paddings.touchTarget,
                }}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleEdit();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Reminder: ${alertPillLabel}`}
              >
                <View
                  style={[
                    styles.alertPill,
                    { backgroundColor: themeColors.background.primarySecondaryBlend() },
                  ]}
                >
                  <SFSymbolIcon
                    name="bell.fill"
                    size={18}
                    color={groupedListIconColor}
                    fallback={
                      <View style={styles.alertPillIcon}>
                        <BellIcon size={18} color={groupedListIconColor} isSolid />
                      </View>
                    }
                    style={styles.alertPillIcon}
                  />
                  <Text
                    style={[styles.alertPillText, { color: themeColors.text.primary() }]}
                    numberOfLines={1}
                  >
                    {alertPillLabel}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : null}

        {descriptionHydrated ? (
          <HabitDescriptionSection
            description={description}
            onDescriptionChange={setDescription}
            onBlur={handleDescriptionBlur}
            habitColor={(detailHabit.color ?? 'green') as HabitColor}
            listIconColor={groupedListIconColor}
            descriptionInputKey={`${habitId}-${descriptionFieldKey}`}
          />
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.headerContainer} collapsable={false} pointerEvents="box-none">
        <View style={[styles.headerWrap, { height: HEADER_STRIP_HEIGHT }]} pointerEvents="box-none">
          <View style={styles.actionsButtonWrap} pointerEvents="box-none">
            <ActionContextMenu
              items={actionsMenuItems}
              style={styles.actionsButton}
              accessibilityLabel="Habit actions"
              tint="primary"
              dropdownAnchorTopOffset={Paddings.taskEditActionsDropdownTopOffset}
              dropdownAnchorRightOffset={Paddings.screen}
            />
          </View>
          <View style={[styles.dragIndicatorWrap, { top: 6 }]} pointerEvents="none">
            <View
              style={[
                styles.dragIndicatorPill,
                {
                  width: pillWidth,
                  height: pillHeight,
                  borderRadius: pillRadius,
                  backgroundColor: themeColors.interactive.tertiary(),
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
) =>
  StyleSheet.create({
    container: { flex: 1 },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: Paddings.screen,
    },
    errorText: {
      ...typography.getTextStyle('body-medium'),
    },
    headerContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
    },
    headerWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    actionsButtonWrap: {
      position: 'absolute',
      top: Paddings.screen,
      right: Paddings.screen,
      zIndex: 11,
    },
    actionsButton: {
      backgroundColor: 'transparent',
    },
    dragIndicatorWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 1,
    },
    dragIndicatorPill: {},
    scroll: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    scrollContent: {
      padding: Paddings.screen,
      paddingBottom: Paddings.scrollBottomExtra,
    },
    // 12 matches task pickerSectionWrap / FormDetailSection repeatingRow marginTop
    sectionBreak: {
      marginTop: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    titleRingWrap: {
      width: HABIT_DETAIL_TITLE_RING_SIZE,
      height: HABIT_DETAIL_TITLE_RING_SIZE,
      marginTop: -6,
      marginRight: Paddings.groupedListIconTextSpacing + 4,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'visible',
    },
    titleInputWrap: {
      flex: 1,
      minWidth: 0,
      paddingRight: HABIT_DETAIL_TITLE_RING_SIZE + 16,
    },
    titleInputWrapNoRing: {
      paddingRight: Paddings.none,
    },
    titleDashedSeparator: {
      marginTop: 8,
    },
    titleSpacer: {
      height: 8,
    },
    detailFormSection: {
      width: '100%',
      overflow: 'visible',
    },
    groupedCard: {
      overflow: 'hidden',
      borderRadius: Paddings.groupedListBorderRadius,
    },
    listContainer: {
      marginVertical: 0,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      // 12 matches task FormDetailSection repeatingRow — gap from grouped list to pills
      marginTop: 12,
      gap: Paddings.formDataPillRowGap,
    },
    alertPillTapArea: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      minHeight: 48,
    },
    alertPillIcon: {
      marginRight: Paddings.formDataPillIconGap,
    },
    alertPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingVertical: Paddings.formDataPillVertical,
      paddingHorizontal: Paddings.formDataPillHorizontal,
      borderRadius: Paddings.formDataPillRadius,
      overflow: 'hidden',
    },
    alertPillText: {
      ...typography.getTextStyle('body-large'),
    },
    todayProgressSection: {
      width: '100%',
      gap: HABIT_DETAIL_PROGRESS_BAR_TOP_GAP,
    },
    todayScore: {
      ...typography.getTextStyle('body-medium'),
      fontVariant: ['tabular-nums'],
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Paddings.groupedListIconTextSpacing,
    },
    progressBarWrap: {
      flex: 1,
      minWidth: 0,
    },
    incrementSlotWrap: {
      width: HABIT_DETAIL_INCREMENT_SIZE,
      height: HABIT_DETAIL_INCREMENT_SIZE,
      flexShrink: 0,
      position: 'relative',
    },
    incrementSlot: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorPaletteBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: HABIT_DETAIL_INCREMENT_COLOR_BADGE_SIZE,
      height: HABIT_DETAIL_INCREMENT_COLOR_BADGE_SIZE,
      borderRadius: HABIT_DETAIL_INCREMENT_COLOR_BADGE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      elevation: 100,
    },
    statsLoading: {
      paddingVertical: Paddings.section,
      alignItems: 'center',
    },
    bottomSpacer: {
      height: 120,
    },
  });
