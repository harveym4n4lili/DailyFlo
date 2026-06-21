/**
 * cold-start / background session restore — uses the long-lived refresh token (django: 30 days)
 * to mint a new access token (django: 15 minutes) so users stay signed in like todoist/structured.
 *
 * provider-agnostic: google, apple, and email all persist the same DailyFlo refresh token in SecureStore.
 * a single in-flight mutex prevents parallel refresh calls from blacklisting a still-valid refresh token.
 */

import axios from 'axios';
import {
  getRefreshToken,
  resolveAccessTokenExpiryMs,
  storeAccessToken,
  storeRefreshToken,
  storeTokenExpiry,
} from './tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.99:8000';

export type RefreshedSessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

// only one refresh at a time — concurrent callers await the same promise (axios 401 + checkAuthStatus)
let refreshInFlight: Promise<RefreshedSessionTokens | null> | null = null;

async function performRefresh(): Promise<RefreshedSessionTokens | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    // raw axios (not apiClient) so refresh never waits on or re-enters axios interceptors
    const { data } = await axios.post(`${API_BASE_URL}/accounts/auth/refresh/`, {
      refresh: refreshToken,
    });

    const accessToken = data.access ?? data.data?.access;
    if (!accessToken) return null;

    const nextRefresh = data.refresh ?? data.data?.refresh ?? refreshToken;
    await storeAccessToken(accessToken);
    await storeRefreshToken(nextRefresh);

    const expiresAt = resolveAccessTokenExpiryMs(accessToken);
    await storeTokenExpiry(expiresAt);

    return { accessToken, refreshToken: nextRefresh, expiresAt };
  } catch (error) {
    // expired, blacklisted, or missing refresh — caller treats as logged out (not a crash)
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

/** POST `/accounts/auth/refresh/` and persist rotated tokens in SecureStore */
export async function refreshStoredSessionTokens(): Promise<RefreshedSessionTokens | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = performRefresh().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
