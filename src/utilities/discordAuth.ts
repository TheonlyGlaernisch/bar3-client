const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

interface SessionData {
  authenticated: boolean;
  isAdmin: boolean;
}

// In-memory cache so the server is only contacted once per page load.
let sessionCache: SessionData | null = null;

export const discordAuth = {
  /**
   * Redirect the browser to the server-controlled Discord OAuth start.
   * The server handles PKCE/secret exchange and sets a session cookie on return.
   * An optional `returnTo` path can be passed so the server can redirect back
   * to the original page after a successful login.
   */
  redirectToDiscord(returnTo?: string): void {
    const url = new URL(`${SERVER_BASE_URL}/auth/discord`);
    if (returnTo) {
      url.searchParams.set('returnTo', returnTo);
    }
    window.location.href = url.toString();
  },

  /**
   * Ask the server whether the current session cookie is authenticated.
   * Parses the JSON response to also capture the `isAdmin` flag.
   * The result is cached in memory for the lifetime of the page to avoid
   * repeated server calls during in-app navigation.
   */
  async getSession(): Promise<SessionData> {
    if (sessionCache !== null) return sessionCache;
    try {
      const res = await fetch(`${SERVER_BASE_URL}/auth/session`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        sessionCache = {
          authenticated: true,
          isAdmin: data.isAdmin === true,
        };
      } else {
        sessionCache = { authenticated: false, isAdmin: false };
      }
    } catch {
      sessionCache = { authenticated: false, isAdmin: false };
    }
    return sessionCache;
  },

  /**
   * Convenience wrapper that returns only the authenticated flag.
   */
  async isAuthed(): Promise<boolean> {
    return (await discordAuth.getSession()).authenticated;
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
