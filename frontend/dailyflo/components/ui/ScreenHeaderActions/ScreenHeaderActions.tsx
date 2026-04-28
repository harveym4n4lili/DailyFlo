/**
 * ScreenHeaderActions – glass row for Today, Planner, and Browse screens.
 * variant determines which icons are shown:
 * - dashboard: dashboard icon only (ios overflow lives in Stack.Toolbar via IosDashboardOverflowToolbar)
 * - browse: bell icon + settings icon
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { HeaderIconButton } from './HeaderIconButton';
import { GearIcon, DashboardIcon } from '@/components/ui/icon';
import { useThemeColors } from '@/hooks/useColorPalette';

export type ScreenHeaderActionsVariant = 'dashboard' | 'browse';

export interface ScreenHeaderActionsProps {
  /** which icon set to show: dashboard (Today/Planner) or browse */
  variant: ScreenHeaderActionsVariant;
  /** for browse variant: called when settings (cog) icon is tapped */
  onSettingsPress?: () => void;
  /** for browse variant: called when alerts (bell) icon is tapped */
  onAlertsPress?: () => void;
  /** optional container style */
  style?: ViewStyle;
  /** tint for icons: "primary" or "elevated" */
  tint?: 'primary' | 'elevated';
}

const ICON_GAP = 20;
const GLASS_PADDING_H = 12;
const GLASS_PADDING_V = 8;
const GLASS_BORDER_RADIUS = 24;

export function ScreenHeaderActions({
  variant,
  onSettingsPress,
  onAlertsPress,
  style,
  tint = 'primary',
}: ScreenHeaderActionsProps) {
  const themeColors = useThemeColors();
  const tintColor = tint === 'elevated' ? themeColors.background.primarySecondaryBlend() : themeColors.background.primary();

  const rowContent =
    variant === 'browse' ? (
      <>
        <HeaderIconButton
          icon="notifications-outline"
          onPress={onAlertsPress ?? (() => console.log('alerts tapped'))}
          accessibilityLabel="Alerts"
          tint={tint}
          noWrapper
        />
        <View style={{ width: ICON_GAP }} />
        <HeaderIconButton
          iconComponent={<GearIcon size={24} color={themeColors.text.primary()} />}
          onPress={onSettingsPress ?? (() => console.log('settings tapped'))}
          accessibilityLabel="Settings"
          tint={tint}
          noWrapper
        />
      </>
    ) : (
      <HeaderIconButton
        iconComponent={<DashboardIcon size={24} color={themeColors.text.primary()} />}
        tint={tint}
        accessibilityLabel="Dashboard"
        noWrapper
      />
    );

  const glassStyle = [
    styles.glassContainer,
    {
      paddingHorizontal: GLASS_PADDING_H,
      paddingVertical: GLASS_PADDING_V,
      borderRadius: GLASS_BORDER_RADIUS,
    },
  ];

  if (Platform.OS === 'ios') {
    return (
      <GlassView
        style={[glassStyle, style]}
        glassEffectStyle="clear"
        tintColor={tintColor as any}
        isInteractive
      >
        {rowContent}
      </GlassView>
    );
  }

  return (
    <View style={[glassStyle, { backgroundColor: tintColor }, style]}>
      {rowContent}
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
