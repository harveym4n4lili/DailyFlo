/**
 * Auth Slice - Redux State Management for Authentication
 * 
 * This file defines the Redux slice for managing authentication-related state.
 * It handles user login, logout, registration, and session management.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, RegisterUserInput, LoginUserInput, SocialAuthInput, UpdateUserInput, UserPreferences } from '../../../types';
// auth API service - handles API calls to Django backend for authentication
// this service makes HTTP requests to login, register, and other auth endpoints
import authApiService from '../../../services/api/auth';
// token storage functions - secure storage for authentication tokens using Expo SecureStore
// these functions store and retrieve tokens from encrypted device storage
import {
  storeAccessToken,
  storeRefreshToken,
  storeTokenExpiry,
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  getTokenExpiry,
  isAccessTokenExpired,
  resolveAccessTokenExpiryMs,
} from '../../../services/auth/tokenStorage';
import { refreshStoredSessionTokens } from '../../../services/auth/sessionRefresh';
import { queueNavigateToTodayThenAuthLanding } from '../../../utils/navigation/queueLogoutAuthNavigation';
import {
  inferOnboardingIsNewAccount,
  ONBOARDING_COMPLETE_STORAGE_KEY,
} from '../../../utils/onboarding/onboardingUserStatus';
import {
  coerceWakeSleepHHMM,
  DEFAULT_SLEEP_HHMM,
  DEFAULT_WAKE_HHMM,
} from '../../../utils/preferenceScheduleTimes';

/**
 * Define the shape of the authentication state
 */
interface AuthState {
  // User data
  user: User | null;                // Current logged-in user
  isAuthenticated: boolean;         // Whether user is logged in
  
  // Loading states
  isLoading: boolean;               // True when checking authentication status
  isLoggingIn: boolean;             // True when logging in
  isRegistering: boolean;           // True when registering
  isUpdatingProfile: boolean;       // True when updating user profile
  
  // Error states
  error: string | null;             // General error message
  loginError: string | null;        // Login-specific error
  registerError: string | null;     // Registration-specific error
  profileError: string | null;      // Profile update error
  
  // Session management
  accessToken: string | null;       // JWT access token
  refreshToken: string | null;      // JWT refresh token
  tokenExpiry: number | null;       // When the access token expires
  
  // Authentication method
  authMethod: 'email' | 'google' | 'apple' | 'facebook' | null; // How user logged in
  
  // Session persistence
  rememberMe: boolean;              // Whether to remember user session
  lastLoginTime: number | null;     // Timestamp of last successful login

  /**
   * last auth action: true = brand-new django user (hide Skip), false = existing (show Skip).
   * set from social auth `is_new_user`; null after logout or before first auth in session.
   */
  onboardingIsNewAccount: boolean | null;
}

/**
 * Initial state - the default state when the app starts
 */
const initialState: AuthState = {
  // Start with no user
  user: null,
  isAuthenticated: false,
  
  // Start with no loading states
  isLoading: false,
  isLoggingIn: false,
  isRegistering: false,
  isUpdatingProfile: false,
  
  // Start with no errors
  error: null,
  loginError: null,
  registerError: null,
  profileError: null,
  
  // Start with no session
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
  
  // Start with no auth method
  authMethod: null,
  
  // Default session settings
  rememberMe: false,
  lastLoginTime: null,
  onboardingIsNewAccount: null,
};

/**
 * Async Thunks - Functions that handle async operations
 */

// Check if user is already authenticated (on app startup)
// This runs when the app launches to see if the user is still logged in
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      // long-lived refresh token (30d server-side) — not the 15m access JWT
      let refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearAllTokens();
        return null;
      }

      let accessToken = await getAccessToken();
      let expiresAt = (await getTokenExpiry()) ?? Date.now();

      // cold start after hours: access JWT is expired but refresh is still valid — mint new access first
      if (!accessToken || (await isAccessTokenExpired())) {
        const refreshed = await refreshStoredSessionTokens();
        if (!refreshed) {
          await clearAllTokens();
          return null;
        }
        accessToken = refreshed.accessToken;
        refreshToken = refreshed.refreshToken;
        expiresAt = refreshed.expiresAt;
      }

      const loadProfile = async () => {
        const userResponse = await authApiService.getCurrentUser();
        const user: User = transformApiUserToUser(userResponse.user || userResponse);
        return {
          user,
          accessToken: accessToken!,
          refreshToken,
          expiresAt: new Date(expiresAt),
        };
      };

      try {
        return await loadProfile();
      } catch (error: any) {
        if (error.response?.status === 401) {
          const refreshed = await refreshStoredSessionTokens();
          if (!refreshed) {
            await clearAllTokens();
            return null;
          }
          accessToken = refreshed.accessToken;
          refreshToken = refreshed.refreshToken;
          expiresAt = refreshed.expiresAt;
          return await loadProfile();
        }
        await clearAllTokens();
        return null;
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      await clearAllTokens();
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to check auth status');
    }
  }
);

