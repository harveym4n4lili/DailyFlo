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

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { useFadeZoomAnimation } from '@/hooks';

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
  
  // use shared fade zoom animation hook for Facebook button (first button with delay)
  const { opacityValue: facebookButtonOpacity, scaleValue: facebookButtonScale } = useFadeZoomAnimation({
    enabled: animate, // use animate prop to enable/disable animations
    delay: SEQUENTIAL_FADE_DELAY, // delay - animates first after initial delay
    dependencies: [animate], // trigger animation when animate prop changes
  });
  
  // use shared fade zoom animation hook for Google button (second button with longer delay)
  const { opacityValue: googleButtonOpacity, scaleValue: googleButtonScale } = useFadeZoomAnimation({
    enabled: animate, // use animate prop to enable/disable animations
    delay: SEQUENTIAL_FADE_DELAY * 2, // longer delay - animates after Facebook button
    dependencies: [animate], // trigger animation when animate prop changes
  });
  
  // use shared fade zoom animation hook for Apple button (third button with longest delay, iOS only)
  const { opacityValue: appleButtonOpacity, scaleValue: appleButtonScale } = useFadeZoomAnimation({
    enabled: animate, // use animate prop to enable/disable animations
    delay: SEQUENTIAL_FADE_DELAY * 3, // longest delay - animates after Google button
    dependencies: [animate], // trigger animation when animate prop changes
  });
  
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
          style={[styles.socialButton, styles.socialButtonPadding]}
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
          style={[styles.socialButton, styles.socialButtonPadding]}
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
            style={[styles.socialButton, styles.socialButtonPadding]}
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
  // --- LAYOUT STYLES ---
  socialButtons: {
    gap: 16, // spacing between social buttons
  },
  socialButton: {
    backgroundColor: themeColors.withOpacity(themeColors.text.primary(), 0.1),
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 56,
  },

  // --- PADDING STYLES ---
  socialButtonPadding: {
    paddingVertical: Paddings.buttonVertical,
    paddingHorizontal: Paddings.screen,
  },

  // --- TYPOGRAPHY STYLES ---
  socialButtonText: {
    ...typography.getTextStyle('button-secondary'),
    color: themeColors.text.primary(),
    fontSize: 16,
  },
});

