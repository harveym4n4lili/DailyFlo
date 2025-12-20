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
import { useUI } from '@/store/hooks';
import { OnboardingNavigation } from '@/components/features/onboarding';
import { OnboardingActions } from '@/components/features/onboarding';
import { EmailAuthRegisterModal } from '@/components/features/authentication/modals/EmailAuthModal';
import { SignInModal } from '@/components/features/authentication/modals/SignInModal';
import { ModalBackdrop } from '@/components/layout/ModalLayout';

export default function OnboardingLayout() {
  const themeColors = useThemeColors();
  const styles = createStyles(themeColors);
  
  // get UI state from Redux to check if emailAuthSignIn modal should show backdrop
  // modals.emailAuthSignIn controls whether the sign in modal is visible
  // closeModal is a Redux action that closes the modal
  const { 
    modals: { emailAuthSignIn },
    closeModal,
  } = useUI();
  
  /**
   * Handle sign in modal close
   * Closes the modal by updating Redux state
   */
  const handleSignInModalClose = () => {
    // close the modal by updating Redux state
    // this triggers a re-render and hides the modal
    closeModal('emailAuthSignIn');
  };
  
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
      
      {/* Email Auth Register Modal */}
      {/* full-screen modal that appears when user clicks "Sign up with Email" */}
      <EmailAuthRegisterModal variant="register" />
      
      {/* separate backdrop that fades in independently behind the sign in modal */}
      {/* rendered at screen level, behind the modal in z-index */}
      {/* same backdrop component used with task view modal */}
      <ModalBackdrop
        isVisible={emailAuthSignIn}
        onPress={handleSignInModalClose}
        zIndex={10000}
      />
      
      {/* Sign In Modal */}
      {/* draggable modal that appears when user clicks "Sign in" on welcome screen */}
      {/* backdrop is rendered separately above so it fades in independently */}
      <SignInModal />
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
