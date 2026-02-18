/**
 * Completion Screen
 * 
 * This is the final screen in the onboarding flow.
 * It confirms successful setup and guides users to create their first task.
 * 
 * Flow:
 * 1. User sees success message
 * 2. User taps "Create Task" → goes to main app (Today screen) with task creation modal open
 * 
 * TODO: This is a placeholder - will be implemented in Step 5
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { useFadeZoomAnimation } from '@/hooks';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

export default function CompletionScreen() {
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
  
  // use shared fade zoom animation hook for instruction (with longer delay - animates last)
  const { opacityValue: instructionOpacity, scaleValue: instructionScale } = useFadeZoomAnimation({
    delay: SEQUENTIAL_FADE_DELAY * 2, // longer delay - animates after headline
  });
  
  const styles = createStyles(themeColors, typography, insets);
  
  return (
    <View style={[styles.container, styles.containerPadding]}>
      {/* Main Content */}
      {/* navigation and buttons are handled globally in the layout */}
      <View style={styles.content}>
        {/* Flag Icon */}
        {/* large flag icon to represent completion */}
        {/* fades in and scales up first (top element) */}
        <Animated.View style={[
          styles.iconContainer,
          {
            opacity: iconOpacity,
            transform: [{ scale: iconScale }],
          },
        ]}>
          <Ionicons 
            name="flag-outline" 
            size={64} 
            color={themeColors.text.primary()} 
          />
        </Animated.View>
        
        {/* Headline */}
        {/* fades in and scales up second */}
        <Animated.Text style={[
          styles.headline,
          {
            opacity: headlineOpacity,
            transform: [{ scale: headlineScale }],
          },
        ]}>
          We're all set!
        </Animated.Text>
        
        {/* Instruction Text */}
        {/* fades in and scales up last (bottom element) */}
        <Animated.Text style={[
          styles.instruction,
          styles.instructionPadding,
          {
            opacity: instructionOpacity,
            transform: [{ scale: instructionScale }],
          },
        ]}>
          Create your first task and make progress today.
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
    gap: 32, // spacing between icon, headline, and instruction
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 100,
  },

  // --- PADDING STYLES ---
  containerPadding: {
    paddingHorizontal: Paddings.screen,
    paddingTop: insets.top,
    paddingBottom: insets.bottom + 100,
  },
  instructionPadding: {
    paddingHorizontal: Paddings.screenLarge,
  },

  // --- TYPOGRAPHY STYLES ---
  headline: {
    ...typography.getTextStyle('heading-1'),
    color: themeColors.text.primary(),
    textAlign: 'center',
    fontSize: 32,
  },
  instruction: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(),
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
