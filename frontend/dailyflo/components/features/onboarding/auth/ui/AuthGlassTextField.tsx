/**
 * onboarding email/password fields — lightweight TextInput chrome (avoid task `CustomTextInput` complexity).
 * sits on transparent formSheet; fill uses primary/secondary blend so bars sit between page wash and solid cards.
 */

import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';
import { getTypographyStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

export type AuthGlassTextFieldProps = TextInputProps & {
  accessibilityHint?: string;
  /** shows above chrome — onboarding login/register pair this with placeholders */
  label?: string;
};

export function AuthGlassTextField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  accessibilityHint,
  accessibilityLabel,
  ...rest
}: AuthGlassTextFieldProps) {
  const themeColors = useThemeColors();
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';

  const accessibilityForInput = accessibilityLabel ?? label ?? placeholder;

  return (
    <View style={styles.block}>
      {label ? (
        <Text
          accessibilityRole="text"
          accessibilityLabel={label}
          style={[getTypographyStyle('body-small', typographyPlatform), { color: themeColors.text.secondary() }]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.shell,
          {
            backgroundColor: themeColors.background.primarySecondaryBlend(),
            borderColor: themeColors.border.secondary(),
          },
        ]}
      >
        <TextInput
          {...rest}
          style={[
            getTypographyStyle('body-large', typographyPlatform),
            { color: themeColors.text.primary(), minHeight: 40, paddingVertical: 0 },
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
          accessibilityHint={accessibilityHint}
          accessibilityLabel={typeof accessibilityForInput === 'string' ? accessibilityForInput : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    // match grouped-list caption→first-row rhythm (`groupedListHeaderContentGap`) so labels don’t collide with outlines
    gap: Paddings.groupedListHeaderContentGap,
  },
  shell: {
    borderRadius: Paddings.continueButtonRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    paddingVertical: 8,
    width: '100%',
  },
});
