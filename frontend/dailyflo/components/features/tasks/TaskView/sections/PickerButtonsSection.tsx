/**
 * PickerButtonsSection Component
 * 
 * Horizontal scrollable section containing form picker buttons for task view.
 * Displays icon, date, time, and alerts picker buttons with dynamic display text.
 */

import React from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { FormPickerButton } from '@/components/ui/Button';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { Ionicons } from '@expo/vector-icons';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import {
  getDatePickerDisplay,
  getTimeDurationPickerDisplay,
  getAlertsPickerDisplay,
  getIconPickerDisplay,
} from '@/components/ui/Button';

export interface PickerButtonsSectionProps {
  /** Form values */
  values: Partial<TaskFormValues>;
  /** Animation values for button highlights */
  iconButtonHighlightOpacity: Animated.Value;
  dateButtonHighlightOpacity: Animated.Value;
  timeButtonHighlightOpacity: Animated.Value;
  alertsButtonHighlightOpacity: Animated.Value;
  /** Handler functions for each picker */
  onShowIconColorPicker: () => void;
  onShowDatePicker: () => void;
  onShowTimeDurationPicker: () => void;
  onShowAlertsPicker: () => void;
  /** Optional callback to snap modal to top when button is pressed */
  onButtonPress?: () => void;
}

/**
 * PickerButtonsSection Component
 * 
 * Renders a horizontal scrollable row of picker buttons for:
 * - Icon & Color selection
 * - Date selection
 * - Time & Duration selection
 * - Alerts selection
 */
export const PickerButtonsSection: React.FC<PickerButtonsSectionProps> = ({
  values,
  iconButtonHighlightOpacity,
  dateButtonHighlightOpacity,
  timeButtonHighlightOpacity,
  alertsButtonHighlightOpacity,
  onShowIconColorPicker,
  onShowDatePicker,
  onShowTimeDurationPicker,
  onShowAlertsPicker,
  onButtonPress,
}) => {
  const colors = useColorPalette();
  const themeColors = useThemeColors();

  // PICKER BUTTONS CONFIGURATION
  // array of picker button configurations
  // each button has an id, icon, label, and onPress handler
  // only includes time and alerts buttons (date and icon removed for task view)
  const pickerButtons = [
    {
      id: 'time',
      icon: 'time-outline',
      label: 'No Time or Duration',
      onPress: onShowTimeDurationPicker,
    },
    {
      id: 'alerts',
      icon: 'notifications-outline',
      label: 'No Alerts',
      onPress: onShowAlertsPicker,
    },
  ];

  return (
    <View style={{ paddingBottom: 8 }}>
      {/* horizontal scrollable picker buttons */}
      {/* allows users to scroll through picker buttons if they don't all fit on screen */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{
          width: '100%',
          gap: 16,
        }}
      >
        {pickerButtons.map((button) => {
          // get display information for each button based on its type
          // displayInfo contains text, color, and iconColor for the button
          // only time and alerts buttons are supported (date and icon removed)
          const displayInfo =
            button.id === 'time'
              ? getTimeDurationPickerDisplay(values.time, values.duration, themeColors)
              : button.id === 'alerts'
              ? getAlertsPickerDisplay(values.alerts?.length || 0, themeColors)
              : null;

          // determine icon and text colors based on display info
          // fallback to secondary text color if no display info
          const iconColor = displayInfo ? displayInfo.iconColor : themeColors.text.secondary();
          const textColor = displayInfo ? displayInfo.color : themeColors.text.secondary();

          // only show display text if there's actually a value selected (not default "No X" text)
          // this prevents showing "No Date" when a date is actually selected
          const displayText =
            displayInfo && !displayInfo.text.startsWith('No ') ? displayInfo.text : '';

          // get the appropriate animated value for this button
          // used for highlight animation when button is pressed
          // only time and alerts buttons are supported (date and icon removed)
          const animatedValue =
            button.id === 'time'
              ? timeButtonHighlightOpacity
              : alertsButtonHighlightOpacity;

          return (
            <View key={button.id} style={{ left: 16 }}>
              <FormPickerButton
                icon={button.icon}
                defaultText={button.label}
                displayText={displayText}
                textColor={textColor}
                iconColor={iconColor}
                onPress={() => {
                  // snap modal to top when button is pressed (if callback provided)
                  onButtonPress?.();
                  // then call the original button handler
                  button.onPress();
                }}
                highlightOpacity={animatedValue}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default PickerButtonsSection;

