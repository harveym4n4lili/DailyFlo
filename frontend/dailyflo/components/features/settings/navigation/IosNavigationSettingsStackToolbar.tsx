/**
 * ios navigation settings — native Stack.Toolbar with hidden toggles so back ↔ edit ↔ apply
 * cross-fade/morph in the system nav bar (expo-router Stack.Toolbar pattern).
 */

import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { MainSubmitButton } from '@/components/ui/Button';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';

export type IosNavigationSettingsStackToolbarProps = {
  isEditMode: boolean;
  onBack: () => void;
  onEdit: () => void;
  onApply: () => void;
};

export function IosNavigationSettingsStackToolbar({
  isEditMode,
  onBack,
  onEdit,
  onApply,
}: IosNavigationSettingsStackToolbarProps) {
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const backTint = themeColors.text.secondary();
  const editTint = getMarpleBrandColor(500);

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          hidden={isEditMode}
          icon="chevron.left"
          onPress={onBack}
          accessibilityLabel="Back"
          tintColor={backTint}
        />
      </Stack.Toolbar>
      {/* both trailing actions live in one toolbar so ios animates between them natively */}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          hidden={isEditMode}
          onPress={onEdit}
          accessibilityLabel="Edit navigation bar"
          tintColor={editTint}
        >
          Edit
        </Stack.Toolbar.Button>
        <Stack.Toolbar.View hidden={!isEditMode}>
          <MainSubmitButton
            layout="inline"
            brandActive
            animateVisibility={false}
            onPress={onApply}
            accessibilityLabel="Done editing navigation"
          />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
    </>
  );
}

export default IosNavigationSettingsStackToolbar;
