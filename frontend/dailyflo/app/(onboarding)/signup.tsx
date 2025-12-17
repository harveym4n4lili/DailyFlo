 /**
 * Sign-up/Login Screen
 * 
 * This screen presents social authentication options to users.
 * Users can sign up or log in using Facebook, Google, or Apple.
 * They can also skip authentication and use the app without an account.
 * 
 * Flow:
 * 1. User sees social auth options
 * 2. User taps a social provider → mock authentication → goes to completion screen
 * 3. User taps "Skip" → goes to main app without authentication
 * 
 * TODO: This is a placeholder - will be implemented in Step 4
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';

export default function SignupScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { getThemeColorValue } = useThemeColor();
  const typography = useTypography();
  const styles = createStyles(themeColors, getThemeColorValue, typography);
  
  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={themeColors.text.primary()} />
      </TouchableOpacity>
      
      <Text style={styles.placeholder}>Sign-up Screen - Coming Soon</Text>
      
      {/* Temporary test buttons */}
      <View style={styles.testButtons}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(onboarding)/completion')}
        >
          <Text style={styles.testButtonText}>→ Completion</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(onboarding)/reminders')}
        >
          <Text style={styles.testButtonText}>← Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.testButtonText}>→ Main App (Skip)</Text>
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
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
