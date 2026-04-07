import React, { useEffect, useState } from 'react';
import { View, DynamicColorIOS, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useSegments } from 'expo-router';

// typography + ThemeColors: UITabBar needs DynamicColorIOS(light, dark) from palette — not one snapshot from useThemeColors (fixes wrong/black tints)
import { ThemeColors } from '@/constants/ColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { SelectionActionsBar } from '@/components/ui/SelectionActionsBar';
import { useUI } from '@/store/hooks';
import { getTodayTabIcon } from '@/utils/todayIcon';
import {
  MinimizeTestBottomAccessory,
  shouldShowBottomAccessory,
} from './MinimizeTestBottomAccessory';

export default function TabLayout() {
  const typography = useTypography();
  const themeColors = useThemeColors();
  const { selection } = useUI();
  const isSelectionMode = selection.isSelectionMode;
  const segments = useSegments() as string[];

  // bottom accessory state must live here — NativeTabs.BottomAccessory renders two instances (inline + regular); see expo native tabs docs
  const [minimizeTestAccessoryDismissed, setMinimizeTestAccessoryDismissed] = useState(false);
  const isMinimizeTestTab = segments.includes('minimizeTest');

  useEffect(() => {
    if (!isMinimizeTestTab) {
      setMinimizeTestAccessoryDismissed(false);
    }
  }, [isMinimizeTestTab]);

  // detect which tab is active for the selection overlay (NativeTabs can make pathname less reliable)
  const selectionScreen =
    segments.includes('planner') ? 'planner'
    : segments.includes('today') ? 'today'
    : 'other';

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

  // minimizeBehavior: ios 18+ UITabBar minimize; scroll linkage still has limitations with FlatList (expo native-tabs docs)
  return (
    <View style={{ flex: 1 }}>
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
    >
      {shouldShowBottomAccessory() && isMinimizeTestTab && (
        <NativeTabs.BottomAccessory>
          <MinimizeTestBottomAccessory
            dismissed={minimizeTestAccessoryDismissed}
            onDismiss={() => setMinimizeTestAccessoryDismissed(true)}
          />
        </NativeTabs.BottomAccessory>
      )}

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

      {/* scroll test route: minimizeTest/index.tsx — folder name must match Trigger name; hidden={false} keeps the item visible (expo-router native-tabs) */}
      <NativeTabs.Trigger name="minimizeTest" hidden={false}>
        <NativeTabs.Trigger.Label>Test</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={tabIconSelected}
          src={
            <NativeTabs.Trigger.VectorIcon family={MaterialCommunityIcons} name="flask-outline" />
          }
        />
      </NativeTabs.Trigger>
    </NativeTabs>
    {isSelectionMode && <SelectionActionsBar screen={selectionScreen} />}
    </View>
  );
}
