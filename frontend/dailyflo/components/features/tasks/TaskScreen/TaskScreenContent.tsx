/**
 * TaskScreen content — scroll-based create task modal (reusable for task view later).
 * ScrollView must be absolute (top/left/right/bottom 0) to fill the stack screen and reach the top.
 * With flex: 1 only, form sheet / safe area can leave a gap above the content.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated as RNAnimated,
  StyleSheet,
  Keyboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { IconColorModal } from './modals';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { FormDetailSection, SubtaskSection } from './sections';
import { SaveButton } from '@/components/ui/button/SaveButton';
import { getDatePickerDisplay, getTimeDurationPickerDisplay, getAlertsPickerDisplay } from '@/components/ui/button';
import { getTextStyle } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { DashedSeparator } from '@/components/ui/borders';
import Checkbox from '@/components/ui/button/Checkbox/Checkbox';
import type { TaskColor } from '@/types';
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
  
  /** Callback to notify parent when any picker modal visibility changes */
  /** Used to coordinate backdrop visibility between FullScreenModal and DraggableModal */
  onPickerVisibilityChange?: (isAnyPickerVisible: boolean) => void;
  
  /** Callback when create button is pressed */
  /** This function handles validating the form and creating the task */
  onCreate: () => void;
  
  /** Whether a task is currently being created (loading state) */
  /** Used to disable the create button and show loading indicator */
  isCreating?: boolean;
  
  /** Error message if task creation failed */
  /** Can be displayed to the user */
  createError?: string | null;
  
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
   * When true (default), render close and save buttons inside the content (for in-screen modal).
   * When false, omit them so the parent (e.g. Stack screen) can provide header close/save.
   */
  embedHeaderButtons?: boolean;

  /**
   * When false, omit the close button so the parent can render it at window level (e.g. top-left of screen).
   * Only applies when embedHeaderButtons is true. Default true.
   */
  renderCloseButton?: boolean;

  /**
   * Extra bottom inset when keyboard is hidden (e.g. form sheet doesn't fill window; add ~80 so save button stays visible).
   */
  saveButtonBottomInsetWhenKeyboardHidden?: number;

  /**
   * Optional: use these to open date/time/alert pickers (e.g. custom navigation).
   * When not provided, stack screens are used (router.push + CreateTaskDraftContext).
   */
  pickerHandlers?: {
    onShowDatePicker: () => void;
    onShowTimeDurationPicker: () => void;
    onShowAlertsPicker: () => void;
  };
}

