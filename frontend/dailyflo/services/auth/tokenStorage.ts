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

/** keep in sync with django `SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']` (settings.py) */
export const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;

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
 * read `exp` from a JWT access token (seconds → ms) — used when persisting expiry after login/refresh
 */
export function accessTokenExpiryFromJwt(accessToken: string): number | null {
  try {
    const segment = accessToken.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
  } catch {
    // malformed token — caller falls back to ACCESS_TOKEN_LIFETIME_MS
  }
  return null;
}

/** when to treat the short-lived access JWT as expired (refresh token may still be valid for weeks) */
export function resolveAccessTokenExpiryMs(accessToken: string): number {
  return accessTokenExpiryFromJwt(accessToken) ?? Date.now() + ACCESS_TOKEN_LIFETIME_MS;
}

export async function isAccessTokenExpired(): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return true;

  const expiry = await getTokenExpiry();
  if (expiry != null) {
    return Date.now() >= expiry;
  }

  const jwtExpiry = accessTokenExpiryFromJwt(accessToken);
  if (jwtExpiry != null) {
    return Date.now() >= jwtExpiry;
  }

  return true;
}

/**
 * true when a refresh token exists — user can restore session without re-entering password
 * (backend refresh lifetime is 30 days; access token alone is only ~15 minutes)
 */
export async function hasRestorableSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  return !!refreshToken;
}

/**
 * true only when the access JWT is still within its short lifetime — NOT whether the user can stay logged in
 * @deprecated for cold-start gate — use `hasRestorableSession` + `refreshStoredSessionTokens` instead
 */
export async function hasValidTokens(): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken) return false;
  return !(await isAccessTokenExpired());
}
