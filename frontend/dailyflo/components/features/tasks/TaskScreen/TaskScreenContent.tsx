/**
 * TaskScreen content — scroll-based create task modal (reusable for task view later).
 * ScrollView must be absolute (top/left/right/bottom 0) to fill the stack screen and reach the top.
 * With flex: 1 only, form sheet / safe area can leave a gap above the content.
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { IconColorModal } from './modals';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { useLists } from '@/store/hooks';
import { getListDisplayName } from '@/utils/listDisplayName';
import { FormDetailSection, SubtaskSection } from './sections';
import { SaveButton, MainCloseButton } from '@/components/ui/button';
import { getDatePickerDisplay, getTimeDurationPickerDisplay, getAlertsPickerDisplay } from '@/components/ui/button';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { DashedSeparator } from '@/components/ui/borders';
import { ActionContextMenu, type ActionContextMenuItem } from '@/components/ui';
import { TrashIcon, ClockIcon, SFSymbolIcon } from '@/components/ui/icon';
import { Checkbox, CHECKBOX_SIZE_TASK_VIEW } from '@/components/ui/button';
import type { TaskColor, RoutineType } from '@/types';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import type { Subtask } from '@/components/features/subtasks';

/**
 * Props for TaskScreenContent component (shared type for task creation and task view)
 */
export interface TaskCreationContentProps {
  /** Whether the content is visible */
  visible: boolean;
  
  /** Form values */
  values: Partial<TaskFormValues>;
  
  /** Form change handler */
  onChange: <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) => void;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Whether form has unsaved changes */
  hasChanges: boolean;
  /** Whether save button should be visible (create: when required fields entered; view: when hasChanges) */
  isSaveButtonVisible?: boolean;
  
  /** Callback to notify parent when any picker modal visibility changes */
  /** Used to coordinate backdrop visibility between FullScreenModal and DraggableModal */
  onPickerVisibilityChange?: (isAnyPickerVisible: boolean) => void;
  
  /** Callback when save button is pressed (create or update) */
  onCreate: () => void;
  
  /** Save button label when not loading (default: "Create") */
  saveButtonText?: string;
  /** Save button label when loading (default: "Creating...") */
  saveLoadingText?: string;
  
  /** Whether a task is currently being created or updated (loading state) */
  /** Used to disable the create button and show loading indicator */
  isCreating?: boolean;
  
  /** Error message if task creation failed */
  /** Can be displayed to the user */
  createError?: string | null;
  /** Error message when update fails (used in edit mode) */
  updateError?: string | null;
  /** Validation error when save fails due to invalid form data (e.g. title required) */
  validationError?: string | null;
  
  /** Array of subtasks for the task */
  subtasks: Subtask[];
  
  /** Callback when a subtask is toggled (complete/incomplete) */
  onSubtaskToggle: (subtaskId: string) => void;
  
  /** Callback when a subtask is deleted */
  onSubtaskDelete: (subtaskId: string) => void;
  
  /** Callback when a subtask title changes */
  onSubtaskTitleChange: (subtaskId: string, newTitle: string) => void;
  
  /** Callback when editing a subtask is finished */
  onSubtaskFinishEditing: (subtaskId: string) => void;
  
  /** Callback when create subtask button is pressed */
  onCreateSubtask: () => void;

  /** When set, the subtask with this id should focus its input (e.g. after Add subtask); clear via onClearPendingFocus */
  pendingFocusSubtaskId?: string | null;
  /** Callback when the pending-focus subtask has focused its input (used to clear pendingFocusSubtaskId) */
  onClearPendingFocus?: () => void;

  /** Optional background color for the subtask list (passed to GroupedList item wrappers) */
  subtaskListBackgroundColor?: string;

  /** Optional border radius for the subtask list (defaults to 24) */
  subtaskListBorderRadius?: number;

  /** Optional border width for the subtask list item wrappers */
  subtaskListBorderWidth?: number;

  /** Optional border color for the subtask list item wrappers */
  subtaskListBorderColor?: string;

  /**
   * When true (default), render save button inside the content.
   * When false, omit so the parent can provide header save.
   */
  embedHeaderButtons?: boolean;

  /**
   * When true, task screen is in edit mode (save button: icon-only, top right).
   * When false, create mode (save button: Create + arrow, floating at bottom with keyboard animation).
   */
  isEditMode?: boolean;

  /**
   * Extra bottom inset when keyboard is hidden (e.g. form sheet doesn't fill window; add ~80 so save button stays visible).
   */
  saveButtonBottomInsetWhenKeyboardHidden?: number;

  /**
   * When true (default), show checkbox next to task title.
   * When false (e.g. create mode), hide checkbox so title input spans full width.
   */
  showTitleCheckbox?: boolean;

  /**
   * when editing an existing task, pass redux isCompleted so the box matches the server;
   * use with onTitleCheckboxToggle so taps patch the task (otherwise local-only state is used).
   */
  titleCheckboxCompleted?: boolean;
  /** dispatch updateTask (or similar) when the title checkbox is pressed in edit mode */
  onTitleCheckboxToggle?: () => void;

  /**
   * When true, show MainCloseButton in top left (e.g. create mode).
   * When false (default), no close button in header.
   */
  showMainCloseButton?: boolean;

  /**
   * When true (default), show drag indicator pill at top.
   * When false (e.g. create mode when not draggable), hide the pill.
   */
  showDragIndicator?: boolean;

  /**
   * Optional: use these to open date/time/alert pickers (e.g. custom navigation).
   * When not provided, stack screens are used (router.push + CreateTaskDraftContext).
   */
  pickerHandlers?: {
    onShowDatePicker: () => void;
    onShowTimeDurationPicker: () => void;
    onShowAlertsPicker: () => void;
    /** pushes /list-select (liquid glass formSheet); seed pickedListId in draft before calling */
    onShowListPicker?: () => void;
  };

  /** edit mode: activity log from overflow menu */
  onActivityLog?: () => void;
  /** edit mode: duplicate from overflow menu */
  onDuplicateTask?: () => void;
  /** edit mode: delete from overflow menu (parent usually confirms) */
  onDeleteTask?: () => void;

  /**
   * create mode on ios: root stack shows native modal header + Stack.Toolbar; scroll starts below measured header
   * (same idea as list-create). android keeps inset close + floating save — leave false.
   */
  useNativeStackHeader?: boolean;
}

