/**
 * Welcome Screen
 * 
 * This is the first screen users see when they open the app for the first time.
 * It introduces the app and provides entry points to either start onboarding
 * or sign in if they already have an account.
 * 
 * Flow:
 * 1. User sees welcome message
 * 2. User taps "Get Started" → goes to Reminders screen
 * 3. User taps "Sign In" → goes to Sign-up/Login screen
 * 
 * TODO: This is a placeholder - will be implemented in Step 2
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';

export default function WelcomeScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { getThemeColorValue } = useThemeColor();
  const typography = useTypography();
  const styles = createStyles(themeColors, getThemeColorValue, typography);
  
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Welcome Screen - Coming Soon</Text>
      
      {/* Temporary test buttons for navigation */}
      <View style={styles.testButtons}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(onboarding)/reminders')}
        >
          <Text style={styles.testButtonText}>→ Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(onboarding)/signup')}
        >
          <Text style={styles.testButtonText}>→ Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(onboarding)/completion')}
        >
          <Text style={styles.testButtonText}>→ Completion</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.testButtonText}>→ Main App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  getThemeColorValue: (shade?: number) => string,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.background.primary(),
  },
  placeholder: {
    fontSize: 18,
    color: themeColors.text.primary(),
    marginBottom: 32,
    ...typography.body,
  },
  testButtons: {
    gap: 12,
    width: '80%',
  },
  testButton: {
    backgroundColor: getThemeColorValue(500), // use theme color for button background
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF', // white text on primary colored buttons
    fontSize: 14,
    fontWeight: '500',
    ...typography.body,
  },
});
