/**
 * Email auth Section Component
 * 
 * A reusable, modular component for email/password authentication inputs.
 * Contains first name, last name, email, and password input fields.
 * 
 * This component is designed to be reusable across different screens and contexts.
 * It manages its own input refs and focus flow, and connects to Redux for state management.
 * 
 * Features:
 * - Sequential focus flow: First Name → Last Name → Email → Password
 * - Auto-focus on first input when shown
 * - Matches button styling (no borders, 28px border radius, matching padding)
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { useUI } from '@/store/hooks';

/**
 * Props for Email auth Section component
 */
export interface EmailAuthSectionProps {
  /**
   * Optional container style
   * Allows parent to customize positioning or spacing
   */
  containerStyle?: any;
  
  /**
   * Optional callback when component mounts
   * Called after component is ready (useful for auto-focus)
   */
  onReady?: () => void;
  
  /**
   * Variant of the form - 'register' shows first/last name fields, 'signin' only shows email/password
   * Defaults to 'register' for backward compatibility
   */
  variant?: 'register' | 'signin';
}

/**
 * Email auth Section Component
 * 
 * Renders a container with input fields based on variant:
 * - Register variant: First Name, Last Name, Email, Password
 * - Sign In variant: Email, Password only
 * 
 * All inputs are connected to Redux state and can be accessed by parent components.
 * The component handles its own focus management.
 */
export function EmailAuthSection({ containerStyle, onReady, variant = 'register' }: EmailAuthSectionProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // determine if this is sign in variant (no name fields)
  const isSignIn = variant === 'signin';
  
  // get onboarding state and actions from Redux UI slice
  // these values are shared with OnboardingActions component
  // Redux is a state management library that stores app-wide state
  // useUI is a custom hook that gives us access to Redux state and actions
  const { 
    onboarding: { emailAuthEmail, emailAuthPassword, emailAuthFirstName, emailAuthLastName },
    setEmailAuthEmail,
    setEmailAuthPassword,
    setEmailAuthFirstName,
    setEmailAuthLastName,
  } = useUI();
  
  // refs for the text inputs to allow programmatic focus
  // these refs are used to control the focus flow between inputs
  // useRef creates a reference that persists across re-renders
  const firstNameInputRef = useRef<TextInput>(null);
  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  
  /**
   * Auto-focus first input when component mounts
   * This makes it easier for users to start typing immediately
   * For sign in variant, focus email field. For register, focus first name field.
   */
  useEffect(() => {
    // focus first input when component is ready
    // setTimeout ensures the input is fully rendered before focusing
    const timer = setTimeout(() => {
      if (isSignIn) {
        // sign in variant: focus email field first
        emailInputRef.current?.focus();
      } else {
        // register variant: focus first name field first
        firstNameInputRef.current?.focus();
      }
      onReady?.();
    }, 100);
    
    // cleanup: clear timer if component unmounts before timer fires
    return () => clearTimeout(timer);
  }, [onReady, isSignIn]);
  
  const styles = createStyles(themeColors, typography);
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Name Inputs Row - only shown for register variant */}
      {/* first name and last name inputs side by side */}
      {!isSignIn && (
        <View style={styles.nameRow}>
          {/* First Name Input */}
          {/* text input for user's first name */}
          {/* value and onChangeText are connected to Redux state so parent components can access them */}
          {/* onChangeText updates Redux state, which triggers re-renders in components that use this state */}
          <TextInput
            ref={firstNameInputRef}
            style={[styles.textInput, styles.nameInput]}
            placeholder="First Name"
            placeholderTextColor={themeColors.text.secondary()}
            value={emailAuthFirstName}
            onChangeText={setEmailAuthFirstName}
            keyboardType="default"
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="givenName"
            returnKeyType="next"
            onSubmitEditing={() => {
              // when user presses "next" on first name input, focus last name input
              // this creates a smooth flow between inputs
              lastNameInputRef.current?.focus();
            }}
          />
          
          {/* Last Name Input */}
          {/* text input for user's last name */}
          {/* value and onChangeText are connected to Redux state so parent components can access them */}
          <TextInput
            ref={lastNameInputRef}
            style={[styles.textInput, styles.nameInput]}
            placeholder="Last Name"
            placeholderTextColor={themeColors.text.secondary()}
            value={emailAuthLastName}
            onChangeText={setEmailAuthLastName}
            keyboardType="default"
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="familyName"
            returnKeyType="next"
            onSubmitEditing={() => {
              // when user presses "next" on last name input, focus email input
              emailInputRef.current?.focus();
            }}
          />
        </View>
      )}
      
      {/* Email Input */}
      {/* text input for user's email address */}
      {/* value and onChangeText are connected to Redux state so parent components can access them */}
      {/* using email-address keyboard type for better email input experience */}
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
      {/* using default keyboard type for password input */}
      {/* secureTextEntry hides the text as user types */}
      <TextInput
        ref={passwordInputRef}
        style={styles.textInput}
        placeholder="Password"
        placeholderTextColor={themeColors.text.secondary()}
        value={emailAuthPassword}
        onChangeText={setEmailAuthPassword}
        keyboardType="default"
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
    </View>
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
    gap: 16, // spacing between input rows (name row, email, password)
    // container for all inputs
  },
  nameRow: {
    // row container for first name and last name inputs side by side
    flexDirection: 'row',
    gap: 12, // spacing between first name and last name inputs
    width: '100%',
  },
  textInput: {
    // styled text input matching the app's design system
    // matches button styling: no borders, same border radius, same vertical padding
    backgroundColor: themeColors.background.elevated(),
    borderRadius: 28, // matches button border radius for consistent design
    paddingVertical: Paddings.buttonVertical,
    paddingHorizontal: Paddings.screen,
    // use typography system for fontFamily and fontSize
    ...typography.getTextStyle('body-large'),
    color: themeColors.text.primary(),
    borderWidth: 0, // no borders as requested
    minHeight: 58, // matches primary button minHeight for consistent sizing
  },
  nameInput: {
    // shared style for first name and last name inputs
    // each input takes up equal space in the row
    flex: 1,
  },
});
