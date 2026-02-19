import { baseUrl } from "../http/url";
import { ENDPOINTS } from "../endpoints";

export type RequestAssistStatus = "pending" | "done";

type RequestAssistUser = {
  id?: number | string;
  nama?: string | null;
  nama_panggilan?: string | null;
  email?: string | null;
  no_telp?: string | null;
};

type RequestAssistInstrument = {
  id?: number | string;
  nama_instrumen?: string | null;
  icon?: string | null;
};

export type RequestAssistItem = {
  id: number | string;
  user_id?: number | string | null;
  instrument_id?: number | string | null;
  city?: string | null;
  hari?: number | string | null;
  tanggal?: string | null;
  waktu_mulai?: string | null;
  status?: RequestAssistStatus | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user?: RequestAssistUser | null;
  instrument?: RequestAssistInstrument | null;
};

export type ListRequestAssistAdminParams = {
  status?: RequestAssistStatus | string;
  page?: number;
  limit?: number;
};

export type ListRequestAssistAdminResponse = {
  total: number;
  page: number;
  limit: number;
  data: RequestAssistItem[];
};

export async function listRequestAssistAdmin(
  params: ListRequestAssistAdminParams = {}
) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", String(params.status));
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const qstr = qs.toString();
  const url = qstr
    ? `${ENDPOINTS.REQUEST_ASSIST.LIST}?${qstr}`
    : ENDPOINTS.REQUEST_ASSIST.LIST;

  return baseUrl.request<ListRequestAssistAdminResponse>(url, { method: "GET" });
}

export async function updateRequestAssistStatus(
  id: number | string,
  status: RequestAssistStatus
) {
  return baseUrl.request<{ message?: string; data?: RequestAssistItem }>(
    ENDPOINTS.REQUEST_ASSIST.UPDATE_STATUS(id),
    { method: "PATCH", json: { status } }
  );
}
