import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { ScreenContainer } from '@/components';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { 
  checkOnboardingStatus, 
  resetOnboarding, 
  markOnboardingComplete, 
  toggleOnboardingStatus,
  debugOnboardingStorage 
} from '@/utils/dev/onboardingDevUtils';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const router = useRouter();
  const styles = createStyles(themeColors, typography);
  
  // check if we're in development mode (__DEV__ is a global variable in React Native)
  const isDev = __DEV__;

  /**
   * Handle checking onboarding status
   * Shows current status in an alert
   */
  const handleCheckStatus = async () => {
    const status = await checkOnboardingStatus();
    Alert.alert(
      'Onboarding Status',
      status === 'true' 
        ? '✅ Onboarding is COMPLETE\n(Returning user - will skip onboarding)' 
        : '⏳ Onboarding is INCOMPLETE\n(First-time user - will see onboarding)',
      [{ text: 'OK' }]
    );
  };

  /**
   * Handle resetting onboarding
   * Makes user a first-time user again
   */
  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will make you a first-time user again. You will see onboarding screens on next app launch.\n\nReload the app to see the change.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetOnboarding();
              Alert.alert('Success', 'Onboarding reset! Reload the app to see onboarding screens.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset onboarding. Check console for details.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle marking onboarding as complete
   * Makes user a returning user
   */
  const handleMarkComplete = async () => {
    Alert.alert(
      'Mark Onboarding Complete',
      'This will mark onboarding as complete. You will skip onboarding on next app launch.\n\nReload the app to see the change.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: async () => {
            try {
              await markOnboardingComplete();
              Alert.alert('Success', 'Onboarding marked as complete! Reload the app to skip onboarding.');
            } catch (error) {
              Alert.alert('Error', 'Failed to mark onboarding complete. Check console for details.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle toggling onboarding status
   * Switches between first-time and returning user
   */
  const handleToggle = async () => {
    try {
      await toggleOnboardingStatus();
      Alert.alert('Success', 'Onboarding status toggled! Reload the app to see the change.');
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle onboarding status. Check console for details.');
    }
  };

  /**
   * Handle debugging onboarding storage
   * Shows detailed info in console
   */
  const handleDebug = async () => {
    await debugOnboardingStorage();
    Alert.alert('Debug Info', 'Check the console/terminal for detailed onboarding storage information.');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.description}>
        This is the settings screen where users can manage their account and app preferences.
      </Text>

      {/* Development Tools Section - Only shown in development mode */}
      {isDev && (
        <View style={styles.devSection}>
          <Text style={styles.devSectionTitle}>🧪 Development Tools</Text>
          <Text style={styles.devSectionDescription}>
            Tools for testing onboarding flow (only visible in development)
          </Text>

          <View style={styles.devButtons}>
            {/* Check Status Button */}
            <TouchableOpacity
              style={styles.devButton}
              onPress={handleCheckStatus}
              activeOpacity={0.7}
            >
              <Text style={styles.devButtonText}>Check Onboarding Status</Text>
            </TouchableOpacity>

            {/* Toggle Status Button */}
            <TouchableOpacity
              style={styles.devButton}
              onPress={handleToggle}
              activeOpacity={0.7}
            >
              <Text style={styles.devButtonText}>Toggle Onboarding Status</Text>
            </TouchableOpacity>

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.devButton, styles.devButtonDanger]}
              onPress={handleResetOnboarding}
              activeOpacity={0.7}
            >
              <Text style={[styles.devButtonText, styles.devButtonDangerText]}>
                Reset Onboarding (First-Time User)
              </Text>
            </TouchableOpacity>

            {/* Mark Complete Button */}
            <TouchableOpacity
              style={[styles.devButton, styles.devButtonSuccess]}
              onPress={handleMarkComplete}
              activeOpacity={0.7}
            >
              <Text style={[styles.devButtonText, styles.devButtonSuccessText]}>
                Mark Complete (Returning User)
              </Text>
            </TouchableOpacity>

            {/* Debug Button */}
            <TouchableOpacity
              style={[styles.devButton, styles.devButtonSecondary]}
              onPress={handleDebug}
              activeOpacity={0.7}
            >
              <Text style={styles.devButtonText}>Debug Storage (Console)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    color: themeColors.text.primary(),
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: themeColors.text.secondary(),
    textAlign: 'center',
    marginBottom: 32,
  },
  devSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.withOpacity(themeColors.text.primary(), 0.1),
  },
  devSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text.primary(),
    marginBottom: 8,
  },
  devSectionDescription: {
    fontSize: 14,
    color: themeColors.text.secondary(),
    marginBottom: 16,
  },
  devButtons: {
    gap: 12,
  },
  devButton: {
    backgroundColor: themeColors.interactive.primary(),
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  devButtonSecondary: {
    backgroundColor: themeColors.withOpacity(themeColors.text.primary(), 0.1),
  },
  devButtonDanger: {
    backgroundColor: themeColors.withOpacity('#FF3B30', 0.1),
  },
  devButtonSuccess: {
    backgroundColor: themeColors.withOpacity('#34C759', 0.1),
  },
  devButtonText: {
    color: themeColors.interactive.quaternary(),
    fontSize: 16,
    fontWeight: '600',
    ...typography.getTextStyle('button-primary'),
  },
  devButtonDangerText: {
    color: '#FF3B30',
  },
  devButtonSuccessText: {
    color: '#34C759',
  },
});
