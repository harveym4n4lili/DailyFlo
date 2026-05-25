/**
 * cold-start / background session restore — uses the long-lived refresh token (django: 30 days)
 * to mint a new access token (django: 15 minutes) so users stay signed in like todoist/structured.
 */

import authApiService from '../api/auth';
import {
  getRefreshToken,
  resolveAccessTokenExpiryMs,
  storeAccessToken,
  storeRefreshToken,
  storeTokenExpiry,
} from './tokenStorage';

export type RefreshedSessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

/** POST `/accounts/auth/refresh/` and persist rotated tokens in SecureStore */
export async function refreshStoredSessionTokens(): Promise<RefreshedSessionTokens | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const response = await authApiService.refreshToken({ refresh: refreshToken });
  const accessToken = response.access ?? response.data?.access;
  if (!accessToken) return null;

  const nextRefresh = response.refresh ?? response.data?.refresh ?? refreshToken;
  await storeAccessToken(accessToken);
  await storeRefreshToken(nextRefresh);

  const expiresAt = resolveAccessTokenExpiryMs(accessToken);
  await storeTokenExpiry(expiresAt);

  return { accessToken, refreshToken: nextRefresh, expiresAt };
}
