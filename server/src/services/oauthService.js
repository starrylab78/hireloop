import axios from 'axios';
import jwt from 'jsonwebtoken';

const PROVIDERS = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: 'openid email profile',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: () => process.env.GOOGLE_CALLBACK_URL,
  },
  linkedin: {
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/userinfo', // LinkedIn's OIDC-compliant endpoint
    scope: 'openid profile email',
    clientId: () => process.env.LINKEDIN_CLIENT_ID,
    clientSecret: () => process.env.LINKEDIN_CLIENT_SECRET,
    callbackUrl: () => process.env.LINKEDIN_CALLBACK_URL,
  },
};

export function isProviderConfigured(provider) {
  const p = PROVIDERS[provider];
  return Boolean(p?.clientId() && p?.clientSecret() && p?.callbackUrl());
}

/** Signs a short-lived JWT carrying the intended role + a CSRF nonce, used as OAuth `state`. */
export function signOAuthState({ role }) {
  return jwt.sign({ role, nonce: Math.random().toString(36).slice(2) }, process.env.JWT_ACCESS_SECRET, { expiresIn: '10m' });
}

export function verifyOAuthState(state) {
  try {
    return jwt.verify(state, process.env.JWT_ACCESS_SECRET);
  } catch {
    return null;
  }
}

export function buildAuthorizeUrl(provider, state) {
  const p = PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: p.clientId(),
    redirect_uri: p.callbackUrl(),
    response_type: 'code',
    scope: p.scope,
    state,
  });
  return `${p.authorizeUrl}?${params.toString()}`;
}

/** Exchanges an authorization code for tokens, then fetches the normalized profile. */
export async function fetchOAuthProfile(provider, code) {
  const p = PROVIDERS[provider];

  const { data: tokenData } = await axios.post(
    p.tokenUrl,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: p.callbackUrl(),
      client_id: p.clientId(),
      client_secret: p.clientSecret(),
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const { data: profile } = await axios.get(p.userInfoUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  // Both Google and LinkedIn's OIDC userinfo endpoints return { sub, email, name, ... }
  return {
    providerId: profile.sub,
    email: profile.email,
    name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' '),
  };
}
