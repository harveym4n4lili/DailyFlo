/**
 * liquid-glass bottom tab strip — pairs with FloatingActionButton via CustomTabNavMetricsContext + FAB_SCREEN_INSET.
 * data: customTabNavItems.ts · layout: computeTabBarChromeLayout · tokens: tabBarChrome.constants
 */

import React from 'react';
import { View, DynamicColorIOS, Platform, Pressable, Text, Image, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors } from '@/constants/ColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { FAB_SCREEN_INSET } from '@/components/ui/button';
import { useCustomTabNavMetrics } from '@/contexts/CustomTabNavMetricsContext';

import { buildCustomTabNavItems } from './customTabNavItems';
import { computeTabBarChromeLayout } from './computeTabBarChromeLayout';
import { TAB_BAR_CHROME_LAYOUT, TAB_BAR_CHROME_VISUAL } from './tabBarChrome.constants';
import { customLiquidTabBarStyles as styles } from './customLiquidTabBar.styles';
import { useTabChromeSuppressed } from '@/contexts/TabChromeSuppressContext';

export function CustomLiquidTabBar() {
  const suppressed = useTabChromeSuppressed();
  if (suppressed) return null;

  const router = useRouter();
  const typography = useTypography();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  const { measuredNavBarHeight, setMeasuredNavBarHeight } = useCustomTabNavMetrics();

  React.useEffect(
    () => () => {
      setMeasuredNavBarHeight(null);
    },
    [setMeasuredNavBarHeight]
  );

  const [optimisticCustomTabKey, setOptimisticCustomTabKey] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (optimisticCustomTabKey === null) return;
    if (segments.includes(optimisticCustomTabKey)) {
      setOptimisticCustomTabKey(null);
    }
  }, [segments, optimisticCustomTabKey]);

  // starts from navbar token, then bumps size (global navbar is 10pt — see Typography TextStyles)
  const labelBase = {
    ...typography.getTextStyle('navbar'),
    fontSize: TAB_BAR_CHROME_VISUAL.tabLabelFontSize,
    lineHeight: TAB_BAR_CHROME_VISUAL.tabLabelLineHeight,
    ...(Platform.OS === 'ios' && { fontFamily: 'ui-rounded' as const }),
  };

  const { customTabStripBottom, customTabBarRightInset } = computeTabBarChromeLayout(
    measuredNavBarHeight,
    FAB_SCREEN_INSET
  );

  // recompute each render so getTodayTabIcon() can update when the calendar day changes
  const customTabItems = buildCustomTabNavItems();

  const customTabBarItems = customTabItems.map((item) => {
    const selected =
      optimisticCustomTabKey !== null
        ? optimisticCustomTabKey === item.key
        : segments.includes(item.key);
    // dark: unselected matches primary body text; light: keep softer secondary so tabs don’t compete with content
    const unselectedTint =
      themeColors.isDark ? themeColors.text.primary() : themeColors.text.secondary();
    const tint = selected ? themeColors.primaryButton.fill() : unselectedTint;
    const labelColor = selected ? themeColors.primaryButton.fill() : unselectedTint;
    return (
      <Pressable
        key={item.key}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setOptimisticCustomTabKey(item.key);
          router.push(item.href as any);
        }}
        style={({ pressed }) => [styles.customTabItem, pressed && styles.customTabItemPressed]}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected }}
      >
        <Image
          source={item.source}
          style={[styles.customTabIcon, { tintColor: tint }]}
          resizeMode="contain"
        />
        <Text
          numberOfLines={1}
          style={[
            labelBase,
            {
              color: labelColor,
              marginTop: TAB_BAR_CHROME_VISUAL.iconLabelGap,
              maxWidth: TAB_BAR_CHROME_VISUAL.labelMaxWidth,
              textAlign: 'center',
            },
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  });

  // tall-enough band so the last rows of scroll views soften before they pass under the glass pill + fab
  const bottomChromeFadeHeight =
    TAB_BAR_CHROME_VISUAL.bottomChromeFadeBaseHeight + insets.bottom;

  return (
    <>
      {/*
        chromeOverlayStack: single parent z-index above tab scenes; inside it, fade uses chromeFadeRelativeZIndex
        and the toolbar uses chromeNavBarRelativeZIndex so the liquid pill is always above the fade (ios + android).
      */}
      <View style={styles.chromeOverlayStack} pointerEvents="box-none">
        {/*
        bottom chrome fade: full screen width (left/right from styles). gradient only — no BlurView (see earlier note).
        pointerEvents="none" so taps pass through to the FAB and list underneath even where the gradient draws.
      */}
        <View
          pointerEvents="none"
          style={[styles.bottomChromeFade, { height: bottomChromeFadeHeight }]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={
              themeColors.isDark
                ? [
                    themeColors.withOpacity(themeColors.background.primary(), 0),
                    themeColors.withOpacity(themeColors.background.primary(), 0.7),
                  ]
                : [
                    themeColors.withOpacity(themeColors.background.primary(), 0),
                    themeColors.background.primary(),
                  ]
            }
            locations={[0.25, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View
          pointerEvents="box-none"
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) setMeasuredNavBarHeight(h);
          }}
          style={[
            styles.customTabToolbarWrap,
            {
              left: TAB_BAR_CHROME_LAYOUT.leftInset,
              right: customTabBarRightInset,
              bottom: customTabStripBottom,
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <GlassView
              style={styles.customTabGlass}
              glassEffectStyle={TAB_BAR_CHROME_VISUAL.glassEffectStyle}
              tintColor={
                DynamicColorIOS({
                  light: ThemeColors.light.background.primary,
                  dark: ThemeColors.dark.background.primary,
                }) as any
              }
              isInteractive
            >
              <View style={styles.customTabGlassBleed}>
                <View style={styles.customTabToolbarInner}>{customTabBarItems}</View>
              </View>
            </GlassView>
          ) : (
            <View
              style={[
                styles.customTabToolbarFallback,
                {
                  backgroundColor: themeColors.background.elevated(),
                  borderColor: themeColors.border.primary(),
                },
              ]}
            >
              <View style={styles.customTabGlassBleed}>
                <View style={styles.customTabToolbarInner}>{customTabBarItems}</View>
              </View>
            </View>
          )}
        </View>
      </View>
    </>
  );
}
