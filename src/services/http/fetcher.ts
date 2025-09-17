import { tokenStorage } from './token';
import { refreshAccessToken } from './refresh';

export class ApiError extends Error {
  status: number;
  info?: unknown;
  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

type FetcherOptions = {
  baseUrl: string;
};

export function createFetchClient({ baseUrl }: FetcherOptions) {
  async function request<T>(
    path: string,
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
      credentials: 'include', // aman untuk cookie-based; kalau murni header bisa dibiarkan tetap include
      body: json instanceof FormData ? json : json !== undefined ? JSON.stringify(json) : rest.body,
    });

    // 401 -> coba refresh 1x lalu ulang request
    if (res.status === 401 && !noAuth && !retry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // ulangi dengan token baru
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
        tokenStorage.clearAll();
      }
    }

    return handleResponse<T>(res);
  }

  async function handleResponse<T>(res: Response): Promise<T> {
    // handle no content
    if (res.status === 204) return undefined as unknown as T;

    const ct = res.headers.get('content-type') ?? '';
    const isJson = ct.includes('application/json');
    const data = isJson ? await res.json().catch(() => ({})) : await res.text();

    if (!res.ok) {
      const message =
        (isJson && (data as any)?.message) ||
        (typeof data === 'string' ? data : 'Request failed');
      throw new ApiError(message, res.status, data);
    }
    return data as T;
  }

  return { request };
}
