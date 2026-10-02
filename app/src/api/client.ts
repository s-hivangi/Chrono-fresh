import axios from 'axios';
import { API_BASE_URL, API_CONFIGURATION_ERROR } from '../utils/config';

const client = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 60_000,
});

client.interceptors.request.use((config) => {
  // A missing URL is a setup problem, never a request to Metro or localhost.
  if (API_CONFIGURATION_ERROR) return Promise.reject(new Error(API_CONFIGURATION_ERROR));
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
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
