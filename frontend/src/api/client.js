import axios from 'axios';

// Empty means same-origin: Vite proxies /api and /uploads to FastAPI.
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_BASE ??
  ''
).replace(/\/$/, '');

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

let accessToken = null;
let refreshToken = null;
let refreshPromise = null;
let authLostHandler = null;
let sessionVersion = 0;

export function setWebSession(tokens) {
  sessionVersion += 1;
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
}

export function clearWebSession() {
  sessionVersion += 1;
  accessToken = null;
  refreshToken = null;
}

export function currentWebRefreshToken() { return refreshToken; }

export function onWebAuthLost(handler) { authLostHandler = handler; }

client.interceptors.request.use((config) => {
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const request = err.config;
    if (err.response?.status === 401 && refreshToken && request && !request._authRetried &&
        !request.url?.startsWith('/api/v1/auth/')) {
      request._authRetried = true;
      try {
        if (!refreshPromise) {
          const version = sessionVersion;
          refreshPromise = axios.post(`${BASE_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken }, { timeout: 15000 })
            .then((response) => {
              if (version !== sessionVersion) throw new Error('Session changed');
              setWebSession(response.data);
              return response.data.access_token;
            })
            .finally(() => { refreshPromise = null; });
        }
        const token = await refreshPromise;
        request.headers.set('Authorization', `Bearer ${token}`);
        return client(request);
      } catch {
        if (refreshToken) {
          clearWebSession();
          authLostHandler?.();
        }
      }
    }
    const msg =
      err.response?.data?.detail ?? err.message ?? 'An unexpected error occurred.';
    return Promise.reject(new Error(msg));
  }
);

export default client;
export { BASE_URL };
