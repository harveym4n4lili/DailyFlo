# Onboarding & Authentication Integration Planning Document
## Overview
This document outlines the step-by-step plan for implementing authentication and onboarding flows in the DailyFlo app. Currently, authentication uses mock data and there are no onboarding screens. This integration will connect the frontend to the Django backend authentication API, enable secure user login/registration, and provide a smooth onboarding experience for new users.

### Current State
- **Redux Auth Slice**: `store/slices/auth/authSlice.ts` uses mock data for login/registration
- **API Service**: `services/api/auth.ts` contains all API methods but is not connected to Redux
- **Onboarding Screens**: No onboarding screens exist (splash, register, permissions, completion)
- **Token Storage**: No secure token storage implemented
- **Authentication Flow**: No real authentication flow - app goes directly to main screens
- **Data Flow**: UI → Redux → Mock Data (no backend connection, no real security)

### Target State
- **Redux Auth Slice**: Uses API service for all authentication operations
- **API Service**: Fully integrated with Redux async thunks
- **Onboarding Screens**: Complete onboarding flow with splash, registration, permissions, and completion screens
- **Token Storage**: Secure token storage using Expo SecureStore
- **Authentication Flow**: Complete flow from app launch → authentication check → onboarding (if new) → main app
- **Data Flow**: UI → Redux → API Service → Django Backend → Database → Secure Token Storage

### Key Concepts for First-Time Authentication/Onboarding Users
- **Authentication**: The process of verifying who a user is (like showing ID to enter a building)
- **Authorization**: Checking what a user is allowed to do (like checking permissions)
- **JWT Tokens**: Secure "passes" that prove a user is logged in (like a badge that expires)
- **Access Token**: Short-lived token (15 minutes) used for API requests
- **Refresh Token**: Long-lived token (7 days) used to get new access tokens
- **Onboarding**: The process of introducing new users to the app and collecting initial setup info
- **Secure Storage**: Encrypted storage on device for sensitive data like tokens
- **Social Authentication**: Using third-party providers (Google, Apple, Facebook) to verify identity
- **Token Refresh**: Automatically getting a new access token when the old one expires

---

## Integration Architecture

### Authentication Flow Diagram
```
App Launch
    ↓
Check for Stored Token (SecureStore)
    ↓
Token Exists?
    ├─ Yes → Validate Token → Valid?
    │          ├─ Yes → Load User Data → Main App
    │          └─ No → Clear Token → Show Login Screen
    └─ No → Show Login Screen
            ↓
User Chooses Auth Method
    ├─ Email/Password → Registration/Login Form
    └─ Social Provider → Provider Authentication
            ↓
Backend Validates Credentials
    ↓
Backend Returns User Data + Tokens
    ↓
Store Tokens Securely (SecureStore)
    ↓
Save User Data to Redux
    ↓
Check if First Time User
    ├─ Yes → Onboarding Flow
    │         ├─ Splash Screen
    │         ├─ Registration Screen (if needed)
    │         ├─ Permissions Screen
    │         └─ Completion Screen
    └─ No → Main App
```

### Component Responsibilities
- **Onboarding Screens**: Guide new users through initial setup
- **Authentication Screens**: Handle login and registration
- **Redux Auth Slice**: Manages authentication state and user data
- **Async Thunks**: Handle async operations (API calls) for auth
- **API Service**: Makes HTTP requests to Django backend
- **SecureStore**: Stores tokens securely on device
- **API Client**: Configures HTTP client with authentication tokens

---

## Implementation Steps

### Step 1: Set Up Secure Token Storage
**Purpose**: Create a secure way to store authentication tokens on the device

**Why This First**: Before we can authenticate users, we need a secure place to store their tokens. This is like having a safe to store important documents.

**Files to Create**:
- `services/auth/tokenStorage.ts`

**Changes Required**:
1. Install Expo SecureStore (if not already installed)
2. Create functions to store, retrieve, and delete tokens
3. Handle errors gracefully

**Code Implementation**:
```typescript
/**
 * Token Storage Service
 * 
 * This service handles secure storage of authentication tokens.
 * SecureStore encrypts data and stores it in the device's secure storage
 * (iOS Keychain or Android Keystore).
 */

import * as SecureStore from 'expo-secure-store';

// Constants for storage keys
// These are like labels for the "drawers" in our secure storage
const ACCESS_TOKEN_KEY = '@DailyFlo:accessToken';
const REFRESH_TOKEN_KEY = '@DailyFlo:refreshToken';
const TOKEN_EXPIRY_KEY = '@DailyFlo:tokenExpiry';

/**
 * Store access token securely
 * This is like putting a valuable item in a safe
 * 
 * @param token - The access token to store
 */
export async function storeAccessToken(token: string): Promise<void> {
  try {
    // Store the token in secure storage
    // SecureStore automatically encrypts the data
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store access token:', error);
    throw new Error('Failed to store access token securely');
  }
}

/**
 * Retrieve access token from secure storage
 * This is like getting an item out of a safe
 * 
 * @returns The access token or null if not found
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    // Retrieve the token from secure storage
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Failed to retrieve access token:', error);
    return null;
  }
}

/**
 * Store refresh token securely
 * 
 * @param token - The refresh token to store
 */
export async function storeRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store refresh token:', error);
    throw new Error('Failed to store refresh token securely');
  }
}

/**
 * Retrieve refresh token from secure storage
 * 
 * @returns The refresh token or null if not found
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Failed to retrieve refresh token:', error);
    return null;
  }
}

/**
 * Store token expiry timestamp
 * This helps us know when the token expires
 * 
 * @param expiryTimestamp - Unix timestamp when token expires
 */
export async function storeTokenExpiry(expiryTimestamp: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
  } catch (error) {
    console.error('Failed to store token expiry:', error);
  }
}

/**
 * Get token expiry timestamp
 * 
 * @returns The expiry timestamp or null if not found
 */
export async function getTokenExpiry(): Promise<number | null> {
  try {
    const expiryString = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
    return expiryString ? parseInt(expiryString, 10) : null;
  } catch (error) {
    console.error('Failed to retrieve token expiry:', error);
    return null;
  }
}

/**
 * Clear all stored tokens
 * This is like emptying the safe - used when logging out
 */
export async function clearAllTokens(): Promise<void> {
  try {
    // Remove all tokens from secure storage
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    throw new Error('Failed to clear tokens');
  }
}

/**
 * Check if user has valid stored tokens
 * This checks if tokens exist and haven't expired
 * 
 * @returns True if valid tokens exist, false otherwise
 */
export async function hasValidTokens(): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    const expiry = await getTokenExpiry();
    
    // If no token, return false
    if (!accessToken) return false;
    
    // If no expiry, assume token is valid (shouldn't happen in production)
    if (!expiry) return true;
    
    // Check if token has expired
    // expiry is a Unix timestamp (milliseconds since 1970)
    const now = Date.now();
    return now < expiry;
  } catch (error) {
    console.error('Failed to check token validity:', error);
    return false;
  }
}
```