/**
 * Helper function to transform API user response to User interface
 * Backend uses snake_case (e.g., user_id), frontend uses camelCase (e.g., userId)
 * This function converts the API response format to match our frontend User interface
 * 
 * @param apiUser - User data from API (snake_case format)
 * @returns User object matching frontend interface (camelCase format)
 */
function transformApiUserToUser(apiUser: any): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    authProvider: apiUser.auth_provider || apiUser.authProvider || 'email',
    authProviderId: apiUser.auth_provider_id || apiUser.authProviderId || null,
    firstName: apiUser.first_name || apiUser.firstName || '',
    lastName: apiUser.last_name || apiUser.lastName || '',
    avatarUrl: apiUser.avatar_url || apiUser.avatarUrl || null,
    isEmailVerified: apiUser.is_email_verified || apiUser.isEmailVerified || false,
    lastLogin: apiUser.last_login ? new Date(apiUser.last_login) : null,
    preferences: transformApiPreferencesToPreferences(apiUser.preferences || {}),
    softDeleted: apiUser.soft_deleted || apiUser.softDeleted || false,
    createdAt: apiUser.created_at ? new Date(apiUser.created_at) : new Date(),
    updatedAt: apiUser.updated_at ? new Date(apiUser.updated_at) : new Date(),
  };
}

/**
 * redux thunk fulfilled payloads must stay json-serializable — `Date` triggers serializableCheck warnings.
 * we iso-string dates on return from PATCH profile thunks, then map back to `Date` in the reducer.
 */

type UserThunkSerializablePayload = Omit<User, 'createdAt' | 'updatedAt' | 'lastLogin'> & {
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
};

function serializeUserForThunkPayload(user: User): UserThunkSerializablePayload {
  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt),
    lastLogin:
      user.lastLogin == null
        ? null
        : user.lastLogin instanceof Date
          ? user.lastLogin.toISOString()
          : String(user.lastLogin),
  };
}

function deserializeUserThunkPayload(payload: UserThunkSerializablePayload): User {
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    lastLogin: payload.lastLogin ? new Date(payload.lastLogin) : null,
  };
}

/**
 * Helper function to transform API preferences to UserPreferences interface
 * Backend uses snake_case for preference field names, frontend uses camelCase
 * 
 * @param apiPrefs - Preferences data from API (snake_case format)
 * @returns UserPreferences object matching frontend interface (camelCase format)
 */
function transformApiPreferencesToPreferences(apiPrefs: any): UserPreferences {
  return {
    theme: apiPrefs.theme || 'light',
    notifications: {
      enabled: apiPrefs.notifications?.enabled ?? true,
      dueDateReminders: apiPrefs.notifications?.due_date_reminders ?? true,
      routineReminders: apiPrefs.notifications?.routine_reminders ?? true,
      pushNotifications: apiPrefs.notifications?.push_notifications ?? true,
      emailNotifications: apiPrefs.notifications?.email_notifications ?? false,
    },
    defaultPriority: apiPrefs.default_priority || apiPrefs.defaultPriority || 3,
    defaultColor: apiPrefs.default_color || apiPrefs.defaultColor || 'blue',
    defaultListView: apiPrefs.default_list_view || apiPrefs.defaultListView || 'list',
    timezone: apiPrefs.timezone || 'UTC',
    dateFormat: apiPrefs.date_format || apiPrefs.dateFormat || 'MM/DD/YYYY',
    timeFormat: apiPrefs.time_format || apiPrefs.timeFormat || '12h',
    autoArchiveCompleted: apiPrefs.auto_archive_completed || apiPrefs.autoArchiveCompleted || false,
    showCompletedTasks: (apiPrefs.show_completed_tasks || apiPrefs.showCompletedTasks) ?? true,
    sortTasksBy: apiPrefs.sort_tasks_by || apiPrefs.sortTasksBy || 'dueDate',
    analyticsEnabled: (apiPrefs.analytics_enabled || apiPrefs.analyticsEnabled) ?? true,
    crashReportingEnabled: (apiPrefs.crash_reporting_enabled || apiPrefs.crashReportingEnabled) ?? true,
    wakeTime: coerceWakeSleepHHMM(apiPrefs.wake_time || apiPrefs.wakeTime, DEFAULT_WAKE_HHMM),
    sleepTime: coerceWakeSleepHHMM(apiPrefs.sleep_time || apiPrefs.sleepTime, DEFAULT_SLEEP_HHMM),
    onboardingCompleted:
      apiPrefs.onboarding_completed === true || apiPrefs.onboardingCompleted === true,
  };
}

