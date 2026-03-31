/**
 * Politics & War GraphQL API utilities.
 * Fetches per-user API key details (daily request usage).
 */

const PW_GRAPHQL_URL = 'https://api.politicsandwar.com/graphql';

export interface PwApiKeyDetails {
  used: number;
  max: number;
  /** Remaining requests for the current rate-limit window (from X-RateLimit-Remaining header). */
  remaining: number;
}

/**
 * Fetch the current user's P&W API key request usage.
 * Reads `X-RateLimit-Limit` and `X-RateLimit-Remaining` response headers
 * to populate the rate-limit fields.  Falls back to the GraphQL body data
 * (`me { requests max_requests }`) when the headers are absent.
 * Returns { used: 0, max: 0, remaining: 0 } on any error.
 */
export async function getPwApiKeyDetails(apiKey: string): Promise<PwApiKeyDetails> {
  try {
    const query = '{ me { requests max_requests } }';
    const url = `${PW_GRAPHQL_URL}?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { used: 0, max: 0, remaining: 0 };

    // Read the standard rate-limit response headers when available.
    const rawLimit = res.headers.get('X-RateLimit-Limit');
    const rawRemaining = res.headers.get('X-RateLimit-Remaining');
    const headerLimit = rawLimit !== null ? parseInt(rawLimit, 10) : null;
    const headerRemaining = rawRemaining !== null ? parseInt(rawRemaining, 10) : null;

    const data = await res.json();
    const me = data?.data?.me;

    // `used` always comes from the GraphQL body (daily requests used today).
    const used = me?.requests ?? 0;
    // `max` prefers the header (reflects the key's actual cap) then falls back to the body.
    const max = (headerLimit !== null && !isNaN(headerLimit)) ? headerLimit : (me?.max_requests ?? 0);
    // `remaining` comes from the header; 0 when the header is absent.
    const remaining = (headerRemaining !== null && !isNaN(headerRemaining)) ? headerRemaining : 0;

    return { used, max, remaining };
  } catch {
    return { used: 0, max: 0, remaining: 0 };
  }
}
