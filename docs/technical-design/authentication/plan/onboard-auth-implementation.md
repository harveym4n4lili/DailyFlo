# Onboarding & Authentication UI Implementation Plan
## Overview
This document outlines the step-by-step plan for building the onboarding and authentication UI screens first, using mock data and local state management. Once all UI screens are complete and working with mock data, we'll connect them to the backend API in a separate integration phase.

### Current State
- **Onboarding Screens**: No onboarding screens exist
- **Authentication Screens**: No login/registration screens exist
- **Navigation Flow**: App goes directly to main tabs without authentication check
- **Redux Auth Slice**: Has mock data but no UI connected
- **UI Components**: Need to build all screens from scratch

### Target State (UI Phase)
- **Welcome Screen**: Initial onboarding entry point with "Get Started" button
- **Reminders Screen**: Permission request screen for notifications
- **Sign-up/Login Screen**: Social authentication options (Facebook, Google, Apple)
- **Completion Screen**: Success screen with "Create Task" button
- **Navigation Flow**: Complete onboarding flow with proper routing
- **Mock Data**: All screens work with mock authentication state
- **Data Flow**: UI → Local State/Redux Mock → Visual Feedback (no API calls yet)

### Key Concepts for First-Time Onboarding/Auth UI Builders
- **UI-First Development**: Build the interface first, connect to backend later
- **Mock Data**: Use fake data to test UI without needing backend
- **Local State**: Manage screen state with React useState hooks
- **Navigation**: Use Expo Router to navigate between screens
- **Component Structure**: Build reusable components for consistency
- **Visual Feedback**: Show loading states, errors, and success messages
- **Wireframe Matching**: Match designs exactly as shown in wireframes

---

## UI Architecture

### Screen Flow Diagram
```
App Launch
    ↓
Welcome Screen (Step 1 of 3)
    ├─ "Get Started" → Reminders Screen
    └─ "Already have an account? Sign In" → Sign-up/Login Screen
            ↓
Reminders Screen (Step 2 of 3)
    ├─ "Allow" → Request Permission → Sign-up/Login Screen
    └─ "Skip" → Sign-up/Login Screen
            ↓
Sign-up/Login Screen (Step 3 of 3)
    ├─ "Sign up with Facebook" → Mock Auth → Completion Screen
    ├─ "Sign up with Google" → Mock Auth → Completion Screen
    ├─ "Sign up with Apple" → Mock Auth → Completion Screen
    └─ "Skip" → Main App (without auth)
            ↓
Completion Screen (Final)
    └─ "Create Task" → Main App (Today Screen)
```

### Component Responsibilities
- **Welcome Screen**: First impression, entry point to onboarding
- **Reminders Screen**: Request notification permissions
- **Sign-up/Login Screen**: Social authentication options
- **Completion Screen**: Success confirmation and next steps
- **Onboarding Layout**: Handles navigation between onboarding screens
- **Navigation Logic**: Routes users based on onboarding completion status

---

## Implementation Steps

### Step 1: Set Up Onboarding Folder Structure
**Purpose**: Create the file structure for onboarding screens

**Why This First**: We need to organize our files before building components. This is like setting up folders before putting files in them.

**Files to Create**:
- `app/(onboarding)/_layout.tsx` - Layout wrapper for onboarding screens
- `app/(onboarding)/welcome.tsx` - Welcome/initial screen
- `app/(onboarding)/reminders.tsx` - Reminders/permissions screen
- `app/(onboarding)/signup.tsx` - Sign-up/login options screen
- `app/(onboarding)/completion.tsx` - Completion/success screen

**File Structure**:
```
app/
├── (onboarding)/
│   ├── _layout.tsx          # Onboarding navigation layout
│   ├── welcome.tsx          # Step 1: Welcome screen
│   ├── reminders.tsx        # Step 2: Reminders/permissions screen
│   ├── signup.tsx           # Step 3: Sign-up/login options screen
│   └── completion.tsx       # Final: Completion screen
└── (tabs)/                  # Main app screens (existing)
```

**Code Implementation**:
```typescript
/**
 * Onboarding Layout
 * 
 * This layout wraps all onboarding screens and handles navigation between them.
 * It uses Expo Router's Stack navigator for smooth transitions.
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide header for onboarding screens
        animation: 'slide_from_right', // Smooth slide animation between screens
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
  );
}
```

