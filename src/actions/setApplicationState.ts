import { apiFetch } from '@/utilities/authFetch';

export default async function setApplicationState(applicationOn: boolean) {
  let error;

  const response = await apiFetch(
    '/api/setApplicationState',
    { method: 'POST' },
    { applicationOn }
  ).catch((e) => {
    error = e;
    console.error(e);
  });

  if (!response) return error;
  if (response.status !== 204) return new Error('Unexpected response code: ' + response.status);

  return true;
}
