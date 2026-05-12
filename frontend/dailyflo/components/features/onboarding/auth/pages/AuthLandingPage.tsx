/**
 * centered brand title on the auth landing route.
 * we merge typography tokens (`AUTH_HEADLINE_TEXT_STYLE`) with per-screen colors from `AUTH_PAGE_SLIDE_UI[0]`
 * so the headline always contrasts against the same plant-toned background the route paints behind this shell.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/hooks/useColorPalette';

import { AUTH_HEADLINE_TEXT_STYLE, AUTH_PAGE_SLIDE_UI, AUTH_PAGE_TITLE } from '../constants';
import { resolveIntroTextColor } from '../scrollTransition';

export function AuthLandingPage() {
  const themeColors = useThemeColors();
  const row = AUTH_PAGE_SLIDE_UI[0];

  // `resolveIntroTextColor` maps token strings like `plant:300` to real hex using the same palette helpers as the questionnaire
  const titleStyle = useMemo(
    () => [
      AUTH_HEADLINE_TEXT_STYLE,
      AUTH_PAGE_TITLE.titleStyle,
      { color: resolveIntroTextColor(themeColors, row.titleColor), textAlign: 'center' as const },
    ],
    [row.titleColor, themeColors],
  );

  return (
    <View style={styles.center}>
      <Text style={titleStyle}>{AUTH_PAGE_TITLE.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
