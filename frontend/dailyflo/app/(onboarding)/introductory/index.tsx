/**
 * introductory route — horizontal pager host; slide UI lives in `@/components/.../introductory/pages`.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContinueButton } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import {
  ONBOARDING_INTRO_PAGE_COUNT,
  IntroSamplePageOne,
  IntroSamplePageTwo,
  useCompleteOnboardingAndExit,
  useOnboardingIntroHeader,
} from '@/components/features/onboarding';

export default function OnboardingIntroductoryScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [pageIndex, setPageIndex] = useState(0);
  const { completeAndExit, busy } = useCompleteOnboardingAndExit();

  useOnboardingIntroHeader({
    pageIndex,
    totalPages: ONBOARDING_INTRO_PAGE_COUNT,
  });

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / Math.max(windowWidth, 1));
      setPageIndex(Math.min(Math.max(next, 0), ONBOARDING_INTRO_PAGE_COUNT - 1));
    },
    [windowWidth],
  );

  const onContinue = useCallback(() => {
    if (pageIndex < ONBOARDING_INTRO_PAGE_COUNT - 1) {
      scrollRef.current?.scrollTo({ x: windowWidth * (pageIndex + 1), animated: true });
      return;
    }
    void completeAndExit();
  }, [pageIndex, windowWidth, completeAndExit]);

  // keep pager children aligned with ONBOARDING_INTRO_PAGE_COUNT
  const introPages = useMemo(
    () => [
      <View key={0} style={[styles.page, { width: windowWidth, height: windowHeight }]}>
        <IntroSamplePageOne />
      </View>,
      <View key={1} style={[styles.page, { width: windowWidth, height: windowHeight }]}>
        <IntroSamplePageTwo />
      </View>,
    ],
    [windowWidth, windowHeight],
  );

  return (
    <View style={styles.root}>
      {/* fixed background layer: keep page-1 color solid and fade page-2 color on top to avoid mid-swipe dark dip. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: themeColors.background.primary() }]} />
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: themeColors.background.primarySecondaryBlend(),
              opacity: scrollX.interpolate({
                inputRange: [0, windowWidth],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>

      {/* skip sits in screen content so it stays plain text, not native header toolbar/liquid glass. */}
      <Pressable
        onPress={completeAndExit}
        accessibilityRole="button"
        accessibilityLabel="Skip introduction"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
        style={[styles.skipButton, { top: insets.top + 10 }]}
      >
        <Text style={[typography.getTextStyle('body-large'), { color: themeColors.text.secondary() }]}>
          Skip
        </Text>
      </Pressable>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        automaticallyAdjustContentInsets={false}
        bounces={false}
      >
        {introPages}
      </Animated.ScrollView>

      <ContinueButton
        onPress={onContinue}
        loading={busy}
        accessibilityLabel={
          pageIndex < ONBOARDING_INTRO_PAGE_COUNT - 1 ? 'Continue to next slide' : 'Finish intro and enter app'
        }
      />
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
  pager: {
    flex: 1,
  },
  pagerContent: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
  page: {
    flexDirection: 'row',
  },
});
