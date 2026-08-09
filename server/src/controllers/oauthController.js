import User from '../models/User.js';
import {
  isProviderConfigured,
  signOAuthState,
  verifyOAuthState,
  buildAuthorizeUrl,
  fetchOAuthProfile,
} from '../services/oauthService.js';
import { signAccessToken, signRefreshToken, setAuthCookies } from '../utils/tokens.js';

function startOAuth(provider) {
  return (req, res) => {
    if (!isProviderConfigured(provider)) {
      return res.status(503).json({
        error: `${provider} sign-in isn't configured on this server yet. Set ${provider.toUpperCase()}_CLIENT_ID / SECRET / CALLBACK_URL.`,
        code: 'OAUTH_NOT_CONFIGURED',
      });
    }
    const role = req.query.role === 'recruiter' ? 'recruiter' : 'candidate';
    const state = signOAuthState({ role });
    res.redirect(buildAuthorizeUrl(provider, state));
  };
}

function oauthCallback(provider) {
  return async (req, res, next) => {
    try {
      const { code, state } = req.query;
      const decoded = verifyOAuthState(state);
      if (!code || !decoded) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_state_invalid`);
      }

      const profile = await fetchOAuthProfile(provider, code);
      if (!profile.email) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_no_email`);
      }

      let user = await User.findOne({
        $or: [{ [`oauthProviders.${provider}.id`]: profile.providerId }, { email: profile.email.toLowerCase() }],
      });

      if (!user) {
        user = await User.create({
          name: profile.name || profile.email.split('@')[0],
          email: profile.email.toLowerCase(),
          role: decoded.role,
          oauthProviders: { [provider]: { id: profile.providerId, email: profile.email } },
        });
      } else if (!user.oauthProviders?.[provider]?.id) {
        // Existing account (e.g. signed up with a password originally) — link this provider to it.
        user.oauthProviders = { ...user.oauthProviders, [provider]: { id: profile.providerId, email: profile.email } };
        await user.save();
      }

      if (!user.isActive) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=account_disabled`);
      }

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user, user.refreshTokenVersion);
      setAuthCookies(res, accessToken, refreshToken);

      res.redirect(`${process.env.CLIENT_URL}/oauth/complete`);
    } catch (err) {
      next(err);
    }
  };
}

export const startGoogle = startOAuth('google');
export const googleCallback = oauthCallback('google');
export const startLinkedIn = startOAuth('linkedin');
export const linkedinCallback = oauthCallback('linkedin');
