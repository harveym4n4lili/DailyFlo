/**
 * habit detail body — root formSheet modal shell (matches TaskScreenContent layout: drag pill + scroll + overflow menu).
 * content layout: title → heatmap + legend → today's progress → grouped list (frequency | completion count | list) → alert pill → description.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Pressable,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { GroupedList, FormDetailButton } from '@/components/ui/List/GroupedList';
import { ActionContextMenu, type ActionContextMenuItem } from '@/components/ui';
import { SaveButton } from '@/components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { DashedSeparator } from '@/components/ui/borders';
import { Paddings } from '@/constants/Paddings';
import { getTypographyStyle } from '@/constants/Typography';
import { getTaskColorValue } from '@/utils/taskColors';
import { useHabits, useLists } from '@/store/hooks';
import { useHabitIncrementPress } from '@/hooks/useHabitIncrementPress';
import { HabitHeatmap } from './HabitHeatmap';
import { HabitProgressBar } from '../list/HabitProgressBar';
import { HabitProgressRing } from '../list/HabitProgressRing';
import { HabitProgressScoreLabel } from '../list/HabitProgressScoreLabel';
import { getHabitIncrementDisplay } from '../list/habitIncrementDisplay';
import {
  formatHabitProgressAccessibilityLabel,
  resolveHabitProgressLabelVariant,
} from '../list/habitProgressLabel';
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
  buildHabitFrequencyConfig,
  deriveFrequencyFromScheduleDays,
  getHabitAlertPillLabel,
  getHabitFrequencyDisplayLabel,
  type HabitDetailFormValues,
} from '../forms/habitFormUtils';
import { HabitDescriptionSection } from '../forms/HabitDescriptionSection';
import { SFSymbolIcon, RepeatIcon, BellIcon } from '@/components/ui/Icon';
import type { HabitColor, HabitTodayItem } from '@/types/api/habits';

const HEADER_STRIP_HEIGHT = 48;
const SCROLL_PADDING_TOP = HEADER_STRIP_HEIGHT + 8;

/** stack picker routes — parent seeds CreateHabitDraftContext before push */
export type HabitDetailPickerHandlers = {
  onShowCompletionsPicker?: () => void;
  onShowFrequencyPicker?: () => void;
  onShowReminderPicker?: () => void;
  onShowListPicker?: () => void;
  onShowColorPicker?: () => void;
};

type HabitDetailScreenContentProps = {
  habitId: string;
  onClose: () => void;
  values: HabitDetailFormValues;
  onChange: <K extends keyof HabitDetailFormValues>(key: K, v: HabitDetailFormValues[K]) => void;
  hasChanges: boolean;
  onSave: () => void;
  isSaving?: boolean;
  validationError?: string | null;
  pickerHandlers?: HabitDetailPickerHandlers;
};

