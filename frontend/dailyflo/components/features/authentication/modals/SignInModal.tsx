/**
 * Sign In Modal Component
 * 
 * A draggable modal for signing in with email and password.
 * This modal opens when users click "Sign in" on the welcome screen.
 * 
 * Features:
 * - Draggable modal using WrappedDraggableModal (same as task view modal)
 * - Initial snap point at highest point (0.9) from task view modal
 * - Modal is draggable at the header - swiping down closes it
 * - Contains ModalHeader with white close button and drag indicator
 * - Same structure as task view modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Easing, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useUI } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { loginUser } from '@/store/slices/auth/authSlice';
import { WrappedDraggableModal, ModalHeader } from '@/components/layout/ModalLayout';
import { DraggableModalRef } from '@/components/layout/ModalLayout/DraggableModal';
import { SocialAuthActions } from '@/components/features/authentication/sections/SocialAuthActions';
import { EmailAuthSection } from '@/components/features/authentication/sections/EmailAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAnchoredContainer } from '@/components/layout/ScreenLayout';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

/**
 * Sign In Modal Component
 * 
 * Renders a draggable modal for email sign in.
 * The modal is controlled by Redux state (modals.emailAuthSignIn).
 * Modal opens at the middle snap point (0.65) and is draggable at the header.
 * Swiping down closes the modal.
 * Contains social auth buttons (sign in variant) and email sign in option.
 */
// storage key for tracking onboarding completion status
// this key is used to check if the user has completed the onboarding flow
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

