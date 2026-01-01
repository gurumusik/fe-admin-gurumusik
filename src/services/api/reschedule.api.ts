import { baseUrl } from "../http/url";
import { ENDPOINTS } from "../endpoints";

export type RescheduleTargetRole = "murid" | "guru";

type BasicUser = {
  id?: number | string;
  nama?: string | null;
  nama_panggilan?: string | null;
  email?: string | null;
  no_telp?: string | null;
  profile_pic_url?: string | null;
};

export type RescheduleAdminItem = {
  id: number | string;
  sesi_id?: number | string | null;
  status?: string | null;
  requested_by?: string | null;
  target_role?: RescheduleTargetRole | string | null;
  old_date?: string | null;
  old_start?: string | null;
  old_end?: string | null;
  new_date?: string | null;
  new_start?: string | null;
  new_end?: string | null;
  reason?: string | null;
  response_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  sesi?: {
    id?: number | string;
    sesi_ke?: number | string | null;
    tanggal_sesi?: string | null;
    waktu_mulai?: string | null;
    waktu_selesai?: string | null;
    ended_time?: string | null;
  } | null;
  transaksi?: {
    id?: number | string;
    id_murid?: number | string;
    id_guru?: number | string;
    murid?: BasicUser | null;
    guru?: BasicUser | null;
  } | null;
};

export type ListRescheduleAdminParams = {
  status?: string;
  target_role?: RescheduleTargetRole | string;
  targetRole?: RescheduleTargetRole | string;
};

export type ListRescheduleAdminResponse = {
  total: number;
  data: RescheduleAdminItem[];
};

export async function listRescheduleAdmin(
  params: ListRescheduleAdminParams = {}
) {
  const qs = new URLSearchParams();

  if (params.status) qs.set("status", params.status);
  const target = params.targetRole ?? params.target_role;
  if (target) qs.set("target_role", String(target));

  const qstr = qs.toString();
  const url = qstr
    ? `${ENDPOINTS.RESCHEDULE.ADMIN_LIST}?${qstr}`
    : ENDPOINTS.RESCHEDULE.ADMIN_LIST;

  return baseUrl.request<ListRescheduleAdminResponse>(url, { method: "GET" });
}
