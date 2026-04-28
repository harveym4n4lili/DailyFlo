/**
 * Tags Screen
 *
 * Layout matches Today screen: big header above content, mini header in top section
 * fades in when scrolled. Blur + gradient top section, back button left.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton } from '@/components/ui/Button';
import { ScreenHeaderActions } from '@/components/ui';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { Paddings } from '@/constants/Paddings';
import { browseScrollPaddingTop } from '@/constants/browseScrollPaddingTop';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const SCROLL_THRESHOLD = 16;

export default function TagsScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = createStyles(themeColors, typography, insets);

  const scrollY = useSharedValue(0);
  const miniHeaderOpacity = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.value > SCROLL_THRESHOLD,
    (shouldShow) => {
      miniHeaderOpacity.value = withTiming(shouldShow ? 1 : 0, { duration: 200 });
    }
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const miniHeaderStyle = useAnimatedStyle(() => ({
    opacity: miniHeaderOpacity.value,
  }));

  const bigHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  // android: glass back in blur band; ios uses Stack.Toolbar chevron.left.
  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

  return (
    <>
      <IosBrowseBackStackToolbar />
      <IosDashboardOverflowToolbar />
      <View style={{ flex: 1 }}>
      {/* top section – blur + gradient + mini header that fades in on scroll */}
      <View
        style={[
          styles.topSectionAnchor,
          { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT },
        ]}
      >
        <BlurView
          tint={themeColors.isDark ? 'dark' : 'light'}
          intensity={1}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            themeColors.background.primary(),
            themeColors.withOpacity(themeColors.background.primary(), 0),
          ]}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          <Animated.View style={[styles.miniHeader, miniHeaderStyle]} pointerEvents="none">
            <Text style={[styles.miniHeaderText, { color: themeColors.text.primary() }]}>
              Tags
            </Text>
          </Animated.View>
          {Platform.OS === 'android' ? (
            <ScreenHeaderActions variant="dashboard" style={styles.topSectionContextButton} tint="primary" />
          ) : (
            <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          )}
        </View>
      </View>

      {Platform.OS === 'android' ? (
        <View style={styles.backButtonContainer} pointerEvents="box-none">
          <MainBackButton
            onPress={() => router.back()}
            top={backButtonTop}
            left={Paddings.screen}
          />
        </View>
      ) : null}

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <Animated.View style={bigHeaderStyle}>
          <Text style={[styles.bigHeader, { color: themeColors.text.primary() }]}>
            Tags
          </Text>
        </Animated.View>
        <Text style={[styles.exampleTitle, { color: themeColors.text.secondary() }]}>
          Example content
        </Text>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.exampleItem,
              { backgroundColor: themeColors.background.primarySecondaryBlend() },
            ]}
          >
            <Text style={[styles.exampleItemText, { color: themeColors.text.primary() }]}>
              Tag item {i}
            </Text>
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
      </View>
    </>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: TOP_SECTION_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
    },
    miniHeader: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniHeaderText: {
      ...typography.getTextStyle('heading-3'),
    },
    topSectionContextButton: {
      backgroundColor: 'primary',
    },
    backButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top + TOP_SECTION_ROW_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Paddings.screen,
      paddingTop: browseScrollPaddingTop(insets.top),
      flexGrow: 1,
    },
    bigHeader: {
      ...typography.getTextStyle('heading-1'),
      marginBottom: 8,
    },
    exampleTitle: {
      ...typography.getTextStyle('body-large'),
      marginBottom: 16,
    },
    exampleItem: {
      paddingVertical: 16,
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      borderRadius: 12,
      marginBottom: 8,
    },
    exampleItemText: {
      ...typography.getTextStyle('body'),
    },
    bottomSpacer: {
      height: 200,
    },
  });
