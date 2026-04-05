export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');

  const response = await fetch(path.startsWith('/api') ? path : `/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(payload.message ?? 'Request failed');
  }

  if (response.status === 204) return {} as T;

  return response.json() as Promise<T>;
}
