/**
 * Token Manager
 * 
 * This service handles JWT token management including storage, retrieval,
 * validation, and automatic refresh. Think of it as the "key keeper" for
 * your app - it manages the special keys (tokens) that prove you're logged in.
 * 
 * Key concepts:
 * - JWT Tokens: Special strings that prove you're logged in (like a temporary ID card)
 * - Access Token: Short-lived token used for API calls (like a day pass)
 * - Refresh Token: Long-lived token used to get new access tokens (like a membership card)
 * - Token Expiry: When tokens become invalid and need to be renewed
 */

import secureStorage from '../storage/SecureStorage';
import authApiService from '../api/auth';

/**
 * Token Manager class
 * This class handles all token-related operations
 */
class TokenManager {
  private secureStorage: any;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.secureStorage = secureStorage;
  }

  /**
   * Store both access and refresh tokens
   * This saves the tokens securely so they can be used later
   * 
   * @param accessToken - The access token (short-lived)
   * @param refreshToken - The refresh token (long-lived)
   * @returns Promise that resolves when tokens are stored
   */
  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      console.log('Storing authentication tokens...');
      
      // Store both tokens securely
      await Promise.all([
        this.secureStorage.storeAccessToken(accessToken),
        this.secureStorage.storeRefreshToken(refreshToken),
      ]);
      
      // Calculate when the access token expires (usually 24 hours)
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 24);
      await this.secureStorage.setItem('tokenExpiry', expiryTime.toISOString());
      
      console.log('Tokens stored successfully');
    } catch (error) {
      console.error('Store tokens failed:', error);
      throw error;
    }
  }

  /**
   * Store access token only
   * This updates just the access token (used after refresh)
   * 
   * @param accessToken - The new access token
   * @returns Promise that resolves when token is stored
   */
  async storeAccessToken(accessToken: string): Promise<void> {
    try {
      console.log('Storing new access token...');
      
      await this.secureStorage.storeAccessToken(accessToken);
      
      // Update the expiry time
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 24);
      await this.secureStorage.setItem('tokenExpiry', expiryTime.toISOString());
      
      console.log('Access token stored successfully');
    } catch (error) {
      console.error('Store access token failed:', error);
      throw error;
    }
  }

  /**
   * Get access token
   * This retrieves the current access token, refreshing it if needed
   * 
   * @returns Promise with access token or null
   */
  async getAccessToken(): Promise<string | null> {
    try {
      // Check if the current token is expired
      if (await this.isTokenExpired()) {
        console.log('Access token expired, attempting refresh...');
        
        // Try to refresh the token
        const newToken = await this.refreshTokenIfNeeded();
        return newToken;
      }
      
      // Token is still valid, return it
      return await this.secureStorage.getAccessToken();
    } catch (error) {
      console.error('Get access token failed:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   * This retrieves the refresh token
   * 
   * @returns Promise with refresh token or null
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await this.secureStorage.getRefreshToken();
    } catch (error) {
      console.error('Get refresh token failed:', error);
      return null;
    }
  }

  /**
   * Check if access token is expired
   * This determines if the current token is still valid
   * 
   * @returns Promise with boolean indicating if token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      // Get the stored expiry time
      const expiryTime = await this.secureStorage.getItem('tokenExpiry');
      if (!expiryTime) {
        return true; // No expiry time means token is expired
      }
      
      const expiry = new Date(expiryTime);
      const now = new Date();
      
      // Add a 5-minute buffer to avoid edge cases
      const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);
      
      return bufferTime >= expiry;
    } catch (error) {
      console.error('Check token expiry failed:', error);
      return true; // If we can't check, assume it's expired
    }
  }

  /**
   * Refresh token if needed
   * This gets a new access token using the refresh token
   * 
   * @returns Promise with new access token or null
   */
  async refreshTokenIfNeeded(): Promise<string | null> {
    try {
      // Prevent multiple simultaneous refresh attempts
      if (this.refreshPromise) {
        console.log('Token refresh already in progress, waiting...');
        return await this.refreshPromise;
      }
      
      this.refreshPromise = this.performTokenRefresh();
      const result = await this.refreshPromise;
      this.refreshPromise = null;
      
      return result;
    } catch (error) {
      this.refreshPromise = null;
      console.error('Refresh token if needed failed:', error);
      return null;
    }
  }

  /**
   * Perform the actual token refresh
   * This calls the server to get a new access token
   * 
   * @returns Promise with new access token or null
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      console.log('Performing token refresh...');
      
      // Get the refresh token
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Call the API to refresh the token
      const response = await authApiService.refreshToken({ refreshToken });
      
      if (response.accessToken) {
        // Store the new access token
        await this.storeAccessToken(response.accessToken);
        
        // Update refresh token if provided
        if (response.refreshToken) {
          await this.secureStorage.storeRefreshToken(response.refreshToken);
        }
        
        console.log('Token refresh successful');
        return response.accessToken;
      }
      
      throw new Error('No access token in refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      // If refresh fails, clear all tokens
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Clear all tokens
   * This removes all stored tokens (used when logging out)
   * 
   * @returns Promise that resolves when tokens are cleared
   */
  async clearTokens(): Promise<void> {
    try {
      console.log('Clearing all tokens...');
      
      await Promise.all([
        this.secureStorage.removeItem('accessToken'),
        this.secureStorage.removeItem('refreshToken'),
        this.secureStorage.removeItem('tokenExpiry'),
      ]);
      
      console.log('Tokens cleared successfully');
    } catch (error) {
      console.error('Clear tokens failed:', error);
    }
  }

  /**
   * Get token expiry time
   * This tells you when the current token will expire
   * 
   * @returns Promise with expiry date or null
   */
  async getTokenExpiry(): Promise<Date | null> {
    try {
      const expiryTime = await this.secureStorage.getItem('tokenExpiry');
      return expiryTime ? new Date(expiryTime) : null;
    } catch (error) {
      console.error('Get token expiry failed:', error);
      return null;
    }
  }

  /**
   * Get time until token expires
   * This tells you how much time is left before the token expires
   * 
   * @returns Promise with milliseconds until expiry or null
   */
  async getTimeUntilExpiry(): Promise<number | null> {
    try {
      const expiry = await this.getTokenExpiry();
      if (!expiry) {
        return null;
      }
      
      const now = new Date();
      const timeUntilExpiry = expiry.getTime() - now.getTime();
      
      // Return 0 if already expired
      return Math.max(0, timeUntilExpiry);
    } catch (error) {
      console.error('Get time until expiry failed:', error);
      return null;
    }
  }

  /**
   * Check if token needs refresh soon (within 5 minutes)
   * This helps determine if we should refresh the token proactively
   * 
   * @returns Promise with boolean indicating if refresh is needed soon
   */
  async needsRefreshSoon(): Promise<boolean> {
    try {
      const timeUntilExpiry = await this.getTimeUntilExpiry();
      if (timeUntilExpiry === null) {
        return true; // Can't determine, so assume refresh is needed
      }
      
      // Refresh if token expires within 5 minutes
      const fiveMinutes = 5 * 60 * 1000;
      return timeUntilExpiry <= fiveMinutes;
    } catch (error) {
      console.error('Check if needs refresh soon failed:', error);
      return true; // If we can't check, assume refresh is needed
    }
  }

  /**
   * Validate token format (basic validation)
   * This checks if a token looks like a valid JWT
   * 
   * @param token - The token to validate
   * @returns Boolean indicating if token format is valid
   */
  validateTokenFormat(token: string): boolean {
    try {
      // Basic JWT format validation
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const parts = token.split('.');
      return parts.length === 3;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decode JWT token payload (without verification)
   * This extracts information from a JWT token
   * 
   * @param token - The token to decode
   * @returns Decoded payload or null
   */
  decodeTokenPayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      // Decode the payload (middle part)
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Decode token payload failed:', error);
      return null;
    }
  }

  /**
   * Get token claims
   * This gets the information stored in the current access token
   * 
   * @returns Promise with token claims or null
   */
  async getTokenClaims(): Promise<any> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        return null;
      }
      
      return this.decodeTokenPayload(token);
    } catch (error) {
      console.error('Get token claims failed:', error);
      return null;
    }
  }
}

export { TokenManager };