/**
 * PATCH `/accounts/users/profile/update/` expects snake_case django fields nested under `preferences`.
 * we only serialize the entries the server allows + merge server-side onto existing json.
 */
export function preferencesPartialToSnakePayload(prefs: Partial<UserPreferences>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (prefs.theme !== undefined) out.theme = prefs.theme;
  if (prefs.defaultPriority !== undefined) out.default_priority = prefs.defaultPriority;
  if (prefs.defaultColor !== undefined) out.default_color = prefs.defaultColor;
  if (prefs.defaultListView !== undefined) out.default_list_view = prefs.defaultListView;
  if (prefs.timezone !== undefined) out.timezone = prefs.timezone;
  if (prefs.dateFormat !== undefined) out.date_format = prefs.dateFormat;
  if (prefs.timeFormat !== undefined) out.time_format = prefs.timeFormat;
  if (prefs.autoArchiveCompleted !== undefined) out.auto_archive_completed = prefs.autoArchiveCompleted;
  if (prefs.showCompletedTasks !== undefined) out.show_completed_tasks = prefs.showCompletedTasks;
  if (prefs.sortTasksBy !== undefined) out.sort_tasks_by = prefs.sortTasksBy;
  if (prefs.analyticsEnabled !== undefined) out.analytics_enabled = prefs.analyticsEnabled;
  if (prefs.crashReportingEnabled !== undefined) out.crash_reporting_enabled = prefs.crashReportingEnabled;
  if (prefs.wakeTime !== undefined) out.wake_time = prefs.wakeTime;
  if (prefs.sleepTime !== undefined) out.sleep_time = prefs.sleepTime;
  if (prefs.onboardingCompleted !== undefined) out.onboarding_completed = prefs.onboardingCompleted;
  if (prefs.notifications !== undefined) {
    const n = prefs.notifications;
    const nid: Record<string, unknown> = {};
    if (n.enabled !== undefined) nid.enabled = n.enabled;
    if (n.dueDateReminders !== undefined) nid.due_date_reminders = n.dueDateReminders;
    if (n.routineReminders !== undefined) nid.routine_reminders = n.routineReminders;
    if (n.pushNotifications !== undefined) nid.push_notifications = n.pushNotifications;
    if (n.emailNotifications !== undefined) nid.email_notifications = n.emailNotifications;
    if (Object.keys(nid).length) out.notifications = nid;
  }
  return out;
}

