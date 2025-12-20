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
import { SocialAuthActions } from '@/components/features/authentication/sections/SocialAuthActions';

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
  
  // get UI state and actions from Redux UI slice
  // openModal is a Redux action that opens modals (we use it to open the email auth modal)
  const { 
    openModal,
  } = useUI();
  
  const [permissionRequested, setPermissionRequested] = useState(false);
  
  // state to prevent multiple button presses (spam protection)
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [socialAuthInProgress, setSocialAuthInProgress] = useState<string | null>(null);
  
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
  
  // reset button press states when screen changes
  // this ensures the state doesn't persist when navigating between screens
  useEffect(() => {
    setPermissionRequested(false);
    setIsButtonPressed(false);
    setSocialAuthInProgress(null);
  }, [activeScreen]);
  
  // track when signup screen becomes active to trigger social auth animations
  // social auth buttons handle their own animations, but we need to reset them when screen changes
  const [shouldAnimateSocialAuth, setShouldAnimateSocialAuth] = useState(false);
  
  useEffect(() => {
    if (activeScreen === 'signup') {
      // trigger animation when signup screen becomes active
      setShouldAnimateSocialAuth(true);
    } else {
      // reset animation trigger when leaving signup screen
      setShouldAnimateSocialAuth(false);
    }
  }, [activeScreen]);
  
  // animate secondary elements when screen changes
  // primary buttons are NOT animated
  // social auth buttons handle their own animations in SocialAuthActions component
  useEffect(() => {
    // reset animation values when screen changes
    secondaryLinkOpacity.setValue(0);
    secondaryLinkScale.setValue(0.8);
    
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
      
      // slide container up, then animate email link after it completes
      // social auth buttons handle their own animations in SocialAuthActions component
      Animated.timing(containerTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        // after container slide-up completes, animate email link
        // delay depends on number of social buttons (they animate in SocialAuthActions)
        const emailLinkDelay = Platform.OS === 'ios' ? SEQUENTIAL_FADE_DELAY * 4 : SEQUENTIAL_FADE_DELAY * 3;
        Animated.parallel([
          Animated.timing(secondaryLinkOpacity, {
            toValue: 1,
            duration: 400,
            delay: emailLinkDelay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(secondaryLinkScale, {
            toValue: 1,
            duration: 400,
            delay: emailLinkDelay,
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
   * Handle "Sign in" link press (Welcome screen)
   * Opens the email sign in modal
   */
  const handleSignIn = () => {
    // open the email sign in modal via Redux state
    // this will show a draggable modal for signing in
    openModal('emailAuthSignIn');
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
   * Handle open email auth modal
   * Opens the full-screen email authentication modal
   */
  const handleOpenEmailAuth = () => {
    // open the email auth modal via Redux state
    // this will show a full-screen modal with the email auth form
    openModal('emailAuth');
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
                  Already have an account? <Text style={styles.secondaryLinkHighlight}>Sign in</Text>
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
            {/* Social Auth Buttons */}
            {/* social buttons fade in and scale up sequentially (handled by SocialAuthActions component) */}
            <SocialAuthActions
              variant="register"
              onSocialAuth={handleSocialAuth}
              disabled={true}
              animate={shouldAnimateSocialAuth}
            />
            
            {/* Use Email Instead Link */}
            {/* opens full-screen email auth modal when clicked */}
            <Animated.View
              style={{
                opacity: secondaryLinkOpacity,
                transform: [{ scale: secondaryLinkScale }],
              }}
            >
              <TouchableOpacity
                style={styles.secondaryLink}
                onPress={handleOpenEmailAuth}
                activeOpacity={0.7}
                disabled={!!socialAuthInProgress}
              >
                <Text style={styles.secondaryLinkText}>
                  Use email instead? <Text style={styles.secondaryLinkHighlight}>Sign up with Email</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
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
});
