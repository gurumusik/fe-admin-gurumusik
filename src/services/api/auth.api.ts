/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from "../http/url";
import { ENDPOINTS } from "../endpoints/";
import { tokenStorage } from "../http/token";

export type RequestMagicLinkPayload = { email: string };
export type MagicLinkResponse = { message: string; expires_in_days?: number };
export type MeResp = {
  id: number;
  nama: string;
  email: string;
  role: string;
  is_super_admin?: boolean;
  is_employee?: boolean;
  auth_source?: string | null;
  [key: string]: unknown;
};

function unwrapUser(input: any): MeResp {
  const src = input?.data ?? input ?? {};
  const user = src?.user ?? src;

  if (!user?.id) {
    throw new Error("Data user admin tidak ditemukan");
  }

  return user as MeResp;
}

export async function requestMagicLink(payload: RequestMagicLinkPayload) {
  return baseUrl.request<MagicLinkResponse>(ENDPOINTS.ADMIN_AUTH.REQUEST_LINK, {
    method: "POST",
    json: payload,
    noAuth: true,
  });
}

export async function consumeMagicLink(token: string) {
  const raw = await baseUrl.request<any>(ENDPOINTS.ADMIN_AUTH.CONSUME, {
    method: "POST",
    json: { token },
    noAuth: true,
  });

  const accessToken =
    raw?.accessToken ??
    raw?.access_token ??
    raw?.token ??
    token;

  tokenStorage.set(String(accessToken), "admin_magic");
  return unwrapUser(raw);
}

export async function getMe() {
  const raw = await baseUrl.request<any>(ENDPOINTS.ADMIN_AUTH.ME, { method: "GET" });
  return unwrapUser(raw);
}

export async function logout() {
  const token = tokenStorage.get();

  try {
    await baseUrl.request(ENDPOINTS.ADMIN_AUTH.LOGOUT, {
      method: "POST",
      json: token ? { token } : undefined,
    });
  } finally {
    tokenStorage.clearAll();
  }
}
