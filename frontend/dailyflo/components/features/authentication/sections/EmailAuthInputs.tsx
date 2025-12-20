/**
 * Email Auth Inputs Component
 * 
 * A reusable, modular component for email/password authentication inputs.
 * Contains first name, last name, email, and password input fields.
 * 
 * This component is designed to be reusable across different screens and contexts.
 * It manages its own input refs and focus flow, and connects to Redux for state management.
 * 
 * Features:
 * - Keyboard avoidance (positioned above keyboard)
 * - Sequential focus flow: First Name → Last Name → Email → Password
 * - Auto-focus on first input when shown
 * - Tap outside to dismiss keyboard
 * - Matches button styling (no borders, 28px border radius, matching padding)
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableWithoutFeedback, 
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useUI } from '@/store/hooks';

/**
 * Props for EmailAuthInputs component
 */
export interface EmailAuthInputsProps {
  /**
   * Whether the inputs should be visible
   * When true, inputs fade in and first input is auto-focused
   */
  visible: boolean;
  
  /**
   * Optional callback when inputs become visible
   * Called after fade-in animation completes
   */
  onVisible?: () => void;
  
  /**
   * Optional container style
   * Allows parent to customize positioning or spacing
   */
  containerStyle?: any;
}

/**
 * Email Auth Inputs Component
 * 
 * Renders a container with four input fields:
 * - First Name
 * - Last Name
 * - Email
 * - Password
 * 
 * All inputs are connected to Redux state and can be accessed by parent components.
 * The component handles its own animations, focus management, and keyboard avoidance.
 */
export function EmailAuthInputs({ visible, onVisible, containerStyle }: EmailAuthInputsProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // get onboarding state and actions from Redux UI slice
  // these values are shared with OnboardingActions component
  const { 
    onboarding: { emailAuthEmail, emailAuthPassword, emailAuthFirstName, emailAuthLastName },
    setEmailAuthEmail,
    setEmailAuthPassword,
    setEmailAuthFirstName,
    setEmailAuthLastName,
  } = useUI();
  
  // refs for the text inputs to allow programmatic focus
  // these refs are used to control the focus flow between inputs
  const firstNameInputRef = useRef<TextInput>(null);
  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  
  // animated values for fade-in and scale animation
  // inputs start invisible and smaller, then animate to visible and full size
  const inputsOpacity = useRef(new Animated.Value(0)).current;
  const inputsScale = useRef(new Animated.Value(0.8)).current;
  
  /**
   * Animate inputs when visibility changes
   * When visible becomes true, fade in and scale up the inputs
   * When visible becomes false, fade out and scale down
   */
  useEffect(() => {
    if (visible) {
      // fade in inputs when they become visible
      Animated.parallel([
        Animated.timing(inputsOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(inputsScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // focus first name input after animation completes
        // this makes it easier for users to start typing immediately
        firstNameInputRef.current?.focus();
        
        // call optional onVisible callback
        onVisible?.();
      });
    } else {
      // fade out inputs when hiding them
      Animated.parallel([
        Animated.timing(inputsOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(inputsScale, {
          toValue: 0.8,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, inputsOpacity, inputsScale, onVisible]);
  
  /**
   * Handle tap outside inputs to dismiss keyboard
   * This allows users to tap anywhere on the container to close the keyboard
   */
  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };
  
  const styles = createStyles(themeColors, typography);
  
  return (
    <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
      <Animated.View
        style={[
          styles.container,
          containerStyle,
          {
            opacity: inputsOpacity,
            transform: [{ scale: inputsScale }],
          },
        ]}
      >
          {/* First Name Input */}
          {/* text input for user's first name */}
          {/* value and onChangeText are connected to Redux state so parent components can access them */}
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
          {/* value and onChangeText are connected to Redux state so parent components can access them */}
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
          {/* value and onChangeText are connected to Redux state so parent components can access them */}
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
          {/* value and onChangeText are connected to Redux state so parent components can access them */}
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
              // when user presses "done" on password input, keyboard dismisses
              // actual submission is handled by parent component (e.g., Register button)
              Keyboard.dismiss();
            }}
          />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

/**
 * Create styles for the component
 * Uses theme colors and typography system for consistent design
 */
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  container: {
    width: '100%',
    gap: 16, // spacing between all inputs (first name, last name, email, password)
    // container for all 4 inputs
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

