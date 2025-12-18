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

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

export default function CompletionScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // animated values for sequential fade-in and scale (start invisible and smaller)
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineScale = useRef(new Animated.Value(0.8)).current;
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const instructionScale = useRef(new Animated.Value(0.8)).current;
  
  // animate elements sequentially on mount (top to bottom)
  useEffect(() => {
    // animate icon first (no delay) - fade in and scale up simultaneously
    Animated.parallel([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    
    // animate headline second - fade in and scale up simultaneously
    Animated.parallel([
      Animated.timing(headlineOpacity, {
        toValue: 1,
        duration: 400,
        delay: SEQUENTIAL_FADE_DELAY,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(headlineScale, {
        toValue: 1,
        duration: 400,
        delay: SEQUENTIAL_FADE_DELAY,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    
    // animate instruction last - fade in and scale up simultaneously
    Animated.parallel([
      Animated.timing(instructionOpacity, {
        toValue: 1,
        duration: 400,
        delay: SEQUENTIAL_FADE_DELAY * 2,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(instructionScale, {
        toValue: 1,
        duration: 400,
        delay: SEQUENTIAL_FADE_DELAY * 2,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [iconOpacity, iconScale, headlineOpacity, headlineScale, instructionOpacity, instructionScale]);
  
  const styles = createStyles(themeColors, typography, insets);
  
  return (
    <View style={styles.container}>
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
    gap: 32, // spacing between icon, headline, and instruction
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
  instruction: {
    // use typography body-large style for instruction
    color: themeColors.text.primary(), // text color using theme color hook
    textAlign: 'center',
    paddingHorizontal: 32, // horizontal padding for text
    // use typography system for fontFamily and fontWeight
    ...typography.getTextStyle('body-large'),
    fontSize: 16, // override typography: readable body text size
    lineHeight: 24, // override typography: comfortable line height for readability
  },
});
