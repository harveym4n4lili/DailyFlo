/**
 * Authentication Service
 * 
 * This is a high-level service that handles all authentication-related operations.
 * Think of it as the "security manager" for your app - it coordinates between
 * the API calls, token management, and local storage.
 * 
 * Key concepts:
 * - Service Layer: A layer that handles business logic and coordinates between different parts
 * - Token Management: Handling login tokens securely
 * - Session Management: Keeping track of whether a user is logged in
 * - Error Handling: Dealing with authentication failures gracefully
 */

import authApiService from '../api/auth';
import { TokenManager } from './TokenManager';
import secureStorage from '../storage/SecureStorage';
import { User, LoginUserInput, RegisterUserInput } from '../../types';

/**
 * Authentication service class
 * This class provides a simple interface for all authentication operations
 */
class AuthService {
  private tokenManager: TokenManager;
  private secureStorage: any;

  constructor() {
    // Initialize the token manager and secure storage
    this.tokenManager = new TokenManager();
    this.secureStorage = secureStorage;
  }

  /**
   * Register a new user
   * This creates a new user account
   * 
   * @param userData - The user's registration information
   * @returns Promise with user data and authentication tokens
   */
  async register(userData: RegisterUserInput): Promise<{ user: User; tokens: any }> {
    try {
      console.log('Starting user registration...');
      
      // Call the API to register the user
      const response = await authApiService.register({ user: userData });
      
      // Store the authentication tokens securely
      if (response.accessToken && response.refreshToken) {
        await this.tokenManager.storeTokens(response.accessToken, response.refreshToken);
      }
      
      // Store user data securely
      await this.secureStorage.storeUserData(response.user);
      
      console.log('User registration successful');
      
      return {
        user: response.user,
        tokens: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   * This authenticates an existing user
   * 
   * @param credentials - The user's login credentials
   * @returns Promise with user data and authentication tokens
   */
  async login(credentials: LoginUserInput): Promise<{ user: User; tokens: any }> {
    try {
      console.log('Starting user login...');
      
      // Call the API to login
      const response = await authApiService.login({ credentials });
      
      // Store the authentication tokens securely
      if (response.accessToken && response.refreshToken) {
        await this.tokenManager.storeTokens(response.accessToken, response.refreshToken);
      }
      
      // Store user data securely
      await this.secureStorage.storeUserData(response.user);
      
      // Record the login time
      await this.secureStorage.storeLastLoginTime();
      
      console.log('User login successful');
      
      return {
        user: response.user,
        tokens: {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * This ends the user's session and clears all stored data
   * 
   * @returns Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    try {
      console.log('Starting user logout...');
      
      // Get the refresh token to send to the server
      const refreshToken = await this.tokenManager.getRefreshToken();
      
      // If we have a refresh token, tell the server we're logging out
      if (refreshToken) {
        try {
          await authApiService.logout({ refreshToken });
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with local logout even if server call fails
        }
      }
      
      // Clear all stored authentication data
      await this.clearAuthData();
      
      console.log('User logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * This determines if the user is currently logged in
   * 
   * @returns Promise with boolean indicating authentication status
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if we have an access token
      const accessToken = await this.tokenManager.getAccessToken();
      
      // Check if we have user data
      const user = await this.getCurrentUser();
      
      // User is authenticated if we have both token and user data
      return !!(accessToken && user);
    } catch (error) {
      console.error('Check authentication failed:', error);
      return false;
    }
  }

  /**
   * Get current user
   * This retrieves the currently logged-in user's information
   * 
   * @returns Promise with user data or null if not logged in
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.secureStorage.getUserData();
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  /**
   * Update user profile
   * This allows users to update their personal information
   * 
   * @param updates - The new information to save
   * @returns Promise with updated user data
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      console.log('Updating user profile...');
      
      // Get the current user
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Call the API to update the profile
      const response = await authApiService.updateProfile(currentUser.id, updates);
      
      // Update the stored user data
      const updatedUser = { ...currentUser, ...response.user };
      await this.secureStorage.storeUserData(updatedUser);
      
      console.log('User profile updated successfully');
      
      return updatedUser;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * This allows users to update their password
   * 
   * @param oldPassword - The current password
   * @param newPassword - The new password
   * @returns Promise that resolves when password is changed
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      console.log('Changing user password...');
      
      // Get the current user
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Call the API to change the password
      await authApiService.changePassword(currentUser.id, oldPassword, newPassword);
      
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  }

  /**
   * Verify email address
   * This confirms that the user's email address is valid
   * 
   * @param token - The verification token from the email
   * @returns Promise that resolves when email is verified
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      console.log('Verifying email address...');
      
      // Call the API to verify the email
      await authApiService.verifyEmail(token);
      
      // Update the user's email verification status
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, isEmailVerified: true };
        await this.secureStorage.storeUserData(updatedUser);
      }
      
      console.log('Email verified successfully');
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   * This sends an email with instructions to reset a forgotten password
   * 
   * @param email - The email address to send reset instructions to
   * @returns Promise that resolves when reset email is sent
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      console.log('Requesting password reset...');
      
      await authApiService.requestPasswordReset(email);
      
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * This actually changes the password using a token from the reset email
   * 
   * @param token - The reset token from the email
   * @param newPassword - The new password
   * @returns Promise that resolves when password is reset
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      console.log('Resetting password...');
      
      await authApiService.resetPassword(token, newPassword);
      
      console.log('Password reset successfully');
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Get access token
   * This retrieves the current access token (used for API calls)
   * 
   * @returns Promise with access token or null
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await this.tokenManager.getAccessToken();
    } catch (error) {
      console.error('Get access token failed:', error);
      return null;
    }
  }

  /**
   * Check if session is expired
   * This determines if the user's session has expired
   * 
   * @returns Promise with boolean indicating if session is expired
   */
  async isSessionExpired(): Promise<boolean> {
    try {
      const lastLogin = await this.secureStorage.getLastLoginTime();
      if (!lastLogin) {
        return true;
      }
      
      // Check if last login was more than 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return lastLogin < thirtyDaysAgo;
    } catch (error) {
      console.error('Check session expiry failed:', error);
      return true;
    }
  }

  /**
   * Clear all authentication data
   * This removes all stored authentication information
   * 
   * @returns Promise that resolves when data is cleared
   */
  private async clearAuthData(): Promise<void> {
    try {
      // Clear tokens
      await this.tokenManager.clearTokens();
      
      // Clear user data
      await this.secureStorage.clearAll();
      
      console.log('Authentication data cleared');
    } catch (error) {
      console.error('Clear auth data failed:', error);
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
