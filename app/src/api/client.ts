import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60_000,
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) {
      return Promise.reject(
        new Error(
          `Cannot reach the ChronoFresh API at ${API_BASE_URL}. ` +
          'Make sure the backend is running on port 8000 and reachable from this device.',
        ),
      );
    }
    const msg =
      err.response?.data?.detail ?? err.message ?? 'An unexpected error occurred.';
    return Promise.reject(new Error(msg));
  },
);

export default client;
export { API_BASE_URL };
