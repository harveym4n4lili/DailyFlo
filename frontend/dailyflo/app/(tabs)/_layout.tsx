import React from 'react';
import { View, DynamicColorIOS, Platform } from 'react-native';
import {
  NativeTabs,
  Label as NativeTabLabel,
  Icon as NativeTabIcon,
} from 'expo-router/unstable-native-tabs';
import { useSegments } from 'expo-router';

// theme + typography hooks: used to style the tab bar consistently with the rest of the app
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { SelectionActionsBar } from '@/components/ui/SelectionActionsBar';
import { useUI } from '@/store/hooks';

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
  const activeColor = themeColors.text.primary();

  // tintColor: on iOS we wrap the color with DynamicColorIOS so the system treats it
  // as a dynamic color; on Android we just use the raw hex string.
  const tintColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ light: activeColor, dark: activeColor })
      : activeColor;

  // labelStyle: navbar text style from our typography system so labels match design
  const labelStyle = { ...typography.getTextStyle('navbar') };

  return (
    <View style={{ flex: 1 }}>
    <NativeTabs labelStyle={labelStyle} tintColor={tintColor}>
      <NativeTabs.Trigger name="today">
        <NativeTabLabel>Today</NativeTabLabel>
        <NativeTabIcon sf="calendar" drawable="calendar_today" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="planner">
        <NativeTabLabel>Planner</NativeTabLabel>
        <NativeTabIcon sf="square.grid.2x2" drawable="grid_view" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="browse">
        <NativeTabLabel>Browse</NativeTabLabel>
        <NativeTabIcon sf="list.bullet" drawable="list" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabLabel>Settings</NativeTabLabel>
        <NativeTabIcon sf="gearshape" drawable="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
    {/* selection actions bar overlays tab bar when user taps "Select Tasks" - liquid glass on iOS */}
    {isSelectionMode && <SelectionActionsBar screen={selectionScreen} />}
    </View>
  );
}
