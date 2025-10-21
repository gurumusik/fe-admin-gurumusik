/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/http/refresh.ts
import { ENV } from "@/config/env";
import { ENDPOINTS } from "../endpoints";
import { tokenStorage, type TokenPair } from "./token";

let refreshPromise: Promise<string | null> | null = null;

function coercePair(anyData: any): Partial<TokenPair> | null {
  if (!anyData) return null;
  const src = anyData.data ?? anyData;
  const access =
    src.access_token ?? src.accessToken ?? (typeof src.token === "string" ? src.token : undefined);
  const refresh =
    src.refresh_token ?? src.refreshToken ?? (typeof src.refresh === "string" ? src.refresh : undefined);
  if (!access && !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

async function doRefresh(): Promise<string | null> {
  const url = (ENV.API_BASE_URL ?? "") + ENDPOINTS.AUTH.REFRESH;
  const rt = tokenStorage.getRefresh();

  const init: RequestInit = {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  };

  // 1) Coba body { refresh_token } jika ada
  let res = await fetch(url, { ...init, body: rt ? JSON.stringify({ refresh_token: rt }) : undefined });

  // 2) Jika gagal, **SELALU** coba cookie-only fallback (POST kosong)
  if (!res.ok) {
    res = await fetch(url, { ...init, body: undefined });
  }

  if (!res.ok) return null;
  if (res.status === 204) return tokenStorage.get() || null;

  let data: any = null;
  data = await res.json(); 

  const pair = coercePair(data);
  if (pair?.access_token) tokenStorage.set(pair.access_token);
  if (pair?.refresh_token) tokenStorage.setRefresh(pair.refresh_token!);

  return tokenStorage.get();
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
