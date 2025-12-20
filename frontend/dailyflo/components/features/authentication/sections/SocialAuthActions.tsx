/**
 * Social Auth Actions Component
 * 
 * A reusable component for social authentication buttons (Facebook, Google, Apple).
 * Can be used for both sign in and registration flows.
 * 
 * Features:
 * - Sequential fade-in animations for each button
 * - Support for signin and register variants
 * - Platform-specific Apple button (iOS only)
 * - Disabled state (social auth not implemented yet)
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

// animation configuration - adjust delay between sequential fade-ins (in milliseconds)
const SEQUENTIAL_FADE_DELAY = 200; // time between each element fading in

/**
 * Props for SocialAuthActions component
 */
export interface SocialAuthActionsProps {
  /**
   * Variant of the social auth buttons
   * - 'register': Shows "Sign up with [Provider]" text
   * - 'signin': Shows "Sign in with [Provider]" text
   * @default 'register'
   */
  variant?: 'register' | 'signin';
  
  /**
   * Callback when a social auth button is pressed
   * @param provider - The social provider (facebook, google, or apple)
   */
  onSocialAuth?: (provider: 'facebook' | 'google' | 'apple') => void;
  
  /**
   * Whether social auth is in progress
   * When true, buttons are disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether to trigger animations
   * When true, buttons will animate in sequentially
   * @default true
   */
  animate?: boolean;
}

/**
 * Social Auth Actions Component
 * 
 * Renders social authentication buttons (Facebook, Google, Apple) with sequential animations.
 * Button text changes based on variant (Sign up vs Sign in).
 */
export function SocialAuthActions({ 
  variant = 'register',
  onSocialAuth,
  disabled = true,
  animate = true,
}: SocialAuthActionsProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();
  
  // determine if this is sign in variant (changes button text)
  const isSignIn = variant === 'signin';
  
  // animated values for sequential fade-in and scale (start invisible and smaller)
  // these animations trigger when the component mounts or animate prop changes
  const facebookButtonOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const facebookButtonScale = useRef(new Animated.Value(animate ? 0.8 : 1)).current;
  const googleButtonOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const googleButtonScale = useRef(new Animated.Value(animate ? 0.8 : 1)).current;
  const appleButtonOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const appleButtonScale = useRef(new Animated.Value(animate ? 0.8 : 1)).current;
  
  // animate buttons sequentially when animate prop becomes true
  // buttons fade in and scale up one after another (Facebook → Google → Apple)
  // when animate is false, buttons are immediately visible (no animation)
  useEffect(() => {
    if (!animate) {
      // if animations are disabled, set all buttons to visible immediately
      facebookButtonOpacity.setValue(1);
      facebookButtonScale.setValue(1);
      googleButtonOpacity.setValue(1);
      googleButtonScale.setValue(1);
      appleButtonOpacity.setValue(1);
      appleButtonScale.setValue(1);
      return;
    }
    
    // reset animation values when animations start
    // start all buttons invisible and slightly smaller
    facebookButtonOpacity.setValue(0);
    facebookButtonScale.setValue(0.8);
    googleButtonOpacity.setValue(0);
    googleButtonScale.setValue(0.8);
    appleButtonOpacity.setValue(0);
    appleButtonScale.setValue(0.8);
    
    // Facebook button first (no delay) - fade in and scale up simultaneously
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
    
    // Google button second (after delay) - fade in and scale up simultaneously
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
    
    // Apple button third (if iOS) - fade in and scale up simultaneously
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
  }, [animate, facebookButtonOpacity, facebookButtonScale, googleButtonOpacity, googleButtonScale, appleButtonOpacity, appleButtonScale]);
  
  /**
   * Handle social authentication button press
   * Calls the onSocialAuth callback with the provider name
   */
  const handleSocialAuth = (provider: 'facebook' | 'google' | 'apple') => {
    if (disabled || !onSocialAuth) return;
    onSocialAuth(provider);
  };
  
  // get button text based on variant
  // register variant: "Sign up with [Provider]"
  // signin variant: "Sign in with [Provider]"
  const getButtonText = (provider: 'Facebook' | 'Google' | 'Apple') => {
    return isSignIn ? `Sign in with ${provider}` : `Sign up with ${provider}`;
  };
  
  const styles = createStyles(themeColors, typography);
  
  return (
    <View style={styles.socialButtons}>
      {/* Facebook Button */}
      {/* fades in and scales up first */}
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
          disabled={disabled}
        >
          <Ionicons name="logo-facebook" size={24} color={themeColors.text.primary()} />
          <Text style={styles.socialButtonText}>{getButtonText('Facebook')}</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Google Button */}
      {/* fades in and scales up second */}
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
          disabled={disabled}
        >
          <Ionicons name="logo-google" size={24} color={themeColors.text.primary()} />
          <Text style={styles.socialButtonText}>{getButtonText('Google')}</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Apple Button (iOS only) */}
      {/* fades in and scales up third (if iOS) */}
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
            disabled={disabled}
          >
            <Ionicons name="logo-apple" size={24} color={themeColors.text.primary()} />
            <Text style={styles.socialButtonText}>{getButtonText('Apple')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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

