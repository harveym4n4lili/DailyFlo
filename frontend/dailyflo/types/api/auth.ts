/**
 * Authentication API Response Types
 * 
 * This file defines TypeScript interfaces for API responses
 * related to authentication operations. These types represent
 * the data structure returned by the Django REST API.
 */

import { User, RegisterUserInput, LoginUserInput, SocialAuthInput, UpdateUserInput } from '../common/User';

// API response wrapper for authentication
export interface AuthResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    user: User;                     // User data
    accessToken: string;            // JWT access token
    refreshToken: string;           // JWT refresh token
    expiresAt: Date;                // When the tokens expire
  };
  message?: string;                 // Optional success/error message
}

// API request for user registration
export interface RegisterRequest {
  user: RegisterUserInput;          // User registration data
}

// API request for user login
export interface LoginRequest {
  credentials: LoginUserInput;      // User login credentials
}

// API request for social authentication
export interface SocialAuthRequest {
  authData: SocialAuthInput;        // Social authentication data
}

// API response for token refresh
export interface TokenRefreshResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    accessToken: string;            // New JWT access token
    refreshToken: string;           // New JWT refresh token
    expiresAt: Date;                // When the new tokens expire
  };
  message?: string;                 // Optional success/error message
}

// API request for token refresh
export interface TokenRefreshRequest {
  refreshToken: string;             // Current refresh token
}

// API response for user profile
export interface UserProfileResponse {
  success: boolean;                 // Whether the request was successful
  data: User;                       // User profile data
  message?: string;                 // Optional success/error message
}

// API request for updating user profile
export interface UpdateUserProfileRequest {
  user: UpdateUserInput;            // Updated user data
}

// API response for password change
export interface ChangePasswordResponse {
  success: boolean;                 // Whether the request was successful
  message: string;                  // Success message
}

// API request for password change
export interface ChangePasswordRequest {
  currentPassword: string;          // Current password
  newPassword: string;              // New password
  confirmPassword: string;          // Password confirmation
}

// API response for password reset request
export interface PasswordResetRequestResponse {
  success: boolean;                 // Whether the request was successful
  message: string;                  // Success message
}

// API request for password reset request
export interface PasswordResetRequestRequest {
  email: string;                    // User's email address
}

// API response for password reset confirmation
export interface PasswordResetConfirmResponse {
  success: boolean;                 // Whether the request was successful
  message: string;                  // Success message
}

// API request for password reset confirmation
export interface PasswordResetConfirmRequest {
  token: string;                    // Reset token from email
  newPassword: string;              // New password
  confirmPassword: string;          // Password confirmation
}

// API response for logout
export interface LogoutResponse {
  success: boolean;                 // Whether the request was successful
  message: string;                  // Success message
}

// API response for account deletion
export interface DeleteAccountResponse {
  success: boolean;                 // Whether the request was successful
  message: string;                  // Success message
}

// API response for email verification
export interface EmailVerificationResponse {
  success: boolean;                 // Whether the request was successful
  message: string;                  // Success message
}

// API request for email verification
export interface EmailVerificationRequest {
  token: string;                    // Verification token from email
}

// API response for resending verification email
export interface ResendVerificationResponse {
  success: boolean;                 // Whether the request was successful
  message: string;                  // Success message
}

// API request for resending verification email
export interface ResendVerificationRequest {
  email: string;                    // User's email address
}

// API response for checking authentication status
export interface AuthStatusResponse {
  success: boolean;                 // Whether the request was successful
  data: {
    isAuthenticated: boolean;       // Whether the user is authenticated
    user?: User;                    // User data if authenticated
    expiresAt?: Date;               // Token expiration time
  };
  message?: string;                 // Optional success/error message
}
