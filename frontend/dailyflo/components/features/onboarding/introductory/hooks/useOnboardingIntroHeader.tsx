/**
 * wires native transparent header — only dots (title) + skip (right). no stack back button.
 * called from intro route with scroll progress so dots update during swipe and after settle / scrollTo.
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { OnboardingDotIndicator } from '../ui/OnboardingDotIndicator';

export type UseOnboardingIntroHeaderOpts = {
  pageProgress: number;
  /** total horizontal intro pages — must equal ScrollView children count */
  totalPages: number;
};

export function useOnboardingIntroHeader({ pageProgress, totalPages }: UseOnboardingIntroHeaderOpts): void {
  const navigation = useNavigation();

  const headerTitle = useCallback(
    () => <OnboardingDotIndicator totalSteps={totalPages} activeProgress={pageProgress} />,
    [pageProgress, totalPages],
  );

  // native stack: hide any default back affordance — intro funnel has swipe + skip + continue only.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerBackVisible: false,
      headerLeft: () => null,
      headerTitle,
      // keep header-right empty so ios does not wrap custom controls in toolbar/liquid glass chrome.
      headerRight: () => null,
      ...(Platform.OS === 'android' ? { title: '' } : {}),
    });
  }, [navigation, headerTitle]);
}
