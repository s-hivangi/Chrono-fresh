import Constants from 'expo-constants';

/**
 * Use EXPO_PUBLIC_API_BASE_URL for deployed builds or a fixed local address.
 * During Expo development, derive the computer host from the Expo dev server
 * so Expo Go on a physical device does not try to call Android's emulator host.
 */
function developmentApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:8000` : 'http://10.0.2.2:8000';
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? developmentApiUrl();
