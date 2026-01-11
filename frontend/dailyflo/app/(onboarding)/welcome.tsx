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
    <View style={styles.container}>
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
  container: {
    flex: 1,
    // use regular primary background - adapts to user's theme preference
    backgroundColor: themeColors.background.primary(),
    paddingHorizontal: 24,
    // padding top accounts for global navigation component (60px = 40px height + 20px spacing)
    paddingTop: insets.top,
    // padding bottom accounts for global actions component (100px = button height + spacing)
    paddingBottom: insets.bottom + 100,
    justifyContent: 'center', // center content vertically
  },
  content: {
    // content takes up available space and centers vertically, positioned slightly higher
    justifyContent: 'center',
    alignItems: 'center', // center content horizontally
    marginTop: -80, // move content slightly higher while maintaining center alignment
  },
  appName: {
    // use typography heading-1 style - this provides fontSize, lineHeight, fontWeight, fontFamily
    // we override fontSize to make it larger for the welcome screen (48 instead of 36)
   
    color: themeColors.text.primary(), // text color using theme color hook
    marginBottom: 16,

    // use typography system for fontFamily, fontWeight, lineHeight from heading-1 style
    ...typography.getTextStyle('heading-1'),
    fontSize: 48, // override typography: large headline size
    lineHeight: 64, // override typography: line height
  },
  tagline: {
    // use typography body-large style - this provides fontSize, lineHeight, fontWeight, fontFamily
   
    color: themeColors.text.primary(), // text color using theme color hook
    textAlign: 'center',
    
    // use typography system for fontFamily and fontWeight from body-large style
    ...typography.getTextStyle('body-large'),
  },
});