**Testing**:
- Verify folder structure is created
- Test that layout file compiles without errors
- Verify Stack navigation is set up correctly

---

### Step 2: Create Welcome Screen (Step 1 of 3)
**Purpose**: Build the initial welcome screen that users see first

**Why This Second**: This is the entry point to onboarding, so we build it first. It's also the simplest screen.

**Files to Create**:
- `app/(onboarding)/welcome.tsx`

**Wireframe Requirements**:
- App logo/name "Dailyflo" in large, bold white font
- Tagline: "Your day, simplified and in flow"
- "Get Started" button (white, rounded rectangular)
- "Already have an account? Sign In" link below button
- Three navigation dots at top (first dot highlighted)
- Dark theme (black background, white text)

**Code Implementation**:
```typescript
/**
 * Welcome Screen
 * 
 * This is the first screen users see when they open the app for the first time.
 * It introduces the app and provides entry points to either start onboarding
 * or sign in if they already have an account.
 * 
 * Flow:
 * 1. User sees welcome message
 * 2. User taps "Get Started" → goes to Reminders screen
 * 3. User taps "Sign In" → goes to Sign-up/Login screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function WelcomeScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  
  /**
   * Handle "Get Started" button press
   * Navigates to the next screen in onboarding flow (Reminders screen)
   */
  const handleGetStarted = () => {
    router.push('/(onboarding)/reminders');
  };
  
  /**
   * Handle "Sign In" link press
   * Navigates directly to sign-up/login screen (skips reminders)
   */
  const handleSignIn = () => {
    router.push('/(onboarding)/signup');
  };
  
  return (
    <View style={styles.container}>
      {/* Navigation Dots Indicator */}
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* App Logo/Name */}
        <Text style={styles.appName}>Dailyflo</Text>
        
        {/* Tagline */}
        <Text style={styles.tagline}>Your day, simplified and in flow</Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
        
        {/* Sign In Link */}
        <TouchableOpacity
          style={styles.signInLink}
          onPress={handleSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.signInLinkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Dark theme background (matching wireframe)
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white
  },
  dotActive: {
    backgroundColor: '#FFFFFF', // Solid white for active dot
    width: 24, // Wider for active dot
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text (matching wireframe)
    marginBottom: 16,
    textAlign: 'center',
    ...typography.heading1,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF', // White text
    textAlign: 'center',
    lineHeight: 24,
    ...typography.body,
  },
  actions: {
    gap: 16,
  },
  getStartedButton: {
    backgroundColor: '#FFFFFF', // White button background
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Touch target size
  },
  getStartedButtonText: {
    color: '#000000', // Black text on white button
    fontSize: 16,
    fontWeight: '600',
    ...typography.button,
  },
  signInLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signInLinkText: {
    color: '#FFFFFF', // White text
    fontSize: 14,
    ...typography.body,
  },
});
```

**Testing**:
- Test screen displays correctly with dark theme
- Test "Get Started" button navigates to reminders screen
- Test "Sign In" link navigates to signup screen
- Verify navigation dots show correctly (first dot active)
- Test button press feedback (activeOpacity)
- Verify text matches wireframe exactly

---

### Step 3: Create Reminders Screen (Step 2 of 3)
**Purpose**: Build the reminders/permissions request screen

**Why This Third**: This is the second step in the onboarding flow, so we build it after the welcome screen.

**Files to Create**:
- `app/(onboarding)/reminders.tsx`

**Wireframe Requirements**:
- Back arrow icon (←) in top-left
- Large outlined bell icon centered
- Headline: "Reminders, your way"
- Description: "Get alerts for tasks and deadlines - you're always in control."
- "Allow" button (white, rounded rectangular)
- "Not ready? Skip" link below button
- Three navigation dots (middle dot highlighted)
- Dark theme (black background, white text)

