const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

interface GraphQLError {
  message?: string;
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

  const payload: GraphQLResponse<TData> = await res.json().catch(() => ({}));

  if (res.status === 401 || res.status === 403) {
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(payload.errors?.[0]?.message || `GraphQL request failed (status ${res.status})`);
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || 'GraphQL request failed');
  }

  if (!payload.data) {
    throw new Error('Missing GraphQL response payload');
  }

  return payload.data;
}

async function tryOperations<TData>(
  operations: Array<{ query: string; pick: (data: TData) => unknown }>,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const errors: string[] = [];

  for (const op of operations) {
    try {
      const data = await graphQlFetch<TData>(op.query, variables);
      const picked = op.pick(data);
      if (picked !== undefined && picked !== null) return picked;
      errors.push('operation returned empty payload');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(message);
    }
  }

  throw new Error(errors.filter(Boolean).join(' | ') || 'All GraphQL operations failed');
}

interface V2Analytics {
  links: { shortId: string; url: string; clickCount: number; lastClickedAt: string | null; clickHistory?: string[] }[];
  messages: { messageId: string; viewCount: number; lastViewedAt: string | null; viewHistory?: string[] }[];
}

export const v2Api = {
  async loginWithPwApiKey(apiKey: string): Promise<{ token: string; accountId: string }> {
    type LoginPayload = { token: string; accountId: string };
    type LoginData = {
      loginWithPwApiKey?: LoginPayload;
      login?: LoginPayload;
      pwLogin?: LoginPayload;
    };

    const result = await tryOperations<LoginData>([
      {
        query: `mutation LoginWithPwApiKey($apiKey: String!) {
          loginWithPwApiKey(apiKey: $apiKey) { token accountId }
        }`,
        pick: (data) => data.loginWithPwApiKey,
      },
      {
        query: `mutation Login($apiKey: String!) {
          login(apiKey: $apiKey) { token accountId }
        }`,
        pick: (data) => data.login,
      },
      {
        query: `mutation PwLogin($apiKey: String!) {
          pwLogin(apiKey: $apiKey) { token accountId }
        }`,
        pick: (data) => data.pwLogin,
      },
    ], { apiKey });

    const login = result as LoginPayload;
    if (!login?.token || !login?.accountId) throw new Error('Login failed');
    return login;
  },

  async getAutomationState(): Promise<{ enabled: boolean }> {
    type StatePayload = { enabled: boolean };
    type StateData = { automationState?: StatePayload; getAutomationState?: StatePayload };

    const result = await tryOperations<StateData>([
      {
        query: `query AutomationState { automationState { enabled } }`,
        pick: (data) => data.automationState,
      },
      {
        query: `query GetAutomationState { getAutomationState { enabled } }`,
        pick: (data) => data.getAutomationState,
      },
    ]);

    return result as StatePayload;
  },

  async setAutomationState(enabled: boolean): Promise<void> {
    type SetStateData = { setAutomationState?: boolean; updateAutomationState?: { enabled: boolean } };

    await tryOperations<SetStateData>([
      {
        query: `mutation SetAutomationState($enabled: Boolean!) {
          setAutomationState(enabled: $enabled)
        }`,
        pick: (data) => data.setAutomationState,
      },
      {
        query: `mutation UpdateAutomationState($enabled: Boolean!) {
          updateAutomationState(enabled: $enabled) { enabled }
        }`,
        pick: (data) => data.updateAutomationState,
      },
    ], { enabled });
  },

  async upsertTemplate(payload: { subject: string; bodyText?: string; bodyHtml?: string; bodyCss?: string; currentEditor?: number }): Promise<void> {
    type TemplateData = { upsertTemplate?: unknown; saveTemplate?: unknown };

    await tryOperations<TemplateData>([
      {
        query: `mutation UpsertTemplate(
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
        pick: (data) => data.upsertTemplate,
      },
      {
        query: `mutation SaveTemplate(
          $subject: String!
          $bodyText: String
          $bodyHtml: String
          $bodyCss: String
          $currentEditor: Int
        ) {
          saveTemplate(
            subject: $subject
            bodyText: $bodyText
            bodyHtml: $bodyHtml
            bodyCss: $bodyCss
            currentEditor: $currentEditor
          )
        }`,
        pick: (data) => data.saveTemplate,
      },
    ], payload);
  },

  async getMyAnalytics(): Promise<V2Analytics> {
    type AnalyticsData = { myAnalytics?: V2Analytics; analyticsMe?: V2Analytics };

    const result = await tryOperations<AnalyticsData>([
      {
        query: `query MyAnalytics {
          myAnalytics {
            links { shortId url clickCount lastClickedAt clickHistory }
            messages { messageId viewCount lastViewedAt viewHistory }
          }
        }`,
        pick: (data) => data.myAnalytics,
      },
      {
        query: `query AnalyticsMe {
          analyticsMe {
            links { shortId url clickCount lastClickedAt clickHistory }
            messages { messageId viewCount lastViewedAt viewHistory }
          }
        }`,
        pick: (data) => data.analyticsMe,
      },
    ]);

    return result as V2Analytics;
  },

  async sendActiveUnallied(payload: { dryRun: boolean; minCities?: number; maxCities?: number }): Promise<unknown> {
    type SendData = { sendActiveUnallied?: unknown; runActiveUnallied?: unknown };

    return tryOperations<SendData>([
      {
        query: `mutation SendActiveUnallied($dryRun: Boolean!, $minCities: Int, $maxCities: Int) {
          sendActiveUnallied(dryRun: $dryRun, minCities: $minCities, maxCities: $maxCities)
        }`,
        pick: (data) => data.sendActiveUnallied,
      },
      {
        query: `mutation RunActiveUnallied($dryRun: Boolean!, $minCities: Int, $maxCities: Int) {
          runActiveUnallied(dryRun: $dryRun, minCities: $minCities, maxCities: $maxCities)
        }`,
        pick: (data) => data.runActiveUnallied,
      },
    ], payload);
  },

  async sendActiveUnalliedDiscord(payload: { dryRun: boolean; hasDiscord: boolean; minCities?: number; maxCities?: number }): Promise<unknown> {
    type SendDiscordData = {
      sendActiveUnalliedDiscord?: unknown;
      runActiveUnalliedDiscord?: unknown;
    };

    return tryOperations<SendDiscordData>([
      {
        query: `mutation SendActiveUnalliedDiscord(
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
        pick: (data) => data.sendActiveUnalliedDiscord,
      },
      {
        query: `mutation RunActiveUnalliedDiscord(
          $dryRun: Boolean!
          $hasDiscord: Boolean!
          $minCities: Int
          $maxCities: Int
        ) {
          runActiveUnalliedDiscord(
            dryRun: $dryRun
            hasDiscord: $hasDiscord
            minCities: $minCities
            maxCities: $maxCities
          )
        }`,
        pick: (data) => data.runActiveUnalliedDiscord,
      },
    ], payload);
  }
};