/**
 * Login with email and password
 * This is an async thunk - a special Redux function that handles async operations like API calls
 * 
 * @param credentials - User's email and password
 * @returns User data and tokens if successful, error if failed
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginUserInput, { rejectWithValue, dispatch }) => {
    try {
      // Call the API service to login
      // The API service makes the HTTP request to Django backend
      // authApiService.login() sends a POST request to /accounts/auth/login/ endpoint
      // Django UserLoginSerializer expects { email, password } directly
      const response = await authApiService.login({
        email: credentials.email,
        password: credentials.password,
      });
      
      // Log the full response for debugging
      // This helps us see the exact structure Django returns
      console.log('Login response:', JSON.stringify(response, null, 2));
      
      // Extract tokens from response
      // TokenObtainPairView returns tokens directly: { access, refresh }
      // Some custom endpoints return nested: { tokens: { access, refresh }, user: {...} }
      // Handle multiple possible response formats for flexibility
      const accessToken = response.tokens?.access || response.access || response.data?.tokens?.access || response.data?.access;
      const refreshToken = response.tokens?.refresh || response.refresh || response.data?.tokens?.refresh || response.data?.refresh;
      
      // If tokens are missing, log the response structure to help debug
      if (!accessToken || !refreshToken) {
        console.error('Tokens not found in response. Response structure:', {
          hasTokens: !!response.tokens,
          hasAccess: !!response.access,
          hasRefresh: !!response.refresh,
          responseKeys: Object.keys(response || {}),
        });
        throw new Error('Tokens not received from server');
      }
      
      // Store tokens securely in Expo SecureStore BEFORE fetching user data
      // This is important because the getCurrentUser API call requires authentication
      // SecureStore encrypts tokens and stores them securely on the device
      await storeAccessToken(accessToken);
      await storeRefreshToken(refreshToken);
      
      // TokenObtainPairView doesn't return user data, so we need to fetch it separately
      // After storing tokens, we can make an authenticated request to get user profile
      let user: User;
      if (response.user) {
        // If user data is in the response (custom login endpoint), use it
        user = transformApiUserToUser(response.user);
      } else {
        // If no user data (TokenObtainPairView), fetch it from the profile endpoint
        // getCurrentUser requires authentication, which is why we stored tokens first
        const userResponse = await authApiService.getCurrentUser();
        user = transformApiUserToUser(userResponse.user || userResponse);
      }
      
      const expiryTime = resolveAccessTokenExpiryMs(accessToken);
      await storeTokenExpiry(expiryTime);

      return {
        user,
        accessToken,
        refreshToken,
        expiresAt: new Date(expiryTime),
      };
    } catch (error: any) {
      // Handle different types of errors and provide user-friendly messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with an error status code
        const status = error.response.status;
        const data = error.response.data;
        
        // Log full error response for debugging
        // This helps us see what Django validation errors are being returned
        console.error('Login error response:', JSON.stringify(data, null, 2));
        
        if (status === 400) {
          // Bad request - usually validation errors
          // Django REST Framework returns field-specific error messages
          // Check for non_field_errors first (cross-field validation)
          if (data.non_field_errors) {
            // Django uses non_field_errors for validation that spans multiple fields
            errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
          } else if (data.email) {
            // Email validation error
            errorMessage = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
          } else if (data.password) {
            // Password validation error
            errorMessage = `Password: ${Array.isArray(data.password) ? data.password[0] : data.password}`;
          } else {
            // Other validation errors - try to get first error from any field
            const firstErrorKey = Object.keys(data)[0];
            if (firstErrorKey) {
              const firstError = data[firstErrorKey];
              errorMessage = `${firstErrorKey}: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
            } else {
              errorMessage = data.message || data.detail || 'Invalid login data';
            }
          }
        } else if (status === 401) {
          // Unauthorized - invalid credentials
          // Check if Django returned a specific error message
          if (data.detail) {
            errorMessage = data.detail;
          } else if (data.non_field_errors) {
            errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
          } else {
            errorMessage = 'Invalid email or password';
          }
        } else if (status === 422) {
          // Unprocessable entity - validation errors
          errorMessage = data.message || data.detail || 'Invalid input';
        } else if (status >= 500) {
          // Server errors
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Network error. Please check your connection.';
      }
      
      // Return error to Redux
      // Redux will store this in the loginError state
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Register a new user
 * This creates a new account and automatically logs the user in
 * 
 * @param userData - User registration information (email, password, firstName, lastName)
 * @returns User data and tokens if successful, error if failed
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterUserInput, { rejectWithValue, dispatch }) => {
    try {
      // Call the API service to register
      // authApiService.register() sends a POST request to /accounts/auth/register/ endpoint
      // Backend expects snake_case field names (first_name, last_name, password_confirm)
      // Django requires password_confirm to match password for validation - we send the same password for both
      // since the frontend form only has one password field (users enter password once)
      // The authApiService.register() accepts the raw registration data directly (not wrapped)
      const response = await authApiService.register({
        email: userData.email,
        password: userData.password,
        password_confirm: userData.password, // Django requires password confirmation - use same password
        first_name: userData.firstName,
        last_name: userData.lastName,
      } as any); // Type assertion needed because RegisterRequest type definition doesn't match actual API implementation
      
      // Log the full response for debugging
      // This helps us see the exact structure Django returns
      console.log('Registration response:', JSON.stringify(response, null, 2));
      
      // Transform API response to match our User interface
      // Backend returns snake_case, frontend uses camelCase
      // Django returns: { message, tokens: { access, refresh }, user: {...} }
      const user: User = transformApiUserToUser(response.user || response);
      
      // Extract tokens from response
      // Django returns tokens in a nested object: response.tokens.access and response.tokens.refresh
      // Handle multiple possible response formats for flexibility
      const accessToken = response.tokens?.access || response.access || response.data?.tokens?.access || response.data?.access;
      const refreshToken = response.tokens?.refresh || response.refresh || response.data?.tokens?.refresh || response.data?.refresh;
      
      // If tokens are missing, log the response structure to help debug
      if (!accessToken || !refreshToken) {
        console.error('Tokens not found in response. Response structure:', {
          hasTokens: !!response.tokens,
          hasAccess: !!response.access,
          hasRefresh: !!response.refresh,
          responseKeys: Object.keys(response || {}),
        });
        throw new Error('Tokens not received from server');
      }
      
      // Store tokens securely in Expo SecureStore
      // This saves tokens to device secure storage (encrypted on iOS Keychain/Android Keystore)
      await storeAccessToken(accessToken);
      await storeRefreshToken(refreshToken);
      
      const expiryTime = resolveAccessTokenExpiryMs(accessToken);
      await storeTokenExpiry(expiryTime);
      
      // Return user data and tokens FIRST
      // Redux will automatically update the state with this data via the reducer
      // User is automatically logged in after successful registration
      // New users won't have tasks yet, so tasks will be fetched when they navigate to tasks screen
      return {
        user,
        accessToken,
        refreshToken,
        expiresAt: new Date(expiryTime),
      };
    } catch (error: any) {
      // Handle different types of errors and provide user-friendly messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        // Server responded with an error status code
        const status = error.response.status;
        const data = error.response.data;
        
        // Log full error response for debugging
        // This helps us see what Django validation errors are being returned
        console.error('Registration error response:', JSON.stringify(data, null, 2));
        
        if (status === 400) {
          // Bad request - usually validation errors
          // Django REST Framework returns field-specific error messages
          // Check for non_field_errors first (cross-field validation, like password mismatch)
          if (data.non_field_errors) {
            // Django uses non_field_errors for validation that spans multiple fields
            errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
          } else if (data.email) {
            // Email validation error (e.g., invalid format, already exists)
            errorMessage = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
          } else if (data.password) {
            // Password validation error (e.g., too short, doesn't meet requirements)
            errorMessage = `Password: ${Array.isArray(data.password) ? data.password[0] : data.password}`;
          } else if (data.password_confirm) {
            // Password confirmation validation error
            errorMessage = `Password confirmation: ${Array.isArray(data.password_confirm) ? data.password_confirm[0] : data.password_confirm}`;
          } else if (data.first_name) {
            // First name validation error
            errorMessage = `First name: ${Array.isArray(data.first_name) ? data.first_name[0] : data.first_name}`;
          } else if (data.last_name) {
            // Last name validation error
            errorMessage = `Last name: ${Array.isArray(data.last_name) ? data.last_name[0] : data.last_name}`;
          } else {
            // Other validation errors - try to get first error from any field
            const firstErrorKey = Object.keys(data)[0];
            if (firstErrorKey) {
              const firstError = data[firstErrorKey];
              errorMessage = `${firstErrorKey}: ${Array.isArray(firstError) ? firstError[0] : firstError}`;
            } else {
              errorMessage = data.message || data.detail || 'Invalid registration data';
            }
          }
        } else if (status === 409) {
          // Conflict - email already exists
          errorMessage = 'An account with this email already exists';
        } else if (status === 422) {
          // Unprocessable entity - validation errors
          errorMessage = data.message || data.detail || 'Invalid input';
        } else if (status >= 500) {
          // Server errors
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Network error. Please check your connection.';
      }
      
      // Return error to Redux
      // Redux will store this in the registerError state
      return rejectWithValue(errorMessage);
    }
  }
);

// Social authentication — google/apple id_token verified by django, then same DailyFlo jwt session as email login
// (access ~15m + refresh ~30d in SecureStore; cold start / 401 use refreshStoredSessionTokens — not provider-specific)
export const socialAuth = createAsyncThunk(
  'auth/socialAuth',
  async (authData: SocialAuthInput, { rejectWithValue }) => {
    try {
      // django expects snake_case field names matching SocialAuthSerializer
      const response = await authApiService.socialLogin({
        provider: authData.provider,
        id_token: authData.idToken,
        first_name: authData.firstName ?? '',
        last_name: authData.lastName ?? '',
      });

      const accessToken =
        response.tokens?.access || response.access || response.data?.tokens?.access || response.data?.access;
      const refreshToken =
        response.tokens?.refresh ||
        response.refresh ||
        response.data?.tokens?.refresh ||
        response.data?.refresh;

      if (!accessToken || !refreshToken) {
        console.error('Social auth: tokens missing from response', Object.keys(response || {}));
        throw new Error('Tokens not received from server');
      }

      // same as loginUser — apiClient reads the bearer token from SecureStore on later calls
      await storeAccessToken(accessToken);
      await storeRefreshToken(refreshToken);

      const user: User = transformApiUserToUser(response.user);
      const expiryTime = resolveAccessTokenExpiryMs(accessToken);
      await storeTokenExpiry(expiryTime);

      // django sets `is_new_user` from get_or_create — existing google accounts get false (show onboarding Skip)
      const isNewUser = response.is_new_user === true || response.isNewUser === true;

      return {
        user,
        accessToken,
        refreshToken,
        expiresAt: new Date(expiryTime),
        isNewUser,
      };
    } catch (error: any) {
      let errorMessage = 'Sign in failed. Please try again.';

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400 && data) {
          if (data.non_field_errors) {
            errorMessage = Array.isArray(data.non_field_errors)
              ? data.non_field_errors[0]
              : data.non_field_errors;
          } else if (data.id_token) {
            errorMessage = Array.isArray(data.id_token) ? data.id_token[0] : String(data.id_token);
          } else if (data.provider) {
            errorMessage = Array.isArray(data.provider) ? data.provider[0] : String(data.provider);
          } else {
            const firstKey = Object.keys(data)[0];
            if (firstKey) {
              const v = data[firstKey];
              errorMessage = `${firstKey}: ${Array.isArray(v) ? v[0] : v}`;
            } else {
              errorMessage = data.message || data.detail || errorMessage;
            }
          }
        } else if (status === 401) {
          errorMessage = typeof data?.error === 'string' ? data.error : 'Could not verify your account. Try again.';
        } else if (status === 409) {
          errorMessage =
            typeof data?.message === 'string' ? data.message : 'An account with this email already uses another sign-in method.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (updates: UpdateUserInput, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.updateProfile(updates);
      // return response.data;
      
      // For now, return the updates
      return updates;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Profile update failed');
    }
  }
);

/**
 * PATCH wake/sleep through django `preferences` merge — thunk keeps redux user in sync with server truth.
 */
