import axios from 'axios';

// In local dev, '/api' is proxied to localhost:5000 by Vite (see vite.config.ts).
// In production, frontend and backend are usually on different hosts (e.g.
// Vercel + Render), so VITE_API_URL must point at the deployed backend —
// set it in your hosting provider's environment variables at build time.
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Endpoints where a 401 means "this credential/token attempt was rejected" —
// NOT "your session expired mid-request". Retrying via /auth/refresh here is
// wrong: there's no session to refresh yet, and doing so overwrites the real
// error (e.g. "Invalid email or password") with the refresh call's own
// failure ("No refresh token"), which is misleading to show the user.
const AUTH_ENTRY_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

let isRefreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthEntryCall = AUTH_ENTRY_ENDPOINTS.some((path) => original?.url?.includes(path));

    if (error.response?.status === 401 && !original._retry && !isAuthEntryCall) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(api(original)));
        });
      }

      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        queue.forEach((cb) => cb());
        queue = [];
        return api(original);
      } catch {
        queue = [];
        window.dispatchEvent(new CustomEvent('hireloop:session-expired'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export function newIdempotencyKey() {
  return crypto.randomUUID();
}