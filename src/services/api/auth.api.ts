/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api/auth.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints/';
import { tokenStorage, type TokenPair } from '../http/token';

export type LoginPayload = { email: string; password: string };
export type MeResp = { id: number; name: string; role: 'admin'|'guru'|'user' };

// helper: terima berbagai bentuk respons token
function coerceTokenPair(input: any): TokenPair {
  const src = input?.data ?? input ?? {};
  const access =
    src.access_token ?? src.accessToken ?? (typeof src.token === 'string' ? src.token : undefined);
  const refresh =
    src.refresh_token ?? src.refreshToken ?? (typeof src.refresh === 'string' ? src.refresh : undefined);

  if (!access) throw new Error('Access token kosong pada respons login');
  // refresh boleh kosong kalau server cookie-based; simpan kalau ada
  return { access_token: String(access), refresh_token: String(refresh ?? '') };
}

export async function login(payload: LoginPayload) {
  // ⚠️ gunakan any dulu supaya bisa dikoersi
  const raw = await baseUrl.request<any>(ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    json: payload,
    noAuth: true,
  });
  const pair = coerceTokenPair(raw);
  tokenStorage.set(pair.access_token);
  if (pair.refresh_token) tokenStorage.setRefresh(pair.refresh_token);

  return getMe();
}

export async function getMe() {
  return baseUrl.request<MeResp>(ENDPOINTS.AUTH.ME, { method: 'GET' });
}

export async function logout() {
  try {
    await baseUrl.request(ENDPOINTS.AUTH.LOGOUT, { method: 'POST' });
  } finally {
    tokenStorage.clearAll();
  }
}
