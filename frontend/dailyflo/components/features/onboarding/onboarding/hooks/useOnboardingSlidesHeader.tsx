/**
 * native stack header for post-intro slides — back (left) + completion bar + plain-text skip (right).
 * skip lives in this custom `headerTitle` row — not in `headerRight` (liquid glass) — and not overlaid
 * on the screen body (the native header would paint the progress bar above a body overlay and hide taps).
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type Insets, type StyleProp, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { OnboardingSlidesProgressBar } from '../ui/OnboardingSlidesProgressBar';

export type UseOnboardingSlidesHeaderOpts = {
  /** fractional carousel index (can be non-integer mid-swipe) — combined with page count for bar fill */
  pageProgress: number;
  totalPages: number;
  trackColor: string;
  fillColor: string;
  iconColor: string;
  onBackPress: () => void;
  /** plain label in the header row — avoids headerRight chrome + avoids body overlays under the native header */
  skip: {
    label: string;
    accessibilityLabel: string;
    hitSlop: Insets;
    textStyle: StyleProp<TextStyle>;
    onPress: () => void;
    disabled?: boolean;
  };
};

export function useOnboardingSlidesHeader({
  pageProgress,
  totalPages,
  trackColor,
  fillColor,
  iconColor,
  onBackPress,
  skip,
}: UseOnboardingSlidesHeaderOpts): void {
  const navigation = useNavigation();

  const clampedProgress = Math.min(Math.max(pageProgress, 0), Math.max(totalPages - 1, 0));
  // map scroll index to 0..1 completion: first page starts at 1/total, last page ends at 1.
  const completionRatio = totalPages <= 0 ? 0 : (clampedProgress + 1) / totalPages;

  const headerTitle = useCallback(
    () => (
      <View style={styles.titleRow} accessibilityElementsHidden={false}>
        <Pressable
          onPress={onBackPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
        >
          <Ionicons name="chevron-back" size={24} color={iconColor} />
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
    ),
    [completionRatio, trackColor, fillColor, iconColor, onBackPress, skip],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => null,
      headerTitle,
      headerTitleAlign: Platform.OS === 'ios' ? 'left' : 'left',
      // keep header-right empty — same reason as intro: ios wraps `headerRight` in liquid glass bar chrome.
      headerRight: () => null,
      ...(Platform.OS === 'android' ? { title: '' } : {}),
    });
  }, [navigation, headerTitle]);
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
  /** flex so the pill shares the row with trailing skip (no marginRight — row gap handles spacing) */
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
