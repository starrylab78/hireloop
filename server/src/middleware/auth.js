import User from '../models/User.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../utils/tokens.js';

/**
 * requireAuth — verifies the short-lived access token cookie.
 * Does NOT auto-refresh (that's the job of POST /auth/refresh, called
 * proactively by the client on 401) — keeps this middleware pure/sync-ish.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated', code: 'NO_TOKEN' });
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return res.status(401).json({ error: 'Session expired', code: 'TOKEN_EXPIRED' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Account not found or disabled', code: 'USER_INVALID' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Optional auth — attaches req.user if present, but never blocks the request. */
export async function attachUserIfPresent(req, _res, next) {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) return next();
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user?.isActive) req.user = user;
    next();
  } catch {
    next();
  }
}
