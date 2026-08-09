import User from '../models/User.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  REFRESH_COOKIE,
} from '../utils/tokens.js';

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueCompanySlug(companyName) {
  const base = slugify(companyName) || 'company';
  let slug = base;
  let suffix = 1;
  // Small collision space at demo scale — fine to check sequentially.
  while (await User.exists({ companySlug: slug })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role, companyName, companyWebsite } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists', code: 'EMAIL_TAKEN' });
    }

    const passwordHash = await User.hashPassword(password);
    const companySlug = role === 'recruiter' && companyName ? await generateUniqueCompanySlug(companyName) : undefined;

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      companyName: role === 'recruiter' ? companyName : undefined,
      companyWebsite: role === 'recruiter' ? companyWebsite : undefined,
      companySlug,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, user.refreshTokenVersion);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'This account has been disabled', code: 'ACCOUNT_DISABLED' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, user.refreshTokenVersion);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) return res.status(401).json({ error: 'No refresh token', code: 'NO_REFRESH_TOKEN' });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token invalid or expired', code: 'REFRESH_INVALID' });
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.isActive || user.refreshTokenVersion !== payload.tokenVersion) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token no longer valid', code: 'REFRESH_STALE' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user, user.refreshTokenVersion); // rotate
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      // Bumping the version invalidates every outstanding refresh token for this user.
      req.user.refreshTokenVersion += 1;
      await req.user.save();
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

export async function updateCompanyProfile(req, res, next) {
  try {
    const { companyDescription, companyWebsite, companyLogoUrl } = req.body;
    if (companyDescription !== undefined) req.user.companyDescription = companyDescription;
    if (companyWebsite !== undefined) req.user.companyWebsite = companyWebsite;
    if (companyLogoUrl !== undefined) req.user.companyLogoUrl = companyLogoUrl;
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

/** Update basic account info: name, email, and (for recruiters) company name. */
export async function updateAccountProfile(req, res, next) {
  try {
    const { name, email, companyName } = req.body;

    if (email && email.toLowerCase() !== req.user.email) {
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
      if (taken) {
        return res.status(409).json({ error: 'That email is already in use by another account', code: 'EMAIL_TAKEN' });
      }
      req.user.email = email.toLowerCase();
    }
    if (name !== undefined) req.user.name = name;
    if (companyName !== undefined && req.user.role === 'recruiter') req.user.companyName = companyName;

    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

/** Change password: requires the current password (skipped for OAuth-only accounts setting one for the first time). */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.passwordHash) {
      const valid = await req.user.comparePassword(currentPassword || '');
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect', code: 'INVALID_CURRENT_PASSWORD' });
      }
    }

    req.user.passwordHash = await User.hashPassword(newPassword);
    // Invalidate all other sessions so a stolen/old session can't keep using the old password.
    req.user.refreshTokenVersion += 1;
    await req.user.save();

    const accessToken = signAccessToken(req.user);
    const refreshToken = signRefreshToken(req.user, req.user.refreshTokenVersion);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
