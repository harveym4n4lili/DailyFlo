/**
 * TaskTimeDurationModal
 * 
 * Modal for selecting task time and duration.
 * Shows time picker and duration options.
 * Uses DraggableModal component for drag-to-dismiss and snap point functionality.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { ModalHeader, DraggableModal } from '@/components/layout/ModalLayout';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

import type { TaskColor } from '@/types';

export interface TaskTimeDurationModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTime?: string;
  selectedDuration?: number;
  onSelectTime: (time: string | undefined) => void;
  onSelectDuration: (duration: number | undefined) => void;
  taskCategoryColor?: TaskColor;
}

// preset duration options in minutes
// these are common task durations that users can quickly select
// includes None option for clearing duration
const DURATION_PRESETS = [
  { value: undefined, label: 'None' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
];


export function TaskTimeDurationModal({
  visible,
  onClose,
  selectedTime,
  selectedDuration,
  onSelectTime,
  onSelectDuration,
  taskCategoryColor,
}: TaskTimeDurationModalProps) {
  // CONSOLE DEBUGGING
  // console.log('⏰ TaskTimeDurationModal - visible:', visible);
  
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();

  // dynamic slider width - measured from container
  const [sliderWidth, setSliderWidth] = useState(300); // default fallback
  
  // time picker state - wheel visibility controlled by button
  const [pickerTime, setPickerTime] = useState(new Date()); // internal time for the picker
  const [showTimePicker, setShowTimePicker] = useState(false); // controls when the time picker wheel is visible
  const [isNoTimeMode, setIsNoTimeMode] = useState(false); // tracks if we're in "No Time" mode (wheel visible)
  
  // internal working state (not applied until "Done")
  const [workingTime, setWorkingTime] = useState<string | undefined>(selectedTime);
  const [workingDuration, setWorkingDuration] = useState<number | undefined>(selectedDuration);
  
  // track initial/committed values
  const [initialTime, setInitialTime] = useState<string | undefined>(selectedTime);
  const [initialDuration, setInitialDuration] = useState<number | undefined>(selectedDuration);
  const [hasChanges, setHasChanges] = useState(false);
  
  // when modal opens, sync working values with selected values
  useEffect(() => {
    if (visible) {
      setWorkingTime(selectedTime);
      setWorkingDuration(selectedDuration);
      setInitialTime(selectedTime);
      setInitialDuration(selectedDuration);
      setHasChanges(false);
    }
  }, [visible, selectedTime, selectedDuration]);
  
  // detect if working values have changed from initial
  useEffect(() => {
    const timeChanged = workingTime !== initialTime;
    const durationChanged = workingDuration !== initialDuration;
    setHasChanges(timeChanged || durationChanged);
  }, [workingTime, workingDuration, initialTime, initialDuration]);

  // find the index of currently working duration in presets
  const getCurrentIndex = () => {
    const index = DURATION_PRESETS.findIndex(p => p.value === workingDuration);
    return index >= 0 ? index : 0; // default to first item (None)
  };

  // shared value for slider position (0 to 1 representing full range)
  const sliderPosition = useSharedValue(getCurrentIndex() / (DURATION_PRESETS.length - 1));
  // store start position for gesture
  const startPosition = useSharedValue(0);

  // handle duration preset selection
  // flow: user drags slider or taps → snaps to nearest preset → updates working state only
  // accepts undefined for "None" option to clear duration
  const handleDurationSelect = (duration: number | undefined) => {
    // console.log('Duration selected:', duration);
    setWorkingDuration(duration); // update working state only, not parent
  };

  // snap to nearest preset based on slider position
  // this runs on the JS thread to update the selected duration
  const updateSelectedDuration = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(DURATION_PRESETS.length - 1, index));
    handleDurationSelect(DURATION_PRESETS[clampedIndex].value);
  };

  // handle time picker confirmation (user taps "Confirm")
  const handleTimePickerConfirm = (selectedTime: Date) => {
    // format the selected time to HH:MM string
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // update the working time (not applied until "Done")
    setWorkingTime(timeString);
    setPickerTime(selectedTime); // update internal picker time
    
    // close the time picker modal
    setIsNoTimeMode(false);
    setShowTimePicker(false);
  };

  // get the display text for the time button
  const getTimeButtonText = () => {
    // show working time (not yet applied)
    if (workingTime) {
      return workingTime;
    }
    // if no time is set, show "No Time"
    return "No Time";
  };

  // handle "No Time" button press - shows wheel picker
  const handleNoTimePress = () => {
    // reset picker to 00:00 when opening
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    setPickerTime(midnight);
    
    // enter no time mode - show wheel picker
    setIsNoTimeMode(true);
    setShowTimePicker(true);
  };

  // handle "No Time" button press in picker - clears working time
  const handleClearPress = () => {
    setIsNoTimeMode(false);
    setShowTimePicker(false);
    setWorkingTime(undefined); // clear working time (not applied until "Done")
  };

  // handle backdrop tap - just close without clearing time
  const handleBackdropPress = () => {
    setIsNoTimeMode(false);
    setShowTimePicker(false);
    // don't clear time on backdrop tap
  };
  
  /**
   * Handle cancel button - discard changes and close
   */
  const handleCancel = () => {
    setWorkingTime(initialTime); // reset working time to initial
    setWorkingDuration(initialDuration); // reset working duration to initial
    onClose();
  };
  
  /**
   * Handle done button - apply changes to parent and close
   */
  const handleDone = () => {
    onSelectTime(workingTime); // apply working time to parent
    onSelectDuration(workingDuration); // apply working duration to parent
    onClose();
  };

  return (
    <>
    <DraggableModal
      visible={visible}
      onClose={onClose}
        // snap points: close at 30%, initial at 55%, expanded at 90%
        // lowest snap point (30%) will dismiss the modal
        snapPoints={[0.3, 0.5, 0.9]}
        // start at the middle snap point (55%)
        initialSnapPoint={1}
        // showBackdrop=true: DraggableModal handles its own backdrop
        showBackdrop={true}
      >
      {/* modal header with action buttons */}
      {/* showActionButtons enables Cancel/Done buttons */}
      {/* Done button only appears when hasChanges is true */}
      <ModalHeader
        title="Time & Duration"
        showActionButtons={true}
        hasChanges={hasChanges}
        onCancel={handleCancel}
        onDone={handleDone}
        showDragIndicator={true}
        showBorder={true}
        taskCategoryColor={taskCategoryColor}
      />

      {/* scrollable content area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 32,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* time row - label on left, value box on right */}
        <View style={{ gap: 0 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            {/* time label on the left */}
            <Text style={[
              getTextStyle('heading-4'),
              { color: themeColors.text.primary() }
            ]}>
              Time
            </Text>

            {/* Time button */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Time button - shows No Time/selected time/No time */}
              <Pressable 
                onPress={handleNoTimePress}
                style={{
                  backgroundColor: themeColors.background.tertiary(),
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={[
                  getTextStyle('body-large'),
                  { color: themeColors.text.primary?.()}
                ]}>
                  {getTimeButtonText()}
                </Text>
              </Pressable>
            </View>
          </View>


      
        </View>

        {/* duration section */}
        <View style={{ gap: 16, paddingTop: 8 }}>
          {/* duration title */}
          <Text style={[
            getTextStyle('heading-4'),
            { color: themeColors.text.primary() }
          ]}>
            Duration
          </Text>

          {/* draggable duration slider with snap-to-selection */}
          <View style={{ paddingVertical: 20, position: 'relative' }}>
            {/* container for track and thumb - this allows proper layering */}
            <View 
              style={{ 
                height: 28,
                width: '100%',
                alignSelf: 'center',
                position: 'relative',
              }}
              onLayout={(event) => {
                // measure actual width of container
                const { width } = event.nativeEvent.layout;
                setSliderWidth(width);
              }}
            >
              {/* slider track - same height as circle for clean look */}
              <View style={{
                height: 28,
                width: '100%',
                backgroundColor: themeColors.background.tertiary(),
                borderRadius: 14,
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
              }}>
                {/* filled track (shows progress) - extends to right edge of circle */}
                <Animated.View style={[
                  {
                    height: '100%',
                    backgroundColor: themeColors.interactive.secondary(),
                    borderRadius: 14,
                  },
                  useAnimatedStyle(() => {
                    // filled track extends to right edge of circle
                    // at position 0: width = 28 (just covers circle)
                    // at position 1: width = sliderWidth (full track)
                    const fillWidth = 28 + (sliderPosition.value * (sliderWidth - 28));
                    return {
                      width: fillWidth,
                    };
                  })
                ]} />
              </View>

              {/* draggable thumb (handle) - positioned on top of track */}
              <GestureDetector gesture={Gesture.Pan()
                .onBegin(() => {
                  'worklet';
                  // store the starting position when drag begins
                  startPosition.value = sliderPosition.value;
                })
              .onUpdate((event) => {
                'worklet';
                // calculate new position based on drag from start position
                // position is clamped between 0 and 1
                const newPosition = Math.max(0, Math.min(1, 
                  startPosition.value + (event.translationX / sliderWidth)
                ));
                sliderPosition.value = newPosition;
                
                // update selection in real-time as user drags past snap points
                const nearestIndex = Math.round(newPosition * (DURATION_PRESETS.length - 1));
                runOnJS(updateSelectedDuration)(nearestIndex);
              })
                .onEnd(() => {
                  'worklet';
                  // when drag ends, snap to nearest preset
                  // calculate which preset index is closest
                  const index = Math.round(sliderPosition.value * (DURATION_PRESETS.length - 1));
                  const snappedPosition = index / (DURATION_PRESETS.length - 1);
                  
                  // update the slider position immediately without animation
                  sliderPosition.value = snappedPosition;
                  
                  // update the selected duration on JS thread
                  runOnJS(updateSelectedDuration)(index);
                })
              }>
                <Animated.View style={[
                  {
                    position: 'absolute',
                    top: -14, // extend touch area above
                    width: 56, // bigger touch area (28 + 28)
                    height: 56, // bigger touch area (28 + 28)
                    borderRadius: 28,
                    // no background color - invisible touch area
                    zIndex: 10,
                    // center the touch area on the visual circle
                    marginLeft: -14, // offset to center (56-28)/2 = 14
                  },
                  useAnimatedStyle(() => {
                    // circle stays within track bounds
                    // at position 0: left edge at 0 (circle center at 14px)
                    // at position 1: left edge at sliderWidth - 28 (circle center at sliderWidth - 14)
                    return {
                      left: sliderPosition.value * (sliderWidth - 28),
                    };
                  })
                ]}>
                  {/* visual circle inside the bigger touch area */}
                  <View style={{
                    position: 'absolute',
                    top: 14, // center within touch area (56-28)/2 = 14
                    left: 14, // center within touch area (56-28)/2 = 14
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 2,
                    borderColor: themeColors.interactive.primary(),
                  }} />
                </Animated.View>
              </GestureDetector>
            </View>

            {/* tick marks and labels for all duration steps */}
            <View style={{
              width: '100%',
              alignSelf: 'center',
              marginTop: 16,
              position: 'relative',
              height: 40,
            }}>
              {DURATION_PRESETS.map((preset, index) => {
                // check if this is the currently selected preset (using working duration)
                const isSelected = preset.value === workingDuration;
                
                // calculate label position to match snap points
                // labels are centered on snap points where circle center will be
                const position = index / (DURATION_PRESETS.length - 1);
                const centerPosition = 14 + (position * (sliderWidth - 28));
                
                return (
                  <View 
                    key={preset.label} 
                    style={{ 
                      position: 'absolute',
                      left: centerPosition,
                      transform: [{ translateX: -20 }], // center the label (approximate width/2)
                      alignItems: 'center', 
                      gap: 4,
                      width: 40, // fixed width for centering
                    }}
                  >
                    {/* tick mark */}
                    <View style={{
                      width: 4,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: isSelected 
                        ? themeColors.interactive.primary()
                        : themeColors.text.tertiary?.() || themeColors.text.secondary(),
                      alignSelf: 'center',
                    }} />
                    
                    {/* label */}
                    <Text style={[
                      getTextStyle('body-medium'),
                      { 
                        color: isSelected
                          ? themeColors.interactive.primary()
                          : themeColors.text.secondary(),
                        fontWeight: isSelected ? '600' : '400',
                        textAlign: 'center',
                      }
                    ]}>
                      {preset.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

      </ScrollView>

      {/* modal time picker - rendered inside draggable modal to fix hierarchy */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        display="spinner" // ios wheel style picker
        onConfirm={handleTimePickerConfirm}
        onCancel={handleClearPress} // "No Time" button clears the time
        onHide={handleBackdropPress} // backdrop tap just closes, doesn't clear
        cancelTextIOS="No Time" // change cancel button text to "No Time"
        is24Hour={true} // use 24-hour format
        date={pickerTime}
        // removed custom textColor/accentColor to use library defaults (blue iOS styling)
      />
    </DraggableModal>
    </>
  );
}

export default TaskTimeDurationModal;


