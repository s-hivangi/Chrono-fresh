import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_CONFIGURATION_ERROR } from '../utils/config';
import { currentAccessToken, refreshAccessToken } from './authSession';

const client = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 60_000,
});

client.interceptors.request.use((config) => {
  // A missing URL is a setup problem, never a request to Metro or localhost.
  if (API_CONFIGURATION_ERROR) return Promise.reject(new Error(API_CONFIGURATION_ERROR));
  const token = currentAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const request = err.config as (InternalAxiosRequestConfig & { _authRetried?: boolean }) | undefined;
    if (err.response?.status === 401 && request && !request._authRetried &&
        !request.url?.startsWith('/api/v1/auth/')) {
      request._authRetried = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
          return client(request);
        }
      } catch {
        // Surface the authorization failure below; restoration handles offline state.
      }
    }
    if (API_CONFIGURATION_ERROR && err?.message === API_CONFIGURATION_ERROR) {
      return Promise.reject(err);
    }
    if (!err.response) {
      return Promise.reject(
        new Error(
          'ChronoFresh could not reach the analysis service. ' +
          'Please check that the backend is running and try again.',
        ),
      );
    }
    const msg =
      err.response?.data?.detail ?? err.message ?? 'An unexpected error occurred.';
    return Promise.reject(new Error(msg));
  },
);

export default client;
export { API_BASE_URL, API_CONFIGURATION_ERROR };
