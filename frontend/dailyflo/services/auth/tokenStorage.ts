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
// Note: SecureStore keys can only contain alphanumeric characters, ".", "-", and "_"
// So we use underscores instead of colons
const ACCESS_TOKEN_KEY = 'DailyFlo_accessToken';
const REFRESH_TOKEN_KEY = 'DailyFlo_refreshToken';
const TOKEN_EXPIRY_KEY = 'DailyFlo_tokenExpiry';

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
