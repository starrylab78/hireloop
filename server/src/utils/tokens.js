import jwt from 'jsonwebtoken';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, tokenType: 'access' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

export function signRefreshToken(user, tokenVersion) {
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion, tokenType: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export const ACCESS_COOKIE = 'hl_access';
export const REFRESH_COOKIE = 'hl_refresh';

export function cookieOptions(maxAgeMs) {
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
  // Only set an explicit cookie Domain in production, and only if it's been
  // configured to something real. Setting `Domain=localhost` in dev is
  // inconsistent across browsers and can silently cause cookies to be
  // dropped/rejected, which looks like a random logout on navigation.
  const domain = process.env.COOKIE_DOMAIN;
  if (process.env.NODE_ENV === 'production' && domain && domain !== 'localhost') {
    opts.domain = domain;
  }
  return opts;
}

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(30 * 24 * 60 * 60 * 1000));
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, cookieOptions(0));
  res.clearCookie(REFRESH_COOKIE, cookieOptions(0));
}
