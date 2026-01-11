/**
 * Reminders Screen
 * 
 * This screen requests notification permissions from the user.
 * It explains why permissions are needed and allows users to grant
 * or skip permission requests.
 * 
 * Flow:
 * 1. User sees reminder explanation
 * 2. User taps "Allow" → requests permission → goes to Sign-up screen
 * 3. User taps "Skip" → goes to Sign-up screen without requesting permission
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useFadeZoomAnimation } from '@/hooks';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 100; // time between each element fading in

export default function RemindersScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // use shared fade zoom animation hook for icon (no delay - animates first)
  const { opacityValue: iconOpacity, scaleValue: iconScale } = useFadeZoomAnimation({
    delay: 0, // no delay - animates first
  });
  
  // use shared fade zoom animation hook for headline (with delay - animates second)
  const { opacityValue: headlineOpacity, scaleValue: headlineScale } = useFadeZoomAnimation({
    delay: SEQUENTIAL_FADE_DELAY, // delay - animates after icon
  });
  
  // use shared fade zoom animation hook for description (with longer delay - animates last)
  const { opacityValue: descriptionOpacity, scaleValue: descriptionScale } = useFadeZoomAnimation({
    delay: SEQUENTIAL_FADE_DELAY * 2, // longer delay - animates after headline
  });
  
  const styles = createStyles(themeColors, typography, insets);
  
  return (
    <View style={styles.container}>
      {/* Main Content */}
      {/* centered content with icon, headline, and description */}
      {/* navigation and buttons are handled globally in the layout */}
      <View style={styles.content}>
        {/* Bell Icon */}
        {/* large outlined bell icon to represent notifications */}
        {/* fades in and scales up first (top element) */}
        <Animated.View style={[
          styles.iconContainer,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}>
          <Ionicons 
            name="notifications-outline" 
            size={80} 
            color={themeColors.text.primary()} 
          />
        </Animated.View>
        
        {/* Headline */}
        {/* main title explaining the feature */}
        {/* fades in and scales up second */}
        <Animated.Text style={[
          styles.headline,
          {
            opacity: headlineOpacity,
            transform: [{ scale: headlineScale }],
          },
        ]}>
          Reminders, your way
        </Animated.Text>
        
        {/* Description */}
        {/* explains why permissions are needed */}
        {/* fades in and scales up last (bottom element) */}
        <Animated.Text style={[
          styles.description,
          {
            opacity: descriptionOpacity,
            transform: [{ scale: descriptionScale }],
          },
        ]}>
          Get alerts for tasks and deadlines - you're always in control.
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
    // content takes up available space and centers vertically
    justifyContent: 'center',
    alignItems: 'center', // center content horizontally
    gap: 32, // spacing between icon, headline, and description
  },
  iconContainer: {
    width: 120, // container size for icon
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 100,
  },
  headline: {
    // use typography heading-1 style for headline
    
    color: themeColors.text.primary(), // text color using theme color hook
    textAlign: 'center',
    // use typography system for fontFamily, fontWeight, lineHeight
    ...typography.getTextStyle('heading-1'),
    fontSize: 32, // override typography: large headline size
  },
  description: {
    // use typography body-large style for description
    fontSize: 16, // readable body text size
    color: themeColors.text.primary(), // text color using theme color hook
    textAlign: 'center',
    lineHeight: 24, // comfortable line height for readability
    paddingHorizontal: 32, // horizontal padding for text
    // use typography system for fontFamily and fontWeight
    ...typography.getTextStyle('body-large'),
  },
});