/** PATCH `preferences.onboarding_completed` — synced when user finishes or skips questionnaire */
export const patchUserOnboardingCompleted = createAsyncThunk<
  UserThunkSerializablePayload,
  void
>(
  'auth/patchUserOnboardingCompleted',
  async (_, { getState, rejectWithValue }) => {
    try {
      const loggedInUser = (getState() as { auth: Readonly<{ user: User | null }> }).auth.user;
      if (!loggedInUser?.id) {
        return rejectWithValue('Sign in required to save onboarding status.');
      }

      const response = await authApiService.patchProfileUpdate({
        preferences: preferencesPartialToSnakePayload({ onboardingCompleted: true }),
      });

      const bodyUser = response.user ?? response;
      return serializeUserForThunkPayload(transformApiUserToUser(bodyUser));
    } catch (error: any) {
      const prefsErr = error?.response?.data?.preferences;
      const message =
        (Array.isArray(prefsErr) ? prefsErr[0] : undefined) ??
        error?.response?.data?.detail ??
        (error instanceof Error ? error.message : 'Could not save onboarding status.');
      return rejectWithValue(typeof message === 'string' ? message : 'Could not save onboarding status.');
    }
  },
);

export const patchUserSchedulePreferences = createAsyncThunk<
  UserThunkSerializablePayload,
  { wakeTime: string; sleepTime: string }
