/**
 * post-intro onboarding slides — horizontal pager with native header showing back + completion bar.
 * counts + carousel children must stay aligned with `onboarding/onboarding/constants` page list.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

import {
  ONBOARDING_SLIDES_PAGE_COUNT,
  ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL,
  ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP,
  ONBOARDING_SLIDES_SKIP_BUTTON_LABEL,
  ONBOARDING_SLIDES_TEXT_TOKENS,
  OnboardingSampleSlidePage,
  resolveOnboardingSlidesTextColor,
  useCompleteOnboardingAndExit,
  useOnboardingSlidesHeader,
  useOnboardingSlidesScrollTransition,
} from '@/components/features/onboarding';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function OnboardingSlidesScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const router = useGuardedRouter();
  const [pageProgress, setPageProgress] = useState(0);
  const { completeAndExit, busy } = useCompleteOnboardingAndExit();

  // typography + resolved secondary fill — tokens live in `onboarding/constants/onboardingSlidesConstants.ts`
  const skipTextStyle = useMemo(
    () => [
      typography.getTextStyle(ONBOARDING_SLIDES_TEXT_TOKENS.skip.typography),
      { color: resolveOnboardingSlidesTextColor(themeColors, ONBOARDING_SLIDES_TEXT_TOKENS.skip.color) },
    ],
    [typography, themeColors],
  );

  const { scrollRef, onScroll } = useOnboardingSlidesScrollTransition(
    ONBOARDING_SLIDES_PAGE_COUNT,
    windowWidth,
    setPageProgress,
  );

  const barTrack = themeColors.border.primary();
  const barFill = themeColors.primaryButton.fill();

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const slidesHeaderSkip = useMemo(
    () => ({
      label: ONBOARDING_SLIDES_SKIP_BUTTON_LABEL,
      accessibilityLabel: ONBOARDING_SLIDES_SKIP_BUTTON_ACCESSIBILITY_LABEL,
      hitSlop: ONBOARDING_SLIDES_SKIP_BUTTON_HIT_SLOP,
      textStyle: skipTextStyle,
      onPress: completeAndExit,
      disabled: busy,
    }),
    [busy, completeAndExit, skipTextStyle],
  );

  useOnboardingSlidesHeader({
    pageProgress,
    totalPages: ONBOARDING_SLIDES_PAGE_COUNT,
    trackColor: barTrack,
    fillColor: barFill,
    iconColor: themeColors.text.primary(),
    onBackPress: goBack,
    skip: slidesHeaderSkip,
  });

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / Math.max(windowWidth, 1));
      const clamped = Math.min(Math.max(next, 0), ONBOARDING_SLIDES_PAGE_COUNT - 1);
      setPageProgress(clamped);
    },
    [windowWidth],
  );

  // one ScrollView page per questionnaire step — length must match constants page list
  const slidePages = useMemo(
    () =>
      Array.from({ length: ONBOARDING_SLIDES_PAGE_COUNT }, (_, pageIndex) => (
        <View key={pageIndex} style={[styles.page, { width: windowWidth, height: windowHeight }]}>
          <OnboardingSampleSlidePage pageIndex={pageIndex} />
        </View>
      )),
    [windowWidth, windowHeight],
  );

  return (
    // fills the stack’s transparent content area with app primary surface so the pager isn’t see-through
    <View style={[styles.root, { backgroundColor: themeColors.background.primary() }]}>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        automaticallyAdjustContentInsets={false}
        bounces={false}
      >
        {slidePages}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
  page: {},
});
