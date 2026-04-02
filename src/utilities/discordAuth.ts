const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

// In-memory cache so the server is only contacted once per page load.
let sessionCache: boolean | null = null;

export const discordAuth = {
  /**
   * Redirect the browser to the server-controlled Discord OAuth start.
   * The server handles PKCE/secret exchange and sets a session cookie on return.
   */
  redirectToDiscord(): void {
    window.location.href = `${SERVER_BASE_URL}/auth/discord`;
  },

  /**
   * Ask the server whether the current session cookie is authenticated.
   * The result is cached in memory for the lifetime of the page to avoid
   * repeated server calls during in-app navigation.
   */
  async isAuthed(): Promise<boolean> {
    if (sessionCache !== null) return sessionCache;
    try {
      const res = await fetch(`${SERVER_BASE_URL}/auth/session`, {
        credentials: 'include',
      });
      sessionCache = res.ok;
    } catch {
      sessionCache = false;
    }
    return sessionCache;
  },

  /**
   * Clear the in-memory cache, any legacy client-side tokens, and redirect to
   * the server logout endpoint so the server can invalidate the session cookie.
   */
  logout(): void {
    sessionCache = null;
    localStorage.removeItem('discordSessionToken');
    window.location.href = `${SERVER_BASE_URL}/auth/logout`;
  },
};
