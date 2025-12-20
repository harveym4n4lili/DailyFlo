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

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

export default function SignupScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // animated values for sequential fade-in and scale (start invisible and smaller)
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineScale = useRef(new Animated.Value(0.8)).current;
  
  // animate elements sequentially on mount (top to bottom)
  useEffect(() => {
    // animate headline first (no delay) - fade in and scale up simultaneously
    Animated.parallel([
      Animated.timing(headlineOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(headlineScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headlineOpacity, headlineScale]);
  
  const styles = createStyles(themeColors, typography, insets);
  
  return (
    <View style={styles.container}>
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
  container: {
    flex: 1,
    backgroundColor: themeColors.background.primary(),
    paddingHorizontal: 24,
    // padding top accounts for global navigation component (60px = 40px height + 20px spacing)
    paddingTop: insets.top,
    // padding bottom accounts for global actions component (100px = button height + spacing)
    paddingBottom: insets.bottom + 100,
    justifyContent: 'center', // center content vertically
  },
  content: {
    // content takes up available space and centers vertically
    justifyContent: 'center',
    alignItems: 'center', // center content horizontally
    gap: 32, // spacing between elements
  },
  headline: {
    // use typography heading-1 style for headline
    color: themeColors.text.primary(), // text color using theme color hook
    textAlign: 'center',
    marginBottom: 48,
    // use typography system for fontFamily, fontWeight, lineHeight
    ...typography.getTextStyle('heading-1'),
    fontSize: 32, // override typography: large headline size
  },
});