>(
  'auth/patchUserSchedulePreferences',
  async (patch: { wakeTime: string; sleepTime: string }, { getState, rejectWithValue }) => {
    try {
      const loggedInUser = (getState() as { auth: Readonly<{ user: User | null }> }).auth.user;
      if (!loggedInUser?.id) {
        return rejectWithValue('Sign in required to save your schedule.');
      }

      const response = await authApiService.patchProfileUpdate({
        preferences: preferencesPartialToSnakePayload({
          wakeTime: patch.wakeTime,
          sleepTime: patch.sleepTime,
        }),
      });

      const bodyUser = response.user ?? response;
      return serializeUserForThunkPayload(transformApiUserToUser(bodyUser));
    } catch (error: any) {
      const prefsErr = error?.response?.data?.preferences;
      const message =
        (Array.isArray(prefsErr) ? prefsErr[0] : undefined) ??
        error?.response?.data?.detail ??
        (error instanceof Error ? error.message : 'Could not save schedule.');
      return rejectWithValue(typeof message === 'string' ? message : 'Could not save schedule.');
    }
  },
);

// Refresh access token
export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      // TODO: Replace with actual API call
      // const state = getState() as RootState;
      // const response = await api.refreshToken(state.auth.refreshToken);
      // return response.data;
      
      // For now, return mock tokens
      return {
        accessToken: 'new-mock-access-token',
        refreshToken: 'new-mock-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Token refresh failed');
    }
  }
);

