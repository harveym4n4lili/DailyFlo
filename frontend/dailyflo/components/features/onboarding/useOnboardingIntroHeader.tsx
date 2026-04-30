/**
 * wires native transparent header — only dots (title) + skip (right). no stack back button.
 * called from intro route with current pager index so dots update after swipe/settle or scrollTo.
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { OnboardingDotIndicator } from './OnboardingDotIndicator';

export type UseOnboardingIntroHeaderOpts = {
  pageIndex: number;
  /** total horizontal intro pages — must equal ScrollView children count */
  totalPages: number;
};

export function useOnboardingIntroHeader({ pageIndex, totalPages }: UseOnboardingIntroHeaderOpts): void {
  const navigation = useNavigation();

  const headerTitle = useCallback(
    () => <OnboardingDotIndicator totalSteps={totalPages} activeIndex={pageIndex} />,
    [pageIndex, totalPages],
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
