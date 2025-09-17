import { ENV } from '@/config/env';
import { tokenStorage, type TokenPair } from './token';

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = tokenStorage.getRefresh();
  if (!rt) return null;

  const res = await fetch(`${ENV.API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',             // jika backend pakai cookie, biarkan. Tidak masalah kalau tidak.
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Partial<TokenPair>;
  if (!data.access_token || !data.refresh_token) return null;

  tokenStorage.setPair({ access_token: data.access_token, refresh_token: data.refresh_token });
  return data.access_token;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