**Code Implementation**:
```typescript
/**
 * Reminders Screen
 * 
 * This screen requests notification permissions from the user.
 * It explains why permissions are needed and allows users to grant
 * or skip permission requests.
 * 
 * Flow:
 * 1. User sees reminder explanation
 * 2. User taps "Allow" → requests permission → goes to Sign-up screen
 * 3. User taps "Skip" → goes to Sign-up screen without requesting permission
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function RemindersScreen() {
  const router = useRouter();
  const [permissionRequested, setPermissionRequested] = useState(false);
  
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  
  /**
   * Handle back button press
   * Navigates back to welcome screen
   */
  const handleBack = () => {
    router.back();
  };
  
  /**
   * Handle "Allow" button press
   * Requests notification permission (mock for now, will connect to real API later)
   */
  const handleAllow = async () => {
    try {
      // TODO: Replace with real permission request when connecting to API
      // For now, just simulate the request
      setPermissionRequested(true);
      
      // Simulate permission request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock: Assume permission is granted
      // In real implementation, this will use expo-notifications
      Alert.alert(
        'Permission Granted',
        'You will receive notifications for your tasks',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to next screen
              router.push('/(onboarding)/signup');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to request permission:', error);
      Alert.alert('Error', 'Failed to request permission');
    }
  };
  
  /**
   * Handle "Skip" link press
   * Skips permission request and goes to next screen
   */
  const handleSkip = () => {
    router.push('/(onboarding)/signup');
  };
  
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Navigation Dots Indicator */}
      <View style={styles.dotsContainer}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Bell Icon */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name="notifications-outline" 
            size={80} 
            color="#FFFFFF" 
            style={styles.bellIcon}
          />
        </View>
        
        {/* Headline */}
        <Text style={styles.headline}>Reminders, your way</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          Get alerts for tasks and deadlines - you're always in control.
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Allow Button */}
        <TouchableOpacity
          style={styles.allowButton}
          onPress={handleAllow}
          activeOpacity={0.8}
          disabled={permissionRequested}
        >
          <Text style={styles.allowButtonText}>
            {permissionRequested ? 'Requesting...' : 'Allow'}
          </Text>
        </TouchableOpacity>
        
        {/* Skip Link */}
        <TouchableOpacity
          style={styles.skipLink}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipLinkText}>Not ready? Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Dark theme background
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    // Icon styling if needed
  },
  headline: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    ...typography.heading1,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
    ...typography.body,
  },
  actions: {
    gap: 16,
  },
  allowButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  allowButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    ...typography.button,
  },
  skipLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...typography.body,
  },
});
```

**Testing**:
- Test screen displays correctly
- Test back button navigates to welcome screen
- Test "Allow" button shows loading state
- Test "Skip" link navigates to signup screen
- Verify navigation dots show correctly (middle dot active)
- Test permission request flow (mock)
- Verify icon displays correctly

---

### Step 4: Create Sign-up/Login Screen (Step 3 of 3)
**Purpose**: Build the social authentication options screen

**Why This Fourth**: This is the third step in onboarding and handles authentication options.

**Files to Create**:
- `app/(onboarding)/signup.tsx`

**Wireframe Requirements**:
- Back arrow icon (←) in top-left
- Headline: "Lets get you in..."
- Three social auth buttons:
  - "Sign up with Facebook" (with Facebook 'f' logo)
  - "Sign up with Google" (with Google 'G' logo)
  - "Sign up with Apple" (with Apple logo)
- "Would you like to sign in later? Skip" link at bottom
- Three navigation dots (rightmost dot highlighted)
- Dark theme (black background, white text)

