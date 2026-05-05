/**
 * native stack header for post-intro slides — back (left) + completion bar (flex grow).
 * intro deliberately hides back; this stack screen opts in so users can return to introductory.
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
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
};

export function useOnboardingSlidesHeader({
  pageProgress,
  totalPages,
  trackColor,
  fillColor,
  iconColor,
  onBackPress,
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
      </View>
    ),
    [completionRatio, trackColor, fillColor, iconColor, onBackPress],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => null,
      headerTitle,
      headerTitleAlign: Platform.OS === 'ios' ? 'left' : 'left',
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
  /** flex so the pill stretches between back icon and trailing safe inset */
  barSlot: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 24,
    marginRight: 8,
  },
});
