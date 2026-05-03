const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

// In-memory cache so the server is only contacted once per page load.
let botSessionCache: boolean | null = null;

export const botAuth = {
  /**
   * Ask the server whether the current session has bot-panel access.
   * Uses a separate endpoint from the standard Discord auth check so that
   * bot access can be granted to a smaller set of users independently.
   * The result is cached in memory for the lifetime of the page.
   */
  async isAuthed(): Promise<boolean> {
    if (botSessionCache !== null) return botSessionCache;
    try {
      const res = await fetch(`${SERVER_BASE_URL}/auth/bot/session`, {
        credentials: 'include',
      });
      botSessionCache = res.ok;
    } catch {
      botSessionCache = false;
    }
    return botSessionCache;
  },

  /** Clear the cached result (e.g. after logout). */
  clearCache(): void {
    botSessionCache = null;
  },
};
