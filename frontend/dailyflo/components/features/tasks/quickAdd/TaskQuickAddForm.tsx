/**
 * task quick-add form body.
 * title row matches TaskScreenContent. optional subtask/description GroupedList (showSubtasksAndDescription, default off) matches SubtaskSection when enabled.
 * chip row: Date, Length (time-duration stack), Repeat (ios: SwiftUI Menu like FormDetailSection; android: DropdownList), Alert — same pill chrome as inbox row.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DynamicColorIOS,
  InteractionManager,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Host, Menu, Button } from '@expo/ui/swift-ui';
import { Ionicons } from '@expo/vector-icons';
import GlassView from 'expo-glass-effect/build/GlassView';

import {
  Checkbox,
  CHECKBOX_SIZE_TASK_VIEW,
  getDatePickerDisplay,
  getTimeDurationPickerDisplay,
  getAlertsPickerDisplay,
} from '@/components/ui/Button';
import { DashedSeparator } from '@/components/ui/borders';
import { DropdownList } from '@/components/ui/List';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { Description } from '@/components/features/tasks/TaskScreen/sections/Description';
import { SubtaskCreateButton, SubtaskListItem } from '@/components/features/tasks/TaskScreen/subtask';
import {
  BellIcon,
  CalendarIcon,
  ClockIcon,
  RepeatIcon,
  SaveIcon,
  SFSymbolIcon,
  SparklesIcon,
} from '@/components/ui/Icon';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useAppDispatch } from '@/store';
import { useTasks } from '@/store/hooks';
import { createTask } from '@/store/slices/tasks/tasksSlice';
import { validateAll } from '@/components/forms/TaskForm/TaskValidation';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle, getTypographyStyle } from '@/constants/Typography';
import type { CreateTaskInput, RoutineType, Subtask as TaskSubtask } from '@/types';

// same labels as FormDetailSection repeating menu — keeps quick-add repeat options aligned with task create
const ROUTINE_TYPE_LABELS: Record<RoutineType, string> = {
  once: 'Once',
  daily: 'Every day',
  weekly: 'Once a week',
  monthly: 'Once a month',
  yearly: 'Once a year',
};
const ROUTINE_MENU_OPTIONS: { id: RoutineType; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Every day' },
  { id: 'weekly', label: 'Once a week' },
  { id: 'monthly', label: 'Once a month' },
  { id: 'yearly', label: 'Once a year' },
];

// circular primary action — same diameter idea as tab FAB; glass on ios via expo-glass-effect
const QUICK_ADD_PRIMARY_FAB_SIZE = 48;
// stroke on an absolute layer so the pill’s yoga box stays identical to FormDetailSection repeatingPill (padding-only outer size)
const QUICK_ADD_PILL_BORDER_WIDTH = 1.25;

// local row shape for quick-add ui (mirrors task create subtasks before save)
type QuickAddSubtaskRow = { id: string; title: string; isCompleted: boolean };

function newSubtaskId() {
  return `qa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// shared pill body (border + padding) — used by pressable chips and by ios swiftui Menu label for repeat
function QuickAddPillChrome({
  icon,
  label,
  textColor,
}: {
  icon: React.ReactNode;
  label: string;
  textColor: string;
}) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.pillSurfaceShell}>
      <View
        pointerEvents="none"
        style={[
          styles.pillSurfaceBorderRing,
          {
            borderWidth: QUICK_ADD_PILL_BORDER_WIDTH,
            borderColor: themeColors.border.secondary(),
          },
        ]}
      />
      <View style={[styles.pillSurfaceInner, { backgroundColor: 'transparent' }]}>
        <View style={styles.pillIcon}>{icon}</View>
        <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

// pill padding/radius match repeatingPill; border is inset via overlay so size does not grow vs task view pills
type QuickAddListChromePillProps = {
  /** same assets as FormDetailSection / FormDetailButton (sf symbol + custom fallback) */
  icon: React.ReactNode;
  label: string;
  textColor: string;
  onPress: () => void;
  accessibilityLabel: string;
};

function QuickAddListChromePill({
  icon,
  label,
  textColor,
  onPress,
  accessibilityLabel,
}: QuickAddListChromePillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.pillTapArea}
      hitSlop={{ top: Paddings.touchTarget, bottom: Paddings.touchTarget, left: Paddings.touchTarget, right: Paddings.touchTarget }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <QuickAddPillChrome icon={icon} label={label} textColor={textColor} />
    </Pressable>
  );
}

