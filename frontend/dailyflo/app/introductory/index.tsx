/**
 * introductory route — horizontal swipe carousel; slide UI lives in `@/components/.../introductory/pages`.
 * titles + backgrounds crossfade via `introductory/scrollTransition` helpers and `introductory/components`.
 * questionnaire is a separate root stack screen (`app/onboarding`); push it when the last intro page continues.
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
  INTRO_SKIP_TEXT_STYLE,
  INTRO_SKIP_TEXT_COLOR,
  INTRO_SKIP_BUTTON_HIT_SLOP,
  INTRO_SKIP_BUTTON_ABSOLUTE_LAYOUT,
  INTRO_SKIP_BUTTON_ACCESSIBILITY_LABEL,
  INTRO_SKIP_BUTTON_LABEL,
  INTRO_PAGE_TITLES,
  INTRO_PAGE_CAPTIONS,
  INTRO_PAGE_SLIDE_UI,
  INTRO_CROSSFADE_TITLE_TEXT_STYLE,
  INTRO_CAPTION_TEXT_STYLE,
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
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import type { Href } from 'expo-router';

// second root stack — questionnaire funnel (`app/onboarding/index.tsx`); cast keeps tsc happy with generated hrefs.
const QUESTIONNAIRE_HREF = '/onboarding' as Href;

export default function OnboardingIntroductoryScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const themeColors = useThemeColors();
  const router = useGuardedRouter();

  const [pageProgress, setPageProgress] = useState(0);
  const { completeAndExit, busy } = useCompleteOnboardingAndExit();

  const { scrollRef, scrollX, onScroll } = useIntroScrollTransition(
    ONBOARDING_INTRO_PAGE_COUNT,
    windowWidth,
    setPageProgress,
  );

  const skipTextStyle = useMemo(
    () => [INTRO_SKIP_TEXT_STYLE, { color: resolveIntroTextColor(themeColors, INTRO_SKIP_TEXT_COLOR) }],
    [themeColors],
  );

  // header dots still snap to rounded page; FAB fill/icon crossfade in rgb as you scroll (fractional `pageProgress`).
  const headerDotColor = useMemo(() => {
    const idx = Math.min(Math.max(Math.round(pageProgress), 0), ONBOARDING_INTRO_PAGE_COUNT - 1);
    return resolveIntroTextColor(themeColors, INTRO_PAGE_SLIDE_UI[idx].dotIndicatorColor);
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
      setPageProgress(clamped);
    },
    [windowWidth],
  );

  const onContinue = useCallback(() => {
    // use rounded scroll progress, not only `pageIndex` — if momentum-end hasn’t run yet, index can lag
    // the visible page and we’d scroll instead of opening the questionnaire.
    const last = ONBOARDING_INTRO_PAGE_COUNT - 1;
    const idx = Math.min(Math.max(Math.round(pageProgress), 0), last);

    if (idx < last) {
      scrollRef.current?.scrollTo({ x: windowWidth * (idx + 1), animated: true });
      return;
    }
    // intro done — push the second root stack so back returns here; skip/complete still dismissTo today.
    router.push(QUESTIONNAIRE_HREF);
  }, [pageProgress, windowWidth, scrollRef, router]);

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
        accessibilityLabel={INTRO_SKIP_BUTTON_ACCESSIBILITY_LABEL}
        hitSlop={INTRO_SKIP_BUTTON_HIT_SLOP}
        style={[
          {
            position: 'absolute',
            right: INTRO_SKIP_BUTTON_ABSOLUTE_LAYOUT.offsetRight,
            zIndex: INTRO_SKIP_BUTTON_ABSOLUTE_LAYOUT.zIndex,
          },
          { top: insets.top + INTRO_SKIP_BUTTON_ABSOLUTE_LAYOUT.topInsetPlus },
        ]}
      >
        <Text style={skipTextStyle}>{INTRO_SKIP_BUTTON_LABEL}</Text>
      </Pressable>

      <IntroScrollCrossfadeTitleLayer
        scrollX={scrollX}
        pageWidth={windowWidth}
        titleLayerTop={headerHeight + Paddings.screen}
        titleConfigs={INTRO_PAGE_TITLES}
        captions={INTRO_PAGE_CAPTIONS}
        slideUiList={INTRO_PAGE_SLIDE_UI}
        titleTypographyStyle={INTRO_CROSSFADE_TITLE_TEXT_STYLE}
        captionTypographyStyle={INTRO_CAPTION_TEXT_STYLE}
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
            Math.round(pageProgress) < ONBOARDING_INTRO_PAGE_COUNT - 1
              ? 'Continue to next slide'
              : 'Continue to questionnaire'
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
