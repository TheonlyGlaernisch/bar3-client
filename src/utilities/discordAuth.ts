const FLAME_BOT_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';
const FLAME_BOT_API_KEY = process.env.VUE_APP_FLAME_BOT_API_KEY || '';

const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';
const DISCORD_ME_URL = 'https://discord.com/api/users/@me';

const DISCORD_SESSION_KEY = 'discordSessionToken';
const PKCE_VERIFIER_KEY = 'discordPkceVerifier';

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array.buffer);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(digest);
}

// ---------------------------------------------------------------------------

export const discordAuth = {
  /**
   * Build the Discord OAuth2 URL using PKCE and redirect the browser to it.
   * The PKCE code verifier is persisted in sessionStorage so it can be
   * retrieved in the callback.
   */
  async redirectToDiscord(): Promise<void> {
    const clientId = process.env.VUE_APP_DISCORD_CLIENT_ID || '';
    if (!clientId) {
      throw new Error('[discordAuth] VUE_APP_DISCORD_CLIENT_ID is not set. Configure the Discord application client ID.');
    }

    const verifier = await generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = encodeURIComponent('identify');
    window.location.href =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&code_challenge=${challenge}` +
      `&code_challenge_method=S256`;
  },

  /**
   * Exchange the OAuth2 code for a Discord access token (via PKCE), fetch the
   * user's Discord ID, and verify the bar3_client role via the flame_bot API.
   * Returns the Discord user ID, which is stored as the session identifier.
   */
  async exchangeCode(code: string): Promise<string> {
    const redirectUri = window.location.origin;
    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY) || '';
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);

    // Exchange the authorization code for a Discord access token.
    const tokenRes = await fetch(DISCORD_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        /* eslint-disable @typescript-eslint/camelcase */
        client_id: process.env.VUE_APP_DISCORD_CLIENT_ID || '',
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
        /* eslint-enable @typescript-eslint/camelcase */
      }),
    });
    if (!tokenRes.ok) {
      throw new Error('Failed to exchange Discord authorization code');
    }
    const tokenData = await tokenRes.json() as { access_token: string };

    // Resolve the Discord user ID.
    const meRes = await fetch(DISCORD_ME_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!meRes.ok) {
      throw new Error('Failed to fetch Discord user identity');
    }
    const meData = await meRes.json() as { id: string };
    const discordId = meData.id;

    // Check the bar3_client role via flame_bot.
    const rolesRes = await fetch(`${FLAME_BOT_URL}/api/roles/${discordId}`, {
      headers: { 'X-API-Key': FLAME_BOT_API_KEY },
    });
    if (rolesRes.status === 401) {
      throw new Error('Invalid flame_bot API key — please contact an administrator');
    }
    if (!rolesRes.ok) {
      throw new Error('Failed to check Discord roles');
    }
    const rolesData = await rolesRes.json() as {
      roles: { verified: boolean; bar3_client: boolean; bar3_server: boolean };
    };
    if (!rolesData.roles.bar3_client) {
      throw new Error('Access denied: you do not have the bar3 client role');
    }

    return discordId;
  },

  isAuthed(): boolean {
    return !!localStorage.getItem(DISCORD_SESSION_KEY);
  },

  getToken(): string {
    return localStorage.getItem(DISCORD_SESSION_KEY) || '';
  },

  saveToken(token: string): void {
    localStorage.setItem(DISCORD_SESSION_KEY, token);
  },

  logout(): void {
    localStorage.removeItem(DISCORD_SESSION_KEY);
  },
};
