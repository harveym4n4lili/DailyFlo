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
  OnboardingSampleSlidePage,
  useOnboardingSlidesHeader,
  useOnboardingSlidesScrollTransition,
} from '@/components/features/onboarding';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function OnboardingSlidesScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const themeColors = useThemeColors();
  const router = useGuardedRouter();
  const [pageProgress, setPageProgress] = useState(0);

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

  useOnboardingSlidesHeader({
    pageProgress,
    totalPages: ONBOARDING_SLIDES_PAGE_COUNT,
    trackColor: barTrack,
    fillColor: barFill,
    iconColor: themeColors.text.primary(),
    onBackPress: goBack,
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

  // one entry per page — append components here as you add titles in constants.
  const slidePages = useMemo(
    () => [
      <View key={0} style={[styles.page, { width: windowWidth, height: windowHeight }]}>
        <OnboardingSampleSlidePage pageIndex={0} />
      </View>,
    ],
    [windowWidth, windowHeight],
  );

  return (
    <View style={styles.root}>
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
    backgroundColor: 'transparent',
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
