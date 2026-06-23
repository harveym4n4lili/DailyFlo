/**
 * liquid-glass bottom tab strip — pairs with FloatingActionButton via CustomTabNavMetricsContext + FAB_SCREEN_INSET.
 * data: customTabNavItems.ts · layout: computeTabBarChromeLayout · tokens: tabBarChrome.constants
 */

import React from 'react';
import { View, DynamicColorIOS, Platform, Pressable, Text, Image, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useSegments } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors } from '@/constants/ColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { FAB_SCREEN_INSET } from '@/components/ui/Button';
import { useCustomTabNavMetrics } from '@/contexts/CustomTabNavMetricsContext';
import { useAppSelector } from '@/store';
import { resolveNavTabOrderFromPreferences } from '@/components/features/settings/navigation/navigationPreferenceUtils';

import { buildCustomTabNavItems } from './customTabNavItems';
import { computeTabBarChromeLayout } from './computeTabBarChromeLayout';
import { TAB_BAR_CHROME_LAYOUT, TAB_BAR_CHROME_VISUAL } from './tabBarChrome.constants';
import { customLiquidTabBarStyles as styles } from './customLiquidTabBar.styles';

/** planner stack screens (expo-router segment names) that should keep the Planner tab selected */
const PLANNER_NESTED_TAB_SEGMENTS = new Set(['month-select']);

// map current segments to which main tab is active — handles nested planner routes where "planner" may be absent from segments
function tabKeyFromSegments(segments: string[], tabKeys: string[]): string | undefined {
  const direct = tabKeys.find((k) => segments.includes(k));
  if (direct) return direct;
  if (segments.some((s) => PLANNER_NESTED_TAB_SEGMENTS.has(s))) return 'planner';
  return undefined;
}

export function CustomLiquidTabBar() {
  const router = useGuardedRouter();
  const typography = useTypography();
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  const { measuredNavBarHeight, setMeasuredNavBarHeight } = useCustomTabNavMetrics();

  // read saved navbar order from account prefs — falls back to today/planner/ai/browse
  const savedNavTabOrder = useAppSelector((s) =>
    resolveNavTabOrderFromPreferences(s.auth.user?.preferences?.navigationPreferences)
  );

  React.useEffect(
    () => () => {
      setMeasuredNavBarHeight(null);
    },
    [setMeasuredNavBarHeight]
  );

  const [optimisticCustomTabKey, setOptimisticCustomTabKey] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (optimisticCustomTabKey === null) return;
    // segment match or nested planner screen counts as "arrived" for that tab
    const arrived =
      segments.includes(optimisticCustomTabKey) ||
      (optimisticCustomTabKey === 'planner' &&
        segments.some((s) => PLANNER_NESTED_TAB_SEGMENTS.has(s)));
    if (arrived) setOptimisticCustomTabKey(null);
  }, [segments, optimisticCustomTabKey]);

  // root stack modals (e.g. /task/[id]) drop tab keys from segments; planner/month-select can list month-select without planner.
  // keep last resolved tab so the bar stays highlighted.
  const tabKeys = React.useMemo(
    () => buildCustomTabNavItems(savedNavTabOrder).map((i) => i.key),
    [savedNavTabOrder]
  );
  const lastTabKeyWhenInTabsRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const found = tabKeyFromSegments(segments, tabKeys);
    if (found) lastTabKeyWhenInTabsRef.current = found;
  }, [segments, tabKeys]);
  const activeTabKeyFromSegments = tabKeyFromSegments(segments, tabKeys);
  const resolvedSelectedTabKey =
    optimisticCustomTabKey !== null
      ? optimisticCustomTabKey
      : (activeTabKeyFromSegments ?? lastTabKeyWhenInTabsRef.current ?? tabKeys[0] ?? 'today');

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

  // recompute when saved order or today icon (day-of-month) changes
  const customTabItems = React.useMemo(
    () => buildCustomTabNavItems(savedNavTabOrder),
    [savedNavTabOrder]
  );

  const customTabBarItems = customTabItems.map((item) => {
    const selected = resolvedSelectedTabKey === item.key;
    // unselected tabs use primary text color; selected uses marple 500
    const unselectedTint = themeColors.text.primary();
    const marpleAccent = getMarpleBrandColor(500);
    const tint = selected ? marpleAccent : unselectedTint;
    const labelColor = selected ? marpleAccent : unselectedTint;
    return (
      <Pressable
        key={item.key}
        onPress={() => {
          // already on this tab (or nested under it, e.g. planner/month-select) — skip push so expo-router doesn’t replay the stack transition
          if (resolvedSelectedTabKey === item.key) {
            return;
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setOptimisticCustomTabKey(item.key);
          // navigate (not push) switches tab roots without stacking duplicate entries on the root stack
          router.navigate(item.href as any);
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