export function HabitDetailScreenContent({
  habitId,
  onClose,
  values,
  onChange,
  hasChanges,
  onSave,
  isSaving = false,
  validationError,
  pickerHandlers,
}: HabitDetailScreenContentProps) {
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
  } = useHabits();
  const { lists: reduxLists } = useLists();

  const titleInputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // refresh habit + stats when sheet gains focus (e.g. returning from a picker route)
  useFocusEffect(
    useCallback(() => {
      void fetchToday();
      void fetchHabit(habitId);
      void fetchHabitStats(habitId);
      // do not clearHabitDetail here — root picker routes are stack siblings; blur would empty the sheet behind them (task edit keeps redux task loaded the same way)
    }, [habitId, fetchToday, fetchHabit, fetchHabitStats]),
  );

  const titleColor = useMemo(
    () => getTaskColorValue(values.color ?? detailHabit?.color ?? 'green', 300),
    [values.color, detailHabit?.color],
  );
  const groupedListIconColor = titleColor;
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const titleStyle = useMemo(
    () => [
      getTypographyStyle('heading-2', typographyPlatform),
      {
        color: titleColor,
        maxHeight: 68,
        paddingBottom: Paddings.none,
        paddingHorizontal: Paddings.none,
      },
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

  // daily goal from merged form values — shown on Completion Count row
  const completionsPerDay = values.completionsPerDay;

  const completionCountValue = useMemo(() => {
    return completionsPerDay === 1 ? '1 completion' : `${completionsPerDay} completions`;
  }, [completionsPerDay]);

  const frequencyValue = useMemo(() => {
    const { frequencyType, dayOfWeek, customDays } = deriveFrequencyFromScheduleDays(values.scheduleDays);
    return getHabitFrequencyDisplayLabel(
      frequencyType,
      buildHabitFrequencyConfig(frequencyType, dayOfWeek, '', customDays) as Record<string, unknown>,
    );
  }, [values.scheduleDays]);

  const alertPillLabel = useMemo(
    () => getHabitAlertPillLabel(values.reminderTime),
    [values.reminderTime],
  );

  // list row label — draft pickedListId until backend exposes habit listId on API
  const listRowValue = useMemo(() => {
    const picked = values.listId;
    if (picked === undefined || picked === null) return 'Habits';
    const match = reduxLists.find((l) => l.id === picked && !l.softDeleted);
    return match?.name ?? 'Habits';
  }, [values.listId, reduxLists]);

  // only use today's API row — habits not due today have no increment/progress block on detail
  const todayRow: HabitTodayItem | null = useMemo(
    () => todayHabits.find((h) => h.id === habitId) ?? null,
    [todayHabits, habitId],
  );

  const heatmapBase = detailStats?.heatmap;
  const { handleIncrement, displayHabit } = useHabitIncrementPress(todayRow ?? undefined, {
    heatmapBase,
  });

  const incrementDisplay = displayHabit ? getHabitIncrementDisplay(displayHabit) : null;
  const heatmapToShow = displayHabit?.heatmap ?? heatmapBase;
  const ringColors = useMemo(
    () => getHabitProgressRingColors(values.color ?? detailHabit?.color ?? 'green'),
    [values.color, detailHabit?.color],
  );
  const progressRatio =
    incrementDisplay && incrementDisplay.target > 0
      ? incrementDisplay.current / incrementDisplay.target
      : 0;
  const showTodayProgress = Boolean(todayRow && incrementDisplay);
  const progressLabelVariant = resolveHabitProgressLabelVariant({
    isTodayInteractive: showTodayProgress,
  });

  const handleAdvancedEdit = useCallback(() => {
    onClose();
    router.push(`/(tabs)/habits/${habitId}/edit` as any);
  }, [router, habitId, onClose]);

  const handleShowCompletionsPicker = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickerHandlers?.onShowCompletionsPicker?.();
  }, [pickerHandlers]);

  const handleShowFrequencyPicker = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickerHandlers?.onShowFrequencyPicker?.();
  }, [pickerHandlers]);

  const handleShowReminderPicker = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickerHandlers?.onShowReminderPicker?.();
  }, [pickerHandlers]);

  const handleShowListPicker = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickerHandlers?.onShowListPicker?.();
  }, [pickerHandlers]);

  const handleShowColorPicker = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickerHandlers?.onShowColorPicker?.();
  }, [pickerHandlers]);

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
        onPress: handleAdvancedEdit,
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
  }, [handleAdvancedEdit, handleDelete]);

  const incrementAccessibilityLabel =
    showTodayProgress && incrementDisplay
      ? formatHabitProgressAccessibilityLabel(
          progressLabelVariant,
          incrementDisplay.current,
          incrementDisplay.target,
          displayHabit!.isCompleteToday ? 'tap-reset' : 'tap-add',
        )
      : undefined;

  const titleRingAccessibilityLabel =
    showTodayProgress && incrementDisplay
      ? formatHabitProgressAccessibilityLabel(
          progressLabelVariant,
          incrementDisplay.current,
          incrementDisplay.target,
        )
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

  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const saveButtonBottom =
    keyboardHeight > 0 ? keyboardHeight + 72 : insets.bottom + 44;
  const animatedBottom = useSharedValue(saveButtonBottom);
  useEffect(() => {
    animatedBottom.value = withTiming(saveButtonBottom, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [saveButtonBottom, animatedBottom]);
  const animatedSaveBarStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: animatedBottom.value,
  }));

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
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: SCROLL_PADDING_TOP,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 32 : 160,
          },
        ]}
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
                onPress={handleShowColorPicker}
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
            <TextInput
              ref={titleInputRef}
              value={values.title}
              onChangeText={(t) => onChange('title', t)}
              placeholder="Habit name"
              placeholderTextColor={themeColors.text.tertiary()}
              selectionColor="#FFFFFF"
              cursorColor="#FFFFFF"
              style={titleStyle}
              multiline
              numberOfLines={2}
              scrollEnabled
              returnKeyType="next"
              accessibilityLabel="Habit name"
            />
            {/* dashed underline — same spacing as TaskScreenContent title row */}
            <DashedSeparator style={styles.titleDashedSeparator} />
            <View style={styles.titleSpacer} />
          </View>
        </View>

        {detailStats && heatmapToShow ? (
          <View style={styles.sectionBreak}>
            <HabitHeatmap heatmap={heatmapToShow} color={values.color ?? detailHabit.color} showLegend />
          </View>
        ) : (
          <View style={[styles.statsLoading, styles.sectionBreak]}>
            <ActivityIndicator color={themeColors.text.secondary()} />
          </View>
        )}

        {showTodayProgress && incrementDisplay ? (
          <View style={[styles.todayProgressSection, styles.sectionBreak]}>
            <HabitProgressScoreLabel
              variant={progressLabelVariant}
              scoreLabel={incrementDisplay.scoreLabel}
              textStyle={styles.todayScore}
            />
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

        {detailHabit ? (
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
                  onPress={handleShowFrequencyPicker}
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
                  onPress={handleShowCompletionsPicker}
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
                  value={listRowValue}
                  onPress={handleShowListPicker}
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
                onPress={handleShowReminderPicker}
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

        <HabitDescriptionSection
          description={values.description}
          onDescriptionChange={(text) => onChange('description', text)}
          habitColor={(values.color ?? detailHabit.color ?? 'green') as HabitColor}
          listIconColor={groupedListIconColor}
          descriptionInputKey={habitId}
        />

        {validationError ? (
          <Text style={[styles.errorText, { color: themeColors.text.secondary(), marginTop: 8 }]}>
            {validationError}
          </Text>
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
        <View
          pointerEvents="box-none"
          style={[styles.saveOverlayWrap, { width: windowWidth, height: windowHeight }]}
        >
          <Animated.View
            pointerEvents="box-none"
            style={[
              animatedSaveBarStyle,
              {
                left: 0,
                right: 0,
                width: windowWidth,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingHorizontal: Paddings.groupedListContentHorizontal,
              },
            ]}
          >
            <SaveButton
              onPress={onSave}
              isLoading={isSaving}
              taskCategoryColor={values.color ?? detailHabit.color}
              text="Save"
              loadingText="Saving..."
              size={28}
              iconSize={28}
              visible={hasChanges}
              showLabel
            />
          </Animated.View>
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
    saveOverlayWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2,
    },
  });