// Logout user - clears tokens from SecureStore and Redux state
// This is an async thunk that handles the full logout process
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    try {
      // Clear all tokens from SecureStore (encrypted device storage)
      // This removes access token, refresh token, and expiry timestamp
      await clearAllTokens();
      
      // Dispatch the logout reducer to clear Redux state
      // This clears user data, tokens, and authentication status from Redux
      dispatch(logout());
      
      // Clear tasks when user logs out
      // This ensures tasks from the previous user don't persist for the next user
      // Import clearTasks action from tasks slice to reset task state
      const { clearTasks } = await import('../tasks/tasksSlice');
      dispatch(clearTasks());
      
      // clear device-wide onboarding flag on logout so cold start shows auth modal again.
      // per-user keys stay — returning accounts still get Skip after they sign back in.
      try {
        await AsyncStorage.removeItem(ONBOARDING_COMPLETE_STORAGE_KEY);
      } catch (onboardingError) {
        // If resetting onboarding fails, log it but don't fail the logout
        // The logout should still succeed even if onboarding reset fails
        console.error('Error resetting onboarding during logout:', onboardingError);
      }

      // only dispatched from browse settings — show auth modal from root routing queue (not from a screen hook lifecycle — see util comment)
      queueNavigateToTodayThenAuthLanding();

      // Return success - the reducer handles clearing the state
      return true;
    } catch (error) {
      // Even if clearing tokens fails, we still want to clear Redux state
      // This ensures the user appears logged out even if there's a storage error
      dispatch(logout());
      
      // Try to clear tasks even if token clearing failed
      try {
        const { clearTasks } = await import('../tasks/tasksSlice');
        dispatch(clearTasks());
      } catch (taskClearError) {
        console.error('Error clearing tasks during logout:', taskClearError);
      }
      
      // Try to reset onboarding even if other logout steps failed
      // This ensures onboarding is reset regardless of other errors
      try {
        await AsyncStorage.removeItem(ONBOARDING_COMPLETE_STORAGE_KEY);
      } catch (onboardingError) {
        console.error('Error resetting onboarding during logout:', onboardingError);
      }

      queueNavigateToTodayThenAuthLanding();

      console.error('Error during logout (tokens may not have been cleared):', error);
      return true;
    }
  }
);

