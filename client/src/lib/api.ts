import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
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
        // Surface the ORIGINAL request's error, not the refresh attempt's —
        // the original is what the user actually tried to do.
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

/** Generates a per-action idempotency key for payment-related POSTs. */
export function newIdempotencyKey() {
  return crypto.randomUUID();
}