export const TaskScreenContent: React.FC<TaskCreationContentProps> = ({
  onClose,
  values,
  onChange,
  onPickerVisibilityChange,
  onCreate,
  isCreating = false,
  createError,
  hasChanges,
  onCreateSubtask,
  subtasks,
  onSubtaskTitleChange,
  onSubtaskToggle,
  onSubtaskDelete,
  pendingFocusSubtaskId,
  onClearPendingFocus,
  embedHeaderButtons = true,
  renderCloseButton = false,
  saveButtonBottomInsetWhenKeyboardHidden,
  pickerHandlers,
}) => {
  const router = useRouter();
  const draftContext = useCreateTaskDraft();
  const { themeColor } = useThemeColor();
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const buttonColor = (values?.color as TaskColor) || themeColor;
  const titleInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // only icon/color still uses an in-screen modal (no stack screen for it yet)
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  useEffect(() => {
    onPickerVisibilityChange?.(isColorPickerVisible);
  }, [isColorPickerVisible, onPickerVisibilityChange]);

  // date/time/alert: use stack screens (seed draft and push, or use passed pickerHandlers)
  const handleShowDatePicker = () => {
    if (pickerHandlers?.onShowDatePicker) {
      pickerHandlers.onShowDatePicker();
      return;
    }
    Keyboard.dismiss();
    draftContext.setDraft({
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
    draftContext.setDraft({
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
    draftContext.setDraft({
      dueDate: values.dueDate ?? new Date().toISOString(),
      time: values.time,
      duration: values.duration,
      alerts: values.alerts ?? [],
    });
    router.push('/alert-select');
  };

  // checkbox state for task title checkbox
  const [titleCheckboxChecked, setTitleCheckboxChecked] = useState(false);

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

  // save button: active when title is non-empty
  const isCreateButtonActive = useMemo(() => !!(values.title?.trim()), [values.title]);

  // insets and window size for save button bar positioning
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // save button bottom: above keyboard when open, else from window bottom with optional inset
  const saveButtonBottom = keyboardHeight > 0
    ? keyboardHeight + 72
    : insets.bottom + (saveButtonBottomInsetWhenKeyboardHidden ?? 0);

  // reanimated: animate save button bottom so it slides with keyboard instead of jumping
  const animatedBottom = useSharedValue(saveButtonBottom);
  useEffect(() => {
    animatedBottom.value = withTiming(saveButtonBottom, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [saveButtonBottom]);

  const animatedSaveButtonBarStyle = useAnimatedStyle(() => ({
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

  return (
    <View style={styles.container}>
      {/* drag indicator at top so user knows the sheet is draggable to dismiss */}
      <View style={styles.dragIndicatorWrap} pointerEvents="none">
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
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scroll, { backgroundColor: themeColors.background.primary() }]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 32 : 160 }]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {/* task title input + checkbox row (checkbox on right) */}
        <View style={styles.titleRow}>
          <View style={styles.titleInputWrap}>
            <TextInput
              ref={titleInputRef}
              value={values.title || ''}
              onChangeText={(t) => onChange('title', t)}
              placeholder="e.g., Answering emails"
              placeholderTextColor={themeColors.text.tertiary()}
              selectionColor={themeColors.text.primary()}
              style={[
                getTextStyle('heading-2'),
                {
                  color: themeColors.text.primary(),
                  paddingBottom: 0,
                  paddingHorizontal: 0,
                },
              ]}
              autoFocus
              returnKeyType="next"
            />
            {/* dashed separator underline for task title - matches scrollContent padding */}
            <DashedSeparator style={{ marginTop: 12 }} />
            <View style={styles.titleSpacer} />
          </View>
          <View style={styles.checkboxWrap}>
            <Checkbox
              checked={titleCheckboxChecked}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTitleCheckboxChecked((prev) => !prev);
              }}
              size={20}
            />
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

        {createError && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              marginBottom: 24,
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.getSemanticColor('error', 500),
            }}
          >
            <Text style={[getTextStyle('body-small'), { color: colors.getSemanticColor('error', 500) }]}>
              {createError}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* save button: outside ScrollView, absolute, based on screen dimensions */}
      {embedHeaderButtons && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: windowWidth,
            height: windowHeight,
          }}
        >
          <Animated.View
            pointerEvents="box-none"
            style={[
              animatedSaveButtonBarStyle,
              {
                position: 'absolute',
                left: 0,
                right: 0,
                width: windowWidth,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingHorizontal: 20,
              },
            ]}
          >
            <SaveButton
              onPress={onCreate}
              isLoading={isCreating}
              taskCategoryColor={buttonColor}
              text="Create"
              loadingText="Creating..."
              size={28}
              iconSize={28}
              visible={isCreateButtonActive}
              showLabel
            />
          </Animated.View>
        </View>
      )}

      {/* date/time/alert use stack screens (task/date-select etc.); only icon/color still uses a modal */}
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  // drag indicator: centered pill at top (matches ModalHeader style)
  dragIndicatorWrap: {
    position: 'absolute',
    top: 10,
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
  // top spacing: drag indicator area (~20px) + spacing before title
  scrollContent: { padding: 20, paddingTop: 48, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleInputWrap: { flex: 1, minWidth: 0, paddingHorizontal: 0 },
  titleSpacer: { height: 8 },
  checkboxWrap: { paddingLeft: 12, flexShrink: 0, alignItems: 'center', justifyContent: 'center', marginTop: -22 },
  pickerSectionWrap: { marginTop: 36 },
});
