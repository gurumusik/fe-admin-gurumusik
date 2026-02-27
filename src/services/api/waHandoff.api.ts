import { createFetchClient } from "../http/fetcher";
import { ENDPOINTS } from "../endpoints";

const ROOT_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v\d+\/?$/, "").replace(/\/$/, "") ?? "";
const rootUrl = createFetchClient({ baseUrl: ROOT_BASE });

export type WaHandoffItem = {
  id: number | string;
  from_number: string;
  first_message_at?: string | null;
  last_message_at?: string | null;
  solved?: boolean;
  solved_at?: string | null;
  handoff_reason?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ListWaHandoffsParams = {
  solved?: boolean;
  page?: number;
  limit?: number;
  from_number?: string;
};

export type ListWaHandoffsResponse = {
  total: number;
  page: number;
  limit: number;
  data: WaHandoffItem[];
};

export async function listWaHandoffs(params: ListWaHandoffsParams = {}) {
  const qs = new URLSearchParams();
  if (params.solved !== undefined) qs.set("solved", String(params.solved));
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.from_number) qs.set("from_number", String(params.from_number));

  const qstr = qs.toString();
  const url = qstr ? `${ENDPOINTS.WA_HANDOFFS.LIST}?${qstr}` : ENDPOINTS.WA_HANDOFFS.LIST;
  return rootUrl.request<ListWaHandoffsResponse>(url, { method: "GET" });
}

export async function resolveWaHandoff(id: number | string) {
  return rootUrl.request<{ message?: string; data?: WaHandoffItem }>(
    ENDPOINTS.WA_HANDOFFS.RESOLVE(id),
    { method: "PATCH" }
  );
}
