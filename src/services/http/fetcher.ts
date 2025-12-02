/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/http/fetcher.ts
import { tokenStorage } from './token';
import { refreshAccessToken } from './refresh';

export function createFetchClient({ baseUrl }: { baseUrl: string }) {
  async function request<T>(path: string,
    init: RequestInit & { json?: unknown; noAuth?: boolean; retry?: boolean } = {}
  ): Promise<T> {
    const { json, noAuth, retry, ...rest } = init;
    const headers = new Headers(rest.headers || {});
    const token = tokenStorage.get();

    if (json !== undefined && !(json instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (!noAuth && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(baseUrl + path, {
      ...rest,
      headers,
      credentials: 'include',
      body: json instanceof FormData ? json : json !== undefined ? JSON.stringify(json) : rest.body,
    });

    // 401 → coba refresh sekali
    if (res.status === 401 && !noAuth && !retry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const h2 = new Headers(headers);
        h2.set('Authorization', `Bearer ${newToken}`);
        const res2 = await fetch(baseUrl + path, {
          ...rest,
          headers: h2,
          credentials: 'include',
          body: json instanceof FormData ? json : json !== undefined ? JSON.stringify(json) : rest.body,
        });
        return handleResponse<T>(res2);
      } else {
        // refresh gagal → bersihkan & broadcast logout
        tokenStorage.clearAll();
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'refresh_failed' } }));
      }
    }

    return handleResponse<T>(res);
  }

  async function handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 204) return undefined as unknown as T;
    const ct = res.headers.get('content-type') ?? '';
    const isJson = ct.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
      const message = (isJson && (data as any)?.message) || (typeof data === 'string' ? data : 'Request failed');
      const err = new Error(message) as any;
      err.status = res.status;
      err.info = data;
      throw err;
    }
    return data as T;
  }

  return { request };
}
