/**
 * Onboarding Layout
 * 
 * This layout wraps all onboarding screens and handles navigation between them.
 * It uses Expo Router's Stack navigator for smooth transitions.
 * 
 * This is the navigation container for the onboarding flow, which includes:
 * - Welcome screen (first screen users see)
 * - Reminders screen (permission requests)
 * - Sign-up screen (authentication options)
 * - Completion screen (final step)
 * 
 * Global components (navigation and actions) are rendered here so they stay fixed
 * while screens slide underneath them.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { OnboardingNavigation } from '@/components/features/onboarding';
import { OnboardingActions } from '@/components/features/onboarding';
import { EmailAuthModal } from '@/components/features/onboarding/EmailAuthModal';

export default function OnboardingLayout() {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);
  
  return (
    <View style={styles.container}>
      {/* Stack Navigator - screens slide underneath global components */}
      <Stack
        screenOptions={{
          headerShown: false, // Hide header for onboarding screens
          animation: 'fade', // cross-fade animation between screens
          animationDuration: 200, // faster transition (default is 350ms, this makes it quicker)
          gestureEnabled: true, // Allow swipe back gesture
        }}
      >
        <Stack.Screen 
          name="welcome" 
          options={{
            gestureEnabled: false, // Can't go back from welcome screen
          }}
        />
        <Stack.Screen name="reminders" />
        <Stack.Screen name="signup" />
        <Stack.Screen 
          name="completion" 
          options={{
            gestureEnabled: false, // Can't go back from completion screen
          }}
        />
      </Stack>
      
      {/* Global Navigation Component */}
      {/* stays fixed at top while screens slide */}
      <OnboardingNavigation />
      
      {/* Global Actions Component */}
      {/* stays fixed at bottom while screens slide, changes based on current screen */}
      <OnboardingActions />
      
      {/* Email Auth Modal */}
      {/* full-screen modal that appears when user clicks "Sign up with Email" */}
      <EmailAuthModal variant="register" />
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background.primary(),
  },
});
