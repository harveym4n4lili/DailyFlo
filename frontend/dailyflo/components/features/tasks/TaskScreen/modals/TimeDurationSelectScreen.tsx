/**
 * Time & duration select screen content. Used by app/time-duration-select (root-level route).
 * Draft via CreateTaskDraftProvider.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';

const DURATION_PRESETS = [
  { value: undefined, label: 'None' },
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
];

export function TimeDurationSelectScreen() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { draft, setTime, setDuration } = useCreateTaskDraft();

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass
    ? 'transparent'
    : themeColors.background.secondary();

  const selectedTime = draft.time;
  const selectedDuration = draft.duration;

  const [sliderWidth, setSliderWidth] = useState(300);
  const [pickerTime, setPickerTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const sliderWidthSV = useSharedValue(300);

  const getCurrentIndex = () => {
    const index = DURATION_PRESETS.findIndex((p) => p.value === selectedDuration);
    return index >= 0 ? index : 0;
  };
  const sliderPosition = useSharedValue(getCurrentIndex() / (DURATION_PRESETS.length - 1));
  const startPosition = useSharedValue(0);

  const handleDurationSelect = (duration: number | undefined) => {
    setDuration(duration);
  };
  const updateSelectedDuration = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(DURATION_PRESETS.length - 1, index));
    handleDurationSelect(DURATION_PRESETS[clampedIndex].value);
  };

  const handleTimePickerConfirm = (selectedTimeDate: Date) => {
    const hours = selectedTimeDate.getHours().toString().padStart(2, '0');
    const minutes = selectedTimeDate.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    setPickerTime(selectedTimeDate);
    setShowTimePicker(false);
  };

  const getTimeButtonText = () => (selectedTime ? selectedTime : 'No Time');

  const handleNoTimePress = () => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    setPickerTime(midnight);
    setShowTimePicker(true);
  };

  const handleClearPress = () => {
    setShowTimePicker(false);
    setTime(undefined);
  };

  const handleBackdropPress = () => {
    setShowTimePicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: 20,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 20,
            gap: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text style={[getTextStyle('heading-4'), { color: themeColors.text.primary() }]}>Time</Text>
            <Pressable
              onPress={handleNoTimePress}
              style={({ pressed }) => ({
                backgroundColor: pressed ? themeColors.background.tertiary() : 'transparent',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
              })}
            >
              <Text style={[getTextStyle('body-large'), { color: themeColors.text.primary?.() }]}>
                {getTimeButtonText()}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ gap: 16, paddingTop: 8 }}>
          <Text style={[getTextStyle('heading-4'), { color: themeColors.text.primary() }]}>Duration</Text>
          <View style={{ paddingVertical: 20, position: 'relative' }}>
            <View
              style={{ height: 28, width: '100%', alignSelf: 'center', position: 'relative' }}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0) {
                  setSliderWidth(w);
                  sliderWidthSV.value = w;
                }
              }}
            >
              <View
                style={{
                  height: 28,
                  width: '100%',
                  backgroundColor: themeColors.background.tertiary(),
                  borderRadius: 14,
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                <Animated.View
                  style={[
                    { height: '100%', backgroundColor: themeColors.interactive.secondary(), borderRadius: 14 },
                    useAnimatedStyle(() => ({
                      width: 28 + sliderPosition.value * (sliderWidthSV.value - 28),
                    })),
                  ]}
                />
              </View>
              <GestureDetector
                gesture={Gesture.Pan()
                  .onBegin(() => {
                    'worklet';
                    startPosition.value = sliderPosition.value;
                  })
                  .onUpdate((event) => {
                    'worklet';
                    const newPosition = Math.max(
                      0,
                      Math.min(1, startPosition.value + event.translationX / sliderWidthSV.value),
                    );
                    sliderPosition.value = newPosition;
                    const nearestIndex = Math.round(newPosition * (DURATION_PRESETS.length - 1));
                    runOnJS(updateSelectedDuration)(nearestIndex);
                  })
                  .onEnd(() => {
                    'worklet';
                    const index = Math.round(sliderPosition.value * (DURATION_PRESETS.length - 1));
                    sliderPosition.value = index / (DURATION_PRESETS.length - 1);
                    runOnJS(updateSelectedDuration)(index);
                  })}
              >
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: -14,
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      zIndex: 10,
                      marginLeft: -14,
                    },
                    useAnimatedStyle(() => ({
                      left: sliderPosition.value * (sliderWidthSV.value - 28),
                    })),
                  ]}
                >
                  <View
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 2,
                      borderColor: themeColors.interactive.primary(),
                    }}
                  />
                </Animated.View>
              </GestureDetector>
            </View>
            <View style={{ width: '100%', alignSelf: 'center', marginTop: 16, position: 'relative', height: 40 }}>
              {DURATION_PRESETS.map((preset, index) => {
                const isSelected = preset.value === selectedDuration;
                const position = index / (DURATION_PRESETS.length - 1);
                const centerPosition = 14 + position * (sliderWidth - 28);
                return (
                  <View
                    key={preset.label}
                    style={{
                      position: 'absolute',
                      left: centerPosition,
                      transform: [{ translateX: -20 }],
                      alignItems: 'center',
                      gap: 4,
                      width: 40,
                    }}
                  >
                    <View
                      style={{
                        width: 4,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isSelected
                          ? themeColors.interactive.primary()
                          : themeColors.text.tertiary?.() || themeColors.text.secondary(),
                        alignSelf: 'center',
                      }}
                    />
                    <Text
                      style={[
                        getTextStyle('body-medium'),
                        {
                          color: isSelected ? themeColors.interactive.primary() : themeColors.text.secondary(),
                          fontWeight: isSelected ? '600' : '400',
                          textAlign: 'center',
                        },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        display="spinner"
        onConfirm={handleTimePickerConfirm}
        onCancel={handleClearPress}
        onHide={handleBackdropPress}
        cancelTextIOS="No Time"
        is24Hour={true}
        date={pickerTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
