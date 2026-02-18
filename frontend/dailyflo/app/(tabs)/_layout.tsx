import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import {
  NativeTabs,
  Label as NativeTabLabel,
  Icon as NativeTabIcon,
} from 'expo-router/unstable-native-tabs';

// theme + typography hooks: used to style the tab bar consistently with the rest of the app
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function TabLayout() {
  const { getThemeColorValue } = useThemeColor();
  const typography = useTypography();
  const themeColors = useThemeColors();
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
  );
}