**Testing**:
- Test storing and retrieving tokens
- Test clearing tokens
- Test token expiry checking
- Verify tokens are encrypted (check device storage)
- Test error handling (simulate storage failures)

---

### Step 2: Update API Client to Use Stored Tokens
**Purpose**: Make sure API requests automatically include authentication tokens

**Why This Second**: Once we can store tokens, we need to use them in API requests. This is like showing your ID badge when entering a building.

**Files to Modify**:
- `services/api/client.ts`

**Changes Required**:
1. Import token storage functions
2. Update request interceptor to add token to headers
3. Handle token refresh when token expires
4. Handle 401 errors (unauthorized) by attempting token refresh

**Code Implementation**:
```typescript
/**
 * API Client Configuration
 * 
 * This file configures the HTTP client (Axios) to work with our backend.
 * It automatically adds authentication tokens to requests and handles
 * token refresh when tokens expire.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, storeAccessToken, storeRefreshToken } from '../auth/tokenStorage';
import { store } from '@/store';
import { refreshToken } from '@/store/slices/auth/authSlice';

// Base URL for the Django backend API
// Change this to your backend URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api'  // Development
  : 'https://api.dailyflo.com/api';  // Production

/**
 * Create axios instance with default configuration
 * Axios is a library that makes HTTP requests easier
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * This runs before every API request
 * It automatically adds the authentication token to the request headers
 * 
 * Think of it like a security guard checking your ID before you enter
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get the access token from secure storage
    const token = await getAccessToken();
    
    // If we have a token, add it to the request headers
    // The backend will check this token to verify the user is authenticated
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    // If something goes wrong before the request, reject it
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * This runs after every API response
 * It handles token refresh when tokens expire
 * 
 * Think of it like renewing your ID badge when it expires
 */
apiClient.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If we get a 401 (Unauthorized) error, the token might be expired
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Mark this request as retried so we don't loop forever
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshTokenValue = await getRefreshToken();
        
        if (!refreshTokenValue) {
          // No refresh token, user needs to log in again
          throw new Error('No refresh token available');
        }
        
        // Call the refresh token endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshTokenValue,
        });
        
        const { access, refresh: newRefreshToken } = response.data;
        
        // Store the new tokens
        await storeAccessToken(access);
        if (newRefreshToken) {
          await storeRefreshToken(newRefreshToken);
        }
        
        // Update the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        
        // Retry the original request with the new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        await clearAllTokens();
        // Dispatch logout action to clear Redux state
        store.dispatch({ type: 'auth/logout' });
        return Promise.reject(refreshError);
      }
    }
    
    // For other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Testing**:
- Test API requests include token in headers
- Test token refresh when token expires
- Test 401 error handling
- Test logout when refresh fails
- Verify requests work without token (for public endpoints)

---

### Step 3: Connect Auth API Service to Redux - Email/Password Login
**Purpose**: Replace mock login with real API call

**Why This Third**: Email/password is the simplest authentication method, so we start here. Once this works, we can add social auth.

**Files to Modify**:
- `store/slices/auth/authSlice.ts`

**Changes Required**:
1. Import auth API service
2. Replace mock login logic with real API call
3. Transform API response to match User interface
4. Store tokens securely after successful login
5. Handle errors gracefully

**Before (Current)**:
```typescript
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginUserInput, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // Returns mock user data
      const mockUser: User = { ... };
      return { user: mockUser, ...mockTokens };
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);
```

**After (Target)**:
```typescript
import authApiService from '@/services/api/auth';
import { storeAccessToken, storeRefreshToken, storeTokenExpiry } from '@/services/auth/tokenStorage';

