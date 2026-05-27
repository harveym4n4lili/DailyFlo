/**
 * ios modals: close (xmark) in the native left bar; optional trailing action on the right.
 * Stack.Toolbar attaches when the stack screen uses headerShown on ios (browse modals, task-create, etc.).
 * android: glass MainCloseButton in-screen where the screen sets headerShown false.
 *
 * display apply uses brandActive trailing toolbar — marple glass circle inside Stack.Toolbar.View (native bar touch target).
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { MainSubmitButton } from '@/components/ui/Button';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';

export type IosBrowseModalCloseStackToolbarProps = {
  /** optional — e.g. task-create debounced close; defaults to router.back() */
  onPress?: () => void;
};

export function IosBrowseModalCloseStackToolbar({ onPress }: IosBrowseModalCloseStackToolbarProps = {}) {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const tint = themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  const handlePress = onPress ?? (() => router.back());

  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button
        icon="xmark"
        onPress={handlePress}
        accessibilityLabel="Close"
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}

export type IosBrowseModalTrailingStackToolbarProps = {
  icon: 'plus' | 'checkmark';
  onPress: () => void;
  accessibilityLabel: string;
  /** when true, the bar button still renders but does nothing (native item may not gray out like glass) */
  disabled?: boolean;
  /** optional override — icon tint only (Stack.Toolbar.Button has no background fill) */
  tintColor?: string;
  /** marple liquid-glass circle background + canvas checkmark — display apply save */
  brandActive?: boolean;
};

export function IosBrowseModalTrailingStackToolbar({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
  tintColor,
  brandActive = false,
}: IosBrowseModalTrailingStackToolbarProps) {
  const themeColors = useThemeColors();
  const tint = tintColor ?? themeColors.text.primary();

  if (Platform.OS !== 'ios') {
    return null;
  }

  if (disabled) {
    return null;
  }

  // brand apply: Toolbar.View slot so marple GlassView background is pressable in the native bar
  if (brandActive) {
    return (
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.View>
          <MainSubmitButton
            layout="inline"
            brandActive
            animateVisibility={false}
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
          />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
    );
  }

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={icon}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        tintColor={tint}
      />
    </Stack.Toolbar>
  );
}