**Code Implementation**:
```typescript
/**
 * Sign-up/Login Screen
 * 
 * This screen presents social authentication options to users.
 * Users can sign up or log in using Facebook, Google, or Apple.
 * They can also skip authentication and use the app without an account.
 * 
 * Flow:
 * 1. User sees social auth options
 * 2. User taps a social provider → mock authentication → goes to completion screen
 * 3. User taps "Skip" → goes to main app without authentication
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '@/store';
import { socialAuth } from '@/store/slices/auth/authSlice';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function SignupScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authProvider, setAuthProvider] = useState<'facebook' | 'google' | 'apple' | null>(null);
  
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  
  /**
   * Handle back button press
   * Navigates back to reminders screen
   */
  const handleBack = () => {
    router.back();
  };
  
  /**
   * Handle social authentication
   * Mocks the authentication process (will connect to real API later)
   * 
   * @param provider - The social provider (facebook, google, or apple)
   */
  const handleSocialAuth = async (provider: 'facebook' | 'google' | 'apple') => {
    try {
      setIsAuthenticating(true);
      setAuthProvider(provider);
      
      // TODO: Replace with real social auth when connecting to API
      // For now, dispatch mock authentication action
      const result = await dispatch(socialAuth({
        provider,
        email: `user@${provider}.com`, // Mock email
        authProviderId: `mock_${provider}_id_${Date.now()}`,
        firstName: 'John',
        lastName: 'Doe',
      }));
      
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (socialAuth.fulfilled.match(result)) {
        // Authentication successful, go to completion screen
        router.push('/(onboarding)/completion');
      } else {
        // Authentication failed
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error(`Failed to authenticate with ${provider}:`, error);
      // Show error (will implement error handling UI later)
    } finally {
      setIsAuthenticating(false);
      setAuthProvider(null);
    }
  };
  
  /**
   * Handle "Skip" link press
   * Skips authentication and goes directly to main app
   */
  const handleSkip = () => {
    router.replace('/(tabs)');
  };
  
  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Navigation Dots Indicator */}
      <View style={styles.dotsContainer}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Headline */}
        <Text style={styles.headline}>Lets get you in...</Text>
        
        {/* Social Auth Buttons */}
        <View style={styles.socialButtons}>
          {/* Facebook Button */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              isAuthenticating && authProvider === 'facebook' && styles.socialButtonLoading
            ]}
            onPress={() => handleSocialAuth('facebook')}
            activeOpacity={0.8}
            disabled={isAuthenticating}
          >
            {isAuthenticating && authProvider === 'facebook' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>Sign up with Facebook</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Google Button */}
          <TouchableOpacity
            style={[
              styles.socialButton,
              isAuthenticating && authProvider === 'google' && styles.socialButtonLoading
            ]}
            onPress={() => handleSocialAuth('google')}
            activeOpacity={0.8}
            disabled={isAuthenticating}
          >
            {isAuthenticating && authProvider === 'google' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                <Text style={styles.socialButtonText}>Sign up with Google</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Apple Button (iOS only) */}
          {require('react-native').Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[
                styles.socialButton,
                isAuthenticating && authProvider === 'apple' && styles.socialButtonLoading
              ]}
              onPress={() => handleSocialAuth('apple')}
              activeOpacity={0.8}
              disabled={isAuthenticating}
            >
              {isAuthenticating && authProvider === 'apple' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                  <Text style={styles.socialButtonText}>Sign up with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Skip Link */}
      <TouchableOpacity
        style={styles.skipLink}
        onPress={handleSkip}
        activeOpacity={0.7}
        disabled={isAuthenticating}
      >
        <Text style={styles.skipLinkText}>Would you like to sign in later? Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  headline: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 48,
    ...typography.heading1,
  },
  socialButtons: {
    gap: 16,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 56,
  },
  socialButtonLoading: {
    opacity: 0.6,
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    ...typography.body,
  },
  skipLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    ...typography.body,
  },
});
```

**Testing**:
- Test screen displays correctly
- Test back button navigates to reminders screen
- Test each social auth button shows loading state
- Test "Skip" link navigates to main app
- Verify navigation dots show correctly (rightmost dot active)
- Test mock authentication flow
- Verify buttons are disabled during authentication

---

### Step 5: Create Completion Screen (Final)
**Purpose**: Build the success/completion screen that ends onboarding

**Why This Fifth**: This is the final screen in the onboarding flow, so we build it after all other screens.

**Files to Create**:
- `app/(onboarding)/completion.tsx`

**Wireframe Requirements**:
- Headline: "We're all set!"
- Large circular icon with double checkmarks (✓✓)
- Instruction text: "Create your first task and make progress today."
- "Create Task" button (white, rounded rectangular)
- Dark theme (black background, white text)
- No navigation dots (final screen)

