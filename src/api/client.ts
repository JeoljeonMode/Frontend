export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8082';

export function authHeaders(): HeadersInit {
  const token = localStorage.getItem('bedsafe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init.headers ?? {}),
    },
  });
}
