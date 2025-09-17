import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints/';
import { tokenStorage, type TokenPair } from '../http/token';

export type LoginPayload = { email: string; password: string };
export type MeResp = { id: number; name: string; role: 'admin'|'guru'|'user' };

export async function login(payload: LoginPayload) {
  const data = await baseUrl.request<TokenPair>(ENDPOINTS.AUTH.LOGIN, { method: 'POST', json: payload, noAuth: true });
  tokenStorage.setPair(data);
  return getMe();
}

export async function getMe() {
  return baseUrl.request<MeResp>(ENDPOINTS.AUTH.ME, { method: 'GET' });
}

export async function logout() {
  try { await baseUrl.request(ENDPOINTS.AUTH.LOGOUT, { method: 'POST' }); } finally {
    tokenStorage.clearAll();
  }
}
