import React from 'react';
import { DynamicColorIOS, Platform } from 'react-native';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import Feather from '@expo/vector-icons/Feather';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';

export default function TabLayout() {
  const themeColors = useThemeColors();
  const { getThemeColorValue } = useThemeColor();
  const typography = useTypography();
  const activeColor = getThemeColorValue(500);
  const tintColor =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          light: activeColor,
          dark: activeColor,
        })
      : activeColor;
  const labelStyle = {
    ...typography.getTextStyle('navbar'),
  };

  return (
    <NativeTabs
      labelStyle={labelStyle}
      tintColor={tintColor}
    >
      <NativeTabs.Trigger name="today">
        <Label>Today</Label>
        {/* @ts-ignore - VectorIcon wrapped in Icon is valid but types are incomplete */}
        {(
          <Icon
            src={
              <VectorIcon
                family={Feather}
                name="calendar"
              />
            }
          />
        ) as any}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="planner">
        <Label>Planner</Label>
        {/* @ts-ignore - VectorIcon wrapped in Icon is valid but types are incomplete */}
        {(
          <Icon
            src={
              <VectorIcon
                family={Feather}
                name="grid"
              />
            }
          />
        ) as any}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="browse">
        <Label>Browse</Label>
        {/* @ts-ignore - VectorIcon wrapped in Icon is valid but types are incomplete */}
        {(
          <Icon
            src={
              <VectorIcon
                family={Feather}
                name="list"
              />
            }
          />
        ) as any}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        {/* @ts-ignore - VectorIcon wrapped in Icon is valid but types are incomplete */}
        {(
          <Icon
            src={
              <VectorIcon
                family={Feather}
                name="settings"
              />
            }
          />
        ) as any}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
