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
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide header for onboarding screens
        animation: 'slide_from_right', // Smooth slide animation between screens
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
  );
}
