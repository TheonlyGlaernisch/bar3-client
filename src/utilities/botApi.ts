const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

async function botFetch(path: string, init: RequestInit = {}, body?: unknown) {
  const existingHeaders = init.headers;
  const extraHeaders: Record<string, string> = {};

  if (existingHeaders instanceof Headers) {
    existingHeaders.forEach((value, key) => { extraHeaders[key] = value; });
  } else if (Array.isArray(existingHeaders)) {
    for (const [key, value] of existingHeaders) extraHeaders[key] = value;
  } else if (existingHeaders) {
    Object.assign(extraHeaders, existingHeaders);
  }

  if (body !== undefined) extraHeaders['Content-Type'] = 'application/json';

  return fetch(`${SERVER_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: extraHeaders,
    body: body !== undefined ? JSON.stringify(body) : init.body,
  });
}

export interface BotServer {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

export interface BotCommand {
  name: string;
  usageCount: number;
  description: string;
}

export const botApi = {
  /**
   * Fetch the list of Discord servers the bot is currently a member of.
   * Backend: GET /api/bot/servers
   */
  async getServers(): Promise<BotServer[]> {
    const res = await botFetch('/api/bot/servers');
    if (!res.ok) throw new Error('Failed to load bot servers');
    return res.json();
  },

  /**
   * Fetch the most-used bot commands sorted by usage count descending.
   * Backend: GET /api/bot/commands/usage
   */
  async getCommandUsage(): Promise<BotCommand[]> {
    const res = await botFetch('/api/bot/commands/usage');
    if (!res.ok) throw new Error('Failed to load command usage');
    return res.json();
  },

  /**
   * Send a message through the bot (distinct from the Politics & War mailer).
   * Backend: POST /api/bot/send  { channelId, content }
   */
  async sendMessage(channelId: string, content: string): Promise<void> {
    const res = await botFetch('/api/bot/send', { method: 'POST' }, { channelId, content });
    if (!res.ok) {
      const data = await res.json().catch(() => ({} as any));
      throw new Error(data?.error || 'Failed to send bot message');
    }
  },
};
