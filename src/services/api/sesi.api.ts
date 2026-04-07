import { baseUrl } from "@/services/http/url";
import { ENDPOINTS } from "@/services/endpoints";

export type AdminSesiItem = {
  sesi_id: number;
  sesi_ke: number | null;
  transaksi_id: number;
  tanggal: string;
  waktu_mulai: string | null;
  waktu_selesai: string | null;
  ended_time: string | null;
  status: string;
  murid: {
    id?: number;
    nama?: string | null;
    nama_panggilan?: string | null;
    profile_pic_url?: string | null;
    no_telp?: string | null;
    email?: string | null;
  } | null;
  guru: {
    id?: number;
    nama?: string | null;
    nama_panggilan?: string | null;
    profile_pic_url?: string | null;
    no_telp?: string | null;
    email?: string | null;
  } | null;
  instrumen: {
    id?: number;
    nama_instrumen?: string | null;
    icon?: string | null;
  } | null;
};

export type AdminGetAllSesiParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  sort_dir?: "asc" | "desc";
};

export type AdminGetAllSesiResponse = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: AdminSesiItem[];
};

export async function adminGetAllSesi(params: AdminGetAllSesiParams = {}) {
  const qs = new URLSearchParams();
  if (params.page)      qs.set("page",      String(params.page));
  if (params.limit)     qs.set("limit",     String(params.limit));
  if (params.q)         qs.set("q",         params.q);
  if (params.status)    qs.set("status",    params.status);
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to)   qs.set("date_to",   params.date_to);
  if (params.sort_dir)  qs.set("sort_dir",  params.sort_dir);

  const qstr = qs.toString();
  const url  = qstr
    ? `${ENDPOINTS.SESI.ADMIN_ALL}?${qstr}`
    : ENDPOINTS.SESI.ADMIN_ALL;

  return baseUrl.request<AdminGetAllSesiResponse>(url, { method: "GET" });
}