export const TaskScreenContent: React.FC<TaskCreationContentProps> = ({
  onClose,
  values,
  onChange,
  onPickerVisibilityChange,
  onCreate,
  saveButtonText = 'Create',
  saveLoadingText = 'Creating...',
  isCreating = false,
  createError,
  updateError,
  validationError,
  hasChanges,
  isSaveButtonVisible: isSaveButtonVisibleProp,
  onCreateSubtask,
  subtasks,
  onSubtaskTitleChange,
  onSubtaskToggle,
  onSubtaskDelete,
  pendingFocusSubtaskId,
  onClearPendingFocus,
  embedHeaderButtons = true,
  isEditMode = false,
  saveButtonBottomInsetWhenKeyboardHidden,
  pickerHandlers,
  showTitleCheckbox = true,
  titleCheckboxCompleted,
  onTitleCheckboxToggle,
  showMainCloseButton = false,
  showDragIndicator = true,
  onActivityLog,
  onDuplicateTask,
  onDeleteTask,
  useNativeStackHeader = false,
}) => {
  const router = useGuardedRouter();
  const { setDraft } = useCreateTaskDraft();
  const { lists: reduxLists } = useLists();

  // tray pill label: Inbox vs list name from redux (same lists as /lists/ api)
  const listDestinationLabel = useMemo(
    () => getListDisplayName(values.listId, reduxLists),
    [values.listId, reduxLists]
  );
  const { themeColor } = useThemeColor();
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const buttonColor = (values?.color as TaskColor) || themeColor;
  const titleInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  // only icon/color still uses an in-screen DraggableModal (no stack route for it yet)
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  useEffect(() => {
    onPickerVisibilityChange?.(isColorPickerVisible);
  }, [isColorPickerVisible, onPickerVisibilityChange]);

  // list-select is a root stack formSheet (like date-select); seed pickedListId so the sheet shows the right row
  const handleOpenListPicker = useCallback(() => {
    Keyboard.dismiss();
    setDraft({ pickedListId: values.listId ? values.listId : null });
    if (pickerHandlers?.onShowListPicker) {
      pickerHandlers.onShowListPicker();
    } else {
      router.push('/list-select' as any);
    }
  }, [setDraft, values.listId, pickerHandlers, router]);

  // date/time/alert: use stack screens (seed draft and push, or use passed pickerHandlers)
  const handleShowDatePicker = () => {
    if (pickerHandlers?.onShowDatePicker) {
      pickerHandlers.onShowDatePicker();
      return;
    }
    Keyboard.dismiss();
    setDraft({
      dueDate: values.dueDate ?? new Date().toISOString(),
      time: values.time,
      duration: values.duration,
      alerts: values.alerts ?? [],
    });
    router.push('/date-select');
  };

  const handleShowColorPicker = () => {
    Keyboard.dismiss();
    setIsColorPickerVisible(true);
  };
  const handleColorSelect = (color: TaskColor) => onChange('color', color);
  const handleColorPickerClose = () => {
    setIsColorPickerVisible(false);
    titleInputRef.current?.focus();
  };
  const handleIconSelect = (icon: string) => onChange('icon', icon);

  const handleShowTimeDurationPicker = () => {
    if (pickerHandlers?.onShowTimeDurationPicker) {
      pickerHandlers.onShowTimeDurationPicker();
      return;
    }
    Keyboard.dismiss();
    setDraft({
      dueDate: values.dueDate ?? new Date().toISOString(),
      time: values.time,
      duration: values.duration,
      alerts: values.alerts ?? [],
    });
    router.push('/time-duration-select');
  };

  const handleShowAlertsPicker = () => {
    if (pickerHandlers?.onShowAlertsPicker) {
      pickerHandlers.onShowAlertsPicker();
      return;
    }
    Keyboard.dismiss();
    setDraft({
      dueDate: values.dueDate ?? new Date().toISOString(),
      time: values.time,
      duration: values.duration,
      alerts: values.alerts ?? [],
    });
    router.push('/alert-select');
  };

  // title checkbox: edit screen passes server state + onTitleCheckboxToggle; otherwise local-only (legacy)
  const [internalTitleCheckboxChecked, setInternalTitleCheckboxChecked] = useState(false);
  const titleCheckboxChecked =
    onTitleCheckboxToggle != null ? (titleCheckboxCompleted ?? false) : internalTitleCheckboxChecked;

  // keyboard height for scroll content bottom padding so content can scroll above keyboard
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

  // save button visibility: parent passes create (required fields) or view (hasChanges)
  const isSaveButtonVisible = isSaveButtonVisibleProp ?? hasChanges;

  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // create mode: save button floats at bottom, animates with keyboard
  const saveButtonBottom = keyboardHeight > 0
    ? keyboardHeight + 72
    : insets.bottom + (saveButtonBottomInsetWhenKeyboardHidden ?? 0);
  const animatedBottom = useSharedValue(saveButtonBottom);
  useEffect(() => {
    animatedBottom.value = withTiming(saveButtonBottom, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [saveButtonBottom, animatedBottom]);
  const animatedCreateSaveBarStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: animatedBottom.value,
  }));

  // drag indicator pill: same sizing as ModalHeader (iOS 15+ smaller pill)
  const iosVersion = Platform.OS === 'ios' ? (typeof Platform.Version === 'string' ? parseInt(Platform.Version.split('.')[0], 10) : Math.floor(Platform.Version as number)) : 0;
  const isNewerIOS = iosVersion >= 15;
  const pillWidth = isNewerIOS ? 36 : 42;
  const pillHeight = isNewerIOS ? 5 : 6;
  const pillRadius = isNewerIOS ? 2 : 3;

  // edit: drag pill + trailing slot sit in a short overlay — keep scroll top padding just below that strip (avoid stacking insets.top in pill, strip height, and padding)
  const headerStripHeight = showDragIndicator && isEditMode ? 48 : 60;
  const stackHeaderHeight = useHeaderHeight();
  const scrollPaddingTop = useNativeStackHeader
    ? stackHeaderHeight + 24
    : showMainCloseButton
      ? 24
      : isEditMode
        ? headerStripHeight + 8
        : 48;

  // small fixed offset from the top of the sheet — extra insets.top was doubling gap below status bar / sheet chrome
  const dragIndicatorTop = showDragIndicator && isEditMode ? 6 : 2;

  // edit mode: liquid glass ActionContextMenu (activity / duplicate / delete) — same pattern as pre–stack-toolbar task screen
  const actionsMenuItems = useMemo((): ActionContextMenuItem[] => {
    return [
      {
        id: 'activity',
        label: 'Activity log',
        systemImage: 'clock.arrow.circlepath',
        iconComponent: (color) => <ClockIcon size={20} color={color} isSolid />,
        onPress: onActivityLog ?? (() => {}),
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        systemImage: 'doc.on.doc',
        icon: 'copy-outline',
        onPress: onDuplicateTask ?? (() => {}),
      },
      {
        id: 'delete',
        label: 'Delete task',
        onPress: onDeleteTask ?? (() => {}),
        destructive: true,
        systemImage: 'trash.fill',
        iconComponent: (color) => (
          <SFSymbolIcon name="trash.fill" size={20} color={color} fallback={<TrashIcon size={20} color={color} />} />
        ),
      },
    ];
  }, [onActivityLog, onDuplicateTask, onDeleteTask]);

  // screen fill: ThemeColors.background.primary (from ColorPalette) — required when stack uses transparent formSheet (ios glass) so we still paint the app surface
  const screenBg = { backgroundColor: themeColors.background.primary() };

  return (
    // collapsable: false keeps one native wrapper for formSheet (RNScreens scroll + header heuristic)
    <View style={[styles.container, screenBg]} collapsable={false}>
      {/* ScrollView first so header overlays on top (header has zIndex) */}
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scroll, screenBg]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: scrollPaddingTop, paddingBottom: keyboardHeight > 0 ? keyboardHeight + 32 : 160 },
        ]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {/* task title input + optional checkbox row (checkbox on left when showTitleCheckbox) */}
        {/* create variant: extra left padding so title has 20px gap from MainCloseButton (16 + 42 + 20 - screen padding) */}
        <View
          style={[
            styles.titleRow,
            showMainCloseButton &&
              !useNativeStackHeader && { paddingLeft: 16 + 42 + 20 - Paddings.screen },
          ]}
        >
          {showTitleCheckbox && (
            <View style={styles.checkboxWrap}>
              <Checkbox
                size={CHECKBOX_SIZE_TASK_VIEW}
                checked={titleCheckboxChecked}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (onTitleCheckboxToggle) {
                    onTitleCheckboxToggle();
                  } else {
                    setInternalTitleCheckboxChecked((prev) => !prev);
                  }
                }}
              />
            </View>
          )}
          <View style={[styles.titleInputWrap, !showTitleCheckbox && styles.titleInputWrapNoCheckbox]}>
            <TextInput
              ref={titleInputRef}
              value={values.title || ''}
              onChangeText={(t) => onChange('title', t)}
              placeholder="e.g., Answering emails"
              placeholderTextColor={themeColors.text.tertiary()}
              selectionColor="#FFFFFF"
              cursorColor="#FFFFFF"
              style={[
                getTextStyle('heading-2'),
                {
                  color: themeColors.text.primary(),
                  paddingBottom: Paddings.none,
                  paddingHorizontal: Paddings.none,
                  maxHeight: 68, // 2 lines max (fontSize 26 * ~1.3 line height)
                  caretColor: '#FFFFFF', // iOS: style-based cursor color fallback
                },
              ]}
              multiline
              numberOfLines={2}
              scrollEnabled={true}
              autoFocus={!isEditMode}
              returnKeyType="next"
            />
            {/* dashed separator underline for task title - matches scrollContent padding */}
            <DashedSeparator style={{ marginTop: 8 }} />
            <View style={styles.titleSpacer} />
          </View>
        </View>

        {/* picker section: date picker (if date selected) + time/alert display row */}
        <View style={styles.pickerSectionWrap}>
          <FormDetailSection
            onShowDatePicker={handleShowDatePicker}
            onShowTimeDurationPicker={handleShowTimeDurationPicker}
            onShowAlertsPicker={handleShowAlertsPicker}
            dateValue={getDatePickerDisplay(values.dueDate, colors, themeColors).text}
            dateSecondaryValue={getDatePickerDisplay(values.dueDate, colors, themeColors).secondaryText}
            time={values.time}
            duration={values.duration}
            alertsCount={values.alerts?.length ?? 0}
            routineType={(values.routineType as RoutineType) || 'once'}
            onRoutineTypeChange={(routineType) => onChange('routineType', routineType)}
            onOpenListPicker={handleOpenListPicker}
            listDestinationLabel={listDestinationLabel}
          />
        </View>

        {/* subtask section: GroupedList with subtask items (if any), then Add button, then description as bottom-most */}
        <SubtaskSection
          subtasks={subtasks}
          onSubtaskTitleChange={onSubtaskTitleChange}
          onSubtaskToggle={onSubtaskToggle}
          onSubtaskDelete={onSubtaskDelete}
          onCreateSubtask={onCreateSubtask}
          pendingFocusSubtaskId={pendingFocusSubtaskId}
          onClearPendingFocus={onClearPendingFocus}
          description={values.description || ''}
          onDescriptionChange={(description) => onChange('description', description)}
          taskColor={buttonColor}
          scrollViewRef={scrollViewRef}
        />

        {(createError ?? updateError ?? validationError) && (
          <View
            style={{
              marginHorizontal: Paddings.groupedListContentHorizontal,
              marginTop: 16,
              marginBottom: 24,
              padding: Paddings.cardCompact,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.getSemanticColor('error', 500),
            }}
          >
            <Text style={[getTextStyle('body-small'), { color: colors.getSemanticColor('error', 500) }]}>
              {createError ?? updateError ?? validationError}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* header container: all non-scroll content - collapsable: false required for RNScreens FormSheet
          (expects at most 2 subviews: header + ScrollView) */}
      <View style={styles.headerContainer} collapsable={false} pointerEvents="box-none">
        {/* MainCloseButton: top left when showMainCloseButton (e.g. create mode) */}
        {showMainCloseButton && (
          <MainCloseButton
            onPress={onClose}
            color={buttonColor}
            top={20}
            left={20}
          />
        )}
        {/* drag indicator + edit overflow (ActionContextMenu top-right) */}
        <View style={[styles.headerWrap, { height: headerStripHeight }]} pointerEvents="box-none">
          {isEditMode && (
            <View style={styles.actionsButtonWrap} pointerEvents="box-none">
              <ActionContextMenu
                items={actionsMenuItems}
                style={styles.actionsButton}
                accessibilityLabel="Task actions"
                tint="primary"
                dropdownAnchorTopOffset={Paddings.taskEditActionsDropdownTopOffset}
                dropdownAnchorRightOffset={Paddings.screen}
              />
            </View>
          )}
          {showDragIndicator && (
            <View style={[styles.dragIndicatorWrap, { top: dragIndicatorTop }]} pointerEvents="none">
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
          )}
        </View>
        {/* save button overlay */}
        {embedHeaderButtons && (
          <View
            pointerEvents="box-none"
            style={[
              styles.saveOverlayWrap,
              { width: windowWidth, height: windowHeight },
            ]}
          >
            <Animated.View
              pointerEvents="box-none"
              style={[
                animatedCreateSaveBarStyle,
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
                onPress={onCreate}
                isLoading={isCreating}
                taskCategoryColor={buttonColor}
                text={saveButtonText}
                loadingText={saveLoadingText}
                size={28}
                iconSize={28}
                visible={isSaveButtonVisible}
                showLabel
              />
            </Animated.View>
          </View>
        )}
        <IconColorModal
          visible={isColorPickerVisible}
          selectedColor={buttonColor}
          selectedIcon={values.icon}
          onClose={handleColorPickerClose}
          onSelectColor={handleColorSelect}
          onSelectIcon={handleIconSelect}
          taskCategoryColor={buttonColor}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // header container: wraps all non-scroll content; collapsable: false for FormSheet (max 2 subviews)
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  // header wrapper: drag indicator strip (height set inline on ios edit so tall safe area does not clip the pill)
  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
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
  // save overlay: full-screen wrapper for bottom save button
  saveOverlayWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // drag indicator: horizontal center; vertical offset from top set inline (ios: below status bar)
  dragIndicatorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  dragIndicatorPill: {},
  // ScrollView must be absolute to fill the stack screen and reach the top (form sheet / safe area otherwise leave a gap).
  scroll: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // top spacing: drag indicator area; paddingTop overridden inline (36 create, 60 edit)
  scrollContent: { padding: Paddings.screen, paddingBottom: Paddings.scrollBottomExtra },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  // right padding matches left: checkbox (18) + gap (16) for visual symmetry
  titleInputWrap: { flex: 1, minWidth: 0, paddingLeft: Paddings.none, paddingRight: CHECKBOX_SIZE_TASK_VIEW + 16 },
  // when no checkbox: remove right padding (was for visual symmetry with checkbox)
  titleInputWrapNoCheckbox: { paddingRight: Paddings.none },
  titleSpacer: { height: 8 },
  checkboxWrap: { width: CHECKBOX_SIZE_TASK_VIEW, marginTop: -10, height: CHECKBOX_SIZE_TASK_VIEW, marginRight: Paddings.groupedListIconTextSpacing + 4, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  pickerSectionWrap: { marginTop: 12 },
});
