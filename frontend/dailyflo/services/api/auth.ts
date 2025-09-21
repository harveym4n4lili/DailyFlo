/**
 * Authentication API Service
 * 
 * This service handles all authentication-related API calls to the Django backend.
 * Think of it as the "security guard" for your app - it handles user login, registration,
 * and other security-related operations.
 * 
 * Key concepts:
 * - Authentication: Verifying who a user is (like checking an ID card)
 * - Authorization: Checking what a user is allowed to do (like checking permissions)
 * - JWT Tokens: Secure "passes" that prove a user is logged in
 * - API Endpoints: Specific URLs on the server that handle different operations
 */

import apiClient from './client';
import { RegisterRequest, LoginRequest, ChangePasswordRequest, ChangePasswordResponse } from '../../types/api/auth';

/**
 * Authentication API service class
 * This class contains all the methods for authentication operations
 */
class AuthApiService {
  /**
   * Register a new user
   * This is like signing up for a new account
   * 
   * @param data - User registration information (email, password, etc.)
   * @returns Promise with the server's response
   */
  async register(data: RegisterRequest): Promise<any> {
    try {
      // Send a POST request to the /auth/register/ endpoint
      // POST is used for creating new resources (like creating a new user)
      const response = await apiClient.post('/auth/register/', data);
      
      // Return the data from the server's response
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   * This is like showing your ID to get into a building
   * 
   * @param data - Login credentials (email and password)
   * @returns Promise with user data and authentication tokens
   */
  async login(data: LoginRequest): Promise<any> {
    try {
      // Send a POST request to the /auth/login/ endpoint
      const response = await apiClient.post('/auth/login/', data);
      
      // The server should return user data and tokens
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Social authentication (Google, Apple, Facebook)
   * This is like using a third-party ID (like a driver's license) to prove who you are
   * 
   * @param data - Social authentication data (provider, tokens, etc.)
   * @returns Promise with user data and authentication tokens
   */
  async socialLogin(data: any): Promise<any> {
    try {
      // Send a POST request to the /auth/social/ endpoint
      const response = await apiClient.post('/auth/social/', data);
      
      return response.data;
    } catch (error) {
      console.error('Social login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * When your login token expires, this gets a new one
   * Think of it like renewing your ID card before it expires
   * 
   * @param data - Refresh token data
   * @returns Promise with new access token
   */
  async refreshToken(data: any): Promise<any> {
    try {
      // Send a POST request to the /auth/refresh/ endpoint
      const response = await apiClient.post('/auth/refresh/', data);
      
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * This tells the server "I'm done, please log me out"
   * 
   * @param data - Logout data (usually just the refresh token)
   * @returns Promise with logout confirmation
   */
  async logout(data: any): Promise<any> {
    try {
      // Send a POST request to the /auth/logout/ endpoint
      const response = await apiClient.post('/auth/logout/', data);
      
      return response.data;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * This allows users to change their personal information
   * 
   * @param userId - The ID of the user to update
   * @param updates - The new information to save
   * @returns Promise with updated user data
   */
  async updateProfile(userId: string, updates: any): Promise<any> {
    try {
      // Send a PATCH request to update the user
      // PATCH is used for partial updates (only changing some fields)
      const response = await apiClient.patch(`/auth/users/${userId}/`, updates);
      
      return response.data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * This allows users to update their password
   * 
   * @param userId - The ID of the user
   * @param oldPassword - The current password
   * @param newPassword - The new password
   * @returns Promise with change confirmation
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    try {
      // Send a POST request to change the password
      const response = await apiClient.post(`/auth/users/${userId}/change-password/`, {
        oldPassword,
        newPassword,
      });
      
      return response.data;
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Verify email address
   * This confirms that the user's email address is valid
   * 
   * @param token - The verification token sent to the user's email
   * @returns Promise with verification confirmation
   */
  async verifyEmail(token: string): Promise<any> {
    try {
      // Send a POST request with the verification token
      const response = await apiClient.post('/auth/verify-email/', { token });
      
      return response.data;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   * This sends another verification email if the first one was lost
   * 
   * @param email - The email address to send verification to
   * @returns Promise with resend confirmation
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    try {
      // Send a POST request to resend verification
      const response = await apiClient.post('/auth/resend-verification/', { email });
      
      return response.data;
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   * This sends an email with instructions to reset a forgotten password
   * 
   * @param email - The email address to send reset instructions to
   * @returns Promise with reset request confirmation
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    try {
      // Send a POST request to request password reset
      const response = await apiClient.post('/auth/password-reset/', { email });
      
      return response.data;
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
   * @returns Promise with reset confirmation
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      // Send a POST request to reset the password
      const response = await apiClient.post('/auth/password-reset-confirm/', {
        token,
        new_password: newPassword,
      });
      
      return response.data;
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Get current user profile
   * This gets information about the currently logged-in user
   * 
   * @returns Promise with current user data
   */
  async getCurrentUser(): Promise<{ user: any }> {
    try {
      // Send a GET request to get current user info
      // GET is used for retrieving data
      const response = await apiClient.get('/auth/me/');
      
      return response.data;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   * This permanently deletes a user's account
   * 
   * @param userId - The ID of the user to delete
   * @returns Promise with deletion confirmation
   */
  async deleteAccount(userId: string): Promise<{ message: string }> {
    try {
      // Send a DELETE request to delete the user
      // DELETE is used for removing resources
      const response = await apiClient.delete(`/auth/users/${userId}/`);
      
      return response.data;
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
// A singleton means there's only one instance of this class in the entire app
// This is useful for services because you don't need multiple copies
const authApiService = new AuthApiService();
export default authApiService;
