/**
 * liquid-glass bottom tab strip — pairs with FloatingActionButton via CustomTabNavMetricsContext + FAB_SCREEN_INSET.
 * data: customTabNavItems.ts · layout: computeTabBarChromeLayout · tokens: tabBarChrome.constants
 */

import React from 'react';
import { View, DynamicColorIOS, Platform, Pressable, Text, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import GlassView from 'expo-glass-effect/build/GlassView';
import { useRouter, useSegments } from 'expo-router';

import { ThemeColors } from '@/constants/ColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { FAB_SCREEN_INSET } from '@/components/ui/button';
import { useCustomTabNavMetrics } from '@/contexts/CustomTabNavMetricsContext';

import { buildCustomTabNavItems } from './customTabNavItems';
import { computeTabBarChromeLayout } from './computeTabBarChromeLayout';
import { TAB_BAR_CHROME_LAYOUT, TAB_BAR_CHROME_VISUAL } from './tabBarChrome.constants';
import { customLiquidTabBarStyles as styles } from './customLiquidTabBar.styles';

export function CustomLiquidTabBar() {
  const router = useRouter();
  const typography = useTypography();
  const themeColors = useThemeColors();
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

  const labelBase = {
    ...typography.getTextStyle('navbar'),
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
    const tint = selected ? themeColors.primaryButton.fill() : themeColors.text.secondary();
    const labelColor = selected ? themeColors.primaryButton.fill() : themeColors.text.secondary();
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
              marginTop: 1,
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

  return (
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
  );
}
