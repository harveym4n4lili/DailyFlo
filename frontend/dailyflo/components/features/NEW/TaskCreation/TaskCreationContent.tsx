/**
 * NEW Task Creation content — scroll-based create task modal.
 * ScrollView must be absolute (top/left/right/bottom 0) to fill the stack screen and reach the top.
 * With flex: 1 only, form sheet / safe area can leave a gap above the content.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated as RNAnimated,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { TaskCreationContentProps } from '@/components/features/tasks/TaskCreation';
import { DatePickerModal } from '@/components/features/calendar';
import { IconColorModal, TimeDurationModal, AlertModal } from '@/components/features/tasks/TaskCreation/modals';
import { PickerButtonsSection, DescriptionSection } from '@/components/features/tasks/TaskCreation/sections';
import { TimeDurationDisplay, AlertDisplay } from '@/components/features/NEW/TaskCreation/sections';
import { SubtaskCreateButton, SubtaskListItem } from '@/components/features/NEW/TaskCreation/subtask';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { getDatePickerDisplay, getTimeDurationPickerDisplay, getAlertsPickerDisplay } from '@/components/ui/Button';
import { getTextStyle } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import type { TaskColor } from '@/types';

export const TaskCreationContent: React.FC<TaskCreationContentProps> = ({
  onClose,
  values,
  onChange,
  onPickerVisibilityChange,
  onCreateSubtask,
  subtasks,
  onSubtaskTitleChange,
  onSubtaskToggle,
  onSubtaskDelete,
}) => {
  const { themeColor } = useThemeColor();
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const buttonColor = (values?.color as TaskColor) || themeColor;
  const titleInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // picker modal visibility (only one open at a time via closeAllModalsExcept)
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [isTimeDurationPickerVisible, setIsTimeDurationPickerVisible] = useState(false);
  const [isAlertsPickerVisible, setIsAlertsPickerVisible] = useState(false);
  const isAnyPickerVisible = isDatePickerVisible || isColorPickerVisible || isTimeDurationPickerVisible || isAlertsPickerVisible;
  useEffect(() => {
    onPickerVisibilityChange?.(isAnyPickerVisible);
  }, [isAnyPickerVisible, onPickerVisibilityChange]);

  const closeAllModalsExcept = (modalToKeep: string) => {
    if (modalToKeep !== 'date') setIsDatePickerVisible(false);
    if (modalToKeep !== 'color') setIsColorPickerVisible(false);
    if (modalToKeep !== 'time') setIsTimeDurationPickerVisible(false);
    if (modalToKeep !== 'alerts') setIsAlertsPickerVisible(false);
  };

  const handleShowDatePicker = () => {
    Keyboard.dismiss();
    closeAllModalsExcept('date');
    setIsDatePickerVisible(true);
  };
  const handleDateSelect = (date: string) => {
    onChange('dueDate', date);
    titleInputRef.current?.focus();
  };
  const handleDatePickerClose = () => {
    setIsDatePickerVisible(false);
    titleInputRef.current?.focus();
  };

  const handleShowColorPicker = () => {
    Keyboard.dismiss();
    closeAllModalsExcept('color');
    setIsColorPickerVisible(true);
  };
  const handleColorSelect = (color: TaskColor) => onChange('color', color);
  const handleColorPickerClose = () => {
    setIsColorPickerVisible(false);
    titleInputRef.current?.focus();
  };
  const handleIconSelect = (icon: string) => onChange('icon', icon);

  const handleShowTimeDurationPicker = () => {
    Keyboard.dismiss();
    closeAllModalsExcept('time');
    setIsTimeDurationPickerVisible(true);
  };
  const handleTimeSelect = (time: string | undefined) => onChange('time', time);
  const handleDurationSelect = (duration: number | undefined) => onChange('duration', duration);
  const handleTimeDurationPickerClose = () => {
    setIsTimeDurationPickerVisible(false);
    titleInputRef.current?.focus();
  };

  const handleShowAlertsPicker = () => {
    Keyboard.dismiss();
    closeAllModalsExcept('alerts');
    setIsAlertsPickerVisible(true);
  };
  const handleAlertsPickerClose = () => {
    setIsAlertsPickerVisible(false);
    titleInputRef.current?.focus();
  };
  const handleAlertsApply = (alertIds: string[]) => onChange('alerts', alertIds);

  // checkbox state and animation (matches original TaskCreation: 20px circle, fill + scale)
  const [titleCheckboxChecked, setTitleCheckboxChecked] = useState(false);
  const titleCheckboxFill = useRef(new RNAnimated.Value(0)).current;
  const titleCheckboxScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.timing(titleCheckboxFill, {
      toValue: titleCheckboxChecked ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [titleCheckboxChecked, titleCheckboxFill]);

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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 32 : 40 }]}
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
            <View style={styles.titleSpacer} />
          </View>
          <View style={styles.checkboxWrap}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                RNAnimated.sequence([
                  RNAnimated.timing(titleCheckboxScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
                  RNAnimated.timing(titleCheckboxScale, { toValue: 1, duration: 100, useNativeDriver: true }),
                ]).start();
                setTitleCheckboxChecked((prev) => !prev);
              }}
              activeOpacity={1}
              style={styles.checkboxTouchable}
            >
              <RNAnimated.View style={{ transform: [{ scale: titleCheckboxScale }] }}>
                <RNAnimated.View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: titleCheckboxFill.interpolate({
                      inputRange: [0, 1],
                      outputRange: [themeColors.text.tertiary(), themeColors.text.primary()],
                    }),
                    backgroundColor: titleCheckboxFill.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', themeColors.text.primary()],
                    }),
                  }}
                />
              </RNAnimated.View>
            </TouchableOpacity>
          </View>
        </View>

        {/* description text area (same as original TaskCreation) */}
        <View style={styles.descriptionWrap}>
          <DescriptionSection
            description={values.description || ''}
            onDescriptionChange={(description) => onChange('description', description)}
            isEditing={true}
            taskColor={buttonColor}
          />
        </View>

        {/* grouped list: date only (time/alerts shown in displays below); then time/alert display row */}
        <View style={styles.pickerSectionWrap}>
          <View style={styles.groupedListWrap}>
            <PickerButtonsSection
              onShowDatePicker={handleShowDatePicker}
              onShowTimeDurationPicker={handleShowTimeDurationPicker}
              onShowAlertsPicker={handleShowAlertsPicker}
              dateValue={getDatePickerDisplay(values.dueDate, colors, themeColors).text}
              dateSecondaryValue={getDatePickerDisplay(values.dueDate, colors, themeColors).secondaryText}
              timeDurationValue={getTimeDurationPickerDisplay(values.time, values.duration, themeColors).text}
              timeDurationSecondaryValue={getTimeDurationPickerDisplay(values.time, values.duration, themeColors).secondaryText}
              alertsValue={getAlertsPickerDisplay(values.alerts?.length ?? 0, themeColors).text}
              contentPaddingHorizontal={0}
              showTaskOptionPills={false}
              hideTimeInList
              hideAlertsInList
              noBottomPadding
              noTopPadding
            />
          </View>
          {/* display section: time + alert cards (subtasks section must stay below this) */}
          <View style={styles.timeAndAlertRow}>
            <View style={styles.timeDurationDisplayWrap}>
              <TimeDurationDisplay
                time={values.time}
                duration={values.duration}
                positionInRow="left"
                onPress={handleShowTimeDurationPicker}
              />
            </View>
            <View style={styles.alertDisplayWrap}>
              <AlertDisplay positionInRow="right" alertsCount={values.alerts?.length ?? 0} onPress={handleShowAlertsPicker} />
            </View>
          </View>
        </View>

        {/* subtask section: when subtasks exist, GroupedList with items then Add button */}
        <View style={styles.subtaskSectionWrap}>
          {subtasks.length === 0 ? (
            <SubtaskCreateButton onPress={onCreateSubtask} />
          ) : (
            <GroupedList
              containerStyle={styles.subtaskListContainer}
              minimalStyle
              fullWidthSeparators
              separatorColor={themeColors.background.quaternary()}
            >
              {subtasks.map((s) => (
                <SubtaskListItem
                  key={s.id}
                  value={s.title}
                  onChangeText={(t) => onSubtaskTitleChange(s.id, t)}
                  isCompleted={s.isCompleted}
                  onToggleComplete={() => onSubtaskToggle(s.id)}
                  placeholder="Subtask"
                  onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  onDelete={onSubtaskDelete ? () => onSubtaskDelete(s.id) : undefined}
                />
              ))}
              <SubtaskCreateButton onPress={onCreateSubtask} />
            </GroupedList>
          )}
        </View>
      </ScrollView>

      <DatePickerModal
        visible={isDatePickerVisible}
        selectedDate={values.dueDate || new Date().toISOString()}
        onClose={handleDatePickerClose}
        onSelectDate={handleDateSelect}
        title="Date"
        taskCategoryColor={buttonColor}
      />
      <IconColorModal
        visible={isColorPickerVisible}
        selectedColor={buttonColor}
        selectedIcon={values.icon}
        onClose={handleColorPickerClose}
        onSelectColor={handleColorSelect}
        onSelectIcon={handleIconSelect}
        taskCategoryColor={buttonColor}
      />
      <TimeDurationModal
        visible={isTimeDurationPickerVisible}
        selectedTime={values.time}
        selectedDuration={values.duration}
        onClose={handleTimeDurationPickerClose}
        onSelectTime={handleTimeSelect}
        onSelectDuration={handleDurationSelect}
        taskCategoryColor={buttonColor}
      />
      <AlertModal
        visible={isAlertsPickerVisible}
        selectedAlerts={values.alerts || []}
        onClose={handleAlertsPickerClose}
        onApplyAlerts={handleAlertsApply}
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
  checkboxWrap: { paddingLeft: 12, flexShrink: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -6 },
  checkboxTouchable: { alignItems: 'flex-start', justifyContent: 'center' },
  descriptionWrap: { paddingTop: 0, paddingBottom: 0 },
  pickerSectionWrap: {},
  groupedListWrap: { marginTop: 24 },
  timeAndAlertRow: { marginTop: 8, flexDirection: 'row', gap: 8 },
  timeDurationDisplayWrap: { flex: 1, minWidth: 0 },
  alertDisplayWrap: { flex: 1, minWidth: 0 },

  subtaskSectionWrap: { marginTop: 32 },
  subtaskListContainer: {},
});
