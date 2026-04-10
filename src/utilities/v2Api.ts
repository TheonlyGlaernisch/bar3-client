import { apiFetch } from '@/utilities/authFetch';
import getAppData from '@/actions/getAppData';

const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

function getToken(): string {
  return localStorage.getItem('pwSessionToken') || '';
}

async function graphQlFetch<TData>(query: string, variables?: Record<string, unknown>): Promise<TData> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${SERVER_BASE_URL}/graphql`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized');
  }

  const payload: GraphQLResponse<TData> = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload.errors?.[0]?.message || `GraphQL request failed (status: ${res.status})`);
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message || 'GraphQL request failed');
  }

  if (!payload.data) {
    throw new Error('Missing GraphQL response payload');
  }

  return payload.data;
}

export const v2Api = {
  async loginWithPwApiKey(apiKey: string): Promise<{ token: string; accountId: string }> {
    type LoginPayload = { token: string; accountId: string };
    type LoginResponse = { loginWithPwApiKey?: LoginPayload; login?: LoginPayload };

    const data: LoginResponse = await graphQlFetch<LoginResponse>(
      `mutation LoginWithPwApiKey($apiKey: String!) {
        loginWithPwApiKey(apiKey: $apiKey) { token accountId }
      }`,
      { apiKey }
    ).catch(async (error) => {
      // Compatibility fallback while old v2 route still exists.
      const response = await fetch(`${SERVER_BASE_URL}/api/v2/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (response.status !== 200) {
        throw error;
      }
      const fallbackPayload: LoginPayload = await response.json();
      return { loginWithPwApiKey: fallbackPayload };
    });

    const loginPayload = data.loginWithPwApiKey || data.login;
    if (!loginPayload?.token || !loginPayload?.accountId) {
      throw new Error('Login failed');
    }

    return loginPayload;
  },

  async getAutomationState(): Promise<{ enabled: boolean }> {
    try {
      const data = await graphQlFetch<{
        automationState?: { enabled: boolean };
        getAutomationState?: { enabled: boolean };
      }>(`query AutomationState { automationState { enabled } }`);

      const state = data.automationState || data.getAutomationState;
      if (!state) throw new Error('Failed to load automation state');

      return state;
    } catch (e) {
      if (e instanceof Error && e.message === 'Unauthorized') {
        throw e;
      }
      console.warn('GraphQL getAutomationState failed, falling back to legacy endpoint:', e);
      const appData = await getAppData();
      if (!appData) throw new Error('Failed to load automation state via fallback endpoint');
      return { enabled: appData.applicationOn };
    }
  },

  async setAutomationState(enabled: boolean): Promise<void> {
    try {
      await graphQlFetch<{
        setAutomationState?: boolean;
        updateAutomationState?: { enabled: boolean };
      }>(
        `mutation SetAutomationState($enabled: Boolean!) {
          setAutomationState(enabled: $enabled)
        }`,
        { enabled }
      );
      return;
    } catch (e) {
      console.warn('GraphQL setAutomationState failed, falling back to legacy endpoint:', e);
      const res = await apiFetch('/api/setApplicationState', { method: 'POST' }, { applicationOn: enabled });
      if (res.status !== 204) throw new Error('Failed to update automation state via fallback endpoint');
    }
  },

  async upsertTemplate(payload: { subject: string; bodyText?: string; bodyHtml?: string; bodyCss?: string; currentEditor?: number }): Promise<void> {
    try {
      await graphQlFetch<{ upsertTemplate?: unknown }>(
        `mutation UpsertTemplate(
          $subject: String!
          $bodyText: String
          $bodyHtml: String
          $bodyCss: String
          $currentEditor: Int
        ) {
          upsertTemplate(
            subject: $subject
            bodyText: $bodyText
            bodyHtml: $bodyHtml
            bodyCss: $bodyCss
            currentEditor: $currentEditor
          )
        }`,
        payload
      );
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
    const data = await graphQlFetch<{
      myAnalytics?: {
        links: { shortId: string; url: string; clickCount: number; lastClickedAt: string | null; clickHistory?: string[] }[];
        messages: { messageId: string; viewCount: number; lastViewedAt: string | null; viewHistory?: string[] }[];
      };
    }>(`query MyAnalytics { myAnalytics { links { shortId url clickCount lastClickedAt clickHistory } messages { messageId viewCount lastViewedAt viewHistory } } }`);

    if (!data.myAnalytics) throw new Error('Failed to load analytics');
    return data.myAnalytics;
  },

  async sendActiveUnallied(payload: { dryRun: boolean; minCities?: number; maxCities?: number }): Promise<unknown> {
    const data = await graphQlFetch<{ sendActiveUnallied?: unknown }>(
      `mutation SendActiveUnallied($dryRun: Boolean!, $minCities: Int, $maxCities: Int) {
        sendActiveUnallied(dryRun: $dryRun, minCities: $minCities, maxCities: $maxCities)
      }`,
      payload
    );

    if (data.sendActiveUnallied === undefined) {
      throw new Error('Failed to send active + unallied messages');
    }

    return data.sendActiveUnallied;
  },

  async sendActiveUnalliedDiscord(payload: { dryRun: boolean; hasDiscord: boolean; minCities?: number; maxCities?: number }): Promise<unknown> {
    const data = await graphQlFetch<{ sendActiveUnalliedDiscord?: unknown }>(
      `mutation SendActiveUnalliedDiscord(
        $dryRun: Boolean!
        $hasDiscord: Boolean!
        $minCities: Int
        $maxCities: Int
      ) {
        sendActiveUnalliedDiscord(
          dryRun: $dryRun
          hasDiscord: $hasDiscord
          minCities: $minCities
          maxCities: $maxCities
        )
      }`,
      payload
    );

    if (data.sendActiveUnalliedDiscord === undefined) {
      throw new Error('Failed to send active + unallied + discord-filtered messages');
    }

    return data.sendActiveUnalliedDiscord;
  }
};
