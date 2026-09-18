import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ?? err.message ?? 'An unexpected error occurred.';
    return Promise.reject(new Error(msg));
  }
);

export default client;
export { BASE_URL };
