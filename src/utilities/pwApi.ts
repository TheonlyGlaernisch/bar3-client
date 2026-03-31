/**
 * Politics & War GraphQL API utilities.
 * Fetches per-user API key details (daily request usage).
 */

const PW_GRAPHQL_URL = 'https://api.politicsandwar.com/graphql/v1';

export interface PwApiKeyDetails {
  used: number;
  max: number;
}

/**
 * Fetch the current user's P&W API key request usage.
 * Returns { used: 0, max: 0 } on any error.
 */
export async function getPwApiKeyDetails(apiKey: string): Promise<PwApiKeyDetails> {
  try {
    const query = '{ api_key_details { requests_today max_requests } }';
    const url = `${PW_GRAPHQL_URL}?apikey=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    if (!res.ok) return { used: 0, max: 0 };

    const data = await res.json();
    const details = data?.data?.api_key_details;
    if (!details) return { used: 0, max: 0 };

    return {
      used: details.requests_today ?? 0,
      max: details.max_requests ?? 0,
    };
  } catch {
    return { used: 0, max: 0 };
  }
}