/**
 * Login with email and password
 * This is an async thunk - a special Redux function that handles async operations
 * 
 * @param credentials - User's email and password
 * @returns User data and tokens if successful, error if failed
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginUserInput, { rejectWithValue }) => {
    try {
      // Call the API service to login
      // The API service makes the HTTP request to Django backend
      const response = await authApiService.login({
        email: credentials.email,
        password: credentials.password,
      });
      
      // Transform API response to match our User interface
      // Backend returns snake_case (user_id), frontend uses camelCase (userId)
      const user: User = transformApiUserToUser(response.user || response);
      
      // Extract tokens from response
      // Backend returns tokens in different formats, handle both
      const accessToken = response.access || response.tokens?.access || response.data?.access;
      const refreshToken = response.refresh || response.tokens?.refresh || response.data?.refresh;
      
      if (!accessToken || !refreshToken) {
        throw new Error('Tokens not received from server');
      }
      
      // Store tokens securely
      // This saves tokens to device secure storage
      await storeAccessToken(accessToken);
      await storeRefreshToken(refreshToken);
      
      // Calculate and store token expiry
      // JWT tokens contain expiry info, but we'll set it to 15 minutes from now
      // (matching backend configuration)
      const expiryTime = Date.now() + (15 * 60 * 1000); // 15 minutes
      await storeTokenExpiry(expiryTime);
      
      // Return user data and tokens
      // Redux will automatically update the state with this data
      return {
        user,
        accessToken,
        refreshToken,
        expiresAt: new Date(expiryTime),
      };
    } catch (error: any) {
      // Handle different types of errors
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with an error
        const status = error.response.status;
        if (status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (status === 422) {
          errorMessage = error.response.data?.message || 'Invalid input';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Network error. Please check your connection.';
      }
      
      // Return error to Redux
      // Redux will store this in the error state
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Helper function to transform API user response to User interface
 * Backend uses snake_case, frontend uses camelCase
 * 
 * @param apiUser - User data from API (snake_case)
 * @returns User object matching frontend interface (camelCase)
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
    lastLogin: apiUser.last_login ? new Date(apiUser.last_login) : new Date(),
    preferences: transformApiPreferencesToPreferences(apiUser.preferences || {}),
    softDeleted: apiUser.soft_deleted || apiUser.softDeleted || false,
    createdAt: apiUser.created_at ? new Date(apiUser.created_at) : new Date(),
    updatedAt: apiUser.updated_at ? new Date(apiUser.updated_at) : new Date(),
  };
}

/**
 * Helper function to transform API preferences to Preferences interface
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
    showCompletedTasks: apiPrefs.show_completed_tasks || apiPrefs.showCompletedTasks ?? true,
    sortTasksBy: apiPrefs.sort_tasks_by || apiPrefs.sortTasksBy || 'dueDate',
    analyticsEnabled: apiPrefs.analytics_enabled || apiPrefs.analyticsEnabled ?? true,
    crashReportingEnabled: apiPrefs.crash_reporting_enabled || apiPrefs.crashReportingEnabled ?? true,
  };
}
```

**Update Redux Reducer**:
```typescript
extraReducers: (builder) => {
  builder
    // Handle login pending state (when login is in progress)
    .addCase(loginUser.pending, (state) => {
      state.isLoggingIn = true;
      state.loginError = null;
      state.error = null;
    })
    // Handle successful login
    .addCase(loginUser.fulfilled, (state, action) => {
      state.isLoggingIn = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.tokenExpiry = action.payload.expiresAt.getTime();
      state.lastLoginTime = Date.now();
      state.loginError = null;
    })
    // Handle login failure
    .addCase(loginUser.rejected, (state, action) => {
      state.isLoggingIn = false;
      state.isAuthenticated = false;
      state.loginError = action.payload as string || 'Login failed';
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    });
}
```

**Testing**:
- Test successful login with valid credentials
- Test login with invalid email
- Test login with invalid password
- Test network error handling
- Verify tokens are stored securely
- Verify user data is saved to Redux state
- Test error messages are user-friendly

---

### Step 4: Connect Auth API Service to Redux - User Registration
**Purpose**: Replace mock registration with real API call

**Why This Fourth**: Registration is similar to login, so we implement it right after login.

**Files to Modify**:
- `store/slices/auth/authSlice.ts`

**Changes Required**:
1. Replace mock registration logic with real API call
2. Transform API response to match User interface
3. Store tokens securely after successful registration
4. Handle validation errors from backend
5. Auto-login user after registration

**After (Target)**:
```typescript
/**
 * Register a new user
 * This creates a new account and automatically logs the user in
 * 
 * @param userData - User registration information
 * @returns User data and tokens if successful, error if failed
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterUserInput, { rejectWithValue }) => {
    try {
      // Call the API service to register
      const response = await authApiService.register({
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
      });
      
      // Transform API response
      const user: User = transformApiUserToUser(response.user || response);
      
      // Extract tokens
      const accessToken = response.access || response.tokens?.access || response.data?.access;
      const refreshToken = response.refresh || response.tokens?.refresh || response.data?.refresh;
      
      if (!accessToken || !refreshToken) {
        throw new Error('Tokens not received from server');
      }
      
      // Store tokens securely
      await storeAccessToken(accessToken);
      await storeRefreshToken(refreshToken);
      
      // Calculate and store token expiry
      const expiryTime = Date.now() + (15 * 60 * 1000); // 15 minutes
      await storeTokenExpiry(expiryTime);
      
      // Return user data and tokens
      return {
        user,
        accessToken,
        refreshToken,
        expiresAt: new Date(expiryTime),
      };
    } catch (error: any) {
      // Handle different types of errors
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          // Bad request - usually validation errors
          if (data.email) {
            errorMessage = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
          } else if (data.password) {
            errorMessage = `Password: ${Array.isArray(data.password) ? data.password[0] : data.password}`;
          } else {
            errorMessage = data.message || 'Invalid registration data';
          }
        } else if (status === 409) {
          // Conflict - email already exists
          errorMessage = 'An account with this email already exists';
        } else if (status === 422) {
          errorMessage = data.message || 'Invalid input';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);
```

**Update Redux Reducer**:
```typescript
extraReducers: (builder) => {
  builder
    // Handle registration pending state
    .addCase(registerUser.pending, (state) => {
      state.isRegistering = true;
      state.registerError = null;
      state.error = null;
    })
    // Handle successful registration
    .addCase(registerUser.fulfilled, (state, action) => {
      state.isRegistering = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.tokenExpiry = action.payload.expiresAt.getTime();
      state.lastLoginTime = Date.now();
      state.registerError = null;
    })
    // Handle registration failure
    .addCase(registerUser.rejected, (state, action) => {
      state.isRegistering = false;
      state.isAuthenticated = false;
      state.registerError = action.payload as string || 'Registration failed';
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    });
}
```

**Testing**:
- Test successful registration with valid data
- Test registration with invalid email format
- Test registration with weak password
- Test registration with existing email
- Test network error handling
- Verify tokens are stored securely
- Verify user is automatically logged in after registration

---

### Step 5: Implement Token Refresh Logic
**Purpose**: Automatically refresh expired access tokens

**Why This Fifth**: Tokens expire, so we need to refresh them automatically without bothering the user.

**Files to Modify**:
- `store/slices/auth/authSlice.ts`

**Changes Required**:
1. Create refreshToken async thunk
2. Call refresh token API endpoint
3. Update stored tokens
4. Handle refresh failures (logout user)

**Code Implementation**:
```typescript
/**
 * Refresh access token
 * This gets a new access token when the old one expires
 * Happens automatically in the background
 * 
 * @returns New access token if successful, error if failed
 */
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // Get refresh token from secure storage
      const refreshTokenValue = await getRefreshToken();
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      // Call the API service to refresh token
      const response = await authApiService.refreshToken({
        refresh: refreshTokenValue,
      });
      
      // Extract new tokens
      const accessToken = response.access || response.data?.access;
      const newRefreshToken = response.refresh || response.data?.refresh || refreshTokenValue;
      
      if (!accessToken) {
        throw new Error('New access token not received');
      }
      
      // Store new tokens
      await storeAccessToken(accessToken);
      if (newRefreshToken !== refreshTokenValue) {
        await storeRefreshToken(newRefreshToken);
      }
      
      // Calculate and store token expiry
      const expiryTime = Date.now() + (15 * 60 * 1000); // 15 minutes
      await storeTokenExpiry(expiryTime);
      
      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(expiryTime),
      };
    } catch (error: any) {
      // If refresh fails, user needs to log in again
      // Clear tokens and logout
      await clearAllTokens();
      dispatch(logoutUser());
      
      let errorMessage = 'Session expired. Please log in again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);
```

**Update Redux Reducer**:
```typescript
extraReducers: (builder) => {
  builder
    .addCase(refreshToken.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.tokenExpiry = action.payload.expiresAt.getTime();
    })
    .addCase(refreshToken.rejected, (state) => {
      // Token refresh failed - user will be logged out
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    });
}
```

**Testing**:
- Test successful token refresh
- Test refresh with expired refresh token
- Test refresh with invalid refresh token
- Test network error during refresh
- Verify new tokens are stored
- Verify user is logged out if refresh fails

---

### Step 6: Implement Check Auth Status on App Launch
**Purpose**: Check if user is already logged in when app starts

**Why This Sixth**: Users shouldn't have to log in every time they open the app. We check if they're already logged in.

**Files to Modify**:
- `store/slices/auth/authSlice.ts`
- `app/_layout.tsx` (root layout)

**Changes Required**:
1. Create checkAuthStatus async thunk
2. Check for stored tokens
3. Validate token with backend (optional - can skip for performance)
4. Load user data if token is valid
5. Clear tokens if invalid

**Code Implementation**:
```typescript
/**
 * Check authentication status on app launch
 * This checks if user has valid stored tokens and loads user data
 * 
 * @returns User data if authenticated, null if not
 */
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      // Check if we have valid tokens stored
      const hasValid = await hasValidTokens();
      
      if (!hasValid) {
        // No valid tokens, user is not authenticated
        return null;
      }
      
      // Get tokens from storage
      const accessToken = await getAccessToken();
      const refreshToken = await getRefreshToken();
      const expiry = await getTokenExpiry();
      
      if (!accessToken || !refreshToken) {
        // Tokens missing, clear everything
        await clearAllTokens();
        return null;
      }
      
      // Optionally validate token with backend
      // This makes an API call to verify the token is still valid
      // You can skip this for faster app launch, but it's more secure
      try {
        // Call a lightweight endpoint to verify token
        // Using the user profile endpoint as it's lightweight
        const response = await authApiService.getProfile();
        const user = transformApiUserToUser(response.user || response);
        
        return {
          user,
          accessToken,
          refreshToken,
          expiresAt: expiry ? new Date(expiry) : new Date(Date.now() + 15 * 60 * 1000),
        };
      } catch (error: any) {
        // Token validation failed, try to refresh
        if (error.response?.status === 401) {
          // Token is invalid, try to refresh
          const refreshResponse = await authApiService.refreshToken({
            refresh: refreshToken,
          });
          
          const newAccessToken = refreshResponse.access || refreshResponse.data?.access;
          const newRefreshToken = refreshResponse.refresh || refreshResponse.data?.refresh || refreshToken;
          
          if (newAccessToken) {
            await storeAccessToken(newAccessToken);
            if (newRefreshToken !== refreshToken) {
              await storeRefreshToken(newRefreshToken);
            }
            
            // Try to get user profile again with new token
            const profileResponse = await authApiService.getProfile();
            const user = transformApiUserToUser(profileResponse.user || profileResponse);
            
            return {
              user,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
              expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            };
          }
        }
        
        // If refresh fails, clear tokens
        await clearAllTokens();
        return null;
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      // On error, assume not authenticated
      await clearAllTokens();
      return null;
    }
  }
);
```

**Update Root Layout**:
```typescript
// In app/_layout.tsx
import { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { checkAuthStatus } from '@/store/slices/auth/authSlice';

export default function RootLayout() {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Check auth status when app launches
    dispatch(checkAuthStatus());
  }, [dispatch]);
  
  // ... rest of layout code
}
```

**Testing**:
- Test app launch with valid tokens
- Test app launch with expired tokens
- Test app launch with no tokens
- Test token refresh on app launch
- Test network error during check
- Verify user data loads correctly

---

### Step 7: Implement Logout Functionality
**Purpose**: Allow users to log out and clear their session

**Why This Seventh**: Users need a way to log out and switch accounts.

**Files to Modify**:
- `store/slices/auth/authSlice.ts`

**Changes Required**:
1. Create logoutUser async thunk
2. Call logout API endpoint (optional - invalidates token on server)
3. Clear tokens from secure storage
4. Clear Redux state
5. Redirect to login screen

**Code Implementation**:
```typescript
/**
 * Logout user
 * This clears all authentication data and logs the user out
 * 
 * @returns Nothing (just clears state)
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Optionally call backend to invalidate token
      // This is good practice but not strictly necessary
      try {
        const refreshTokenValue = await getRefreshToken();
        if (refreshTokenValue) {
          // Call logout endpoint to invalidate token on server
          await authApiService.logout({
            refresh: refreshTokenValue,
          });
        }
      } catch (error) {
        // If logout API call fails, still proceed with local logout
        console.error('Failed to call logout API:', error);
      }
      
      // Clear all tokens from secure storage
      await clearAllTokens();
      
      // Return success (state will be cleared by reducer)
      return null;
    } catch (error) {
      // Even if something fails, clear tokens locally
      await clearAllTokens();
      return rejectWithValue('Logout failed');
    }
  }
);
```

**Update Redux Reducer**:
```typescript
extraReducers: (builder) => {
  builder
    .addCase(logoutUser.fulfilled, (state) => {
      // Reset all auth state to initial values
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenExpiry = null;
      state.lastLoginTime = null;
      state.authMethod = null;
      state.error = null;
      state.loginError = null;
      state.registerError = null;
    });
}

// Also add a synchronous logout action for immediate state clearing
export const { clearAuthState } = authSlice.actions;
```

**Testing**:
- Test successful logout
- Test logout clears tokens
- Test logout clears Redux state
- Test logout API call (if implemented)
- Verify user is redirected to login screen

---

### Step 8: Create Splash Screen
**Purpose**: Show a loading screen while checking authentication status

**Why This Eighth**: Users need visual feedback while we check if they're logged in.

**Files to Create**:
- `app/(onboarding)/splash.tsx`

**Code Implementation**:
```typescript
/**
 * Splash Screen
 * 
 * This is the first screen users see when the app launches.
 * It shows while we check if the user is already logged in.
 * 
 * Flow:
 * 1. Show splash screen
 * 2. Check authentication status
 * 3. If authenticated → go to main app
 * 4. If not authenticated → go to login/onboarding
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store';
import { checkAuthStatus } from '@/store/slices/auth/authSlice';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function SplashScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  
  useEffect(() => {
    // Check authentication status when screen loads
    dispatch(checkAuthStatus());
  }, [dispatch]);
  
  useEffect(() => {
    // Navigate based on authentication status
    if (!isLoading) {
      if (isAuthenticated) {
        // User is logged in, go to main app
        router.replace('/(tabs)');
      } else {
        // User is not logged in, go to registration/login screen
        router.replace('/(onboarding)/register');
      }
    }
  }, [isAuthenticated, isLoading, router]);
  
  return (
    <View style={styles.container}>
      {/* App Logo/Branding */}
      <Text style={styles.appName}>DailyFlo</Text>
      <Text style={styles.tagline}>Your day, simplified and in flow</Text>
      
      {/* Loading Indicator */}
      <ActivityIndicator 
        size="large" 
        color={themeColors.primary()} 
        style={styles.loader}
      />
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.background.primary(),
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: themeColors.text.primary(),
    marginBottom: 8,
    ...typography.heading1,
  },
  tagline: {
    fontSize: 16,
    color: themeColors.text.secondary(),
    marginBottom: 48,
    ...typography.body,
  },
  loader: {
    marginTop: 24,
  },
});
```

**Testing**:
- Test splash screen displays correctly
- Test navigation to main app when authenticated
- Test navigation to login when not authenticated
- Test loading indicator shows
- Verify smooth transitions

---

### Step 9: Create Registration/Login Screen
**Purpose**: Allow users to register or log in

**Why This Ninth**: Users need a way to create accounts and log in.

**Files to Create**:
- `app/(onboarding)/register.tsx`

**Code Implementation**:
```typescript
/**
 * Registration/Login Screen
 * 
 * This screen allows users to:
 * - Register a new account (email/password)
 * - Log in to existing account
 * - Use social authentication (Google, Apple, Facebook)
 * 
 * Flow:
 * 1. User enters email/password or chooses social provider
 * 2. Submit credentials
 * 3. On success → check if first time user → onboarding or main app
 * 4. On error → show error message
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, registerUser } from '@/store/slices/auth/authSlice';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoggingIn, isRegistering, loginError, registerError } = useAppSelector((state) => state.auth);
  
  const [isLoginMode, setIsLoginMode] = useState(true); // Toggle between login and register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  
  const isLoading = isLoggingIn || isRegistering;
  const error = loginError || registerError;
  
  /**
   * Handle form submission
   * Validates input and calls appropriate action (login or register)
   */
  const handleSubmit = async () => {
    // Basic validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }
    
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    
    if (!isLoginMode) {
      // Registration mode
      if (!firstName.trim()) {
        Alert.alert('Error', 'Please enter your first name');
        return;
      }
      
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      
      // Dispatch register action
      const result = await dispatch(registerUser({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }));
      
      if (registerUser.fulfilled.match(result)) {
        // Registration successful
        // Check if this is first time user (you can add logic here)
        // For now, go to permissions screen
        router.replace('/(onboarding)/permissions');
      }
    } else {
      // Login mode
      const result = await dispatch(loginUser({
        email: email.trim(),
        password,
      }));
      
      if (loginUser.fulfilled.match(result)) {
        // Login successful
        // Check if this is first time user
        // For now, go to main app (or permissions if first time)
        router.replace('/(tabs)');
      }
    }
  };
  
  /**
   * Handle social authentication
   * This will be implemented in a later step
   */
  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    Alert.alert('Coming Soon', `${provider} authentication will be available soon`);
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {isLoginMode 
              ? 'Log in to continue' 
              : 'Sign up to get started'}
          </Text>
        </View>
        
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Form */}
        <View style={styles.form}>
          {!isLoginMode && (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor={themeColors.text.tertiary()}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor={themeColors.text.tertiary()}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={themeColors.text.tertiary()}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={themeColors.text.tertiary()}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
          
          {!isLoginMode && (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={themeColors.text.tertiary()}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />
          )}
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading 
                ? (isLoginMode ? 'Logging in...' : 'Creating account...')
                : (isLoginMode ? 'Log In' : 'Sign Up')}
            </Text>
          </TouchableOpacity>
          
          {/* Toggle Mode */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsLoginMode(!isLoginMode)}
            disabled={isLoading}
          >
            <Text style={styles.toggleButtonText}>
              {isLoginMode 
                ? "Don't have an account? Sign up"
                : 'Already have an account? Log in'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Social Auth Section */}
        <View style={styles.socialSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          
          {/* Social Auth Buttons */}
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialAuth('google')}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth('apple')}
              disabled={isLoading}
            >
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialAuth('facebook')}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>Continue with Facebook</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background.primary(),
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: themeColors.text.primary(),
    marginBottom: 8,
    ...typography.heading1,
  },
  subtitle: {
    fontSize: 16,
    color: themeColors.text.secondary(),
    ...typography.body,
  },
  errorContainer: {
    backgroundColor: themeColors.error.background(),
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: themeColors.error.text(),
    fontSize: 14,
    ...typography.body,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: themeColors.background.secondary(),
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: themeColors.text.primary(),
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.border.primary(),
    ...typography.body,
  },
  submitButton: {
    backgroundColor: themeColors.primary(),
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: themeColors.primaryContrast(),
    fontSize: 16,
    fontWeight: '600',
    ...typography.button,
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: themeColors.primary(),
    fontSize: 14,
    ...typography.body,
  },
  socialSection: {
    marginTop: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: themeColors.border.primary(),
  },
  dividerText: {
    marginHorizontal: 16,
    color: themeColors.text.secondary(),
    fontSize: 14,
    ...typography.body,
  },
  socialButton: {
    backgroundColor: themeColors.background.secondary(),
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.border.primary(),
  },
  socialButtonText: {
    color: themeColors.text.primary(),
    fontSize: 16,
    fontWeight: '500',
    ...typography.body,
  },
});
```

**Testing**:
- Test registration with valid data
- Test registration with invalid data
- Test login with valid credentials
- Test login with invalid credentials
- Test form validation
- Test error messages display correctly
- Test loading states
- Test mode toggle (login/register)

---

### Step 10: Create Permissions Screen
**Purpose**: Request necessary permissions from users (notifications, etc.)

**Why This Tenth**: Apps need permissions for features like notifications. We ask for them during onboarding.

**Files to Create**:
- `app/(onboarding)/permissions.tsx`

**Code Implementation**:
```typescript
/**
 * Permissions Screen
 * 
 * This screen requests necessary permissions from users.
 * Currently requests notification permissions.
 * 
 * Flow:
 * 1. Explain why permissions are needed
 * 2. Request permission
 * 3. Handle granted/denied states
 * 4. Continue to completion screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function PermissionsScreen() {
  const router = useRouter();
  const [notificationPermission, setNotificationPermission] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  
  /**
   * Request notification permissions
   * This asks the user for permission to send notifications
   */
  const requestNotificationPermission = async () => {
    try {
      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        setNotificationPermission('granted');
        Alert.alert('Permission Granted', 'You will receive notifications for your tasks');
      } else {
        setNotificationPermission('denied');
        Alert.alert(
          'Permission Denied',
          'You can enable notifications later in Settings'
        );
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      Alert.alert('Error', 'Failed to request permission');
    }
  };
  
  /**
   * Continue to next screen
   * User can skip permissions and continue
   */
  const handleContinue = () => {
    router.replace('/(onboarding)/completion');
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Enable Notifications</Text>
        <Text style={styles.subtitle}>
          Get reminders for your tasks and never miss a deadline
        </Text>
      </View>
      
      {/* Permission Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {notificationPermission === 'undetermined' && 'Tap the button below to enable notifications'}
          {notificationPermission === 'granted' && '✓ Notifications enabled'}
          {notificationPermission === 'denied' && 'Notifications disabled (can be enabled in Settings)'}
        </Text>
      </View>
      
      {/* Request Button */}
      {notificationPermission === 'undetermined' && (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={requestNotificationPermission}
        >
          <Text style={styles.requestButtonText}>Enable Notifications</Text>
        </TouchableOpacity>
      )}
      
      {/* Continue Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>
          {notificationPermission === 'undetermined' ? 'Skip for Now' : 'Continue'}
        </Text>
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
    padding: 24,
    backgroundColor: themeColors.background.primary(),
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: themeColors.text.primary(),
    marginBottom: 16,
    textAlign: 'center',
    ...typography.heading1,
  },
  subtitle: {
    fontSize: 16,
    color: themeColors.text.secondary(),
    textAlign: 'center',
    lineHeight: 24,
    ...typography.body,
  },
  statusContainer: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: themeColors.background.secondary(),
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: themeColors.text.secondary(),
    textAlign: 'center',
    ...typography.body,
  },
  requestButton: {
    backgroundColor: themeColors.primary(),
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  requestButtonText: {
    color: themeColors.primaryContrast(),
    fontSize: 16,
    fontWeight: '600',
    ...typography.button,
  },
  continueButton: {
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: themeColors.primary(),
    fontSize: 16,
    fontWeight: '500',
    ...typography.body,
  },
});
```

**Testing**:
- Test permission request on iOS
- Test permission request on Android
- Test granted state
- Test denied state
- Test skip functionality
- Verify navigation to next screen

---

### Step 11: Create Onboarding Completion Screen
**Purpose**: Welcome users and guide them to create their first task

**Why This Eleventh**: Users need a completion screen that welcomes them and guides next steps.

**Files to Create**:
- `app/(onboarding)/completion.tsx`

**Code Implementation**:
```typescript
/**
 * Onboarding Completion Screen
 * 
 * This is the final screen in the onboarding flow.
 * Welcomes users and guides them to create their first task.
 * 
 * Flow:
 * 1. Show welcome message
 * 2. Option to create first task
 * 3. Navigate to main app
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function CompletionScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);
  
  /**
   * Navigate to main app
   * User can skip creating a task and go straight to the app
   */
  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };
  
  /**
   * Navigate to task creation
   * Opens the task creation modal
   */
  const handleCreateTask = () => {
    // Navigate to main app, which will show task creation modal
    // You can pass a parameter to indicate first-time user
    router.replace({
      pathname: '/(tabs)/today',
      params: { showTaskCreation: 'true' },
    });
  };
  
  return (
    <View style={styles.container}>
      {/* Success Icon/Animation */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✓</Text>
      </View>
      
      {/* Welcome Message */}
      <View style={styles.content}>
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          Welcome to DailyFlo. Let's get started by creating your first task.
        </Text>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCreateTask}
        >
          <Text style={styles.primaryButtonText}>Create Your First Task</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleGetStarted}
        >
          <Text style={styles.secondaryButtonText}>Explore the App</Text>
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
    padding: 24,
    backgroundColor: themeColors.background.primary(),
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.success.background(),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    color: themeColors.success.text(),
    fontWeight: 'bold',
  },
  content: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: themeColors.text.primary(),
    marginBottom: 16,
    textAlign: 'center',
    ...typography.heading1,
  },
  subtitle: {
    fontSize: 16,
    color: themeColors.text.secondary(),
    textAlign: 'center',
    lineHeight: 24,
    ...typography.body,
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: themeColors.primary(),
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: themeColors.primaryContrast(),
    fontSize: 16,
    fontWeight: '600',
    ...typography.button,
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: themeColors.primary(),
    fontSize: 16,
    fontWeight: '500',
    ...typography.body,
  },
});
```

**Testing**:
- Test completion screen displays correctly
- Test "Create First Task" button
- Test "Explore App" button
- Verify navigation works correctly

---

### Step 12: Set Up Onboarding Navigation Flow
**Purpose**: Configure navigation to show onboarding screens for new users

**Why This Twelfth**: We need to route users through onboarding screens in the correct order.

**Files to Modify**:
- `app/(onboarding)/_layout.tsx`

**Code Implementation**:
```typescript
/**
 * Onboarding Layout
 * 
 * This layout wraps all onboarding screens.
 * It handles navigation between splash, register, permissions, and completion screens.
 */

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide header for onboarding screens
        animation: 'slide_from_right', // Smooth slide animation
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="register" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="completion" />
    </Stack>
  );
}
```

**Update Root Layout**:
```typescript
// In app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store';
import { checkAuthStatus } from '@/store/slices/auth/authSlice';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  useEffect(() => {
    // Check authentication status on app launch
    const checkAuth = async () => {
      await dispatch(checkAuthStatus());
      setIsCheckingAuth(false);
    };
    
    checkAuth();
  }, [dispatch]);
  
  useEffect(() => {
    if (isCheckingAuth) return;
    
    const inAuthGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';
    
    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated and not in onboarding, redirect to onboarding
      router.replace('/(onboarding)/splash');
    } else if (isAuthenticated && inAuthGroup) {
      // User is authenticated but in onboarding, redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isCheckingAuth, segments]);
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
```

**Testing**:
- Test navigation flow for new users
- Test navigation flow for returning users
- Test navigation between onboarding screens
- Verify proper routing based on auth status

---

## Data Transformation Reference

### API Response Format → User Interface
The API returns snake_case (e.g., `user_id`) while frontend uses camelCase (e.g., `userId`). Transform function maps all fields:

```typescript
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
    lastLogin: apiUser.last_login ? new Date(apiUser.last_login) : new Date(),
    preferences: transformApiPreferencesToPreferences(apiUser.preferences || {}),
    softDeleted: apiUser.soft_deleted || apiUser.softDeleted || false,
    createdAt: apiUser.created_at ? new Date(apiUser.created_at) : new Date(),
    updatedAt: apiUser.updated_at ? new Date(apiUser.updated_at) : new Date(),
  };
}
```

### User Interface → API Request Format
Transform frontend format to API request format:

```typescript
function transformUserInputToApiRequest(input: RegisterUserInput | LoginUserInput): any {
  return {
    email: input.email,
    password: input.password,
    // For registration
    ...(input.firstName && { first_name: input.firstName }),
    ...(input.lastName && { last_name: input.lastName }),
  };
}
```

---

## Error Handling Strategy

### Error Types and Responses
1. **Network Errors**: No internet connection
   - Show: "Network error. Please check your connection"
   - Action: Allow retry

2. **Authentication Errors (401)**: Invalid credentials
   - Show: "Invalid email or password"
   - Action: Clear form, allow retry

3. **Validation Errors (400/422)**: Invalid input
   - Show: Specific field errors from API response
   - Action: Highlight invalid fields

4. **Conflict Errors (409)**: Email already exists
   - Show: "An account with this email already exists"
   - Action: Suggest login instead

5. **Server Errors (500)**: Backend issue
   - Show: "Server error. Please try again later"
   - Action: Allow retry

---

## Security Considerations

### Token Security
- **Secure Storage**: Tokens stored in Expo SecureStore (encrypted)
- **Token Expiry**: Access tokens expire in 15 minutes
- **Token Refresh**: Automatic refresh when access token expires
- **Token Invalidation**: Tokens invalidated on logout

### Password Security
- **Minimum Length**: 8 characters required
- **Server Validation**: Backend validates password strength
- **No Plaintext Storage**: Passwords never stored in plaintext
- **Secure Transmission**: HTTPS for all API requests

### User Data Protection
- **Data Isolation**: User data separated by user ID
- **Input Validation**: All user input validated before sending to API
- **Error Messages**: Don't expose sensitive information in errors

---

## Testing and Validation

### Testing Checklist
- [ ] Token storage and retrieval works
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Registration with valid data
- [ ] Registration with invalid data
- [ ] Token refresh works automatically
- [ ] Logout clears all data
- [ ] App launch checks auth status correctly
- [ ] Splash screen shows correctly
- [ ] Registration screen works
- [ ] Permissions screen requests permissions
- [ ] Completion screen navigates correctly
- [ ] Onboarding flow completes successfully
- [ ] Returning users skip onboarding
- [ ] Network errors handled gracefully
- [ ] Token expiry handled correctly

### Manual Testing Steps
1. Start Django backend server
2. Ensure backend auth endpoints are working
3. Test registration flow
4. Test login flow
5. Test token refresh
6. Test logout
7. Test app launch with stored tokens
8. Test app launch without tokens
9. Test onboarding flow for new users
10. Test returning user flow
11. Test error scenarios (network errors, invalid credentials)

---

## Success Criteria

### Functional Requirements
- [ ] Users can register with email/password
- [ ] Users can log in with email/password
- [ ] Tokens are stored securely
- [ ] Tokens refresh automatically
- [ ] Users can log out
- [ ] App checks auth status on launch
- [ ] Onboarding flow works for new users
- [ ] Returning users skip onboarding
- [ ] Error handling provides clear feedback

### Technical Requirements
- [ ] No console errors
- [ ] TypeScript types are correct
- [ ] Code follows project conventions
- [ ] Comments explain complex logic
- [ ] Error messages are user-friendly
- [ ] Tokens stored securely
- [ ] API integration works correctly

---

## Next Steps After Integration

Once authentication and onboarding are complete:

1. **Social Authentication**: Implement Google, Apple, Facebook login
2. **Password Reset**: Add forgot password flow
3. **Email Verification**: Add email verification (optional)
4. **Biometric Auth**: Add optional biometric app protection
5. **Profile Management**: Complete user profile editing
6. **Settings Integration**: Connect settings to user preferences

---

## Resources and References

### Key Files
- **Redux Auth Slice**: `frontend/dailyflo/store/slices/auth/authSlice.ts`
- **Auth API Service**: `frontend/dailyflo/services/api/auth.ts`
- **Token Storage**: `frontend/dailyflo/services/auth/tokenStorage.ts`
- **API Client**: `frontend/dailyflo/services/api/client.ts`
- **User Types**: `frontend/dailyflo/types/common/User.ts`

### Documentation
- **API Endpoints**: `docs/technical-design/api/endpoints.md`
- **Authentication Plan**: `docs/technical-design/authentication/plan/authentication.md`
- **Database Models**: `docs/technical-design/database/models.md`

### External Resources
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Redux Toolkit Async Thunks](https://redux-toolkit.js.org/api/createAsyncThunk)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

---

*Last updated: 2025-01-20*
