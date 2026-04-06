import React from 'react';
import { View, DynamicColorIOS, Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  NativeTabs,
  Label as NativeTabLabel,
  Icon as NativeTabIcon,
  VectorIcon,
} from 'expo-router/unstable-native-tabs';
import { useSegments } from 'expo-router';

// theme + typography hooks: used to style the tab bar consistently with the rest of the app
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { SelectionActionsBar } from '@/components/ui/SelectionActionsBar';
import { useUI } from '@/store/hooks';
import { getTodayTabIcon } from '@/utils/todayIcon';

export default function TabLayout() {
  const { getThemeColorValue } = useThemeColor();
  const typography = useTypography();
  const themeColors = useThemeColors();
  const { selection } = useUI();
  const isSelectionMode = selection.isSelectionMode;
  const segments = useSegments() as string[];

  // detect which tab is currently active so SelectionActionsBar can adapt behavior
  // useSegments is more reliable than usePathname for tabs (pathname can return "/" with NativeTabs)
  const selectionScreen =
    segments.includes('planner') ? 'planner'
    : segments.includes('today') ? 'today'
    : 'other';

  // activeColor: base brand color token (same 500 shade we use elsewhere, e.g. FAB)
  const activeColor = themeColors.primaryButton.fill();

  // tintColor: on iOS we wrap the color with DynamicColorIOS so the system treats it
  // as a dynamic color; on Android we just use the raw hex string.
  const tintColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ light: activeColor, dark: activeColor })
      : activeColor;

  // labelStyle: navbar text style from our typography system so labels match design
  // on iOS use SF Pro Rounded (ui-rounded) for tab labels; Android keeps default
  const labelStyle = {
    ...typography.getTextStyle('navbar'),
    ...(Platform.OS === 'ios' && { fontFamily: 'ui-rounded' }),
  };

  // solid tab bar (same idea on both platforms)
  const tabBarBackgroundColor = themeColors.background.primary();

  // minimizeBehavior: native prop → UITabBarMinimizeBehavior (iOS 26+). this is the *setting* for “minimize on scroll down”.
  // the *trigger* (UIKit actually driving minimize from scroll) is separate: expo native-tabs docs → Known limitations → “Limited support for FlatList”
  // states scroll-to-top and minimize-on-scroll aren’t supported with FlatList + native tabs yet. most of our tabs use ListCard (FlatList).

  return (
    <View style={{ flex: 1 }}>
    <NativeTabs
      labelStyle={labelStyle}
      tintColor={tintColor}
      backgroundColor={tabBarBackgroundColor}
      blurEffect="onScrollUp"
      {...(Platform.OS === 'ios' ? { minimizeBehavior: 'automatic ' as const } : {})}
    >
      <NativeTabs.Trigger name="today">
        <NativeTabLabel>Today</NativeTabLabel>
        <NativeTabIcon src={getTodayTabIcon()} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="planner">
        <NativeTabLabel>Planner</NativeTabLabel>
        <NativeTabIcon src={require('@/assets/icons/Timeline.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ai" >
        <NativeTabLabel>AI</NativeTabLabel>
        <NativeTabIcon src={require('@/assets/icons/Sparkles.png')} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="browse">
        <NativeTabLabel>Browse</NativeTabLabel>
        <NativeTabIcon src={require('@/assets/icons/Browse.png')} />
      </NativeTabs.Trigger>

      {/* scroll-only test tab: see minimizeTest/index.tsx — ScrollView, no FlatList, Slot layout */}
      {/* expo-router matches Trigger name to the folder segment; hidden={false} keeps the tab in the bar (native-tabs filters tabs unless options.hidden === false) */}
      <NativeTabs.Trigger name="minimizeTest" role="search">
        <NativeTabLabel>Test</NativeTabLabel>
        <NativeTabIcon
          src={<VectorIcon family={MaterialCommunityIcons} name="flask-outline" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
    {/* selection actions bar overlays tab bar when user taps "Select Tasks" - liquid glass on iOS */}
    {isSelectionMode && <SelectionActionsBar screen={selectionScreen} />}
    </View>
  );
}
