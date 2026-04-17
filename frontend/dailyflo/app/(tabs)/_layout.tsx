import React, { useEffect } from 'react';
import { View, DynamicColorIOS, Platform, StyleSheet } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSegments } from 'expo-router';

import { ThemeColors } from '@/constants/ColorPalette';
import { IOS_LIQUID_CHROME_TRANSITION_MS } from '@/constants/nativeStackTransition';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { SelectionActionsBar } from '@/components/ui/SelectionActionsBar';
import { useUI } from '@/store/hooks';
import { useAppDispatch, useAppSelector } from '@/store';
import { getTodayTabIcon } from '@/utils/todayIcon';
import { CustomLiquidTabBar, USE_CUSTOM_LIQUID_TAB_BAR } from '@/components/navigation/tabBarChrome';
import { TabFabOverlayLayer } from '@/components/navigation/tabBarChrome/TabFabOverlayLayer';
import { TabFabOverlayProvider } from '@/contexts/TabFabOverlayContext';

export default function TabLayout() {
  const typography = useTypography();
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const { selection } = useUI();
  const isSelectionMode = selection.isSelectionMode;
  const segments = useSegments() as string[];
  const iosLiquidChromePreSelectFade = useAppSelector((s) => s.ui.iosLiquidChromePreSelectFade);

  const tabIconUnselected =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          light: ThemeColors.light.text.secondary,
          dark: ThemeColors.dark.text.secondary,
        })
      : themeColors.text.secondary();

  const tabIconSelected =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          light: ThemeColors.light.primaryButton.fill,
          dark: ThemeColors.dark.primaryButton.fill,
        })
      : themeColors.primaryButton.fill();

  const tabBarBgIos =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          light: ThemeColors.light.background.primary,
          dark: ThemeColors.dark.background.primary,
        })
      : null;

  const labelBase = {
    ...typography.getTextStyle('navbar'),
    ...(Platform.OS === 'ios' && { fontFamily: 'ui-rounded' as const }),
  };

  const tabBarBackgroundColor = themeColors.background.primary();

  const selectionScreen =
    segments.includes('planner') ? 'planner'
    : segments.includes('today') ? 'today'
    : 'other';

  const onIosTaskSelectRoute =
    Platform.OS === 'ios' &&
    (segments.includes('select') || segments.includes('task-select'));

  // root routes (e.g. /date-select) drop "select" from segments while redux task selection stays on — keep chrome hidden
  const iosTaskMultiSelectActive =
    Platform.OS === 'ios' && selection.isSelectionMode && selection.selectionType === 'tasks';

  const shouldHideLiquidChromeIos =
    USE_CUSTOM_LIQUID_TAB_BAR &&
    Platform.OS === 'ios' &&
    (onIosTaskSelectRoute || iosLiquidChromePreSelectFade || iosTaskMultiSelectActive);

  const liquidChromeInactive = !USE_CUSTOM_LIQUID_TAB_BAR || shouldHideLiquidChromeIos;

  // 1 = visible pill + fab; 0 = hidden — eased to feel like chrome travels into the native selection toolbar
  const chromeProgress = useSharedValue(shouldHideLiquidChromeIos ? 0 : 1);

  useEffect(() => {
    chromeProgress.value = withTiming(shouldHideLiquidChromeIos ? 0 : 1, {
      duration: IOS_LIQUID_CHROME_TRANSITION_MS,
    });
  }, [shouldHideLiquidChromeIos, chromeProgress]);

  useEffect(() => {
    if (onIosTaskSelectRoute && iosLiquidChromePreSelectFade) {
      dispatch({ type: 'ui/clearIosLiquidChromePreSelectFade' });
    }
  }, [dispatch, onIosTaskSelectRoute, iosLiquidChromePreSelectFade]);

  const liquidChromeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: chromeProgress.value,
    transform: [{ translateY: interpolate(chromeProgress.value, [0, 1], [22, 0]) }],
  }));

  return (
    <TabFabOverlayProvider>
      <View style={styles.root}>
        <NativeTabs
          labelStyle={{
            default: { ...labelBase, color: tabIconUnselected },
            selected: { ...labelBase, color: tabIconSelected },
          }}
          iconColor={{
            default: tabIconUnselected,
            selected: tabIconSelected,
          }}
          tintColor={tabIconSelected}
          backgroundColor={tabBarBgIos ?? tabBarBackgroundColor}
          blurEffect="none"
          {...(Platform.OS === 'ios' ? { minimizeBehavior: 'onScrollDown' as const } : {})}
          hidden={USE_CUSTOM_LIQUID_TAB_BAR}
        >
          <NativeTabs.Trigger name="today" hidden={false}>
            <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon src={getTodayTabIcon()} renderingMode="template" />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="planner" hidden={false}>
            <NativeTabs.Trigger.Label>Planner</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon src={require('@/assets/icons/Timeline.png')} renderingMode="template" />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="ai" hidden={false}>
            <NativeTabs.Trigger.Label>AI</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon src={require('@/assets/icons/Sparkles.png')} renderingMode="template" />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="browse" hidden={false}>
            <NativeTabs.Trigger.Label>Browse</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon src={require('@/assets/icons/Browse.png')} renderingMode="template" />
          </NativeTabs.Trigger>

          <NativeTabs.Trigger name="test" hidden={false}>
            <NativeTabs.Trigger.Label>Test</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon src={require('@/assets/icons/Today.png')} renderingMode="template" />
          </NativeTabs.Trigger>
        </NativeTabs>
        {isSelectionMode && <SelectionActionsBar screen={selectionScreen} />}
        {USE_CUSTOM_LIQUID_TAB_BAR ? (
          <Animated.View
            pointerEvents={liquidChromeInactive ? 'none' : 'box-none'}
            style={[styles.liquidChromeMount, liquidChromeAnimatedStyle]}
          >
            <CustomLiquidTabBar />
            <TabFabOverlayLayer />
          </Animated.View>
        ) : (
          <View
            pointerEvents="none"
            style={[styles.liquidChromeMount, styles.liquidChromeInactive]}
          >
            <CustomLiquidTabBar />
            <TabFabOverlayLayer />
          </View>
        )}
      </View>
    </TabFabOverlayProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  liquidChromeMount: {
    ...StyleSheet.absoluteFillObject,
  },
  liquidChromeInactive: {
    opacity: 0,
  },
});
