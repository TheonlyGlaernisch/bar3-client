import { apiFetch } from '@/utilities/authFetch';
import { v2Api } from '@/utilities/v2Api';

export default async function setApplicationState(applicationOn: boolean) {
  let error;

  const token = localStorage.getItem('pwSessionToken') || '';
  if (token) {
    try {
      await v2Api.setAutomationState(applicationOn);
      return true;
    } catch (e) {
      error = e;
      return error;
    }
  }

  const response = await apiFetch(
    '/api/setApplicationState',
    { method: 'POST' },
    { applicationOn }
  ).catch((e) => {
    error = e;
  });

  if (!response) return error;
  if (response.status !== 204) return new Error('Unexpected response code: ' + response.status);

  return true;
}