**Code Implementation**:
```typescript
/**
 * Completion Screen
 * 
 * This is the final screen in the onboarding flow.
 * It confirms successful setup and guides users to create their first task.
 * 
 * Flow:
 * 1. User sees success message
 * 2. User taps "Create Task" → goes to main app (Today screen) with task creation modal open
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function CompletionScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  
  /**
   * Handle "Create Task" button press
   * Navigates to main app and opens task creation modal
   */
  const handleCreateTask = () => {
    // Navigate to Today screen with parameter to show task creation modal
    router.replace({
      pathname: '/(tabs)/today',
      params: { showTaskCreation: 'true' },
    });
  };
  
  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.checkmarkContainer}>
            <Ionicons name="checkmark" size={40} color="#000000" style={styles.checkmark} />
            <Ionicons name="checkmark" size={40} color="#000000" style={styles.checkmark} />
          </View>
        </View>
        
        {/* Headline */}
        <Text style={styles.headline}>We're all set!</Text>
        
        {/* Instruction Text */}
        <Text style={styles.instruction}>
          Create your first task and make progress today.
        </Text>
      </View>
      
      {/* Action Button */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.createTaskButton}
          onPress={handleCreateTask}
          activeOpacity={0.8}
        >
          <Text style={styles.createTaskButtonText}>Create Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF', // White circle background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -8, // Overlap checkmarks slightly
  },
  checkmark: {
    // Individual checkmark styling
  },
  headline: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    ...typography.heading1,
  },
  instruction: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
    ...typography.body,
  },
  actions: {
    gap: 16,
  },
  createTaskButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  createTaskButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    ...typography.button,
  },
});
```

**Testing**:
- Test screen displays correctly
- Test "Create Task" button navigates to main app
- Verify success icon displays correctly
- Test that task creation modal opens (if implemented)
- Verify no back navigation available

---

### Step 6: Update Root Layout for Onboarding Flow
**Purpose**: Configure app to show onboarding screens for new users

**Why This Sixth**: We need to route users to onboarding screens when they first open the app.

**Files to Modify**:
- `app/_layout.tsx`

**Changes Required**:
1. Add onboarding route group
2. Check if user has completed onboarding (using AsyncStorage mock)
3. Route to onboarding if not completed, main app if completed

**Code Implementation**:
```typescript
/**
 * Root Layout
 * 
 * This is the main layout file that handles routing between onboarding
 * and main app screens based on whether the user has completed onboarding.
 */

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing onboarding completion status
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  
  useEffect(() => {
    /**
     * Check if user has completed onboarding
     * This determines which screens to show
     */
    const checkOnboardingStatus = async () => {
      try {
        // Check if onboarding has been completed
        const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        
        // Wait a bit to show splash (optional)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (onboardingComplete === 'true') {
          // User has completed onboarding, go to main app
          router.replace('/(tabs)');
        } else {
          // User hasn't completed onboarding, show welcome screen
          router.replace('/(onboarding)/welcome');
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // On error, show onboarding (safer default)
        router.replace('/(onboarding)/welcome');
      } finally {
        setIsCheckingOnboarding(false);
      }
    };
    
    checkOnboardingStatus();
  }, [router]);
  
  // Show nothing while checking (or show splash screen)
  if (isCheckingOnboarding) {
    return null; // Or return a splash screen component
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

**Update Completion Screen to Mark Onboarding Complete**:
```typescript
// In completion.tsx, add this when user completes onboarding
import AsyncStorage from '@react-native-async-storage/async-storage';

const handleCreateTask = async () => {
  // Mark onboarding as complete
  await AsyncStorage.setItem('@DailyFlo:onboardingComplete', 'true');
  
  // Navigate to main app
  router.replace({
    pathname: '/(tabs)/today',
    params: { showTaskCreation: 'true' },
  });
};
```

**Testing**:
- Test app launch shows onboarding for new users
- Test app launch shows main app for returning users
- Test onboarding completion is saved
- Test navigation between onboarding screens
- Verify proper routing logic

---

### Step 7: Add Loading States and Animations
**Purpose**: Enhance UX with smooth transitions and loading feedback

**Why This Seventh**: Makes the app feel polished and responsive.

**Files to Modify**:
- All onboarding screens

**Changes Required**:
1. Add loading indicators during async operations
2. Add smooth screen transitions
3. Add button press animations
4. Add success/error animations

**Code Implementation**:
```typescript
// Example: Add loading state to signup screen
const [isAuthenticating, setIsAuthenticating] = useState(false);

// Show loading indicator
{isAuthenticating && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color="#FFFFFF" />
  </View>
)}
```

**Testing**:
- Test loading states show correctly
- Test animations are smooth
- Test button press feedback
- Verify no UI blocking during loading

---

### Step 8: Add Error Handling UI
**Purpose**: Show user-friendly error messages

**Why This Eighth**: Users need feedback when something goes wrong.

**Files to Modify**:
- All onboarding screens

**Changes Required**:
1. Add error state management
2. Display error messages
3. Add retry functionality
4. Handle network errors gracefully

**Code Implementation**:
```typescript
// Example: Add error handling to signup screen
const [error, setError] = useState<string | null>(null);

