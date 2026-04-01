const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

const DISCORD_SESSION_KEY = 'discordSessionToken';

export const discordAuth = {
  /** Build the Discord OAuth2 URL and redirect the browser to it. */
  redirectToDiscord(): void {
    const clientId = process.env.VUE_APP_DISCORD_CLIENT_ID || '';
    if (!clientId) {
      console.error('[discordAuth] VUE_APP_DISCORD_CLIENT_ID is not set. Discord login will not work.');
    }
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/auth/discord/callback`
    );
    const scope = encodeURIComponent('identify guilds.members.read');
    window.location.href =
      `https://discord.com/oauth2/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=${scope}`;
  },

  /**
   * Send the OAuth2 code to the server for verification.
   * The server will exchange the code for a Discord token, check that the
   * user holds role 1361784636119978086 in guild 1358837641973338334, and
   * return a short-lived session token on success.
   */
  async exchangeCode(code: string): Promise<string> {
    const redirectUri = `${window.location.origin}/auth/discord/callback`;
    const res = await fetch(`${SERVER_BASE_URL}/api/discord/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(
        typeof data?.error === 'string' ? data.error : 'Discord authentication failed'
      );
    }
    const data = await res.json() as { token: string };
    return data.token;
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
