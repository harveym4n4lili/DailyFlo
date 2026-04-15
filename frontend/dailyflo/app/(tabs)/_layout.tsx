import React from 'react';
import { View, DynamicColorIOS, Platform, StyleSheet } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { ThemeColors } from '@/constants/ColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { SelectionActionsBar } from '@/components/ui/SelectionActionsBar';
import { useUI } from '@/store/hooks';
import { getTodayTabIcon } from '@/utils/todayIcon';
import { useSegments } from 'expo-router';
import { CustomLiquidTabBar, USE_CUSTOM_LIQUID_TAB_BAR } from '@/components/navigation/tabBarChrome';
import { TabFabOverlayLayer } from '@/components/navigation/tabBarChrome/TabFabOverlayLayer';
import { TabFabOverlayProvider } from '@/contexts/TabFabOverlayContext';

export default function TabLayout() {
  const typography = useTypography();
  const themeColors = useThemeColors();
  const { selection } = useUI();
  const isSelectionMode = selection.isSelectionMode;
  const segments = useSegments() as string[];

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
        {/* fade + liquid navbar + overlay FAB: always mounted; invisible and non-interactive when NativeTabs is visible */}
        <View
          pointerEvents={USE_CUSTOM_LIQUID_TAB_BAR ? 'box-none' : 'none'}
          style={[styles.liquidChromeMount, !USE_CUSTOM_LIQUID_TAB_BAR && styles.liquidChromeInactive]}
        >
          <CustomLiquidTabBar />
          <TabFabOverlayLayer />
        </View>

      </View>
    </TabFabOverlayProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // positioning context for absolute bottom chrome + FAB so they stay mounted when USE_CUSTOM_LIQUID_TAB_BAR is false
  liquidChromeMount: {
    ...StyleSheet.absoluteFillObject,
  },
  liquidChromeInactive: {
    opacity: 0,
  },
});