const handleSocialAuth = async (provider: 'facebook' | 'google' | 'apple') => {
  try {
    setError(null);
    // ... auth logic
  } catch (error) {
    setError('Failed to sign in. Please try again.');
  }
};

// Display error
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
  </View>
)}
```

**Testing**:
- Test error messages display correctly
- Test retry functionality
- Test network error handling
- Verify errors don't break navigation

---

## Mock Data & State Management

### Onboarding State
```typescript
// Store onboarding completion status
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

// Store permission status (mock)
const NOTIFICATION_PERMISSION_KEY = '@DailyFlo:notificationPermission';
```

### Mock Authentication
```typescript
// In Redux auth slice, use existing mock functions
// These will be replaced with real API calls later
dispatch(socialAuth({
  provider: 'google',
  email: 'user@google.com',
  // ... mock data
}));
```

---

## Testing Checklist

### UI Testing
- [ ] Welcome screen displays correctly
- [ ] Reminders screen displays correctly
- [ ] Sign-up screen displays correctly
- [ ] Completion screen displays correctly
- [ ] Navigation between screens works
- [ ] Back buttons work correctly
- [ ] Navigation dots show correct step
- [ ] All buttons have proper touch feedback
- [ ] Loading states show correctly
- [ ] Error messages display correctly

### Flow Testing
- [ ] New user sees welcome screen
- [ ] "Get Started" → Reminders → Sign-up → Completion flow works
- [ ] "Sign In" → Sign-up screen works
- [ ] "Skip" options work correctly
- [ ] Social auth buttons trigger mock authentication
- [ ] Completion screen marks onboarding complete
- [ ] Returning users skip onboarding

### Visual Testing
- [ ] Dark theme matches wireframes
- [ ] Text matches wireframe content exactly
- [ ] Icons display correctly
- [ ] Spacing matches wireframes
- [ ] Button styles match wireframes
- [ ] Navigation dots match wireframes

---

## Success Criteria

### Functional Requirements
- [ ] All 4 onboarding screens built and working
- [ ] Navigation flow works correctly
- [ ] Mock authentication works
- [ ] Onboarding completion is tracked
- [ ] Users can skip steps
- [ ] Loading states work
- [ ] Error handling works

### Visual Requirements
- [ ] Screens match wireframes exactly
- [ ] Dark theme implemented correctly
- [ ] All text matches wireframe content
- [ ] Icons and buttons match designs
- [ ] Smooth animations and transitions

### Technical Requirements
- [ ] No console errors
- [ ] TypeScript types are correct
- [ ] Code follows project conventions
- [ ] Comments explain complex logic
- [ ] Components are reusable
- [ ] Navigation is properly configured

---

## Next Steps After UI Implementation

Once all UI screens are complete and working with mock data:

1. **API Integration**: Connect screens to real authentication API (see `onboarding-auth-integration.md`)
2. **Real Permissions**: Replace mock permission requests with real expo-notifications
3. **Social Auth**: Implement real Google, Apple, Facebook authentication
4. **Error Handling**: Enhance error handling with real API errors
5. **Loading States**: Connect loading states to real API calls
6. **Token Storage**: Implement secure token storage
7. **User State**: Connect to real user data from backend

---

## Resources and References

### Key Files
- **Onboarding Layout**: `app/(onboarding)/_layout.tsx`
- **Welcome Screen**: `app/(onboarding)/welcome.tsx`
- **Reminders Screen**: `app/(onboarding)/reminders.tsx`
- **Sign-up Screen**: `app/(onboarding)/signup.tsx`
- **Completion Screen**: `app/(onboarding)/completion.tsx`
- **Root Layout**: `app/_layout.tsx`

### Documentation
- **Wireframes**: `docs/project-planning/wireframes.md`
- **Design System**: `docs/technical-design/frontend/plan/design-system.md`
- **File Architecture**: `docs/technical-design/frontend/plan/file-architecture.md`

### External Resources
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native StyleSheet](https://reactnative.dev/docs/stylesheet)
- [Ionicons](https://ionic.io/ionicons)

---

*Last updated: 2025-01-20*
