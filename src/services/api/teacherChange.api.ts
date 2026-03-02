import { baseUrl } from "../http/url";
import { ENDPOINTS } from "../endpoints";

export type ChangeTeacherCategory =
  | "murid_tidak_cocok"
  | "guru_tidak_cocok"
  | "guru_tanggung_jawab"
  | "other";

export type ChangeTeacherStatus =
  | "pending"
  | "waiting_student_pick"
  | "waiting_teacher_approval"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "closed_without_change";

type ChangeTeacherUser = {
  id?: number | string;
  nama?: string | null;
  nama_panggilan?: string | null;
  email?: string | null;
  no_telp?: string | null;
};

type ChangeTeacherFile = {
  id?: number | string;
  change_teacher_id?: number | string | null;
  file_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  uploaded_by?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ChangeTeacherItem = {
  id: number | string;
  transaksi_id?: number | string | null;
  id_murid?: number | string | null;
  id_guru?: number | string | null;
  requester_id?: number | string | null;
  requested_by?: string | null;
  category?: ChangeTeacherCategory | string | null;
  reason?: string | null;
  effort?: string | null;
  teacher_referral_id?: number | string | null;
  new_teacher_id?: number | string | null;
  new_jadwal_id?: number | string | null;
  new_tanggal_mulai_sesi?: string | null;
  status?: ChangeTeacherStatus | string | null;
  admin_note?: string | null;
  change_fee_invoice_id?: number | string | null;
  payment_ref?: string | null;
  freeze_remaining_sessions?: number | null;
  freeze_at?: string | null;
  selection_sent_at?: string | null;
  selection_expires_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  teacher_rejected_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  kelas_belum_dimulai?: number | null;
  murid?: ChangeTeacherUser | null;
  guru?: ChangeTeacherUser | null;
  requester?: ChangeTeacherUser | null;
  teacherReferral?: ChangeTeacherUser | null;
  files?: ChangeTeacherFile[] | null;
};

export type ListTeacherChangeAdminParams = {
  status?: ChangeTeacherStatus | string;
  category?: ChangeTeacherCategory | string;
  page?: number;
  limit?: number;
};

export type ListTeacherChangeAdminResponse = {
  total: number;
  page: number;
  limit: number;
  data: ChangeTeacherItem[];
};

export async function listTeacherChangeAdmin(
  params: ListTeacherChangeAdminParams = {}
) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", String(params.status));
  if (params.category) qs.set("category", String(params.category));
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const qstr = qs.toString();
  const url = qstr
    ? `${ENDPOINTS.TEACHER_CHANGE.ADMIN_LIST}?${qstr}`
    : ENDPOINTS.TEACHER_CHANGE.ADMIN_LIST;

  return baseUrl.request<ListTeacherChangeAdminResponse>(url, { method: "GET" });
}

export type ApproveTeacherChangePayload = {
  admin_note?: string | null;
  selection_expires_at?: string | null;
  expire_in_days?: number | null;
  freeze_remaining_sessions?: number | null;
  new_teacher_id?: number | string | null;
  new_jadwal_id?: number | string | null;
  new_tanggal_mulai_sesi?: string | null;
  decided_category?: ChangeTeacherCategory | string | null;
};

export async function approveTeacherChangeRequest(
  id: number | string,
  payload: ApproveTeacherChangePayload = {}
) {
  return baseUrl.request<{ message?: string; data?: ChangeTeacherItem }>(
    ENDPOINTS.TEACHER_CHANGE.APPROVE(id),
    { method: "PATCH", json: payload }
  );
}

export async function rejectTeacherChangeRequest(
  id: number | string,
  admin_note?: string | null
) {
  return baseUrl.request<{ message?: string; data?: ChangeTeacherItem }>(
    ENDPOINTS.TEACHER_CHANGE.REJECT(id),
    { method: "PATCH", json: { admin_note } }
  );
}

export async function closeTeacherChangeRequest(
  id: number | string,
  admin_note?: string | null
) {
  return baseUrl.request<{ message?: string; data?: ChangeTeacherItem }>(
    ENDPOINTS.TEACHER_CHANGE.CLOSE(id),
    { method: "PATCH", json: { admin_note } }
  );
}

export async function freezeTeacherChangeSessions(
  id: number | string,
  freeze_remaining_sessions: number
) {
  return baseUrl.request<{ message?: string; data?: any }>(
    ENDPOINTS.TEACHER_CHANGE.FREEZE(id),
    { method: "PATCH", json: { freeze_remaining_sessions } }
  );
}

export type TeacherChangeFeePayload = {
  change_fee_invoice_id?: number | string | null;
  payment_ref?: string | null;
};

export async function setTeacherChangeFeeRef(
  id: number | string,
  payload: TeacherChangeFeePayload
) {
  return baseUrl.request<{ message?: string; data?: ChangeTeacherItem }>(
    ENDPOINTS.TEACHER_CHANGE.FEE(id),
    { method: "PATCH", json: payload }
  );
}
