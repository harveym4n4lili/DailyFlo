/**
 * Welcome Screen
 * 
 * This is the first screen users see when they open the app for the first time.
 * It introduces the app and provides entry points to either start onboarding
 * or sign up if they already have an account.
 * 
 * Flow:
 * 1. User sees welcome message
 * 2. User taps "Get Started" → goes to Reminders screen
 * 3. User taps "Sign Up" → goes to Sign-up/Login screen
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { useFadeZoomAnimation } from '@/hooks';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

export default function WelcomeScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // use shared fade zoom animation hook for app name (no delay - animates first)
  const { opacityValue: appNameOpacity, scaleValue: appNameScale } = useFadeZoomAnimation({
    delay: 0, // no delay - animates first
  });
  
  // use shared fade zoom animation hook for tagline (with delay - animates second)
  const { opacityValue: taglineOpacity, scaleValue: taglineScale } = useFadeZoomAnimation({
    delay: SEQUENTIAL_FADE_DELAY, // delay - animates after app name
  });
  
  const styles = createStyles(themeColors, typography, insets);
  
  return (
    <View style={[styles.container, styles.containerPadding]}>
      {/* Main Content */}
      {/* this section contains the app name and tagline, centered vertically */}
      {/* navigation and buttons are handled globally in the layout */}
      <View style={styles.content}>
        {/* App Logo/Name */}
        {/* large, bold white text displaying the app name */}
        {/* fades in and scales up first (top element) */}
        <Animated.Text style={[
          styles.appName,
          {
            opacity: appNameOpacity,
            transform: [{ scale: appNameScale }],
          },
        ]}>
          Dailyflo
        </Animated.Text>
        
        {/* Tagline */}
        {/* smaller white text describing what the app does */}
        {/* fades in and scales up second (bottom element) */}
        <Animated.Text style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ scale: taglineScale }],
          },
        ]}>
          Your day, simplified and in flow
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
    // content takes up available space and centers vertically, positioned slightly higher
    justifyContent: 'center',
    alignItems: 'center', // center content horizontally
    marginTop: -80,
  },

  // --- PADDING STYLES ---
  containerPadding: {
    paddingHorizontal: Paddings.screen,
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 100,
  },

  // --- TYPOGRAPHY STYLES ---
  appName: {
    ...typography.getTextStyle('heading-1'),
    color: themeColors.text.primary(),
    marginBottom: 16,
    fontSize: 48,
    lineHeight: 64,
  },
  tagline: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(),
    textAlign: 'center',
  },
});
