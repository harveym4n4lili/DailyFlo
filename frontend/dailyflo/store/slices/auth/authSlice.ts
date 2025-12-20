/**
 * Auth Slice - Redux State Management for Authentication
 * 
 * This file defines the Redux slice for managing authentication-related state.
 * It handles user login, logout, registration, and session management.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, RegisterUserInput, LoginUserInput, SocialAuthInput, UpdateUserInput } from '../../../types';

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
};

/**
 * Async Thunks - Functions that handle async operations
 */

// Check if user is already authenticated (on app startup)
export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.checkAuthStatus();
      // return response.data;
      
      // For now, check if we have stored tokens
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        return {
          user: JSON.parse(storedUser),
          accessToken: storedToken,
          refreshToken: localStorage.getItem('refreshToken'),
          tokenExpiry: parseInt(localStorage.getItem('tokenExpiry') || '0'),
        };
      }
      
      return null;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to check auth status');
    }
  }
);

// mock account credentials for testing
// this allows testing sign-in functionality without a backend
const MOCK_ACCOUNT = {
  email: 'test@example.com',
  password: 'password123',
};

// Login with email and password
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginUserInput, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.login(credentials);
      // return response.data;
      
      // for now, validate against mock account for testing
      // check if email and password match the mock account
      if (credentials.email !== MOCK_ACCOUNT.email || credentials.password !== MOCK_ACCOUNT.password) {
        // credentials don't match mock account - reject with error
        return rejectWithValue('Invalid email or password. Please check your credentials and try again.');
      }
      
      // credentials match mock account - create mock user
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        authProvider: 'email',
        authProviderId: null,
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: null,
        isEmailVerified: true,
        lastLogin: new Date(),
        preferences: {
          theme: 'light',
          notifications: {
            enabled: true,
            dueDateReminders: true,
            routineReminders: true,
            pushNotifications: true,
            emailNotifications: false,
          },
          defaultPriority: 3,
          defaultColor: 'blue',
          defaultListView: 'list',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          autoArchiveCompleted: false,
          showCompletedTasks: true,
          sortTasksBy: 'dueDate',
          analyticsEnabled: true,
          crashReportingEnabled: true,
        },
        softDeleted: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
      
      return {
        user: mockUser,
        ...mockTokens,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

// Register a new user
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterUserInput, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.register(userData);
      // return response.data;
      
      // For now, create a mock user
      // firstName and lastName are required and validated before this thunk is called
      const mockUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        authProvider: userData.authProvider || 'email',
        authProviderId: userData.authProviderId || null,
        firstName: userData.firstName || '', // firstName is required and validated in OnboardingActions
        lastName: userData.lastName || '', // lastName is required and validated in OnboardingActions
        avatarUrl: null,
        isEmailVerified: false,
        lastLogin: new Date(),
        preferences: {
          theme: 'light',
          notifications: {
            enabled: true,
            dueDateReminders: true,
            routineReminders: true,
            pushNotifications: true,
            emailNotifications: false,
          },
          defaultPriority: 3,
          defaultColor: 'blue',
          defaultListView: 'list',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          autoArchiveCompleted: false,
          showCompletedTasks: true,
          sortTasksBy: 'dueDate',
          analyticsEnabled: true,
          crashReportingEnabled: true,
          ...userData.preferences,
        },
        softDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
      
      return {
        user: mockUser,
        ...mockTokens,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Registration failed');
    }
  }
);

// Social authentication (Google, Apple, Facebook)
export const socialAuth = createAsyncThunk(
  'auth/socialAuth',
  async (authData: SocialAuthInput, { rejectWithValue }) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.socialAuth(authData);
      // return response.data;
      
      // For now, create a mock user
      const mockUser: User = {
        id: Date.now().toString(),
        email: authData.email,
        authProvider: authData.authProvider,
        authProviderId: authData.authProviderId,
        firstName: authData.firstName || '',
        lastName: authData.lastName || '',
        avatarUrl: authData.avatarUrl || null,
        isEmailVerified: true,
        lastLogin: new Date(),
        preferences: {
          theme: 'light',
          notifications: {
            enabled: true,
            dueDateReminders: true,
            routineReminders: true,
            pushNotifications: true,
            emailNotifications: false,
          },
          defaultPriority: 3,
          defaultColor: 'blue',
          defaultListView: 'list',
          timezone: 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          autoArchiveCompleted: false,
          showCompletedTasks: true,
          sortTasksBy: 'dueDate',
          analyticsEnabled: true,
          crashReportingEnabled: true,
        },
        softDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
      
      return {
        user: mockUser,
        ...mockTokens,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Social authentication failed');
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
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.tokenExpiry = action.payload.tokenExpiry;
        }
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Clear any stored tokens on error
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenExpiry');
      })
      
      // Handle loginUser actions
      .addCase(loginUser.pending, (state) => {
        state.isLoggingIn = true;
        state.loginError = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenExpiry = action.payload.expiresAt.getTime();
        state.authMethod = 'email';
        state.lastLoginTime = Date.now();
        
        // Store tokens if remember me is enabled
        if (state.rememberMe) {
          localStorage.setItem('accessToken', action.payload.accessToken);
          localStorage.setItem('refreshToken', action.payload.refreshToken);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
          localStorage.setItem('tokenExpiry', action.payload.expiresAt.getTime().toString());
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.loginError = action.payload as string;
      })
      
      // Handle registerUser actions
      .addCase(registerUser.pending, (state) => {
        state.isRegistering = true;
        state.registerError = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenExpiry = action.payload.expiresAt.getTime();
        state.authMethod = action.payload.user.authProvider;
        state.lastLoginTime = Date.now();
        
        // Store tokens if remember me is enabled
        if (state.rememberMe) {
          localStorage.setItem('accessToken', action.payload.accessToken);
          localStorage.setItem('refreshToken', action.payload.refreshToken);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
          localStorage.setItem('tokenExpiry', action.payload.expiresAt.getTime().toString());
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isRegistering = false;
        state.registerError = action.payload as string;
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
        
        // Store tokens if remember me is enabled
        if (state.rememberMe) {
          localStorage.setItem('accessToken', action.payload.accessToken);
          localStorage.setItem('refreshToken', action.payload.refreshToken);
          localStorage.setItem('user', JSON.stringify(action.payload.user));
          localStorage.setItem('tokenExpiry', action.payload.expiresAt.getTime().toString());
        }
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
