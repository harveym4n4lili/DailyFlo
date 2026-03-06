/**
 * Sign-up/Login Screen
 * 
 * This screen presents authentication options to users.
 * Users can sign up or log in using email/password or social providers (Facebook, Google, Apple).
 * They can also skip authentication and use the app without an account.
 * 
 * Flow:
 * 1. User sees social auth options (default view)
 * 2. User clicks "Sign up with Email" → full-screen modal opens with email form
 * 3. User enters email/password → authentication → goes to completion screen
 * 4. User taps "Skip" → goes to main app without authentication
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFadeZoomAnimation } from '@/hooks';

export default function SignupScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // use shared fade zoom animation hook for headline (no delay - animates on mount)
  const { opacityValue: headlineOpacity, scaleValue: headlineScale } = useFadeZoomAnimation();
  
  const styles = createStyles(themeColors, typography, insets);
  
  return (
    <View style={[styles.container, styles.containerPadding]}>
      {/* Main Content */}
      {/* navigation and buttons are handled globally in the layout */}
      <View style={styles.content}>
        {/* Headline */}
        {/* fades in and scales up first (top element) */}
        <Animated.Text style={[
          styles.headline,
          {
            opacity: headlineOpacity,
            transform: [{ scale: headlineScale }],
          },
        ]}>
          Lets get you in...
        </Animated.Text>
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  container: {
    flex: 1,
    backgroundColor: themeColors.background.primary(),
    justifyContent: 'center',
  },
  content: {
    // content takes up available space and centers vertically
    justifyContent: 'center',
    alignItems: 'center', // center content horizontally
    gap: 32,
  },

  // --- PADDING STYLES ---
  containerPadding: {
    paddingHorizontal: Paddings.screen,
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 100,
  },

  // --- TYPOGRAPHY STYLES ---
  headline: {
    ...typography.getTextStyle('heading-1'),
    color: themeColors.text.primary(),
    textAlign: 'center',
    marginBottom: 48,
    fontSize: 32,
  },
});
