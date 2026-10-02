import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../utils/config';

export type AuthTokens = { access_token: string; refresh_token: string; token_type: string };
const REFRESH_KEY = 'chronofresh.refresh-token';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let generation = 0;
let refreshInFlight: Promise<string | null> | null = null;
let onSessionLost: (() => void) | null = null;

export function currentAccessToken() { return accessToken; }
export function currentRefreshToken() { return refreshToken; }
export function setSessionLostHandler(handler: (() => void) | null) { onSessionLost = handler; }

export async function storedRefreshToken(): Promise<string | null> {
  if (refreshToken) return refreshToken;
  try {
    const token = await SecureStore.getItemAsync(REFRESH_KEY);
    if (token) refreshToken = token;
    return token;
  } catch {
    return null;
  }
}

export async function acceptTokens(tokens: AuthTokens, expectedGeneration = generation) {
  if (expectedGeneration !== generation) return false;
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh_token);
  if (expectedGeneration !== generation) {
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined);
    return false;
  }
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  return true;
}

export async function clearSession() {
  generation += 1;
  accessToken = null;
  refreshToken = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined);
}

export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const startedAt = generation;
  refreshInFlight = (async () => {
    const token = await storedRefreshToken();
    if (!token || !API_BASE_URL || startedAt !== generation) return null;
    try {
      const response = await axios.post<AuthTokens>(`${API_BASE_URL}/api/v1/auth/refresh`,
        { refresh_token: token }, { timeout: 15_000 });
      if (!(await acceptTokens(response.data, startedAt))) return null;
      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && startedAt === generation) {
        await clearSession();
        onSessionLost?.();
      }
      throw error;
    }
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}
