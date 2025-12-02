import { ApiHttpError } from "@/errors/ApiHttpError";
import { bearer } from "@/helpers/bearer.helper";
import { isFormData } from "@/helpers/formData.helper";
import { mergeHeaders } from "@/helpers/mergeHeaders.helper";
import { parseResponse } from "@/helpers/parseResponse.helper";
import type { ApiFetchOptions } from "@/types/TApiFetchOptions";
import { buildUrl, isBrowser } from "@/utils/url";

// ------ Token store (global) ------
let accessTokenCache: string | null = null;
let refreshInFlight: Promise<string> | null = null;

const isRefreshPath = (urlOrPath: string) => /\/auth\/refresh(\?|$)/.test(urlOrPath);

const readLS = () => {
  if (!isBrowser) return null;
  try { return localStorage.getItem("accessToken"); } catch { return null; }
};
const writeLS = (val: string | null) => {
  if (!isBrowser) return;
  try {
    if (val) localStorage.setItem("accessToken", val);
    else localStorage.removeItem("accessToken");
  // eslint-disable-next-line no-empty
  } catch {}
};

export const getAccessToken = (): string | null => accessTokenCache ?? readLS();
export const setAccessToken = (t: string | null) => {
  accessTokenCache = t ?? null;
  writeLS(accessTokenCache);
};

// --- SINGLETON refresh request ---
export async function requestRefresh(): Promise<string> {
  if (!refreshInFlight) {
    const url = buildUrl("/auth/refresh");
    refreshInFlight = (async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
      });
      const data = await parseResponse(res);

      if (!res.ok) {
        const msg = data?.message || res.statusText || `HTTP ${res.status}`;
        // refresh gagal → kosongkan access token
        setAccessToken(null);
        throw new ApiHttpError(msg, data, res.status, url, "POST");
      }

      const token =
        data?.accessToken ||
        data?.token ||
        data?.data?.accessToken ||
        data?.data?.token;

      if (!token) {
        // tidak ada token di response → kosongkan access token
        setAccessToken(null);
        throw new ApiHttpError("Refresh tidak mengembalikan accessToken.", data, res.status, url, "POST");
      }

      setAccessToken(token);
      return token;
    })().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

// --- MAIN FETCH WRAPPER ---
export async function apiFetch<T = unknown, B = unknown>(path: string, opts: ApiFetchOptions<B> = {}): Promise<T> {
  const {
    method = "GET",
    token,
    body,
    headers,
    query,
    cache = "no-store",
    revalidate = 0,
    signal,
    timeoutMs,
  } = opts;

  const url = buildUrl(path, query);
  const form = isFormData(body);
  const tokenToUse: string | undefined = (token ?? getAccessToken()) ?? undefined;

  const makeInit = (tk?: string): RequestInit & { next?: { revalidate?: number } } => {
    const baseHeaderObj: Record<string, string> = {
      ...(form ? {} : { "Content-Type": "application/json" }),
      ...(tk ? { Authorization: bearer(tk)! } : {}),
    };
    const mergedHeaders = mergeHeaders(baseHeaderObj, headers);
    return {
      method,
      headers: mergedHeaders,
      body: form ? (body as FormData) : body != null ? JSON.stringify(body) : undefined,
      ...(isBrowser ? { credentials: "include" as RequestCredentials } : {}),
      cache,
      next: { revalidate },
      signal,
    };
  };

  const controller = !signal && timeoutMs ? new AbortController() : undefined;
  const abortSignal = signal ?? controller?.signal;
  const timer = controller && timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  let res: Response | null = null;
  try {
    // attempt #1
    res = await fetch(url, { ...makeInit(tokenToUse), signal: abortSignal });

    // jika 401 dan bukan endpoint refresh → lakukan refresh tunggal
    if (res.status === 401 && !isRefreshPath(path)) {
      try {
        const newToken = await requestRefresh();
        res = await fetch(url, { ...makeInit(newToken), signal: abortSignal }); // retry sekali
      } catch {
        // refresh gagal → kosongkan access token lalu biarkan error 401 dipropagasi di bawah
        setAccessToken(null);
      }
    }

    const data = await parseResponse(res!);
    if (!res!.ok) {
      const msg = data?.message || data?.detail || res!.statusText || `HTTP ${res!.status}`;
      throw new ApiHttpError(msg, data, res!.status, url, method);
    }
    return data as T;
  } catch (err: unknown) {
    const isAbort =    
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as Record<string, unknown>).name === 'AbortError';

    if (isAbort && timeoutMs) {
      throw new ApiHttpError(`Request timed out after ${timeoutMs}ms`, {}, 0, url, method);
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}