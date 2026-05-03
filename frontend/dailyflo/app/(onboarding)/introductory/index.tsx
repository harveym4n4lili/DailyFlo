/**
 * introductory route — horizontal swipe carousel; slide UI lives in `@/components/.../introductory/pages`.
 * titles + backgrounds crossfade via `introductory/scrollTransition` helpers and `introductory/components`.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  Text,
  Animated,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContinueButton } from '@/components/ui/Button';
import {
  ONBOARDING_INTRO_PAGE_COUNT,
  INTRO_TEXT_TOKENS,
  INTRO_PAGE_TITLES,
  INTRO_PAGE_CAPTIONS,
  INTRO_PAGE_SLIDE_UI,
  IntroWelcomeDailyFloPage,
  IntroYourDayTimelinePage,
  IntroHabitsFlowPage,
  IntroCopilotPlanPage,
  useCompleteOnboardingAndExit,
  useOnboardingIntroHeader,
  useIntroScrollTransition,
  IntroScrollCrossfadeBackgrounds,
  IntroScrollCrossfadeTitleLayer,
  resolveIntroTextColor,
  resolveIntroContinueButtonPaint,
  blendIntroContinueButtonColors,
} from '@/components/features/onboarding';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function OnboardingIntroductoryScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const themeColors = useThemeColors();
  const typography = useTypography();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageProgress, setPageProgress] = useState(0);
  const { completeAndExit, busy } = useCompleteOnboardingAndExit();

  const { scrollRef, scrollX, onScroll } = useIntroScrollTransition(
    ONBOARDING_INTRO_PAGE_COUNT,
    windowWidth,
    setPageProgress,
  );

  const skipTextStyle = useMemo(
    () => [
      typography.getTextStyle(INTRO_TEXT_TOKENS.skip.typography),
      { color: resolveIntroTextColor(themeColors.text, INTRO_TEXT_TOKENS.skip.color) },
    ],
    [typography, themeColors],
  );

  const titleTypographyOnly = useMemo(
    () => typography.getTextStyle(INTRO_TEXT_TOKENS.title.typography),
    [typography],
  );

  const captionTypographyOnly = useMemo(() => typography.getTextStyle('body-large'), [typography]);

  // header dots still snap to rounded page; FAB fill/icon crossfade in rgb as you scroll (fractional `pageProgress`).
  const headerDotColor = useMemo(() => {
    const idx = Math.min(Math.max(Math.round(pageProgress), 0), ONBOARDING_INTRO_PAGE_COUNT - 1);
    return resolveIntroTextColor(themeColors.text, INTRO_PAGE_SLIDE_UI[idx].dotIndicatorColor);
  }, [pageProgress, themeColors]);

  const continuePaintByPage = useMemo(
    () => ({
      fills: INTRO_PAGE_SLIDE_UI.map((c) =>
        resolveIntroContinueButtonPaint(themeColors, c.continueButtonBackground),
      ),
      icons: INTRO_PAGE_SLIDE_UI.map((c) =>
        resolveIntroContinueButtonPaint(themeColors, c.continueButtonIcon),
      ),
    }),
    [themeColors],
  );

  const continuePaint = useMemo(
    () => blendIntroContinueButtonColors(pageProgress, continuePaintByPage.fills, continuePaintByPage.icons),
    [pageProgress, continuePaintByPage],
  );

  useOnboardingIntroHeader({
    pageProgress,
    totalPages: ONBOARDING_INTRO_PAGE_COUNT,
    dotColor: headerDotColor,
  });

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / Math.max(windowWidth, 1));
      const clamped = Math.min(Math.max(next, 0), ONBOARDING_INTRO_PAGE_COUNT - 1);
      setPageIndex(clamped);
      setPageProgress(clamped);
    },
    [windowWidth],
  );

  const onContinue = useCallback(() => {
    if (pageIndex < ONBOARDING_INTRO_PAGE_COUNT - 1) {
      scrollRef.current?.scrollTo({ x: windowWidth * (pageIndex + 1), animated: true });
      return;
    }
    void completeAndExit();
  }, [pageIndex, windowWidth, completeAndExit, scrollRef]);

  const introPages = useMemo(
    () => [
      <View key={0} style={[styles.page, { width: windowWidth, height: windowHeight }]}>
        <IntroWelcomeDailyFloPage />
      </View>,
      <View key={1} style={[styles.page, { width: windowWidth, height: windowHeight }]}>
        <IntroYourDayTimelinePage />
      </View>,
      <View key={2} style={[styles.page, { width: windowWidth, height: windowHeight }]}>
        <IntroHabitsFlowPage />
      </View>,
      <View key={3} style={[styles.page, { width: windowWidth, height: windowHeight }]}>
        <IntroCopilotPlanPage />
      </View>,
    ],
    [windowWidth, windowHeight],
  );

  return (
    <View style={styles.root}>
      <IntroScrollCrossfadeBackgrounds
        scrollX={scrollX}
        pageWidth={windowWidth}
        slideUiList={INTRO_PAGE_SLIDE_UI}
      />

      <Pressable
        onPress={completeAndExit}
        accessibilityRole="button"
        accessibilityLabel="Skip introduction"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
        style={[styles.skipButton, { top: insets.top + 10 }]}
      >
        <Text style={skipTextStyle}>Skip</Text>
      </Pressable>

      <IntroScrollCrossfadeTitleLayer
        scrollX={scrollX}
        pageWidth={windowWidth}
        titleLayerTop={headerHeight + Paddings.screen}
        titleConfigs={INTRO_PAGE_TITLES}
        captions={INTRO_PAGE_CAPTIONS}
        slideUiList={INTRO_PAGE_SLIDE_UI}
        titleTypographyStyle={titleTypographyOnly}
        captionTypographyStyle={captionTypographyOnly}
      />

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.horizontalCarousel}
        contentContainerStyle={styles.horizontalCarouselContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        automaticallyAdjustContentInsets={false}
        bounces={false}
      >
        {introPages}
      </Animated.ScrollView>

      <View style={[StyleSheet.absoluteFillObject, { zIndex: 10, elevation: 10 }]} pointerEvents="box-none">
        <ContinueButton
          onPress={onContinue}
          loading={busy}
          fillColor={continuePaint.fill}
          iconColor={continuePaint.icon}
          accessibilityLabel={
            pageIndex < ONBOARDING_INTRO_PAGE_COUNT - 1 ? 'Continue to next slide' : 'Finish intro and enter app'
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  skipButton: {
    position: 'absolute',
    right: 16,
    zIndex: 3,
  },
  horizontalCarousel: {
    flex: 1,
  },
  horizontalCarouselContent: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
  page: {
    flexDirection: 'row',
  },
});
