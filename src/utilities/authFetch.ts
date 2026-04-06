const SERVER_BASE_URL =
  process.env.VUE_APP_SERVER_URL || 'https://bar3-server.onrender.com';

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  body?: JsonValue
): Promise<Response> {
  const apiKey = localStorage.getItem('apiKey') || '';

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };

  const method = (init.method || 'GET').toUpperCase();
  if (apiKey && method !== 'GET') headers['x-api-key'] = apiKey;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${SERVER_BASE_URL}${path}`, {
    ...init,
    headers,
    body: body !== undefined ? JSON.stringify(body) : init.body,
  });

  return response;
}


