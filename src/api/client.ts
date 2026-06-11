export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8083';

export function getToken(): string | null {
  return localStorage.getItem('bedsafe_token');
}

export function authHeaders(): HeadersInit {
  const token = getToken();
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
