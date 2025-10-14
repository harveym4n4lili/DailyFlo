/**
 * TaskTimeDurationModal
 * 
 * Modal for selecting task time and duration.
 * Shows time picker and duration options.
 * Uses DraggableModal component for drag-to-dismiss and snap point functionality.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { ModalHeader, DraggableModal } from '@/components/layout/ModalLayout';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';

export interface TaskTimeDurationModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTime?: string;
  selectedDuration?: number;
  onSelectTime: (time: string | undefined) => void;
  onSelectDuration: (duration: number | undefined) => void;
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
}: TaskTimeDurationModalProps) {
  // get theme-aware colors from the color palette system
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();

  // slider width - adjust based on screen width
  const SLIDER_WIDTH = 300;
  const SLIDER_PADDING = 20; // padding on each side

  // find the index of currently selected duration in presets
  const getCurrentIndex = () => {
    const index = DURATION_PRESETS.findIndex(p => p.value === selectedDuration);
    return index >= 0 ? index : 0; // default to first item (None)
  };

  // shared value for slider position (0 to 1 representing full range)
  const sliderPosition = useSharedValue(getCurrentIndex() / (DURATION_PRESETS.length - 1));
  // store start position for gesture
  const startPosition = useSharedValue(0);

  // handle duration preset selection
  // flow: user drags slider or taps → snaps to nearest preset → updates form state
  // accepts undefined for "None" option to clear duration
  const handleDurationSelect = (duration: number | undefined) => {
    console.log('Duration selected:', duration);
    onSelectDuration(duration);
  };

  // snap to nearest preset based on slider position
  // this runs on the JS thread to update the selected duration
  const updateSelectedDuration = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(DURATION_PRESETS.length - 1, index));
    handleDurationSelect(DURATION_PRESETS[clampedIndex].value);
  };

  // clear time selection
  const handleClearTime = () => {
    onSelectTime(undefined);
  };

  return (
    <DraggableModal
      visible={visible}
      onClose={onClose}
      // snap points: close at 30%, initial at 55%, expanded at 90%
      // lowest snap point (30%) will dismiss the modal
      snapPoints={[0.3, 0.55, 0.9]}
      // start at the middle snap point (55%)
      initialSnapPoint={1}
      borderRadius={20}
    >
      {/* modal header with drag indicator and title */}
      {/* showDragIndicator displays the small rounded bar at the top */}
      {/* showCloseButton is false since we dismiss by dragging or tapping backdrop */}
      <ModalHeader
        title="Time & Duration"
        showCloseButton={false}
        showDragIndicator={true}
        showBorder={true}
      />

      {/* scrollable content area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 32,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* time row - label on left, value box on right */}
        <View style={{ gap: 12 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            {/* time label on the left */}
            <Text style={[
              getTextStyle('heading-3'),
              { color: themeColors.text.primary() }
            ]}>
              Time
            </Text>

            {/* time value box on the right */}
            <View style={{
              backgroundColor: themeColors.background.tertiary(),
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}>
              <Text style={[
                getTextStyle('body-large'),
                { color: themeColors.text.primary() }
              ]}>
                {selectedTime || 'Not Set'}
              </Text>
            </View>
          </View>

      
        </View>

        {/* duration section */}
        <View style={{ gap: 16, paddingTop: 8 }}>
          {/* duration title */}
          <Text style={[
            getTextStyle('heading-3'),
            { color: themeColors.text.primary() }
          ]}>
            Duration
          </Text>

          {/* draggable duration slider with snap-to-selection */}
          <View style={{ paddingVertical: 20, position: 'relative' }}>
            {/* container for track and thumb - this allows proper layering */}
            <View style={{ 
              height: 28,
              width: SLIDER_WIDTH,
              alignSelf: 'center',
              position: 'relative',
            }}>
              {/* slider track - same height as circle for clean look */}
              <View style={{
                height: 28,
                width: SLIDER_WIDTH,
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
                    // at position 1: width = SLIDER_WIDTH (full track)
                    const fillWidth = 28 + (sliderPosition.value * (SLIDER_WIDTH - 28));
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
                    startPosition.value + (event.translationX / SLIDER_WIDTH)
                  ));
                  sliderPosition.value = newPosition;
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
                    top: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                    zIndex: 10,
                  },
                  useAnimatedStyle(() => {
                    // circle stays within track bounds
                    // at position 0: left edge at 0 (circle center at 14px)
                    // at position 1: left edge at SLIDER_WIDTH - 28 (circle center at SLIDER_WIDTH - 14)
                    return {
                      left: sliderPosition.value * (SLIDER_WIDTH - 28),
                    };
                  })
                ]} />
              </GestureDetector>
            </View>

            {/* tick marks and labels for all duration steps */}
            <View style={{
              width: SLIDER_WIDTH,
              alignSelf: 'center',
              marginTop: 16,
              position: 'relative',
              height: 40,
            }}>
              {DURATION_PRESETS.map((preset, index) => {
                // check if this is the currently selected preset
                const isSelected = preset.value === selectedDuration;
                
                // calculate label position to match snap points
                // labels are centered on snap points where circle center will be
                const position = index / (DURATION_PRESETS.length - 1);
                const centerPosition = 14 + (position * (SLIDER_WIDTH - 28));
                
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
                      width: 2,
                      height: 8,
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
    </DraggableModal>
  );
}

export default TaskTimeDurationModal;


