import { apiFetch } from '@/utilities/authFetch';
const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

function getToken(): string {
  return localStorage.getItem('pwSessionToken') || '';
}

async function v2Fetch(path: string, init: RequestInit = {}, body?: JsonValue) {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  return fetch(`${SERVER_BASE_URL}${path}`, {
    ...init,
    headers,
    body: body !== undefined ? JSON.stringify(body) : init.body,
  });
}

export const v2Api = {
  async loginWithPwApiKey(apiKey: string): Promise<{ token: string; accountId: string }> {
    const res = await v2Fetch('/api/v2/auth/login', { method: 'POST' }, { apiKey });
    if (res.status !== 200) throw new Error((await res.json().catch(() => ({} as any)))?.error || 'Login failed');
    return res.json();
  },

  async getAutomationState(): Promise<{ enabled: boolean }> {
    try {
      const res = await v2Fetch('/api/v2/automation/state');
      if (res.status === 200) return res.json();
      throw new Error('Failed to load automation state');
    } catch {
      const fallback = await apiFetch('/api/appData');
      if (fallback.status !== 200) throw new Error('Failed to load automation state');
      const data = await fallback.json() as { applicationOn?: boolean };
      return { enabled: !!data.applicationOn };
    }
  },

  async setAutomationState(enabled: boolean): Promise<void> {
    try {
      const res = await v2Fetch('/api/v2/automation/state', { method: 'POST' }, { enabled });
      if (res.status === 204) return;
      throw new Error('Failed to update automation state');
    } catch {
      const fallback = await apiFetch('/api/setApplicationState', { method: 'POST' }, { applicationOn: enabled });
      if (fallback.status !== 204) throw new Error('Failed to update automation state');
    }
  },

  async upsertTemplate(payload: { subject: string; bodyText?: string; bodyHtml?: string; bodyCss?: string; currentEditor?: number }): Promise<void> {
    try {
      const res = await v2Fetch('/api/v2/templates', { method: 'POST' }, payload);
      if (res.status !== 201 && res.status !== 200) {
        const data = await res.json();
        throw new Error(data?.error || `Failed to save (status: ${res.status})`);
      }
      return;
    } catch (e) {
      console.error('Failed to save template to backend:', e);
      throw e;
    }
  },

  async getMyAnalytics(): Promise<{
    links: { shortId: string; url: string; clickCount: number; lastClickedAt: string | null; clickHistory?: string[] }[];
    messages: { messageId: string; viewCount: number; lastViewedAt: string | null; viewHistory?: string[] }[];
  }> {
    const res = await v2Fetch('/analytics/v2/me');
    if (res.status !== 200) throw new Error('Failed to load analytics');
    return res.json();
  }
};
