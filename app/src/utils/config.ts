/** Expo embeds this URL from app/.env when Metro bundles the app. */
function resolveApiBaseUrl(): { url: string; error: string | null } {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!value) {
    return {
      url: '',
      error: 'Analysis service is not configured. Set EXPO_PUBLIC_API_BASE_URL in app/.env to your computer\'s Wi-Fi address, then restart Expo.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { url: '', error: 'Analysis service URL is invalid. Set EXPO_PUBLIC_API_BASE_URL to a full HTTP or HTTPS URL, then reload the app.' };
  }
  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || !parsed.hostname) {
    return { url: '', error: 'Analysis service URL must be a full HTTP or HTTPS URL. Update EXPO_PUBLIC_API_BASE_URL, then reload the app.' };
  }

  return { url: value.replace(/\/+$/, ''), error: null };
}

const apiConfiguration = resolveApiBaseUrl();
export const API_BASE_URL = apiConfiguration.url;
export const API_CONFIGURATION_ERROR = apiConfiguration.error;
