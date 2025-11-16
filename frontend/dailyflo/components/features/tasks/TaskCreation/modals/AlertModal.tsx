/**
 * AlertModal Component
 * 
 * Modal for selecting task alerts/reminders with multi-select functionality.
 * Features a draggable modal with cancel/done buttons that appear when changes are made.
 * Uses DraggableModal for drag-to-dismiss and snap point functionality.
 * 
 * Alert Options:
 * - Start of task
 * - End of task
 * - 15 minutes before
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { DraggableModal, ModalHeader } from '@/components/layout/ModalLayout';

/**
 * Available alert options
 * Each option represents a time offset from the task's due date/time
 */
export interface AlertOption {
  id: string;           // unique identifier for this alert option
  label: string;        // display label (e.g., "Start of task", "15 minutes before")
  value: number;        // minutes before the event (0 = start, -1 = end, positive = minutes before)
  icon: string;         // ionicon name for visual representation
}

/**
 * Predefined alert options that users can select from
 */
const ALERT_OPTIONS: AlertOption[] = [
  { id: 'start', label: 'Start of task', value: 0, icon: 'play-outline' },
  { id: 'end', label: 'End of task', value: -1, icon: 'stop-outline' },
  { id: '15-min', label: '15 minutes before', value: 15, icon: 'alarm-outline' },
];

import type { TaskColor } from '@/types';

export interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  // array of alert IDs that are currently selected
  selectedAlerts: string[];
  // callback when user applies changes (presses Done button)
  onApplyAlerts: (alertIds: string[]) => void;
  // task category color for button styling
  taskCategoryColor?: TaskColor;
}

export function AlertModal({
  visible,
  onClose,
  selectedAlerts,
  onApplyAlerts,
  taskCategoryColor,
}: AlertModalProps) {
  // CONSOLE DEBUGGING
  // console.log('🔔 AlertModal - visible:', visible);
  
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();

  // local state to track selected alerts during editing
  // this allows users to make changes without immediately applying them
  const [tempSelectedAlerts, setTempSelectedAlerts] = useState<string[]>(selectedAlerts);
  
  // track whether changes have been made (to show/hide action buttons)
  const [hasChanges, setHasChanges] = useState(false);

  // sync local state with prop changes when modal opens
  // this ensures the modal always starts with the current selection
  useEffect(() => {
    if (visible) {
      setTempSelectedAlerts(selectedAlerts);
      setHasChanges(false);
    }
  }, [visible, selectedAlerts]);

  // check if changes have been made by comparing temp state with original
  useEffect(() => {
    const changed = JSON.stringify(tempSelectedAlerts.sort()) !== JSON.stringify(selectedAlerts.sort());
    setHasChanges(changed);
  }, [tempSelectedAlerts, selectedAlerts]);

  // handle toggling an alert option
  // flow: user taps option → check if already selected → add or remove from array → update temp state
  const handleToggleAlert = (alertId: string) => {
    // console.log('Toggle alert:', alertId);
    setTempSelectedAlerts((prev) => {
      // if already selected, remove it from the array
      if (prev.includes(alertId)) {
        return prev.filter((id) => id !== alertId);
      } 
      // if not selected, add it to the array
      else {
        return [...prev, alertId];
      }
    });
  };

  // handle cancel button press
  // flow: user presses cancel → reset temp state to original → close modal
  const handleCancel = () => {
    // console.log('Cancel alert changes');
    setTempSelectedAlerts(selectedAlerts); // reset to original values
    setHasChanges(false);
    onClose();
  };

  // handle done button press
  // flow: user presses done → apply changes via callback → close modal
  const handleDone = () => {
    // console.log('Apply alert changes:', tempSelectedAlerts);
    onApplyAlerts(tempSelectedAlerts); // send changes to parent
    setHasChanges(false);
    onClose();
  };

  return (
    <>
      <DraggableModal
        visible={visible}
        onClose={onClose}
        // snap points: close at 20%, initial at 50%, expanded at 85%
        // lowest snap point (20%) will dismiss the modal when dragged down
        snapPoints={[0.3, 0.5, 0.9]}
        // start at the middle snap point (50%)
        initialSnapPoint={1}
        // showBackdrop=true: DraggableModal handles its own backdrop
        showBackdrop={true}
      >
        {/* modal header with action buttons */}
        {/* showActionButtons enables Cancel/Done buttons */}
        {/* Done button only appears when hasChanges is true */}
        <ModalHeader
          title="Alerts"
          showActionButtons={true}
          hasChanges={hasChanges}
          onCancel={handleCancel}
          onDone={handleDone}
          showDragIndicator={true}
          showBorder={true}
          taskCategoryColor={taskCategoryColor}
        />

        {/* scrollable alert options */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 0,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* map through available alert options and render as selectable items */}
          {/* styling matches QuickDateOptions for consistency */}
          {ALERT_OPTIONS.map((alert) => {
            // check if this alert is currently selected in temp state
            const isSelected = tempSelectedAlerts.includes(alert.id);

            return (
              <Pressable
                key={alert.id}
                onPress={() => handleToggleAlert(alert.id)}
                style={({ pressed }) => ({
                  // full width to touch edges (matches quick date options)
                  width: '100%',
                  // border only on bottom (matches quick date options)
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border.primary(),
                  // horizontal layout for icon + label on left
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  // consistent padding (matches quick date options)
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  height: 48,
                  // highlight background when selected OR when pressing
                  // selected items stay highlighted with tertiary background
                  backgroundColor: isSelected
                    ? themeColors.background.tertiary()
                    : pressed
                    ? themeColors.background.tertiary()
                    : themeColors.background.elevated(),
                })}
                accessibilityRole="button"
                accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${alert.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                {/* left side: icon and label */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  flex: 1, // take up available space
                }}>
                  {/* alert icon container - fixed width for alignment */}
                  <View
                    style={{
                      width: 20, // fixed width to align icons consistently (matches quick date options)
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12, // space between icon and label
                    }}
                  >
                    <Ionicons
                      name={alert.icon as any}
                      size={20}
                      color={isSelected 
                        ? themeColors.interactive.primary()
                        : themeColors.text.secondary()}
                    />
                  </View>
                  
                  {/* alert label */}
                  <Text
                    style={{
                      ...getTextStyle('body-large'),
                      color: themeColors.text.primary(),
                      fontWeight: '700', // bold for emphasis (matches quick date options)
                    }}
                  >
                    {alert.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

      </DraggableModal>
    </>
  );
}

export default AlertModal;

