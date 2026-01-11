/**
 * Email Auth Register Modal Component
 * 
 * A full-screen modal that displays the email authentication form.
 * This modal pops up when users click "Sign up with Email" on the signup screen.
 * 
 * Features:
 * - Full-screen modal presentation
 * - Contains Email auth Section component
 * - Register button anchored to keyboard
 * - Close button to dismiss modal
 * - Clears form fields when closed
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useFadeZoomAnimation } from '@/hooks';
import { useUI } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { registerUser, loginUser } from '@/store/slices/auth/authSlice';
import { WrappedFullScreenModal } from '@/components/layout/ModalLayout/WrappedFullScreenModal';
import { KeyboardAnchoredContainer } from '@/components/layout/ScreenLayout';
import { EmailAuthSection } from '@/components/features/authentication/sections/EmailAuth';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

/**
 * Email Auth Register Modal Component
 * 
 * Renders a full-screen modal with the email authentication form.
 * The modal is controlled by Redux state (modals.emailAuth).
 * When the modal closes, it clears all form fields.
 * 
 * @param variant - 'register' for new user registration, 'signin' for existing user login
 */
export function EmailAuthRegisterModal({ variant = 'register' }: { variant?: 'register' | 'signin' }) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch(); // get dispatch function to call Redux actions
  
  // determine if this is sign in variant (no name fields, different button text)
  const isSignIn = variant === 'signin';
  
  // track if email auth registration/login is in progress
  // this prevents multiple button presses while authentication is happening
  const [emailAuthInProgress, setEmailAuthInProgress] = useState(false);
  
  // get modal visibility state from Redux UI slice
  // modals.emailAuth controls whether this modal is visible
  // closeModal is a Redux action that closes the modal
  const { 
    modals: { emailAuth },
    closeModal,
    setEmailAuthEmail,
    setEmailAuthPassword,
    setEmailAuthFirstName,
    setEmailAuthLastName,
    onboarding: { emailAuthEmail, emailAuthPassword, emailAuthFirstName, emailAuthLastName },
  } = useUI();
  
  // use shared fade zoom animation hook for email auth component (no delay - animates first)
  // animations trigger when modal becomes visible (emailAuth is true)
  const { opacityValue: emailAuthOpacity, scaleValue: emailAuthScale } = useFadeZoomAnimation({
    enabled: emailAuth, // animate when modal is visible
    delay: 0, // no delay - animates first
    dependencies: [emailAuth], // trigger animation when modal visibility changes
  });
  
  // use shared fade zoom animation hook for register button (with delay - animates second)
  // animations trigger when modal becomes visible (emailAuth is true)
  const { opacityValue: registerButtonOpacity, scaleValue: registerButtonScale } = useFadeZoomAnimation({
    enabled: emailAuth, // animate when modal is visible
    delay: SEQUENTIAL_FADE_DELAY, // delay - animates after email auth component
    dependencies: [emailAuth], // trigger animation when modal visibility changes
  });
  
  /**
   * Handle email/password authentication
   * Validates form fields and either registers a new user or signs in an existing user
   * Based on the variant prop, calls either registerUser or loginUser Redux thunk
   */
  const handleEmailAuth = async () => {
    // prevent spam clicks - if authentication is in progress, don't allow another
    if (emailAuthInProgress) return;
    
    // validate that email and password are provided
    if (!emailAuthEmail || !emailAuthPassword) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    // basic email validation (check for @ symbol)
    if (!emailAuthEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    // basic password validation (at least 6 characters)
    if (emailAuthPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    // validate that first name and last name are provided for register variant only
    // these are required for registration but not for sign in
    if (!isSignIn) {
      if (!emailAuthFirstName || emailAuthFirstName.trim().length === 0) {
        Alert.alert('Error', 'Please enter your first name');
        return;
      }
      
      if (!emailAuthLastName || emailAuthLastName.trim().length === 0) {
        Alert.alert('Error', 'Please enter your last name');
        return;
      }
    }
    
    setEmailAuthInProgress(true); // mark email auth as in progress
    
    try {
      if (isSignIn) {
        // sign in variant: use loginUser thunk to authenticate existing user
        // loginUser is a Redux async thunk that authenticates an existing user account
        // Redux thunks are functions that can perform async operations and dispatch actions
        const loginResult = await dispatch(loginUser({ 
          email: emailAuthEmail, 
          password: emailAuthPassword,
        }));
        
        // check if login was successful
        // loginUser.fulfilled.match checks if the thunk completed successfully
        if (loginUser.fulfilled.match(loginResult)) {
          // login successful, close modal and navigate to completion screen
          handleClose();
          router.push('/(onboarding)/completion');
        } else {
          // login failed, show error
          // the error message comes from the Redux thunk
          const errorMessage = loginUser.rejected.match(loginResult) 
            ? loginResult.payload as string 
            : 'Failed to sign in. Please check your email and password.';
          Alert.alert('Error', errorMessage);
        }
      } else {
        // register variant: use registerUser thunk to create new user account
        // registerUser is a Redux async thunk that creates a new user account
        // Redux thunks are functions that can perform async operations and dispatch actions
        // firstName and lastName are required and validated above
        const registerResult = await dispatch(registerUser({ 
          email: emailAuthEmail, 
          password: emailAuthPassword,
          firstName: emailAuthFirstName.trim(), // trim whitespace and use the provided first name
          lastName: emailAuthLastName.trim(), // trim whitespace and use the provided last name
          authProvider: 'email',
        }));
        
        // check if registration was successful
        // registerUser.fulfilled.match checks if the thunk completed successfully
        if (registerUser.fulfilled.match(registerResult)) {
          // registration successful, close modal and navigate to completion screen
          handleClose();
          router.push('/(onboarding)/completion');
        } else {
          // registration failed, show error
          // the error message comes from the Redux thunk
          const errorMessage = registerUser.rejected.match(registerResult) 
            ? registerResult.payload as string 
            : 'Failed to sign up. Please try again.';
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error) {
      // catch any unexpected errors
      console.error('Email authentication error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      // always reset loading state, even if there was an error
      setEmailAuthInProgress(false);
    }
  };
  
  /**
   * Handle modal close
   * Closes the modal and clears all form fields
   */
  const handleClose = () => {
    // clear all form fields when closing modal
    // this ensures a fresh form when the modal is opened again
    setEmailAuthEmail('');
    setEmailAuthPassword('');
    setEmailAuthFirstName('');
    setEmailAuthLastName('');
    
    // close the modal by updating Redux state
    // this triggers a re-render and hides the modal
    closeModal('emailAuth');
  };
  
  const styles = createStyles(themeColors, typography, insets);
  
  return (
    <WrappedFullScreenModal
      visible={emailAuth}
      onClose={handleClose}
      backdropDismiss={true}
      showBackdrop={true}
    >
      {/* main content container with flex layout */}
      {/* matches task creation modal structure exactly */}
      {/* allows ScrollView to take available space and bottom section to be keyboard-anchored */}
      <View style={{ flex: 1 }}>
        {/* close button - absolutely positioned at top left */}
        {/* custom implementation with white X icon (not using MainCloseButton to get white color) */}
        {/* no animation - always visible and functional */}
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
        >
          <Ionicons
            name="close"
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        
        {/* Email auth Section Component */}
        {/* This is the modular email auth section component with all input fields */}
        {/* flex: 1 allows content to take available space above keyboard-anchored bottom section */}
        {/* fades in and scales up first (top animated element) */}
        <Animated.View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 60 + 24,
            opacity: emailAuthOpacity,
            transform: [{ scale: emailAuthScale }],
          }}
        >
          <EmailAuthSection variant={variant} />
        </Animated.View>
        
        {/* Register/Sign In Button Section */}
        {/* bottom action section anchored to keyboard using KeyboardAnchoredContainer */}
        {/* uses locked keyboard height approach: height locks when keyboard first opens */}
        {/* when switching fields, keyboard height stays locked - no position recalculation */}
        {/* this prevents twitching when user switches between input fields */}
        {/* offset={64} ensures consistent spacing from keyboard for both register and sign in variants */}
        {/* fades in and scales up second (bottom animated element) */}
        <KeyboardAnchoredContainer offset={64}>
          <Animated.View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24, // matches get started button container padding
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: insets.bottom,
              opacity: registerButtonOpacity,
              transform: [{ scale: registerButtonScale }],
            }}
          >
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleEmailAuth}
              activeOpacity={0.8}
              disabled={emailAuthInProgress}
            >
              <Text style={styles.registerButtonText}>
                {emailAuthInProgress 
                  ? (isSignIn ? 'Signing in...' : 'Registering...') 
                  : (isSignIn ? 'Sign In' : 'Register')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAnchoredContainer>
      </View>
    </WrappedFullScreenModal>
  );
}

/**
 * Create styles for the component
 * Uses theme colors and typography system for consistent design
 */
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) => StyleSheet.create({
  closeButton: {
    // absolutely position close button at top left
    // circular button matching iOS 15+ style from MainCloseButton
    position: 'absolute',
    left: 16,
    top: 16 + insets.top,
    zIndex: 10, // ensure button appears above other content
    width: 42,
    height: 42,
    borderRadius: 21, // circular shape
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background.lightOverlay(), // tertiary background like MainCloseButton
  },
  registerButton: {
    // use interactive primary color for button background
    backgroundColor: themeColors.interactive.primary(),
    borderRadius: 28, // rounded rectangular button
    paddingVertical: 16, // vertical padding for button height
    paddingHorizontal: 32, // horizontal padding
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58, // minimum touch target size for accessibility
    width: '100%', // full width button
  },
  registerButtonText: {
    // use getThemeColor to access text.inverse for contrasting text on button
    color: themeColors.interactive.quaternary(),
    // use typography system for fontFamily and fontWeight
    ...typography.getTextStyle('button-primary'),
  },
});

