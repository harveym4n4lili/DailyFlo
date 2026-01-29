/**
 * PickerButtonsSection Component
 * 
 * Horizontal scrollable section containing form picker buttons.
 * Displays icon, date, time, and alerts picker buttons with dynamic display text.
 */

import React from 'react';
import { View, ScrollView, Animated } from 'react-native';
// import directly from button files to avoid require cycle with Button barrel
import { FormPickerButton } from '@/components/ui/Button/FormPickerButton';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { Ionicons } from '@expo/vector-icons';
import type { TaskFormValues } from '@/components/forms/TaskForm/TaskValidation';
import {
  getDatePickerDisplay,
  getTimeDurationPickerDisplay,
  getAlertsPickerDisplay,
  getIconPickerDisplay,
} from '@/components/ui/Button/FormPickerButton';

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
}) => {
  const colors = useColorPalette();
  const themeColors = useThemeColors();

  // PICKER BUTTONS CONFIGURATION
  const pickerButtons = [
    {
      id: 'icon',
      icon: (values.icon as any) || 'star-outline',
      label: '', // empty label since there's always a default and we don't want to show text
      onPress: onShowIconColorPicker,
    },
    {
      id: 'date',
      icon: 'calendar-outline',
      label: 'No Date',
      onPress: onShowDatePicker,
    },
    {
      id: 'time',
      icon: 'time-outline',
      label: 'Time',
      onPress: onShowTimeDurationPicker,
    },
    {
      id: 'alerts',
      icon: 'notifications-outline',
      label: 'Alerts',
      onPress: onShowAlertsPicker,
    },
  ];

  return (
    <View style={{ paddingBottom: 8 }}>
      {/* horizontal scrollable picker buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        // allow glass expansion to bleed out beyond scroll view bounds
        style={{ overflow: 'visible' }}
        contentContainerStyle={{
          // use horizontal padding instead of fixed width so the row
          // can grow beyond the screen and keep scrolling further
          // while still starting/ending nicely inset from the screen edge
          paddingHorizontal: 16,
          gap: 16,
        }}
      >
        {pickerButtons.map((button) => {
          const displayInfo =
            button.id === 'icon'
              ? getIconPickerDisplay(values.icon, values.color, colors, themeColors)
              : button.id === 'date'
              ? getDatePickerDisplay(values.dueDate, colors, themeColors)
              : button.id === 'time'
              ? getTimeDurationPickerDisplay(values.time, values.duration, themeColors)
              : button.id === 'alerts'
              ? getAlertsPickerDisplay(values.alerts?.length || 0, themeColors)
              : null;

          const iconColor = displayInfo ? displayInfo.iconColor : themeColors.text.secondary();
          const textColor = displayInfo ? displayInfo.color : themeColors.text.secondary();

          // Only show display text if there's actually a value selected (not default "No X" text)
          const displayText =
            displayInfo && !displayInfo.text.startsWith('No ') ? displayInfo.text : '';

          const animatedValue =
            button.id === 'icon'
              ? iconButtonHighlightOpacity
              : button.id === 'date'
              ? dateButtonHighlightOpacity
              : button.id === 'time'
              ? timeButtonHighlightOpacity
              : alertsButtonHighlightOpacity;

          return (
            <View
              key={button.id}
              style={{
                // let each picker button size itself naturally; we intentionally
                // avoid using absolute left offsets here so the horizontal
                // ScrollView can extend and scroll as far as needed
                overflow: 'visible',
              }}
            >
              <FormPickerButton
                icon={button.icon}
                defaultText={button.label}
                displayText={displayText}
                textColor={textColor}
                iconColor={iconColor}
                onPress={button.onPress}
                highlightOpacity={animatedValue}
                forceSelected={button.id === 'icon'} // force selected state for icon picker
                rightContainer={
                  button.id === 'icon' ? (
                    <View
                      style={{
                        // make the color-palette pill the same visual height as other picker icons
                       
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons
                        name="color-palette"
                        size={18}
                        color={themeColors.text.secondary()}
                      />
                    </View>
                  ) : undefined
                }
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default PickerButtonsSection;

