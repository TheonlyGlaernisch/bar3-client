import { Message } from '../types';
import { apiFetch } from '@/utilities/authFetch';
import { getPwApiKeyDetails } from '@/utilities/pwApi';

export interface AppData {
  applicationOn: boolean;
  isSetup: boolean;
  sentMessages: Message[];
  apiDetails: {
    used: number;
    max: number;
  };
  serverVersion: string;
}

export default async function getAppData(): Promise<AppData | null> {
  const response = await apiFetch('/api/appData').catch((e) => {
    console.error(e);
    return undefined;
  });

  if (!response) return null;
  if (response.status !== 200) return null;

  const data: AppData | undefined = await response.json().catch(() => {
    console.error('Could not parse appData!');
    return undefined;
  });

  if (!data) return null;

  // The server's global requestsUsed/requestsMax are only populated by the legacy
  // single-user search loop and are always 0 for v2 users. When the server returns
  // zero for max, fall back to querying P&W GraphQL directly from the client so the
  // dashboard always shows accurate API usage.
  if (data.apiDetails.max === 0) {
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      const details = await getPwApiKeyDetails(apiKey).catch((e) => {
        console.error('Failed to fetch P&W API key details as fallback:', e);
        return { used: 0, max: 0 };
      });
      if (details.max > 0) {
        data.apiDetails = details;
      }
    }
  }

  return data;
}
