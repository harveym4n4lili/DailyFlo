import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { 
  checkOnboardingStatus, 
  resetOnboarding, 
  markOnboardingComplete, 
  toggleOnboardingStatus,
  debugOnboardingStorage,
  checkLoggedInUser,
  getLoggedInUser,
} from '@/utils/dev/onboardingDevUtils';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { logoutUser } from '@/store/slices/auth/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

// storage key for tracking onboarding completion status
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

export default function SettingsScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const router = useRouter();
  const dispatch = useAppDispatch(); // get dispatch function to call Redux actions
  const { user, isAuthenticated, authMethod } = useAuth(); // get auth state from Redux
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

  /**
   * Handle checking logged in user
   * Shows current logged in user information
   */
  const handleCheckLoggedInUser = () => {
    // log to console for detailed info
    checkLoggedInUser();
    
    // get user info for alert display
    const userInfo = getLoggedInUser();
    
    if (userInfo.isAuthenticated && userInfo.user) {
      // user is logged in, show their info
      const userName = `${userInfo.user.firstName} ${userInfo.user.lastName}`.trim() || 'Not set';
      Alert.alert(
        'Logged In User',
        `✅ User is logged in\n\n` +
        `Email: ${userInfo.user.email}\n` +
        `Name: ${userName}\n` +
        `Auth Method: ${userInfo.authMethod || 'Unknown'}\n` +
        `User ID: ${userInfo.user.id}\n` +
        `Email Verified: ${userInfo.user.isEmailVerified ? 'Yes' : 'No'}\n\n` +
        `Check console for more details.`,
        [{ text: 'OK' }]
      );
    } else {
      // no user is logged in
      Alert.alert(
        'Logged In User',
        '❌ No user is currently logged in\n\n' +
        `isAuthenticated: ${userInfo.isAuthenticated}\n` +
        `Check console for more details.`,
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle logout
   * Clears tokens from SecureStore, clears Redux state, resets onboarding, and navigates to login
   */
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // call logoutUser thunk to clear tokens from SecureStore and Redux state
              // logoutUser is a Redux async thunk that clears authentication tokens and state
              await dispatch(logoutUser());
              
              // reset onboarding status so user goes back to login screen
              // this ensures that after logout, they'll see the welcome/login screen
              await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
              
              // navigate to welcome screen (first onboarding screen)
              // use replace to prevent going back to settings after logout
              router.replace('/(onboarding)/welcome');
            } catch (error) {
              // if logout fails, still try to navigate to login
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out completely. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.description}>
          This is the settings screen where users can manage their account and app preferences.
        </Text>

        {/* Account Section - Only shown when user is authenticated */}
        {isAuthenticated && (
          <View style={[styles.accountSection, styles.accountSectionPadding]}>
            <Text style={styles.sectionTitle}>Account</Text>
            {user && (
              <View style={styles.userInfo}>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.firstName || user.lastName ? (
                  <Text style={styles.userName}>
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                  </Text>
                ) : null}
              </View>
            )}
            <TouchableOpacity
              style={[styles.logoutButton, styles.logoutButtonPadding, styles.logoutButtonDanger]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={[styles.logoutButtonText, styles.logoutButtonDangerText]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Development Tools Section - Only shown in development mode */}
        {isDev && (
          <View style={[styles.devSection, styles.devSectionPadding]}>
            <Text style={styles.devSectionTitle}>🧪 Development Tools</Text>
            <Text style={styles.devSectionDescription}>
              Tools for testing onboarding flow (only visible in development)
            </Text>

            <View style={styles.devButtons}>
              {/* Check Status Button */}
              <TouchableOpacity
                style={[styles.devButton, styles.devButtonPadding]}
                onPress={handleCheckStatus}
                activeOpacity={0.7}
              >
                <Text style={styles.devButtonText}>Check Onboarding Status</Text>
              </TouchableOpacity>

              {/* Toggle Status Button */}
              <TouchableOpacity
                style={[styles.devButton, styles.devButtonPadding]}
                onPress={handleToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.devButtonText}>Toggle Onboarding Status</Text>
              </TouchableOpacity>

              {/* Reset Button */}
              <TouchableOpacity
                style={[styles.devButton, styles.devButtonPadding, styles.devButtonDanger]}
                onPress={handleResetOnboarding}
                activeOpacity={0.7}
              >
                <Text style={[styles.devButtonText, styles.devButtonDangerText]}>
                  Reset Onboarding (First-Time User)
                </Text>
              </TouchableOpacity>

              {/* Mark Complete Button */}
              <TouchableOpacity
                style={[styles.devButton, styles.devButtonPadding, styles.devButtonSuccess]}
                onPress={handleMarkComplete}
                activeOpacity={0.7}
              >
                <Text style={[styles.devButtonText, styles.devButtonSuccessText]}>
                  Mark Complete (Returning User)
                </Text>
              </TouchableOpacity>

              {/* Debug Button */}
              <TouchableOpacity
                style={[styles.devButton, styles.devButtonPadding, styles.devButtonSecondary]}
                onPress={handleDebug}
                activeOpacity={0.7}
              >
                <Text style={styles.devButtonText}>Debug Storage (Console)</Text>
              </TouchableOpacity>

              {/* Check Logged In User Button */}
              <TouchableOpacity
                style={[styles.devButton, styles.devButtonPadding, styles.devButtonSecondary]}
                onPress={handleCheckLoggedInUser}
                activeOpacity={0.7}
              >
                <Text style={styles.devButtonText}>Check Logged In User</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // --- LAYOUT STYLES ---
  scrollView: {
    flex: 1,
  },
  accountSection: {
    marginTop: 0,
    marginBottom: 32,
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.withOpacity(themeColors.text.primary(), 0.1),
  },
  userInfo: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 14,
    color: themeColors.text.secondary(),
  },
  logoutButton: {
    backgroundColor: themeColors.interactive.primary(),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  logoutButtonDanger: {
    backgroundColor: themeColors.withOpacity('#FF3B30', 0.1),
  },
  logoutButtonDangerText: {
    color: '#FF3B30',
  },
  devSection: {
    marginTop: 32,
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: themeColors.withOpacity(themeColors.text.primary(), 0.1),
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
  devButtonDangerText: {
    color: '#FF3B30',
  },
  devButtonSuccessText: {
    color: '#34C759',
  },

  // --- PADDING STYLES ---
  scrollViewContent: {
    padding: Paddings.screenSmall,
    paddingBottom: Paddings.scrollBottomExtra,
  },
  accountSectionPadding: {
    padding: Paddings.screenSmall,
  },
  devSectionPadding: {
    padding: Paddings.screenSmall,
  },
  logoutButtonPadding: {
    paddingVertical: Paddings.listItemVertical,
    paddingHorizontal: Paddings.card,
  },
  devButtonPadding: {
    paddingVertical: Paddings.listItemVertical,
    paddingHorizontal: Paddings.card,
  },

  // --- TYPOGRAPHY STYLES ---
  title: {
    ...typography.getTextStyle('heading-2'),
    color: themeColors.text.primary(),
    marginBottom: 16,
  },
  description: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.secondary(),
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    ...typography.getTextStyle('heading-3'),
    color: themeColors.text.primary(),
    marginBottom: 16,
  },
  userEmail: {
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(),
    marginBottom: 4,
  },
  logoutButtonText: {
    ...typography.getTextStyle('button-primary'),
    color: themeColors.interactive.quaternary(),
  },
  devSectionTitle: {
    ...typography.getTextStyle('heading-3'),
    color: themeColors.text.primary(),
    marginBottom: 8,
  },
  devButtonText: {
    ...typography.getTextStyle('button-primary'),
    color: themeColors.interactive.quaternary(),
  },
});
