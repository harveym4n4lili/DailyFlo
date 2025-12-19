/**
 * Sign-up/Login Screen
 * 
 * This screen presents authentication options to users.
 * Users can sign up or log in using email/password or social providers (Facebook, Google, Apple).
 * They can also skip authentication and use the app without an account.
 * 
 * Flow:
 * 1. User sees social auth options (default view)
 * 2. User can toggle to email/password view
 * 3. User enters email/password → authentication → goes to completion screen
 * 4. User taps "Skip" → goes to main app without authentication
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TextInput, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useUI } from '@/store/hooks';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

export default function SignupScreen() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // get onboarding state and actions from Redux UI slice
  // showEmailAuth controls whether email/password inputs are visible
  // emailAuthEmail, emailAuthPassword, emailAuthFirstName, emailAuthLastName store the input values (shared with OnboardingActions)
  const { 
    onboarding: { showEmailAuth, emailAuthEmail, emailAuthPassword, emailAuthFirstName, emailAuthLastName },
    setEmailAuthEmail,
    setEmailAuthPassword,
    setEmailAuthFirstName,
    setEmailAuthLastName,
    setShowEmailAuth,
  } = useUI();
  
  // refs for the text inputs to allow programmatic focus
  const firstNameInputRef = useRef<TextInput>(null);
  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  
  // animated values for sequential fade-in and scale (start invisible and smaller)
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineScale = useRef(new Animated.Value(0.8)).current;
  const emailInputsOpacity = useRef(new Animated.Value(0)).current;
  const emailInputsScale = useRef(new Animated.Value(0.8)).current;
  
  /**
   * Reset email auth view when screen comes into focus
   * This ensures that when user navigates back to signup screen, they see social auth options again
   * useFocusEffect runs when the screen comes into focus (including when navigating back)
   */
  useFocusEffect(
    React.useCallback(() => {
      // reset email auth view to show social auth options by default
      // this ensures users see social auth when they navigate back to this screen
      setShowEmailAuth(false);
      
      // also clear all input fields when resetting
      setEmailAuthEmail('');
      setEmailAuthPassword('');
      setEmailAuthFirstName('');
      setEmailAuthLastName('');
    }, [setShowEmailAuth, setEmailAuthEmail, setEmailAuthPassword, setEmailAuthFirstName, setEmailAuthLastName])
  );
  
  // animate elements sequentially on mount (top to bottom)
  useEffect(() => {
    // animate headline first (no delay) - fade in and scale up simultaneously
    Animated.parallel([
      Animated.timing(headlineOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(headlineScale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headlineOpacity, headlineScale]);
  
  // animate email inputs when showEmailAuth changes
  // when user toggles to email view, fade in the email/password inputs
  useEffect(() => {
    if (showEmailAuth) {
      // fade in email inputs when they become visible
      Animated.parallel([
        Animated.timing(emailInputsOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(emailInputsScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // focus first name input after animation completes
        // this makes it easier for users to start typing immediately
        firstNameInputRef.current?.focus();
      });
    } else {
      // fade out email inputs when hiding them
      Animated.parallel([
        Animated.timing(emailInputsOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(emailInputsScale, {
          toValue: 0.8,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
      
    }
  }, [showEmailAuth, emailInputsOpacity, emailInputsScale]);
  
  const styles = createStyles(themeColors, typography, insets);
  
  /**
   * Handle tap outside inputs to dismiss keyboard
   * This allows users to tap anywhere on the screen to close the keyboard
   */
  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
      keyboardVerticalOffset={0}
    >
      <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
        <View style={styles.container}>
          {/* Main Content */}
          {/* navigation and buttons are handled globally in the layout */}
          <View style={styles.content}>
          {/* Headline */}
          {/* fades in and scales up first (top element) */}
          <Animated.Text style={[
            styles.headline,
            {
              opacity: headlineOpacity,
              transform: [{ scale: headlineScale }],
            },
          ]}>
            Lets get you in...
          </Animated.Text>
          
          {/* Email/Password Inputs Container */}
          {/* shown when user toggles to email auth view */}
          {/* contains first name, last name, email, and password inputs */}
          {/* positioned above keyboard when keyboard is visible */}
          {showEmailAuth && (
            <Animated.View
              style={[
                styles.emailInputsContainer,
                {
                  opacity: emailInputsOpacity,
                  transform: [{ scale: emailInputsScale }],
                },
              ]}
            >
            {/* First Name Input */}
            {/* text input for user's first name */}
            {/* value and onChangeText are connected to Redux state so OnboardingActions can access them */}
            <TextInput
              ref={firstNameInputRef}
              style={styles.textInput}
              placeholder="First Name"
              placeholderTextColor={themeColors.text.secondary()}
              value={emailAuthFirstName}
              onChangeText={setEmailAuthFirstName}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="givenName"
              returnKeyType="next"
              onSubmitEditing={() => {
                // when user presses "next" on first name input, focus last name input
                lastNameInputRef.current?.focus();
              }}
            />
            
            {/* Last Name Input */}
            {/* text input for user's last name */}
            {/* value and onChangeText are connected to Redux state so OnboardingActions can access them */}
            <TextInput
              ref={lastNameInputRef}
              style={styles.textInput}
              placeholder="Last Name"
              placeholderTextColor={themeColors.text.secondary()}
              value={emailAuthLastName}
              onChangeText={setEmailAuthLastName}
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="familyName"
              returnKeyType="next"
              onSubmitEditing={() => {
                // when user presses "next" on last name input, focus email input
                emailInputRef.current?.focus();
              }}
            />
            
            {/* Email Input */}
            {/* text input for user's email address */}
            {/* value and onChangeText are connected to Redux state so OnboardingActions can access them */}
            <TextInput
              ref={emailInputRef}
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor={themeColors.text.secondary()}
              value={emailAuthEmail}
              onChangeText={setEmailAuthEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => {
                // when user presses "next" on email input, focus password input
                passwordInputRef.current?.focus();
              }}
            />
            
            {/* Password Input */}
            {/* text input for user's password (hidden text) */}
            {/* value and onChangeText are connected to Redux state so OnboardingActions can access them */}
            <TextInput
              ref={passwordInputRef}
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor={themeColors.text.secondary()}
              value={emailAuthPassword}
              onChangeText={setEmailAuthPassword}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={() => {
                // when user presses "done" on password input, trigger email auth
                // this is handled by OnboardingActions component via "Sign up with Email" button
              }}
            />
            </Animated.View>
          )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) => StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: themeColors.background.primary(),
    paddingHorizontal: 24,
    // padding top accounts for global navigation component (60px = 40px height + 20px spacing)
    paddingTop: insets.top,
    // padding bottom accounts for global actions component (100px = button height + spacing)
    // when keyboard is visible, KeyboardAvoidingView will adjust this automatically
    paddingBottom: insets.bottom + 100,
    justifyContent: 'center', // center content vertically
  },
  content: {
    // content takes up available space and centers vertically
    justifyContent: 'center',
    alignItems: 'center', // center content horizontally
    gap: 32, // spacing between elements
  },
  headline: {
    // use typography heading-1 style for headline
    color: themeColors.text.primary(), // text color using theme color hook
    textAlign: 'center',
    marginBottom: 48,
    // use typography system for fontFamily, fontWeight, lineHeight
    ...typography.getTextStyle('heading-1'),
    fontSize: 32, // override typography: large headline size
  },
  emailInputsContainer: {
    width: '100%',
    gap: 16, // spacing between all inputs (first name, last name, email, password)
    marginTop: 24,
    // container for all 4 inputs (first name, last name, email, password)
    // KeyboardAvoidingView will position this above the keyboard when keyboard is visible
  },
  textInput: {
    // styled text input matching the app's design system
    // matches button styling: no borders, same border radius, same vertical padding
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 28, // matches button border radius for consistent design
    paddingVertical: 16, // matches primary button vertical padding for consistency
    paddingHorizontal: 24, // horizontal padding for comfortable text spacing
    // use typography system for fontFamily and fontSize
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(),
    borderWidth: 0, // no borders as requested
    minHeight: 58, // matches primary button minHeight for consistent sizing
  },
});
