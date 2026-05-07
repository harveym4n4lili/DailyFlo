/**
 * presentational row for the slides native header (back + progress + skip).
 * shared by `useOnboardingSlidesHeader` and `OnboardingSlidesInitialHeader` so static route options
 * can paint the same chrome immediately — avoids a blank header / route title flash before the flow mounts.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View, type Insets, type StyleProp, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingSlidesProgressBar } from './OnboardingSlidesProgressBar';

export type OnboardingSlidesHeaderChromeProps = {
  completionRatio: number;
  trackColor: string;
  fillColor: string;
  backChevronColor: string;
  onBackPress: () => void;
  backAccessibilityLabel?: string;
  skip: {
    label: string;
    accessibilityLabel: string;
    hitSlop: Insets;
    textStyle: StyleProp<TextStyle>;
    onPress: () => void;
    disabled?: boolean;
  };
};

export function OnboardingSlidesHeaderChrome({
  completionRatio,
  trackColor,
  fillColor,
  backChevronColor,
  onBackPress,
  backAccessibilityLabel = 'Go back',
  skip,
}: OnboardingSlidesHeaderChromeProps) {
  return (
    <View style={styles.titleRow} accessibilityElementsHidden={false}>
      <Pressable
        onPress={onBackPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel}
        style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
      >
        <Ionicons name="chevron-back" size={24} color={backChevronColor} />
      </Pressable>
      <View style={styles.barSlot}>
        <OnboardingSlidesProgressBar progress={completionRatio} trackColor={trackColor} fillColor={fillColor} />
      </View>
      <Pressable
        onPress={skip.onPress}
        disabled={skip.disabled}
        hitSlop={skip.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={skip.accessibilityLabel}
        style={({ pressed }) => [styles.skipTap, pressed && styles.skipTapPressed]}
      >
        <Text style={skip.textStyle}>{skip.label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  backPressed: {
    opacity: 0.6,
  },
  barSlot: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 24,
  },
  skipTap: {
    paddingVertical: 4,
    paddingLeft: 4,
    justifyContent: 'center',
  },
  skipTapPressed: {
    opacity: 0.6,
  },
});