/**
 * Create the auth slice
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Reducers for synchronous state updates
     */
    
    // Clear all errors
    clearErrors: (state) => {
      state.error = null;
      state.loginError = null;
      state.registerError = null;
      state.profileError = null;
    },
    
    // Logout user (clear all auth data)
    // Note: Token storage clearing should be handled by TokenManager/SecureStorage service
    // This reducer only clears Redux state (localStorage doesn't exist in React Native)
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenExpiry = null;
      state.authMethod = null;
      state.lastLoginTime = null;
      state.onboardingIsNewAccount = null;
      
      // Note: Actual token storage clearing should be done by TokenManager/SecureStorage
      // when implementing full auth persistence. For now, we only clear Redux state.
    },
    
    // Set remember me preference
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload;
    },
    
    // Update user preferences
    updateUserPreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
        state.user.updatedAt = new Date();
      }
    },
    
    // Set authentication method
    setAuthMethod: (state, action: PayloadAction<AuthState['authMethod']>) => {
      state.authMethod = action.payload;
    },
  },
  
  /**
   * Extra reducers handle actions created by async thunks
   */
  extraReducers: (builder) => {
    builder
      // Handle checkAuthStatus actions
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          // User is authenticated, restore their session
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.tokenExpiry = action.payload.expiresAt.getTime();
          state.authMethod = action.payload.user.authProvider;
          state.lastLoginTime = Date.now();
          state.onboardingIsNewAccount = inferOnboardingIsNewAccount(
            action.payload.user,
            null,
          );
        } else {
          // No valid tokens, user is not authenticated
          state.isAuthenticated = false;
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.tokenExpiry = null;
          state.authMethod = null;
          state.onboardingIsNewAccount = null;
        }
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // User is not authenticated
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.tokenExpiry = null;
        state.authMethod = null;
        state.onboardingIsNewAccount = null;
        // Note: Tokens are cleared by the thunk, no need to clear here
      })
      
      // Handle loginUser actions
      .addCase(loginUser.pending, (state) => {
        state.isLoggingIn = true;
        state.loginError = null;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenExpiry = action.payload.expiresAt.getTime();
        state.authMethod = 'email';
        state.lastLoginTime = Date.now();
        state.loginError = null;
        state.onboardingIsNewAccount = false;
        
        // Note: Tokens are stored in SecureStore by the thunk before this reducer runs
        // No need to store tokens here - they're already in secure storage
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.isAuthenticated = false;
        state.loginError = action.payload as string || 'Login failed';
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
      
      // Handle registerUser actions
      .addCase(registerUser.pending, (state) => {
        state.isRegistering = true;
        state.registerError = null;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenExpiry = action.payload.expiresAt.getTime();
        state.authMethod = action.payload.user.authProvider;
        state.lastLoginTime = Date.now();
        state.registerError = null;
        state.onboardingIsNewAccount = true;
        
        // Note: Tokens are stored in SecureStore by the thunk before this reducer runs
        // No need to store tokens here - they're already in secure storage
        // User is automatically logged in after successful registration
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isRegistering = false;
        state.isAuthenticated = false;
        state.registerError = action.payload as string || 'Registration failed';
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
      })
      
      // Handle socialAuth actions
      .addCase(socialAuth.pending, (state) => {
        state.isLoggingIn = true;
        state.loginError = null;
      })
      .addCase(socialAuth.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenExpiry = action.payload.expiresAt.getTime();
        state.authMethod = action.payload.user.authProvider;
        state.lastLoginTime = Date.now();
        state.onboardingIsNewAccount = action.payload.isNewUser;
        // tokens already persisted in the thunk via SecureStore (same pattern as loginUser)
      })
      .addCase(socialAuth.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.loginError = action.payload as string;
      })
      
      // Handle updateUserProfile actions
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdatingProfile = true;
        state.profileError = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        if (state.user) {
          const { preferences, ...otherUpdates } = action.payload;
          state.user = { 
            ...state.user, 
            ...otherUpdates, 
            preferences: preferences ? { ...state.user.preferences, ...preferences } : state.user.preferences,
            updatedAt: new Date() 
          };
          
          // Update stored user data
          if (state.rememberMe) {
            localStorage.setItem('user', JSON.stringify(state.user));
          }
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.profileError = action.payload as string;
      })

      .addCase(patchUserSchedulePreferences.pending, (state) => {
        state.isUpdatingProfile = true;
        state.profileError = null;
      })
      .addCase(patchUserSchedulePreferences.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.profileError = null;
        state.user = deserializeUserThunkPayload(action.payload);
      })
      .addCase(patchUserSchedulePreferences.rejected, (state, action) => {
        state.isUpdatingProfile = false;
        state.profileError = (action.payload as string) || 'Schedule update failed';
      })

      .addCase(patchUserOnboardingCompleted.fulfilled, (state, action) => {
        state.user = deserializeUserThunkPayload(action.payload);
      })
      
      // Handle refreshAccessToken actions
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenExpiry = action.payload.expiresAt.getTime();
        
        // Update stored tokens
        if (state.rememberMe) {
          localStorage.setItem('accessToken', action.payload.accessToken);
          localStorage.setItem('refreshToken', action.payload.refreshToken);
          localStorage.setItem('tokenExpiry', action.payload.expiresAt.getTime().toString());
        }
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        // If token refresh fails, logout the user
        state.user = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.tokenExpiry = null;
        state.authMethod = null;
        
        // Clear stored tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
      });
  },
});

/**
 * Export actions and reducer
 */
export const {
  clearErrors,
  logout,
  setRememberMe,
  updateUserPreferences,
  setAuthMethod,
} = authSlice.actions;

export default authSlice.reducer;
