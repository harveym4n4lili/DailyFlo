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
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTypography } from '@/hooks/useTypography';

export default function CompletionScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { getThemeColorValue } = useThemeColor();
  const typography = useTypography();
  const styles = createStyles(themeColors, getThemeColorValue, typography);
  
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Completion Screen - Coming Soon</Text>
      
      {/* Temporary test buttons */}
      <View style={styles.testButtons}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.testButtonText}>→ Main App</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(onboarding)/signup')}
        >
          <Text style={styles.testButtonText}>← Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push('/(onboarding)/welcome')}
        >
          <Text style={styles.testButtonText}>← Welcome</Text>
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
