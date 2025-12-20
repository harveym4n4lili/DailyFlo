/**
 * Development Utilities for Onboarding Testing
 * 
 * These utilities help test different onboarding states during development.
 * They allow you to check, set, and reset the onboarding completion status
 * without having to delete app data or clear AsyncStorage manually.
 * 
 * Usage:
 * - Import these functions in your dev menu or console
 * - Call them to test different user states
 * - Example: await resetOnboarding() to see onboarding again
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '@/store';
import { logout } from '@/store/slices/auth/authSlice';

// storage key for tracking onboarding completion status
// this matches the key used in _layout.tsx and OnboardingActions.tsx
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

/**
 * Check the current onboarding completion status
 * Returns 'true' if onboarding is complete, 'false' or null if not
 * 
 * @returns Promise<string | null> - The onboarding status value
 */
export const checkOnboardingStatus = async (): Promise<string | null> => {
  try {
    const status = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    console.log('📱 Onboarding Status:', status || 'not set (first-time user)');
    return status;
  } catch (error) {
    console.error('❌ Failed to check onboarding status:', error);
    return null;
  }
};

/**
 * Reset onboarding status (make user a first-time user again)
 * This clears the onboarding completion flag so the user will see onboarding screens
 * Also logs out any currently logged-in user to ensure first-time users have no account
 * 
 * @returns Promise<void>
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    // clear onboarding completion flag
    await AsyncStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    
    // ensure no account is logged in when resetting onboarding
    // first-time users should not have any logged-in account
    const authState = store.getState().auth;
    if (authState.isAuthenticated) {
      // dispatch logout action to clear auth state
      // this ensures first-time users start with a clean slate
      store.dispatch(logout());
      console.log('✅ Logged out user - first-time users should not have logged-in accounts');
    }
    
    console.log('✅ Onboarding status reset - user will see onboarding screens on next launch');
  } catch (error) {
    console.error('❌ Failed to reset onboarding status:', error);
    throw error;
  }
};

/**
 * Mark onboarding as complete (simulate returning user)
 * This sets the onboarding completion flag so the user will skip onboarding
 * 
 * @returns Promise<void>
 */
export const markOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    console.log('✅ Onboarding marked as complete - user will skip onboarding on next launch');
  } catch (error) {
    console.error('❌ Failed to mark onboarding as complete:', error);
    throw error;
  }
};

/**
 * Toggle onboarding status
 * If onboarding is complete, reset it. If not complete, mark it as complete.
 * 
 * @returns Promise<void>
 */
export const toggleOnboardingStatus = async (): Promise<void> => {
  try {
    const currentStatus = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    if (currentStatus === 'true') {
      await resetOnboarding();
      console.log('🔄 Toggled: Onboarding is now INCOMPLETE (first-time user)');
    } else {
      await markOnboardingComplete();
      console.log('🔄 Toggled: Onboarding is now COMPLETE (returning user)');
    }
  } catch (error) {
    console.error('❌ Failed to toggle onboarding status:', error);
    throw error;
  }
};

/**
 * Get all onboarding-related storage keys (for debugging)
 * 
 * @returns Promise<void>
 */
export const debugOnboardingStorage = async (): Promise<void> => {
  try {
    const status = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    console.log('🔍 Onboarding Debug Info:');
    console.log('  Key:', ONBOARDING_COMPLETE_KEY);
    console.log('  Value:', status);
    console.log('  Status:', status === 'true' ? 'COMPLETE (returning user)' : 'INCOMPLETE (first-time user)');
  } catch (error) {
    console.error('❌ Failed to debug onboarding storage:', error);
  }
};

/**
 * Check who is currently logged in
 * Reads the authentication state from Redux store
 * Shows user information if logged in, or indicates no user is logged in
 * 
 * @returns void - Logs user info to console
 */
export const checkLoggedInUser = (): void => {
  try {
    // get current auth state from Redux store
    // store.getState() gives us access to the entire Redux state
    const authState = store.getState().auth;
    
    if (authState.isAuthenticated && authState.user) {
      // user is logged in, show their information
      console.log('👤 Logged In User:');
      console.log('  Email:', authState.user.email);
      console.log('  Name:', `${authState.user.firstName} ${authState.user.lastName}`.trim() || 'Not set');
      console.log('  Auth Method:', authState.authMethod || 'Unknown');
      console.log('  User ID:', authState.user.id);
      console.log('  Email Verified:', authState.user.isEmailVerified ? 'Yes' : 'No');
      console.log('  Last Login:', authState.lastLoginTime ? new Date(authState.lastLoginTime).toLocaleString() : 'Never');
      console.log('  Has Access Token:', authState.accessToken ? 'Yes' : 'No');
      console.log('  Has Refresh Token:', authState.refreshToken ? 'Yes' : 'No');
    } else {
      // no user is logged in
      console.log('👤 Logged In User:');
      console.log('  Status: NOT LOGGED IN');
      console.log('  isAuthenticated:', authState.isAuthenticated);
      console.log('  user:', authState.user);
    }
  } catch (error) {
    console.error('❌ Failed to check logged in user:', error);
  }
};

/**
 * Get logged in user info as an object (for programmatic use)
 * Returns the user object if logged in, null otherwise
 * 
 * @returns { user: User | null, isAuthenticated: boolean, authMethod: string | null }
 */
export const getLoggedInUser = () => {
  try {
    const authState = store.getState().auth;
    return {
      user: authState.user,
      isAuthenticated: authState.isAuthenticated,
      authMethod: authState.authMethod,
      hasTokens: !!(authState.accessToken && authState.refreshToken),
    };
  } catch (error) {
    console.error('❌ Failed to get logged in user:', error);
    return {
      user: null,
      isAuthenticated: false,
      authMethod: null,
      hasTokens: false,
    };
  }
};
