import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

// theme + typography hooks: used to style the tab bar consistently with the rest of the app
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';
import { useThemeColors } from '@/hooks/useColorPalette';

function TabsContent() {
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
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_today" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="planner">
        <NativeTabs.Trigger.Label>Planner</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="square.grid.2x2" md="grid_view" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="browse">
        <NativeTabs.Trigger.Label>Browse</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabLayout() {
  // tablayout is a small wrapper so expo-router can mount our tabs content
  return <TabsContent />;
}
