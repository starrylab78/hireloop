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
  const isProd = process.env.NODE_ENV === 'production';
  const domain = process.env.COOKIE_DOMAIN;
  const hasSharedParentDomain = isProd && domain && domain !== 'localhost';

  const opts = {
    httpOnly: true,
    secure: isProd, // must be true whenever sameSite is 'none' — browsers reject 'none' cookies over plain http
    sameSite: !isProd ? 'lax' : hasSharedParentDomain ? 'lax' : 'none',
    maxAge: maxAgeMs,
    path: '/',
  };

  if (hasSharedParentDomain) {
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
