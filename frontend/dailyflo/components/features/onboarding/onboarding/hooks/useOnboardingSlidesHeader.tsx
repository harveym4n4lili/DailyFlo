/**
 * native stack header for post-intro slides — back (left) + progress bar + plain-text skip (right).
 * skip lives in this custom `headerTitle` row — not in `headerRight` (liquid glass) — and not overlaid
 * on the screen body (the native header would paint the bar above a body overlay and hide taps).
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { Platform, type Insets, type StyleProp, type TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { OnboardingSlidesHeaderChrome } from '../ui/OnboardingSlidesHeaderChrome';

export type UseOnboardingSlidesHeaderOpts = {
  /**
   * fractional step index (0 … totalPages−1) — maps to bar fill via `(clampedProgress + 1) / totalPages`;
   * parent can animate this between integers so the bar eases like scroll-driven progress.
   */
  pageProgress: number;
  totalPages: number;
  trackColor: string;
  fillColor: string;
  onBackPress: () => void;
  /** defaults to "Go back" — e.g. "Back to introduction" on slide 0 */
  backAccessibilityLabel?: string;
  /** resolved css color — usually from `resolveOnboardingSlidesTextColor(..., row.headerBackIconColor ?? 'secondary')` */
  backChevronColor: string;
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
  backChevronColor,
  onBackPress,
  backAccessibilityLabel = 'Go back',
  skip,
}: UseOnboardingSlidesHeaderOpts): void {
  const navigation = useNavigation();

  const clampedProgress = Math.min(Math.max(pageProgress, 0), Math.max(totalPages - 1, 0));
  const completionRatio = totalPages <= 0 ? 0 : (clampedProgress + 1) / totalPages;

  const headerTitle = useCallback(
    () => (
      <OnboardingSlidesHeaderChrome
        completionRatio={completionRatio}
        trackColor={trackColor}
        fillColor={fillColor}
        backChevronColor={backChevronColor}
        onBackPress={onBackPress}
        backAccessibilityLabel={backAccessibilityLabel}
        skip={skip}
      />
    ),
    [
      backAccessibilityLabel,
      backChevronColor,
      completionRatio,
      fillColor,
      onBackPress,
      skip,
      trackColor,
    ],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => null,
      headerTitle,
      headerTitleAlign: Platform.OS === 'ios' ? 'left' : 'left',
      headerRight: () => null,
      title: '',
    });
  }, [navigation, headerTitle]);
}
