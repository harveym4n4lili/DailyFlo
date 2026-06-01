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

import { MarpleBrandColors, ThemeColors } from '@/constants/ColorPalette';
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
import { usePrimaryTabColdStartNavigation } from '@/hooks/usePrimaryTabColdStartNavigation';

export default function TabLayout() {
  const { isBootOverlayVisible } = usePrimaryTabColdStartNavigation();

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
          light: ThemeColors.light.text.primary,
          dark: ThemeColors.dark.text.primary,
        })
      : themeColors.text.primary();

  const tabIconSelected =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          light: MarpleBrandColors[500],
          dark: MarpleBrandColors[500],
        })
      : MarpleBrandColors[500];

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

  const iosTaskMultiSelectActive =
    Platform.OS === 'ios' && selection.isSelectionMode && selection.selectionType === 'tasks';

  const shouldHideLiquidChromeIos =
    USE_CUSTOM_LIQUID_TAB_BAR &&
    Platform.OS === 'ios' &&
    (onIosTaskSelectRoute || iosLiquidChromePreSelectFade || iosTaskMultiSelectActive);

  const liquidChromeInactive = !USE_CUSTOM_LIQUID_TAB_BAR || shouldHideLiquidChromeIos;

  const chromeProgress = useSharedValue(shouldHideLiquidChromeIos ? 0 : 1);
  const bootOverlayOpacity = useSharedValue(isBootOverlayVisible ? 1 : 0);

  useEffect(() => {
    if (isBootOverlayVisible) {
      bootOverlayOpacity.value = 1;
    } else {
      bootOverlayOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [bootOverlayOpacity, isBootOverlayVisible]);

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

  const bootOverlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bootOverlayOpacity.value,
  }));

  return (
    <TabFabOverlayProvider>
      <View style={styles.root}>
        {/* trigger order must stay fixed — reordering breaks expo-router tab content on cold start */}
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

          <NativeTabs.Trigger name="inbox" hidden={false}>
            <NativeTabs.Trigger.Label>Inbox</NativeTabs.Trigger.Label>
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
        {/* blocks a one-frame Today flash while cold-start navigation runs */}
        <Animated.View
          pointerEvents={isBootOverlayVisible ? 'auto' : 'none'}
          style={[
            styles.bootOverlay,
            { backgroundColor: tabBarBackgroundColor },
            bootOverlayAnimatedStyle,
          ]}
        />
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
  bootOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});
