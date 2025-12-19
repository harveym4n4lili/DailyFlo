/**
 * Onboarding Actions Component
 * 
 * This component provides global action buttons for all onboarding screens.
 * The buttons change based on the current screen:
 * - Welcome: "Get Started" button + "Sign Up" link
 * - Reminders: "Allow" button + "Skip" link
 * - Signup: Social auth buttons + "Skip" link
 * - Completion: "Create Task" button
 * 
 * The buttons are positioned at the bottom and stay fixed while screens slide.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Animated, Easing } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useUI } from '@/store/hooks';
import { useAppDispatch } from '@/store';
import { loginUser, registerUser } from '@/store/slices/auth/authSlice';

// storage key for tracking onboarding completion status
// this key matches the one used in _layout.tsx for checking onboarding status
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

// define the onboarding screens in order
const ONBOARDING_SCREENS = ['welcome', 'reminders', 'signup', 'completion'] as const;
type OnboardingScreen = typeof ONBOARDING_SCREENS[number];

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

export function OnboardingActions() {
  const router = useRouter();
  const segments = useSegments();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch(); // get dispatch function to call Redux actions
  
  // get UI state and actions from Redux UI slice
  // showEmailAuth controls whether email inputs are visible
  // emailAuthEmail, emailAuthPassword, emailAuthFirstName, emailAuthLastName store the input values
  const { 
    openModal,
    onboarding: { showEmailAuth, emailAuthEmail, emailAuthPassword, emailAuthFirstName, emailAuthLastName },
    toggleEmailAuth,
  } = useUI();
  
  const [permissionRequested, setPermissionRequested] = useState(false);
  
  // state to prevent multiple button presses (spam protection)
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [socialAuthInProgress, setSocialAuthInProgress] = useState<string | null>(null);
  const [emailAuthInProgress, setEmailAuthInProgress] = useState(false); // track if email auth is in progress
  
  // determine current screen from route segments
  const currentScreen = segments[segments.length - 1] as OnboardingScreen;
  const currentStep = ONBOARDING_SCREENS.indexOf(currentScreen);
  const activeScreen = currentStep >= 0 ? currentScreen : 'welcome';
  
  // track previous screen to detect transitions from signup
  const prevScreenRef = useRef<OnboardingScreen>(activeScreen);
  
  // animated value for container slide-up animation (signup screen only)
  // starts at positive value (pushed down) and animates to 0 (slides up)
  const containerTranslateY = useRef(new Animated.Value(0)).current;
  
  // animated values for secondary elements (not primary buttons)
  // these animate when the screen changes
  const secondaryLinkOpacity = useRef(new Animated.Value(0)).current;
  const secondaryLinkScale = useRef(new Animated.Value(0.8)).current;
  const socialButtonsOpacity = useRef(new Animated.Value(0)).current;
  const socialButtonsScale = useRef(new Animated.Value(0.8)).current;
  const facebookButtonOpacity = useRef(new Animated.Value(0)).current;
  const facebookButtonScale = useRef(new Animated.Value(0.8)).current;
  const googleButtonOpacity = useRef(new Animated.Value(0)).current;
  const googleButtonScale = useRef(new Animated.Value(0.8)).current;
  const appleButtonOpacity = useRef(new Animated.Value(0)).current;
  const appleButtonScale = useRef(new Animated.Value(0.8)).current;
  
  // reset button press states when screen changes
  // this ensures the state doesn't persist when navigating between screens
  useEffect(() => {
    setPermissionRequested(false);
    setIsButtonPressed(false);
    setSocialAuthInProgress(null);
    setEmailAuthInProgress(false);
  }, [activeScreen]);
  
  // animate secondary elements when screen changes
  // primary buttons are NOT animated
  useEffect(() => {
    // reset animation values when screen changes
    secondaryLinkOpacity.setValue(0);
    secondaryLinkScale.setValue(0.8);
    socialButtonsOpacity.setValue(0);
    socialButtonsScale.setValue(0.8);
    facebookButtonOpacity.setValue(0);
    facebookButtonScale.setValue(0.8);
    googleButtonOpacity.setValue(0);
    googleButtonScale.setValue(0.8);
    appleButtonOpacity.setValue(0);
    appleButtonScale.setValue(0.8);
    
    // check if transitioning FROM signup to another screen
    const wasOnSignup = prevScreenRef.current === 'signup';
    const isNowOnSignup = activeScreen === 'signup';
    
    // animate based on current screen
    if (activeScreen === 'welcome') {
      // if transitioning from signup, slide container down first
      if (wasOnSignup && !isNowOnSignup) {
        // slide container down
        Animated.timing(containerTranslateY, {
          toValue: 100,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          // after slide down completes, animate container back to 0 smoothly
          // and let the button fade in naturally (primary button doesn't animate)
          Animated.timing(containerTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
          
          // animate secondary link after a brief delay
          Animated.parallel([
            Animated.timing(secondaryLinkOpacity, {
              toValue: 1,
              duration: 400,
              delay: SEQUENTIAL_FADE_DELAY,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(secondaryLinkScale, {
              toValue: 1,
              duration: 400,
              delay: SEQUENTIAL_FADE_DELAY,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start();
        });
      } else {
        // reset container position for non-signup screens
        containerTranslateY.setValue(0);
        
        // animate secondary link (Sign Up) only
        Animated.parallel([
          Animated.timing(secondaryLinkOpacity, {
            toValue: 1,
            duration: 400,
            delay: SEQUENTIAL_FADE_DELAY,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(secondaryLinkScale, {
            toValue: 1,
            duration: 400,
            delay: SEQUENTIAL_FADE_DELAY,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else if (activeScreen === 'reminders') {
      // reset container position immediately (no animations for signup > reminder transition)
      containerTranslateY.setValue(0);
      
      // animate secondary link (Skip) only
      Animated.parallel([
        Animated.timing(secondaryLinkOpacity, {
          toValue: 1,
          duration: 400,
          delay: SEQUENTIAL_FADE_DELAY,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(secondaryLinkScale, {
          toValue: 1,
          duration: 400,
          delay: SEQUENTIAL_FADE_DELAY,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (activeScreen === 'signup') {
      // ensure secondary link starts invisible
      secondaryLinkOpacity.setValue(0);
      secondaryLinkScale.setValue(0.8);
      
      // first, slide container up to make room for social buttons
      // start from pushed down position (100px down) and slide to 0 (normal position)
      containerTranslateY.setValue(100);
      
      // slide container up, then start sequential button animations after it completes
      Animated.timing(containerTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // after container slide-up completes, start sequential button fade animations
        // Facebook button first (no additional delay since slide-up already happened)
        Animated.parallel([
          Animated.timing(facebookButtonOpacity, {
            toValue: 1,
            duration: 400,
            delay: SEQUENTIAL_FADE_DELAY,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(facebookButtonScale, {
            toValue: 1,
            duration: 400,
            delay: SEQUENTIAL_FADE_DELAY,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
        
        // Google button second
        Animated.parallel([
          Animated.timing(googleButtonOpacity, {
            toValue: 1,
            duration: 400,
            delay: SEQUENTIAL_FADE_DELAY * 2,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(googleButtonScale, {
            toValue: 1,
            duration: 400,
            delay: SEQUENTIAL_FADE_DELAY * 2,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
        
        // Apple button third (if iOS)
        if (Platform.OS === 'ios') {
          Animated.parallel([
            Animated.timing(appleButtonOpacity, {
              toValue: 1,
              duration: 400,
              delay: SEQUENTIAL_FADE_DELAY * 3,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(appleButtonScale, {
              toValue: 1,
              duration: 400,
              delay: SEQUENTIAL_FADE_DELAY * 3,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        // Skip link last (delay depends on number of social buttons)
        const skipDelay = Platform.OS === 'ios' ? SEQUENTIAL_FADE_DELAY * 4 : SEQUENTIAL_FADE_DELAY * 3;
        Animated.parallel([
          Animated.timing(secondaryLinkOpacity, {
            toValue: 1,
            duration: 400,
            delay: skipDelay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(secondaryLinkScale, {
            toValue: 1,
            duration: 400,
            delay: skipDelay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // completion screen - reset container position immediately (no animations)
      // primary button doesn't animate, so no need for delays
      containerTranslateY.setValue(0);
    }
    
    // update previous screen reference for next transition
    prevScreenRef.current = activeScreen;
  }, [
    activeScreen,
    containerTranslateY,
    secondaryLinkOpacity,
    secondaryLinkScale,
    facebookButtonOpacity,
    facebookButtonScale,
    googleButtonOpacity,
    googleButtonScale,
    appleButtonOpacity,
    appleButtonScale,
  ]);
  
  const styles = createStyles(themeColors, typography, insets);
  
  /**
   * Handle "Get Started" button press (Welcome screen)
   * Navigates to the next screen in onboarding flow (Reminders screen)
   */
  const handleGetStarted = () => {
    if (isButtonPressed) return; // prevent spam clicks
    setIsButtonPressed(true);
    router.push('/(onboarding)/reminders');
  };
  
  /**
   * Handle "Sign Up" link press (Welcome screen)
   * Navigates directly to sign-up/login screen (skips reminders)
   */
  const handleSignIn = () => {
    router.push('/(onboarding)/signup');
  };
  
  /**
   * Handle "Allow" button press (Reminders screen)
   * Requests notification permission (mock for now)
   */
  const handleAllow = async () => {
    if (isButtonPressed || permissionRequested) return; // prevent spam clicks
    setIsButtonPressed(true);
    try {
      setPermissionRequested(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Alert.alert(
        'Permission Granted',
        'You will receive notifications for your tasks',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/(onboarding)/signup');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to request permission:', error);
      Alert.alert('Error', 'Failed to request permission');
      setPermissionRequested(false);
      setIsButtonPressed(false); // reset on error
    }
  };
  
  /**
   * Handle "Skip" link press (Reminders/Signup screens)
   * Skips current step and goes to next screen
   * When skipping from signup, marks onboarding as complete since user has seen all screens
   */
  const handleSkip = async () => {
    if (activeScreen === 'reminders') {
      // skip reminders and go to signup screen
      router.push('/(onboarding)/signup');
    } else if (activeScreen === 'signup') {
      // user is skipping from signup screen - they've seen all onboarding screens
      // mark onboarding as complete so they don't see it again on app reload
      try {
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      } catch (error) {
        // if saving fails, still navigate - user has seen onboarding
        console.error('Failed to save onboarding completion:', error);
      }
      
      // navigate to main app
      router.replace('/(tabs)');
    }
  };
  
  /**
   * Handle social authentication (Signup screen)
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
   * Handle email/password authentication (Signup screen)
   * Tries to login first, then registers if user doesn't exist
   * This allows users to sign up with email and password
   */
  const handleEmailAuth = async () => {
    // prevent spam clicks - if any auth is in progress, don't allow another
    if (emailAuthInProgress || socialAuthInProgress) return;
    
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
    
    // validate that first name and last name are provided
    // these are required for registration
    if (!emailAuthFirstName || emailAuthFirstName.trim().length === 0) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }
    
    if (!emailAuthLastName || emailAuthLastName.trim().length === 0) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }
    
    setEmailAuthInProgress(true); // mark email auth as in progress
    
    try {
      // since this is the signup screen, we always register new users
      // registerUser is a Redux async thunk that creates a new user account
      // firstName and lastName are required and validated above
      const registerResult = await dispatch(registerUser({ 
        email: emailAuthEmail, 
        password: emailAuthPassword,
        firstName: emailAuthFirstName.trim(), // trim whitespace and use the provided first name
        lastName: emailAuthLastName.trim(), // trim whitespace and use the provided last name
        authProvider: 'email',
      }));
      
      // check if registration was successful
      if (registerUser.fulfilled.match(registerResult)) {
        // registration successful, navigate to completion screen
        router.push('/(onboarding)/completion');
      } else {
        // registration failed, show error
        // the error message comes from the Redux thunk
        const errorMessage = registerUser.rejected.match(registerResult) 
          ? registerResult.payload as string 
          : 'Failed to sign up. Please try again.';
        Alert.alert('Error', errorMessage);
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
   * Handle toggle email auth view
   * Shows or hides email/password inputs on signup screen
   */
  const handleToggleEmailAuth = () => {
    // toggle the showEmailAuth state in Redux
    // this will show/hide the email inputs in the signup screen
    toggleEmailAuth();
  };
  
  /**
   * Handle "Create Task" button press (Completion screen)
   * Marks onboarding as complete, then goes to main app and opens the create task modal
   */
  const handleCreateTask = async () => {
    if (isButtonPressed) return; // prevent spam clicks
    setIsButtonPressed(true);
    
    try {
      // mark onboarding as complete in AsyncStorage
      // this ensures that when the app is reloaded, it will skip onboarding
      // AsyncStorage is a simple key-value storage system for React Native
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      
      // open the create task modal via Redux UI state
      // this will be checked by the Today screen to open the modal
      openModal('createTask');
      
      // navigate to the home screen (today tab)
      // use replace to prevent going back to onboarding screens
      router.replace('/(tabs)/today');
    } catch (error) {
      // if saving fails, still navigate to main app
      // the user has completed onboarding, so we should let them continue
      console.error('Failed to save onboarding completion:', error);
      
      // still open modal and navigate even if save fails
      openModal('createTask');
      router.replace('/(tabs)/today');
    }
  };
  
  // render different buttons based on current screen
  const renderActions = () => {
    switch (activeScreen) {
      case 'welcome':
        return (
          <View style={styles.actions}>
            {/* Get Started Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetStarted}
              activeOpacity={0.8}
              disabled={isButtonPressed}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
            
            {/* Sign In Link */}
            {/* fades in and scales up (primary button is not animated) */}
            <Animated.View
              style={{
                opacity: secondaryLinkOpacity,
                transform: [{ scale: secondaryLinkScale }],
              }}
            >
              <TouchableOpacity
                style={styles.secondaryLink}
                onPress={handleSignIn}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryLinkText}>
                  Already have an account? <Text style={styles.secondaryLinkHighlight}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        );
        
      case 'reminders':
        return (
          <View style={styles.actions}>
            {/* Allow Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAllow}
              activeOpacity={0.8}
              disabled={permissionRequested}
            >
              <Text style={styles.primaryButtonText}>
                {permissionRequested ? 'Requesting...' : 'Allow'}
              </Text>
            </TouchableOpacity>
            
            {/* Skip Link */}
            {/* fades in and scales up (primary button is not animated) */}
            <Animated.View
              style={{
                opacity: secondaryLinkOpacity,
                transform: [{ scale: secondaryLinkScale }],
              }}
            >
              <TouchableOpacity
                style={styles.secondaryLink}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryLinkText}>
                  Not ready? <Text style={styles.secondaryLinkHighlight}>Skip</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        );
        
      case 'signup':
        return (
          <View style={styles.actions}>
            {showEmailAuth ? (
              // Email Auth View - show email/password inputs and sign up button
              <>
                {/* Register Button */}
                {/* primary button for email authentication */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEmailAuth}
                  activeOpacity={0.8}
                  disabled={emailAuthInProgress || !!socialAuthInProgress}
                >
                  <Text style={styles.primaryButtonText}>
                    {emailAuthInProgress ? 'Registering...' : 'Register'}
                  </Text>
                </TouchableOpacity>
                
                {/* Back to Social Auth Link */}
                {/* allows user to go back to social auth options */}
                <Animated.View
                  style={{
                    opacity: secondaryLinkOpacity,
                    transform: [{ scale: secondaryLinkScale }],
                  }}
                >
                  <TouchableOpacity
                    style={styles.secondaryLink}
                    onPress={handleToggleEmailAuth}
                    activeOpacity={0.7}
                    disabled={emailAuthInProgress}
                  >
                    <Text style={styles.secondaryLinkText}>
                      Use social auth instead? <Text style={styles.secondaryLinkHighlight}>Back</Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              // Social Auth View - show social buttons and email toggle
              <>
                {/* Social Auth Buttons */}
                {/* social buttons fade in and scale up sequentially (primary buttons are not animated) */}
                <View style={styles.socialButtons}>
                  {/* Facebook Button */}
                  <Animated.View
                    style={{
                      opacity: facebookButtonOpacity,
                      transform: [{ scale: facebookButtonScale }],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialAuth('facebook')}
                      activeOpacity={0.8}
                      disabled={true}
                    >
                      <Ionicons name="logo-facebook" size={24} color={themeColors.text.primary()} />
                      <Text style={styles.socialButtonText}>Sign up with Facebook</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  {/* Google Button */}
                  <Animated.View
                    style={{
                      opacity: googleButtonOpacity,
                      transform: [{ scale: googleButtonScale }],
                    }}
                  >
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleSocialAuth('google')}
                      activeOpacity={0.8}
                      disabled={true}
                    >
                      <Ionicons name="logo-google" size={24} color={themeColors.text.primary()} />
                      <Text style={styles.socialButtonText}>Sign up with Google</Text>
                    </TouchableOpacity>
                  </Animated.View>
                  
                  {/* Apple Button (iOS only) */}
                  {Platform.OS === 'ios' && (
                    <Animated.View
                      style={{
                        opacity: appleButtonOpacity,
                        transform: [{ scale: appleButtonScale }],
                      }}
                    >
                      <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => handleSocialAuth('apple')}
                        activeOpacity={0.8}
                        disabled={true}
                      >
                        <Ionicons name="logo-apple" size={24} color={themeColors.text.primary()} />
                        <Text style={styles.socialButtonText}>Sign up with Apple</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
                
                {/* Use Email Instead Link */}
                {/* allows user to switch to email/password authentication */}
                <Animated.View
                  style={{
                    opacity: secondaryLinkOpacity,
                    transform: [{ scale: secondaryLinkScale }],
                  }}
                >
                  <TouchableOpacity
                    style={styles.secondaryLink}
                    onPress={handleToggleEmailAuth}
                    activeOpacity={0.7}
                    disabled={!!socialAuthInProgress}
                  >
                    <Text style={styles.secondaryLinkText}>
                      Use email instead? <Text style={styles.secondaryLinkHighlight}>Sign up with Email</Text>
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}
          </View>
        );
        
      case 'completion':
        return (
          <View style={styles.actions}>
            {/* Create Task Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateTask}
              activeOpacity={0.8}
              disabled={isButtonPressed}
            >
              <Text style={styles.primaryButtonText}>Create Task</Text>
            </TouchableOpacity>
            
            {/* Invisible spacer to match secondary link spacing and sizing */}
            <View style={styles.secondaryLinkSpacer} />
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: containerTranslateY }],
        },
      ]}
    >
      {renderActions()}
    </Animated.View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) => StyleSheet.create({
  container: {
    // absolute positioning at the bottom to stay fixed while screens slide
    position: 'absolute',
    bottom: 0, // start from bottom edge
    left: 0,
    right: 0,
    paddingHorizontal: 24, // horizontal padding
    paddingTop: 24, // top padding for spacing
    paddingBottom: insets.bottom, // safe area bottom padding plus extra spacing
    backgroundColor: themeColors.background.elevated(), // elevated background for depth
    zIndex: 10, // ensure it's above other content
  },
  actions: {
    gap: 16, // spacing between primary button and secondary link
  },
  primaryButton: {
    // use interactive primary color for button background
    backgroundColor: themeColors.interactive.primary(),
    borderRadius: 28, // rounded rectangular button
    paddingVertical: 16, // vertical padding for button height
    paddingHorizontal: 32, // horizontal padding
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58, // minimum touch target size for accessibility
  },
  primaryButtonText: {
    // use getThemeColor to access text.inverse for contrasting text on button
    color: themeColors.interactive.quaternary(),
    // use typography system for fontFamily and fontWeight
    ...typography.getTextStyle('button-primary'),
 
  },
  secondaryLink: {
    paddingVertical: 12, // padding for touch target
    alignItems: 'center',
  },
  secondaryLinkSpacer: {
    // invisible spacer to maintain same spacing as secondary link
    // matches secondaryLink paddingVertical (12 * 2 = 24px total height)
    height: 24,
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
  socialButtons: {
    gap: 16, // spacing between social buttons
  },
  socialButton: {
    // semi-transparent background for social buttons
    backgroundColor: themeColors.withOpacity(themeColors.text.primary(), 0.1),
    borderRadius: 28, // rounded rectangular button
    paddingVertical: 16, // vertical padding
    paddingHorizontal: 24, // horizontal padding
    flexDirection: 'row', // horizontal layout for icon and text
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12, // spacing between icon and text
    
    minHeight: 56, // minimum touch target size
  },
  socialButtonText: {
    color: themeColors.text.primary(), // text color using theme color hook
    // use typography system for fontFamily
    ...typography.getTextStyle('button-secondary'),
    fontSize: 16, // override typography: standard social button text size
    fontWeight: '500', // override typography: medium weight for social buttons
  },
});