export function SignInModal() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch(); // get dispatch function to call Redux actions
  
  /**
   * Get iOS version number for conditional styling
   * iOS 15+ introduced the glass UI design with updated header styling
   * Returns the major version number (e.g., 14, 15, 16, 17)
   */
  const getIOSVersion = (): number => {
    if (Platform.OS !== 'ios') return 0;
    const version = Platform.Version as string;
    // Platform.Version can be a string like "15.0" or number like 15
    // parse it to get the major version number
    const majorVersion = typeof version === 'string' 
      ? parseInt(version.split('.')[0], 10) 
      : Math.floor(version as number);
    return majorVersion;
  };
  
  // check if running on iOS 15+ (newer glass UI design)
  const isNewerIOS = getIOSVersion() >= 15;
  
  // calculate header height based on iOS version
  // iOS 15+: 70px (16px top + 38px button + 16px bottom)
  // iOS < 15: 56px
  const headerHeight = isNewerIOS ? 70 : 56;
  
  // ref to control draggable modal programmatically
  // allows us to snap modal to highest snap point when email auth is selected
  const draggableModalRef = useRef<DraggableModalRef>(null);
  
  // track current view mode: 'social' shows social auth buttons, 'email' shows email auth form
  // starts with 'social' to show social auth options first
  const [viewMode, setViewMode] = useState<'social' | 'email'>('social');
  
  // track current snap point index to check if already at highest
  // snapPoints array: [0.3, 0.65, 0.9] - index 2 is highest (0.9)
  // we track this to avoid unnecessary snap animations
  const [currentSnapIndex, setCurrentSnapIndex] = useState<number>(1); // starts at middle (index 1)
  
  // track if social auth is in progress
  // this prevents multiple button presses while authentication is happening
  const [socialAuthInProgress, setSocialAuthInProgress] = useState<string | null>(null);
  
  // track when modal becomes visible to trigger social auth animations
  const [shouldAnimateSocialAuth, setShouldAnimateSocialAuth] = useState(false);
  
  // animated value for email link fade-in
  // email link fades in after social buttons
  const emailLinkOpacity = useRef(new Animated.Value(0)).current;
  const emailLinkScale = useRef(new Animated.Value(0.8)).current;
  
  // animated values for email auth section sequential fade-in
  // email auth section and sign in button animate sequentially when email view loads
  const emailAuthSectionOpacity = useRef(new Animated.Value(0)).current;
  const emailAuthSectionScale = useRef(new Animated.Value(0.8)).current;
  const signInButtonOpacity = useRef(new Animated.Value(0)).current;
  const signInButtonScale = useRef(new Animated.Value(0.8)).current;
  
  // get modal visibility state from Redux UI slice
  // modals.emailAuthSignIn controls whether this modal is visible
  // closeModal is a Redux action that closes the modal
  // openModal is a Redux action that opens modals (we use it to open the email auth modal)
  // setEmailAuthEmail and setEmailAuthPassword are Redux actions to clear form fields
  const { 
    modals: { emailAuthSignIn },
    closeModal,
    openModal,
    setEmailAuthEmail,
    setEmailAuthPassword,
  } = useUI();
  
  // trigger animations when modal becomes visible
  // social auth buttons handle their own animations, but we need to trigger them
  useEffect(() => {
    if (emailAuthSignIn) {
      // modal just opened - reset to social view and trigger animations
      setViewMode('social');
      setCurrentSnapIndex(1); // reset to middle snap point
      setShouldAnimateSocialAuth(true);
      
      // reset email link animation values
      emailLinkOpacity.setValue(0);
      emailLinkScale.setValue(0.8);
      
      // animate email link after social buttons finish animating
      // social buttons animate sequentially: Facebook (delay 1), Google (delay 2), Apple if iOS (delay 3)
      // each button animation takes 400ms duration
      // calculate delay to start after the last button finishes:
      // - iOS: Apple button starts at delay 3 (600ms), finishes at 1000ms (600ms + 400ms duration)
      // - Android: Google button starts at delay 2 (400ms), finishes at 800ms (400ms + 400ms duration)
      const animationDuration = 400; // duration of each social button animation
      const lastButtonDelay = Platform.OS === 'ios' 
        ? SEQUENTIAL_FADE_DELAY * 3  // Apple button delay (600ms)
        : SEQUENTIAL_FADE_DELAY * 2;  // Google button delay (400ms)
      const emailLinkDelay = lastButtonDelay + animationDuration; // start after last button finishes
      
      Animated.parallel([
        Animated.timing(emailLinkOpacity, {
          toValue: 1,
          duration: 400,
          delay: emailLinkDelay,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(emailLinkScale, {
          toValue: 1,
          duration: 400,
          delay: emailLinkDelay,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // modal closed - reset animation trigger and view mode
      setShouldAnimateSocialAuth(false);
      setViewMode('social');
    }
  }, [emailAuthSignIn, emailLinkOpacity, emailLinkScale]);
  
  // animate email auth section sequentially when viewMode switches to 'email'
  // email auth section fades in first, then sign in button fades in after delay
  useEffect(() => {
    if (viewMode === 'email') {
      // reset animation values when email view loads
      // start all elements invisible and slightly smaller
      emailAuthSectionOpacity.setValue(0);
      emailAuthSectionScale.setValue(0.8);
      signInButtonOpacity.setValue(0);
      signInButtonScale.setValue(0.8);
      
      // animate email auth section first (no delay) - fade in and scale up simultaneously
      Animated.parallel([
        Animated.timing(emailAuthSectionOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(emailAuthSectionScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      
      // animate sign in button second (after delay) - fade in and scale up simultaneously
      Animated.parallel([
        Animated.timing(signInButtonOpacity, {
          toValue: 1,
          duration: 400,
          delay: SEQUENTIAL_FADE_DELAY,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(signInButtonScale, {
          toValue: 1,
          duration: 400,
          delay: SEQUENTIAL_FADE_DELAY,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // reset animation values when switching away from email view
      // this ensures fresh animations when email view loads again
      emailAuthSectionOpacity.setValue(0);
      emailAuthSectionScale.setValue(0.8);
      signInButtonOpacity.setValue(0);
      signInButtonScale.setValue(0.8);
    }
  }, [viewMode, emailAuthSectionOpacity, emailAuthSectionScale, signInButtonOpacity, signInButtonScale]);
  
  /**
   * Handle modal close
   * Closes the modal and clears all form fields
   */
  const handleClose = () => {
    // clear email and password fields when modal closes
    // this ensures form is clean when modal opens again
    setEmailAuthEmail('');
    setEmailAuthPassword('');
    
    // close the modal by updating Redux state
    // this triggers a re-render and hides the modal
    closeModal('emailAuthSignIn');
  };
  
  /**
   * Handle social authentication (Sign in modal)
   * Currently disabled - social auth is not implemented yet
   * This function does nothing when called
   */
  const handleSocialAuth = async (provider: 'facebook' | 'google' | 'apple') => {
    // social auth buttons are disabled for now
    // TODO: Implement social authentication when connecting to API
    console.log(`Social auth with ${provider} is not implemented yet`);
    // do nothing - buttons are disabled
    return;
  };
  
  /**
   * Handle open email auth form
   * Expands modal to top snap point (0.9, same as task view's top snap point) and switches to email auth form
   */
  const handleOpenEmailAuth = () => {
    // snap modal to top snap point (0.9 - fully expanded, same as task view modal)
    // snapToTop() animates to translateY of 0, which is the top position
    // if already at top, the animation will be minimal/no animation
    draggableModalRef.current?.snapToTop();
    
    // update tracked snap index to top (index 2 = 0.9)
    setCurrentSnapIndex(2);
    
    // switch view mode to show email auth form instead of social auth buttons
    setViewMode('email');
  };
  
  /**
   * Handle back button press
   * Reverts modal back to social auth view (first section)
   */
  const handleBack = () => {
    // switch view mode back to social auth buttons
    setViewMode('social');
    
    // reset snap index to middle (index 1 = 0.65)
    setCurrentSnapIndex(1);
    
    // snap modal back to middle snap point
    draggableModalRef.current?.snapToIndex(1);
  };
  
  // track if email sign in is in progress
  // this prevents multiple button presses while authentication is happening
  const [emailAuthInProgress, setEmailAuthInProgress] = useState(false);
  
  // get email auth form values from Redux state
  // these are shared with EmailAuthSection component
  const {
    onboarding: { emailAuthEmail, emailAuthPassword },
  } = useUI();
  
  /**
   * Handle email sign in
   * Validates form fields and authenticates user with email and password
   * Uses Redux loginUser thunk to authenticate, then navigates to home page
   */
  const handleEmailSignIn = async () => {
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
    
    setEmailAuthInProgress(true); // mark email auth as in progress
    
    try {
      // use loginUser thunk to authenticate existing user
      // loginUser is a Redux async thunk that authenticates an existing user account
      // Redux thunks are functions that can perform async operations and dispatch actions
      const loginResult = await dispatch(loginUser({ 
        email: emailAuthEmail, 
        password: emailAuthPassword,
      }));
      
      // check if login was successful
      // loginUser.fulfilled.match checks if the thunk completed successfully
      if (loginUser.fulfilled.match(loginResult)) {
        // login successful - mark onboarding as complete and navigate to home page
        // this ensures returning users don't see onboarding screens again
        try {
          // mark onboarding as complete in AsyncStorage
          // this ensures that when the app is reloaded, it will skip onboarding
          // AsyncStorage is a simple key-value storage system for React Native
          await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        } catch (error) {
          // if saving fails, still navigate to main app
          // the user has successfully signed in, so we should let them continue
          console.error('Failed to save onboarding completion:', error);
        }
        
        // close the sign-in modal
        handleClose();
        
        // navigate to the home screen (today tab)
        // use replace to prevent going back to onboarding screens
        router.replace('/(tabs)/today');
      } else {
        // login failed, show error
        // the error message comes from the Redux thunk
        const errorMessage = loginUser.rejected.match(loginResult) 
          ? loginResult.payload as string 
          : 'Failed to sign in. Please check your email and password.';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      // handle unexpected errors
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Sign in error:', error);
    } finally {
      // always reset loading state, even if there was an error
      setEmailAuthInProgress(false);
    }
  };
  
  const styles = createStyles(themeColors, typography, headerHeight, insets);
  
  return (
    <WrappedDraggableModal
      ref={draggableModalRef}
      visible={emailAuthSignIn}
      onClose={handleClose}
      // snap points: same as task view modal
      // [0.3, 0.65, 0.9] - lowest point (0.3) closes modal, middle (0.65) is initial position, highest (0.9)
      // when dragged down to 0.3, modal closes automatically
      snapPoints={[0.3, 0.65, 0.9]}
      // initial snap point is 1 (the middle snap point in the array - 0.65)
      initialSnapPoint={1}
      // enable gestures to make modal draggable at the header
      disableGestures={false}
      backgroundColor={themeColors.background.primary()}
      backdropDismiss={true}
    >
      {/* modal header with close/back button on left and drag indicator */}
      {/* absolutely positioned to float over content */}
      {/* header is draggable - user can swipe down from here to close modal */}
      <View 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10, // ensure header is above scrollable content
        }}
      >
        {/* modal header with drag indicator and custom white close/back button */}
        {/* button switches between close (social view) and back (email view) */}
        <View style={{ position: 'relative' }}>
          {/* conditionally render close button or back button based on viewMode */}
          {/* social view: show white close button that closes modal */}
          {/* email view: show white back button that returns to social view */}
          {viewMode === 'social' ? (
            // close button - shown when in social auth view
            // custom white close button positioned within header
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
          ) : (
            // back button - shown when in email auth view
            // custom white back button positioned within header
            // icon size matches onboarding screens (24px) for consistency
            <TouchableOpacity
              onPress={handleBack}
              style={styles.closeButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
          
          {/* modal header with drag indicator (close button hidden, using custom white button above) */}
          <ModalHeader
            showCloseButton={false}
            showDragIndicator={true}
            onClose={handleClose}
            showBorder={false}
            backgroundColor="transparent"
          />
        </View>
      </View>
      
      {/* main content area */}
      {/* conditionally shows social auth buttons or email auth form based on viewMode */}
      {viewMode === 'social' ? (
        <View style={styles.contentContainer}>
          {/* Social Auth Buttons */}
          {/* social buttons fade in and scale up sequentially (handled by SocialAuthActions component) */}
          {/* uses signin variant to show "Sign in with [Provider]" text */}
          <SocialAuthActions
            variant="signin"
            onSocialAuth={handleSocialAuth}
            disabled={true}
            animate={shouldAnimateSocialAuth}
          />
          
          {/* Use Email Instead Link */}
          {/* expands modal to highest snap point and switches to email auth form */}
          {/* fades in after social buttons */}
          <Animated.View
            style={{
              opacity: emailLinkOpacity,
              transform: [{ scale: emailLinkScale }],
            }}
          >
            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={handleOpenEmailAuth}
              activeOpacity={0.7}
              disabled={!!socialAuthInProgress}
            >
              <Text style={styles.secondaryLinkText}>
                Use email instead? <Text style={styles.secondaryLinkHighlight}>Sign in with Email</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        /* Email Auth Form */
        /* shown when viewMode is 'email' - displays email and password inputs */
        <View style={styles.emailAuthWrapper}>
          {/* Email Auth Section Component */}
          {/* reusable component with email and password input fields */}
          {/* variant="signin" hides first name and last name fields */}
          {/* flex: 1 allows content to take available space above keyboard-anchored bottom section */}
          {/* fades in and scales up first (top animated element) */}
          <Animated.View
            style={[
              styles.emailAuthSectionContainer,
              {
                opacity: emailAuthSectionOpacity,
                transform: [{ scale: emailAuthSectionScale }],
              },
            ]}
          >
            <EmailAuthSection variant="signin" />
          </Animated.View>
          
          {/* Sign In Button */}
          {/* anchored to keyboard using KeyboardAnchoredContainer */}
          {/* uses locked keyboard height approach: height locks when keyboard first opens */}
          {/* when switching fields, keyboard height stays locked - no position recalculation */}
          {/* this prevents twitching when user switches between input fields */}
          {/* offset={96} ensures more spacing from keyboard for better visual separation */}
          {/* fades in and scales up second (bottom animated element) */}
          <KeyboardAnchoredContainer offset={0}>
            <Animated.View
              style={[
                styles.signInButtonContainer,
                { paddingBottom: insets.bottom },
                {
                  opacity: signInButtonOpacity,
                  transform: [{ scale: signInButtonScale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleEmailSignIn}
                activeOpacity={0.8}
                disabled={emailAuthInProgress || !emailAuthEmail || !emailAuthPassword}
              >
                <Text style={styles.signInButtonText}>
                  {emailAuthInProgress ? 'Signing in...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAnchoredContainer>
        </View>
      )}
    </WrappedDraggableModal>
  );
}

/**
 * Create styles for the component
 * Uses theme colors and typography system for consistent design
 */
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  headerHeight: number,
  insets: ReturnType<typeof useSafeAreaInsets>
) => StyleSheet.create({
  closeButton: {
    // absolutely position close button at top left within ModalHeader
    // positioned to match ModalHeader's close button position (16px from top and left for iOS 15+)
    // circular button matching iOS 15+ style from MainCloseButton
    position: 'absolute',
    left: 16, // matches ModalHeader's closeButtonSpacing for iOS 15+
    top: 16, // matches ModalHeader's closeButtonSpacing for iOS 15+ (safe area handled by container)
    zIndex: 11, // ensure button appears above ModalHeader content
    width: 42,
    height: 42,
    borderRadius: 21, // circular shape
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.background.lightOverlay(), // tertiary background like MainCloseButton
  },
  contentContainer: {
    flex: 1,
    // add top padding to account for absolutely positioned header
    // headerHeight is calculated based on iOS version (70px for iOS 15+, 56px for older iOS)
    // add extra 16px for visual breathing room between header and social auth buttons
    paddingTop: headerHeight + 16, // header height + spacing
    paddingHorizontal: 24, // horizontal padding to match other screens
    gap: 16, // spacing between social buttons and email link
  },
  secondaryLink: {
    paddingVertical: 12, // padding for touch target
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: themeColors.text.secondary(), // text color using theme color hook
    textAlign: 'center',
    // use typography system for fontFamily and fontWeight
    ...typography.getTextStyle('body-large'),
  },
  secondaryLinkHighlight: {
    fontWeight: '800', // make highlighted part slightly bolder
    color: themeColors.text.primary(), // text color using theme color hook
  },
  emailAuthWrapper: {
    flex: 1,
    // wrapper for email auth form and sign in button
    // ensures proper layout with flex: 1 to take available space
  },
  emailAuthSectionContainer: {
    flex: 1,
    // add top padding to account for absolutely positioned header
    // headerHeight is calculated based on iOS version (70px for iOS 15+, 56px for older iOS)
    paddingTop: headerHeight + 24, // header height + spacing
    paddingHorizontal: 24, // horizontal padding to match other screens
    paddingBottom: 24, // bottom padding for content
    // flex: 1 allows this container to take available space above the keyboard-anchored button
  },
  signInButtonContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24, // matches other button container padding
    // paddingBottom for safe area is added inline (insets.bottom)
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButton: {
    // use interactive primary color for button background (same as register button)
    backgroundColor: themeColors.interactive.primary(),
    borderRadius: 28, // rounded rectangular button (same as register button)
    paddingVertical: 16, // vertical padding for button height (same as register button)
    paddingHorizontal: 32, // horizontal padding (same as register button)
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58, // minimum touch target size for accessibility (same as register button)
    width: '100%', // full width button (same as register button)
  },
  signInButtonText: {
    // use interactive quaternary color for text (same as register button)
    // this provides contrasting text color on the primary button background
    color: themeColors.interactive.quaternary(),
    // use typography system for fontFamily and fontWeight (same as register button)
    ...typography.getTextStyle('button-primary'),
  },
});

