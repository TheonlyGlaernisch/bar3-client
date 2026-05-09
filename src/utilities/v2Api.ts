import { apiFetch } from '@/utilities/authFetch';
import getAppData from '@/actions/getAppData';

const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export function getV2Token(): string {
  const raw =
    localStorage.getItem('pwSessionToken') ||
    localStorage.getItem('pwToken') ||
    localStorage.getItem('v2SessionToken') ||
    '';
  return raw.replace(/^Bearer\s+/i, '').trim();
}

export function hasV2Credentials(): boolean {
  return !!(getV2Token() || (localStorage.getItem('apiKey') || '').trim());
}

function getToken(): string {
  return getV2Token();
}

async function v2Fetch(path: string, init: RequestInit = {}, body?: JsonValue) {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const apiKey = (localStorage.getItem('apiKey') || '').trim();
  if (apiKey) headers['x-api-key'] = apiKey;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  return fetch(`${SERVER_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : init.body,
  });
}

export const v2Api = {
  async loginWithPwApiKey(apiKey: string): Promise<{ token: string; accountId: string }> {
    const res = await v2Fetch('/api/v2/auth/login', { method: 'POST' }, { apiKey });
    if (res.status !== 200) throw new Error((await res.json().catch(() => ({} as any)))?.error || 'Login failed');
    const data = await res.json();
    const token = String(
      data?.token ||
      data?.sessionToken ||
      data?.accessToken ||
      ''
    ).replace(/^Bearer\s+/i, '').trim();
    const accountId = String(
      data?.accountId ||
      data?.account?.id ||
      data?.user?.accountId ||
      ''
    ).trim();
    return { token, accountId };
  },

  async getAutomationState(): Promise<{ enabled: boolean }> {
    try {
      const res = await v2Fetch('/api/v2/automation/state');
      if (res.status === 401 || res.status === 403) {
        throw new Error('Unauthorized');
      }
      if (res.status !== 200) throw new Error('Failed to load automation state');
      return res.json();
    } catch (e) {
      if (e instanceof Error && e.message === 'Unauthorized') {
        throw e;
      }
      const appData = await getAppData();
      if (!appData) throw new Error('Failed to load automation state via fallback endpoint');
      return { enabled: appData.applicationOn };
    }
  },

  async setAutomationState(enabled: boolean): Promise<void> {
    try {
      const res = await v2Fetch('/api/v2/automation/state', { method: 'POST' }, { enabled });
      if (res.status !== 204) throw new Error('Failed to update automation state');
    } catch (e) {
      const res = await apiFetch('/api/setApplicationState', { method: 'POST' }, { applicationOn: enabled });
      if (res.status !== 204) throw new Error('Failed to update automation state via fallback endpoint');
    }
  },

  async upsertTemplate(payload: { subject: string; bodyText?: string; bodyHtml?: string; bodyCss?: string; currentEditor?: number }): Promise<void> {
    const res = await v2Fetch('/api/v2/templates', { method: 'POST' }, payload);
    if (res.status !== 201 && res.status !== 200) {
      const data = await res.json();
      throw new Error(data?.error || `Failed to save (status: ${res.status})`);
    }
  },

  async getMyAnalytics(): Promise<{
    links: { shortId: string; url: string; clickCount: number; lastClickedAt: string | null; clickHistory?: string[] }[];
    messages: { messageId: string; viewCount: number; lastViewedAt: string | null; viewHistory?: string[] }[];
  }> {
    const res = await v2Fetch('/analytics/v2/me');
    if (res.status !== 200) throw new Error('Failed to load analytics');
    return res.json();
  },

  async sendActiveUnallied(payload: { dryRun: boolean; minCities?: number; maxCities?: number }): Promise<any> {
    const res = await v2Fetch('/api/v2/automation/send-active-unallied', { method: 'POST' }, payload);
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized: please log in from Account with your Politics & War API key.');
    }
    if (res.status !== 200) {
      const data = await res.json().catch(() => ({} as any));
      throw new Error(data?.error || 'Failed to send active + unallied messages');
    }
    return res.json();
  },

  async sendActiveUnalliedDiscord(payload: { dryRun: boolean; hasDiscord: boolean; minCities?: number; maxCities?: number }): Promise<any> {
    const res = await v2Fetch('/api/v2/automation/send-active-unallied-discord', { method: 'POST' }, payload);
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized: please log in from Account with your Politics & War API key.');
    }
    if (res.status !== 200) {
      const data = await res.json().catch(() => ({} as any));
      throw new Error(data?.error || 'Failed to send active + unallied + discord-filtered messages');
    }
    return res.json();
  },

  async sendByNationIds(payload: { dryRun: boolean; nationIds: string | number[] }): Promise<any> {
    const res = await v2Fetch('/api/v2/automation/send-by-nation-ids', { method: 'POST' }, payload);
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized: please log in from Account with your Politics & War API key.');
    }
    if (res.status !== 200) {
      const data = await res.json().catch(() => ({} as any));
      throw new Error(data?.error || 'Failed to send messages by nation IDs');
    }
    return res.json();
  }
};