export interface TaskQuickAddFormProps {
  /** wired from task-quick-add screen so useFocusEffect there can refocus after stack pickers pop */
  titleInputRef: React.RefObject<TextInput | null>;
  /** overlay sets false while dismissing so alert/backdrop cannot reopen the keyboard on the title field */
  titleFocusAllowedRef: React.MutableRefObject<boolean>;
  /**
   * when true, show the GroupedList with subtasks + description (like task create).
   * default false keeps quick add minimal; enable via TaskQuickAddOverlay or route ?showSubtasks=1
   */
  showSubtasksAndDescription?: boolean;
  /** parent (overlay) keeps a ref to this for backdrop/back: show native discard dialog when closing with edits */
  onHasUnsavedWorkChange?: (hasUnsaved: boolean) => void;
}

export function TaskQuickAddForm({
  titleInputRef,
  titleFocusAllowedRef,
  showSubtasksAndDescription = false,
  onHasUnsavedWorkChange,
}: TaskQuickAddFormProps) {
  const themeColors = useThemeColors();
  // empty chrome pills + inbox row: interactive.active is one step darker/dimmer than text.primary in both themes
  const pillChromeDefaultColor = themeColors.interactive.active();
  // colors palette gives semantic + task category colors (e.g. success for "Today")
  const colors = useColorPalette();
  // pickers persist their selections in the same draft slice that task create uses
  const { draft, setDraft } = useCreateTaskDraft();
  const router = useGuardedRouter();
  const dispatch = useAppDispatch();
  const { themeColor } = useThemeColor();
  const { isCreating } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleChecked, setTitleChecked] = useState(false);
  const [subtasks, setSubtasks] = useState<QuickAddSubtaskRow[]>([]);
  const [pendingFocusSubtaskId, setPendingFocusSubtaskId] = useState<string | null>(null);
  // repeat pill opens this menu; writes routineType into CreateTaskDraft (no stack screen for recurrence)
  const [repeatMenuVisible, setRepeatMenuVisible] = useState(false);

  // recurrence menu steals focus; when it closes (pick or dismiss on android), put caret back in title like after stack pickers
  const refocusTitleInput = useCallback(() => {
    const focus = () => {
      if (!titleFocusAllowedRef.current) return;
      titleInputRef.current?.focus();
    };
    InteractionManager.runAfterInteractions(() => {
      focus();
      setTimeout(focus, 50);
      setTimeout(focus, 150);
      setTimeout(focus, 300);
    });
  }, [titleInputRef, titleFocusAllowedRef]);

  // same platform pick as TaskScreenContent so heading-2 uses the right Inter font file per os
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';

  const handleCreateSubtask = () => {
    const id = newSubtaskId();
    setSubtasks((prev) => [...prev, { id, title: '', isCompleted: false }]);
    setPendingFocusSubtaskId(id);
  };

  const handleSubtaskTitleChange = (subtaskId: string, newTitle: string) => {
    setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, title: newTitle } : s)));
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s)),
    );
  };

  // same as SubtaskSection when onSubtaskDelete is set — removes row and clears pending focus if needed
  const handleSubtaskDelete = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    setPendingFocusSubtaskId((pending) => (pending === subtaskId ? null : pending));
  };

  // shared draft seeding before pushing a stack picker — mirrors handlers in TaskScreenContent.
  // we always send a non-undefined dueDate so date-select renders today by default the first time.
  const seedDraftForPickers = useCallback(() => {
    setDraft({
      dueDate: draft.dueDate ?? new Date().toISOString(),
      time: draft.time,
      duration: draft.duration,
      alerts: draft.alerts ?? [],
      routineType: draft.routineType ?? 'once',
    });
  }, [draft.alerts, draft.dueDate, draft.duration, draft.routineType, draft.time, setDraft]);

  // open stack pickers — same routes as task create. keyboard dismisses on push and re-opens on focus return
  const handleOpenDatePicker = useCallback(() => {
    Keyboard.dismiss();
    seedDraftForPickers();
    router.push('/date-select');
  }, [router, seedDraftForPickers]);

  const handleOpenTimeDurationPicker = useCallback(() => {
    Keyboard.dismiss();
    seedDraftForPickers();
    router.push('/time-duration-select');
  }, [router, seedDraftForPickers]);

  const handleOpenAlertsPicker = useCallback(() => {
    Keyboard.dismiss();
    seedDraftForPickers();
    router.push('/alert-select');
  }, [router, seedDraftForPickers]);

  // selected/empty state per pill — "selected" means user has chosen a non-empty value
  const hasDeadline = !!draft.dueDate;
  const hasDuration = !!draft.time || (typeof draft.duration === 'number' && draft.duration > 0);
  const hasAlerts = (draft.alerts?.length ?? 0) > 0;
  const routineType = draft.routineType ?? 'once';
  const hasRepeat = routineType !== 'once';

  // computed display text/colors (only used when pill is selected)
  const dateDisplay = hasDeadline ? getDatePickerDisplay(draft.dueDate, colors, themeColors) : null;
  const durationDisplay = hasDuration
    ? getTimeDurationPickerDisplay(draft.time, draft.duration, themeColors)
    : null;
  const alertsDisplay = hasAlerts
    ? getAlertsPickerDisplay(draft.alerts?.length ?? 0, themeColors)
    : null;

  // for deadline pill prefer the relative copy ("Today" / "Tomorrow" / "in 3 days") — falls back to formatted date
  const deadlineLabel = dateDisplay ? dateDisplay.secondaryText ?? dateDisplay.text : '';

  // icon colors for chips — match semantic picker state; assets match FormDetailSection / FormDetailButton
  const dateChipIconColor = hasDeadline && dateDisplay ? dateDisplay.iconColor : pillChromeDefaultColor;
  const durationChipIconColor =
    hasDuration && durationDisplay ? durationDisplay.iconColor : pillChromeDefaultColor;
  const repeatChipIconColor = hasRepeat ? themeColors.text.primary() : pillChromeDefaultColor;
  const alertsChipIconColor = hasAlerts && alertsDisplay ? alertsDisplay.iconColor : pillChromeDefaultColor;

  const repeatMenuItems = useMemo(
    () =>
      ROUTINE_MENU_OPTIONS.map((opt) => ({
        id: opt.id,
        label: opt.label,
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setDraft({ routineType: opt.id });
        },
      })),
    [setDraft],
  );

  // title filled → primary fab shows save (create task); empty → sparkles / ai hint. submit still blocked while request in flight
  const primaryActionIsCreate = title.trim().length > 0;
  const canSubmitTask = primaryActionIsCreate && !isCreating;

  // any local text, checkbox, subtask rows, or draft pickers differ from empty — overlay asks before dismiss
  const hasUnsavedWork = useMemo(() => {
    if (title.trim() !== '') return true;
    if (description.trim() !== '') return true;
    if (titleChecked) return true;
    if (subtasks.length > 0) return true;
    if (!!draft.dueDate) return true;
    if (!!draft.time) return true;
    if (typeof draft.duration === 'number' && draft.duration > 0) return true;
    if ((draft.alerts?.length ?? 0) > 0) return true;
    if ((draft.routineType ?? 'once') !== 'once') return true;
    if (typeof draft.pickedListId === 'string' && draft.pickedListId.length > 0) return true;
    return false;
  }, [
    title,
    description,
    titleChecked,
    subtasks,
    draft.dueDate,
    draft.time,
    draft.duration,
    draft.alerts,
    draft.routineType,
    draft.pickedListId,
  ]);

  useEffect(() => {
    onHasUnsavedWorkChange?.(hasUnsavedWork);
  }, [hasUnsavedWork, onHasUnsavedWorkChange]);

  const listIdForCreate =
    draft.pickedListId === undefined
      ? undefined
      : draft.pickedListId === null
        ? undefined
        : draft.pickedListId;

  const handlePrimaryFabPress = useCallback(async () => {
    if (!canSubmitTask) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    const formValues: TaskFormValues = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: draft.dueDate,
      time: draft.time,
      duration: draft.duration,
      routineType: draft.routineType ?? 'once',
      priorityLevel: 3,
      color: themeColor,
      listId: listIdForCreate,
      alerts: draft.alerts?.length ? draft.alerts : undefined,
    };
    const errors = validateAll(formValues);
    if (Object.keys(errors).length > 0) return;

    const taskSubtasks: TaskSubtask[] = subtasks.map((st, index) => ({
      id: st.id,
      title: st.title,
      isCompleted: st.isCompleted,
      sortOrder: index,
    }));

    const taskData: CreateTaskInput = {
      title: formValues.title,
      description: formValues.description,
      time: formValues.time || undefined,
      duration: formValues.duration || undefined,
      dueDate: formValues.dueDate || undefined,
      priorityLevel: formValues.priorityLevel || 3,
      color: formValues.color || themeColor,
      routineType: formValues.routineType || 'once',
      listId: listIdForCreate,
      isCompleted: titleChecked,
      metadata: {
        subtasks: taskSubtasks,
        reminders: [],
        notes: formValues.description,
        tags: [],
      },
    };

    try {
      const result = await dispatch(createTask(taskData));
      if (createTask.fulfilled.match(result)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setDraft({
          dueDate: undefined,
          time: undefined,
          duration: undefined,
          alerts: [],
          pickedListId: null,
          routineType: 'once',
        });
        setTitle('');
        setDescription('');
        setSubtasks([]);
        setTitleChecked(false);
        router.back();
      }
    } catch (e) {
      console.error('quick add create task:', e);
    }
  }, [
    canSubmitTask,
    description,
    dispatch,
    draft.alerts,
    draft.dueDate,
    draft.duration,
    draft.routineType,
    draft.time,
    listIdForCreate,
    router,
    setDraft,
    subtasks,
    themeColor,
    title,
    titleChecked,
  ]);

  const primaryFabRadius = QUICK_ADD_PRIMARY_FAB_SIZE / 2;
  const primaryFabGlassInnerRadius = Math.max(0, primaryFabRadius - 3);
  const primaryGlassTint =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          light: themeColors.primaryButton.fill(),
          dark: themeColors.primaryButton.fill(),
        })
      : themeColors.primaryButton.fill();
  // fab circle uses fill; icons use icon — caret/selection follow fill so ios/android don’t stick to system blue
  const primaryButtonFill = themeColors.primaryButton.fill();
  const primaryIconColor = themeColors.primaryButton.icon();

  return (
    <View style={styles.formTapRoot} pointerEvents="box-none">
      {/* tap empty glass / padding: refocus title; real controls sit above and keep their own touches */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={refocusTitleInput}
        accessible={false}
      />
      <View style={styles.formColumn} pointerEvents="box-none">
      <View style={styles.titleRow} pointerEvents="box-none">
        <View style={styles.checkboxWrap}>
          <Checkbox
            size={CHECKBOX_SIZE_TASK_VIEW}
            checked={titleChecked}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTitleChecked((v) => !v);
            }}
          />
        </View>
        {/* title column: right padding mirrors checkbox column so text and dashed line align like task screen */}
        <View style={styles.titleInputWrap} pointerEvents="box-none">
          {/* ios: view tint can drive uitextview caret when selectionColor alone stays system blue */}
          <View
            style={
              Platform.OS === 'ios'
                ? ({ alignSelf: 'stretch', tintColor: primaryButtonFill } as object)
                : { alignSelf: 'stretch' }
            }
          >
            <TextInput
            ref={titleInputRef}
            value={title}
            onChangeText={setTitle}
            onFocus={() => {
              // if overlay is closing, ios may still hand focus back after native alert — blur immediately so keyboard stays down
              if (!titleFocusAllowedRef.current) titleInputRef.current?.blur();
            }}
            placeholder="e.g., Answering emails"
            placeholderTextColor={themeColors.text.tertiary()}
            selectionColor={primaryButtonFill}
            cursorColor={primaryButtonFill}
            underlineColorAndroid="transparent"
            style={[
              getTypographyStyle('heading-3', typographyPlatform),
              {
                color: primaryIconColor,
                paddingBottom: Paddings.none,
                paddingHorizontal: Paddings.none,
                maxHeight: 68,
                textAlignVertical: 'top',
                // @ts-expect-error caretColor works on RN TextInput; @types/react-native TextStyle is incomplete
                caretColor: primaryButtonFill,
              },
            ]}
            multiline
            numberOfLines={2}
            scrollEnabled
            returnKeyType="next"
          />
          </View>
          {/* dashed underline under title — same component/spacing as TaskScreenContent */}
          <DashedSeparator style={{ marginTop: 8 }} />
          <View style={styles.titleSpacer} />
        </View>
      </View>

      {showSubtasksAndDescription ? (
        <View style={styles.subtaskSection}>
          <View style={styles.subtaskGroupedCard}>
            <GroupedList
              containerStyle={styles.subtaskListContainer}
              contentPaddingHorizontal={Paddings.groupedListContentHorizontal}
              contentPaddingVertical={Paddings.groupedListContentVertical}
              backgroundColor={themeColors.background.primarySecondaryBlend()}
              separatorColor={themeColors.border.primary()}
              separatorInsetRight={Paddings.groupedListContentHorizontal}
              separatorVariant="solid"
              borderRadius={24}
              minimalStyle={false}
              fullWidthSeparators={false}
              separatorConsiderIconColumn={true}
              iconColumnWidth={30}
            >
              {subtasks.map((s) => (
                <SubtaskListItem
                  key={s.id}
                  value={s.title}
                  onChangeText={(t) => handleSubtaskTitleChange(s.id, t)}
                  isCompleted={s.isCompleted}
                  onToggleComplete={() => handleSubtaskToggle(s.id)}
                  placeholder="Subtask"
                  onDelete={() => handleSubtaskDelete(s.id)}
                  shouldAutoFocus={s.id === pendingFocusSubtaskId}
                  onDidAutoFocus={() => setPendingFocusSubtaskId(null)}
                />
              ))}
              <SubtaskCreateButton onPress={handleCreateSubtask} />
              <Description
                description={description}
                onDescriptionChange={setDescription}
                isEditing
                taskColor="blue"
                showIcon
                useInitialMinHeight={false}
              />
            </GroupedList>
          </View>
        </View>
      ) : null}

      {/* horizontal pickers slider — bleeds past formColumn padding so a selected pill can scroll fully off-edge.
          contentContainerStyle uses Paddings.screen so the first pill lines up with the title column (20pt). */}
      <View
        style={[styles.chipsBleed, !showSubtasksAndDescription && styles.chipsBleedTightToTitle]}
        pointerEvents="box-none"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chipsContent}
        >
          <QuickAddListChromePill
            icon={
              <SFSymbolIcon
                name="calendar"
                size={18}
                color={dateChipIconColor}
                fallback={<CalendarIcon size={18} color={dateChipIconColor} isSolid />}
              />
            }
            label={hasDeadline ? deadlineLabel : 'Date'}
            textColor={hasDeadline && dateDisplay ? dateDisplay.color : pillChromeDefaultColor}
            onPress={handleOpenDatePicker}
            accessibilityLabel={hasDeadline ? `Date: ${deadlineLabel}` : 'Date'}
          />

          <QuickAddListChromePill
            icon={
              <SFSymbolIcon
                name="clock.fill"
                size={18}
                color={durationChipIconColor}
                fallback={<ClockIcon size={18} color={durationChipIconColor} isSolid />}
              />
            }
            label={hasDuration && durationDisplay ? durationDisplay.text : 'Length'}
            textColor={
              hasDuration && durationDisplay ? durationDisplay.color : pillChromeDefaultColor
            }
            onPress={handleOpenTimeDurationPicker}
            accessibilityLabel={
              hasDuration && durationDisplay ? `Length: ${durationDisplay.text}` : 'Length'
            }
          />

          {Platform.OS === 'ios' ? (
            <View style={styles.quickAddRepeatMenuWrap} collapsable={false}>
              <Host matchContents={false} style={styles.quickAddRepeatHost}>
                <Menu
                  label={
                    <View style={styles.pillTapArea}>
                      <QuickAddPillChrome
                        icon={
                          <SFSymbolIcon
                            name="repeat"
                            size={18}
                            color={repeatChipIconColor}
                            fallback={<RepeatIcon size={18} color={repeatChipIconColor} />}
                          />
                        }
                        label={hasRepeat ? ROUTINE_TYPE_LABELS[routineType] : 'Repeat'}
                        textColor={
                          hasRepeat ? themeColors.text.primary() : pillChromeDefaultColor
                        }
                      />
                    </View>
                  }
                >
                  {ROUTINE_MENU_OPTIONS.map((opt) => (
                    <Button
                      key={opt.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setDraft({ routineType: opt.id });
                        refocusTitleInput();
                      }}
                      label={opt.label}
                    />
                  ))}
                </Menu>
              </Host>
            </View>
          ) : (
            <QuickAddListChromePill
              icon={
                <SFSymbolIcon
                  name="repeat"
                  size={18}
                  color={repeatChipIconColor}
                  fallback={<RepeatIcon size={18} color={repeatChipIconColor} />}
                />
              }
              label={hasRepeat ? ROUTINE_TYPE_LABELS[routineType] : 'Repeat'}
              textColor={hasRepeat ? themeColors.text.primary() : pillChromeDefaultColor}
              onPress={() => {
                Keyboard.dismiss();
                setRepeatMenuVisible(true);
              }}
              accessibilityLabel={
                hasRepeat ? `Repeat: ${ROUTINE_TYPE_LABELS[routineType]}` : 'Repeat'
              }
            />
          )}

          <QuickAddListChromePill
            icon={
              <SFSymbolIcon
                name="bell.fill"
                size={18}
                color={alertsChipIconColor}
                fallback={<BellIcon size={18} color={alertsChipIconColor} isSolid />}
              />
            }
            label={hasAlerts && alertsDisplay ? alertsDisplay.text : 'Alert'}
            textColor={hasAlerts && alertsDisplay ? alertsDisplay.color : pillChromeDefaultColor}
            onPress={handleOpenAlertsPicker}
            accessibilityLabel={hasAlerts && alertsDisplay ? `Alert: ${alertsDisplay.text}` : 'Alert'}
          />
        </ScrollView>
      </View>

      {Platform.OS !== 'ios' ? (
        <DropdownList
          visible={repeatMenuVisible}
          onClose={() => {
            setRepeatMenuVisible(false);
            refocusTitleInput();
          }}
          anchorPosition="bottom-left"
          leftOffset={Paddings.screen}
          items={repeatMenuItems}
        />
      ) : null}

      <View
        style={[
          styles.bottomSeparatorBleed,
          { backgroundColor: themeColors.border.primary() },
        ]}
        pointerEvents="none"
      />

      <View style={styles.bottomBar} pointerEvents="box-none">
        <Pressable
          style={[styles.pillTapArea, styles.bottomBarListPill]}
          hitSlop={{ top: Paddings.touchTarget, bottom: Paddings.touchTarget, left: Paddings.touchTarget, right: Paddings.touchTarget }}
          accessibilityRole="button"
          accessibilityLabel="List destination"
        >
          <View style={styles.pillSurfaceShell}>
            <View
              pointerEvents="none"
              style={[
                styles.pillSurfaceBorderRing,
                {
                  borderWidth: QUICK_ADD_PILL_BORDER_WIDTH,
                  borderColor: themeColors.border.secondary(),
                },
              ]}
            />
            <View style={[styles.pillSurfaceInner, { backgroundColor: 'transparent' }]}>
              <View style={styles.pillIcon}>
                <SFSymbolIcon
                  name="tray.fill"
                  size={18}
                  color={pillChromeDefaultColor}
                  fallback={
                    <Ionicons name="file-tray" size={18} color={pillChromeDefaultColor} />
                  }
                />
              </View>
              <Text style={[styles.pillText, { color: pillChromeDefaultColor }]}>Inbox</Text>
            </View>
          </View>
        </Pressable>
        {Platform.OS === 'ios' ? (
          <GlassView
            style={[
              styles.fabPrimaryGlass,
              {
                width: QUICK_ADD_PRIMARY_FAB_SIZE,
                height: QUICK_ADD_PRIMARY_FAB_SIZE,
                borderRadius: primaryFabRadius,
              },
            ]}
            glassEffectStyle="regular"
            tintColor={primaryGlassTint as any}
            isInteractive
          >
            <Pressable
              onPress={handlePrimaryFabPress}
              disabled={isCreating}
              style={[styles.fabPrimaryGlassInner, { borderRadius: primaryFabGlassInnerRadius }]}
              accessibilityRole="button"
              accessibilityLabel={
                primaryActionIsCreate ? 'Create task' : 'AI — add a title to create'
              }
              accessibilityState={{ disabled: isCreating }}
            >
              {primaryActionIsCreate ? (
                <SaveIcon size={24} color={primaryIconColor} />
              ) : (
                <SparklesIcon size={24} color={primaryIconColor} />
              )}
            </Pressable>
          </GlassView>
        ) : (
          <TouchableOpacity
            style={[
              styles.fabPrimaryFallback,
              {
                width: QUICK_ADD_PRIMARY_FAB_SIZE,
                height: QUICK_ADD_PRIMARY_FAB_SIZE,
                borderRadius: primaryFabRadius,
                backgroundColor: themeColors.background.elevated(),
                borderColor: themeColors.border.primary(),
              },
            ]}
            onPress={handlePrimaryFabPress}
            disabled={isCreating}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={primaryActionIsCreate ? 'Create task' : 'AI — add a title to create'}
            accessibilityState={{ disabled: isCreating }}
          >
            {primaryActionIsCreate ? (
              <SaveIcon size={24} color={themeColors.text.primary()} />
            ) : (
              <SparklesIcon size={24} color={themeColors.text.primary()} />
            )}
          </TouchableOpacity>
        )}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // wraps tap-to-focus layer + padded column so padding is still “empty” hit area
  formTapRoot: {
    position: 'relative',
    width: '100%',
  },
  formColumn: {
    paddingHorizontal: Paddings.screen,
    paddingTop: Platform.OS === 'ios' ? 26 : 22,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxWrap: {
    width: CHECKBOX_SIZE_TASK_VIEW,
    marginTop: -10,
    height: CHECKBOX_SIZE_TASK_VIEW,
    marginRight: Paddings.groupedListIconTextSpacing + 4,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // matches TaskScreenContent titleInputWrap when checkbox is visible (symmetric inset on the right)
  titleInputWrap: {
    flex: 1,
    minWidth: 0,
    paddingLeft: Paddings.none,
    paddingRight: CHECKBOX_SIZE_TASK_VIEW + 16,
  },
  titleSpacer: { height: 8 },
  // formColumn horizontal padding is Paddings.screen (20); subtask card sits inside that column (same as task SubtaskSection)
  subtaskSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  // one continuous background behind all rows; inner GroupedList keeps same borderRadius + per-row padding as default GroupedList
  subtaskGroupedCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  subtaskListContainer: {
    marginVertical: 0,
  },
  // bleed wrapper: cancels formColumn's horizontal screen padding so the slider runs edge-to-edge
  chipsBleed: {
    marginHorizontal: -Paddings.screen,
    marginBottom: 8,
  },
  // when subtask block is hidden, add top gap so title → pills matches the old title → subtask margin
  chipsBleedTightToTitle: {
    marginTop: 12,
  },
  // horizontal inset matches formColumn; paddingTop only — bottom padding would add extra space above the full-bleed rule (match 12pt: pills↔rule = rule↔buttons via chipsBleed.marginBottom + bottomSeparatorBleed.marginBottom)
  chipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Paddings.formDataPillRowGap,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: Paddings.screen,
  },
  // full-width rule above list pill + FAB — cancel formColumn horizontal padding (same bleed idea as chipsBleed)
  bottomSeparatorBleed: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -Paddings.screen,
    marginBottom: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // chip row pills use alignSelf flex-start; here we center with the 48pt primary FAB on the cross axis
  bottomBarListPill: {
    alignSelf: 'center',
    minHeight: QUICK_ADD_PRIMARY_FAB_SIZE,
    justifyContent: 'center',
  },
  pillTapArea: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
  },
  // ios swiftui Menu wrapper — mirrors FormDetailSection repeatingRecurrenceWrap + repeatingHost
  quickAddRepeatMenuWrap: {
    alignSelf: 'flex-start',
  },
  quickAddRepeatHost: {
    alignSelf: 'flex-start',
    overflow: 'visible',
  },
  // outer size = padded inner row only; ring fills shell so border does not expand layout
  pillSurfaceShell: {
    alignSelf: 'flex-start',
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  pillSurfaceBorderRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Paddings.formDataPillRadius,
  },
  pillSurfaceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Paddings.formDataPillVertical,
    paddingHorizontal: Paddings.formDataPillHorizontal,
  },
  pillIcon: {
    marginRight: Paddings.formDataPillIconGap,
  },
  pillText: {
    ...getTextStyle('body-large'),
  },
  fabPrimaryGlass: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  fabPrimaryGlassInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPrimaryFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
