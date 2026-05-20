/**
 * onboarding email/password fields — lightweight TextInput chrome (avoid task `CustomTextInput` complexity).
 * sits on transparent formSheet; fill uses tertiary background so text stays readable over liquid glass blur.
 */

import React from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

export type AuthGlassTextFieldProps = TextInputProps & {
  /** label rendered above input for accessibility (optional visual if we extend later) */
  accessibilityHint?: string;
};

export function AuthGlassTextField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  ...rest
}: AuthGlassTextFieldProps) {
  const themeColors = useThemeColors();
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: themeColors.background.tertiary(),
          borderColor: themeColors.border.secondary(),
        },
      ]}
    >
      <TextInput
        style={[
          getTypographyStyle('body-large', typographyPlatform),
          { color: themeColors.text.primary(), minHeight: 48 },
        ]}
        placeholder={placeholder}
        placeholderTextColor={themeColors.text.tertiary()}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: Paddings.continueButtonRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    paddingVertical: Paddings.touchTargetSmall,
    width: '100%',
  },
});
