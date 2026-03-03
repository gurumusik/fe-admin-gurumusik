import { baseUrl } from "../http/url";
import { ENDPOINTS } from "../endpoints";

export type MissingField = {
  key: string;
  label: string;
};

export type IncompleteGuruItem = {
  id: number | string;
  nama?: string | null;
  nama_panggilan?: string | null;
  email?: string | null;
  no_telp?: string | null;
  phone_normalized?: string | null;
  alamat?: string | null;
  province?: string | null;
  city?: string | null;
  home_lat?: string | number | null;
  home_lng?: string | number | null;
  profile_pic_url?: string | null;
  bio?: string | null;
  status_akun?: string | null;
  missing_fields: MissingField[];
  missing_count?: number;
};

export type ListIncompleteGuruParams = {
  q?: string;
  status?: "aktif" | "non_aktif" | "cuti";
  page?: number;
  limit?: number;
};

export type ListIncompleteGuruResponse = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  data: IncompleteGuruItem[];
};

export async function listIncompleteGurus(params: ListIncompleteGuruParams = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const qstr = qs.toString();
  const url = qstr ? `${ENDPOINTS.GURU.INCOMPLETE}?${qstr}` : ENDPOINTS.GURU.INCOMPLETE;
  return baseUrl.request<ListIncompleteGuruResponse>(url, { method: "GET" });
}
