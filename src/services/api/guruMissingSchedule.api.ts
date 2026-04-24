import { baseUrl } from "../http/url";
import { ENDPOINTS } from "../endpoints";

export type TeacherScheduleReminderLogSummary = {
  id: number;
  id_guru: number;
  reminder_key: string;
  reminder_sequence: number;
  due_at: string;
  sent_at: string | null;
  status: string;
  whatsapp_status: string | null;
  whatsapp_target: string | null;
  whatsapp_error: string | null;
  in_app_status: string | null;
  in_app_notification_id: number | null;
  in_app_error: string | null;
  created_at: string;
};

export type MissingScheduleGuruItem = {
  id: number;
  nama?: string | null;
  nama_panggilan?: string | null;
  email?: string | null;
  no_telp?: string | null;
  phone_normalized?: string | null;
  profile_pic_url?: string | null;
  status_akun?: string | null;
  city?: string | null;

  active_minutes: number;
  active_hours: number;
  min_active_minutes: number;
  has_minimum_active_schedule: boolean;
  requires_schedule_setup: boolean;

  schedule_empty_since: string | null;
  schedule_empty_days: number;
  deactivate_after_days: number;
  deactivation_due_at: string | null;
  schedule_deactivated_at: string | null;

  last_reminder_log: TeacherScheduleReminderLogSummary | null;
};

export type ListMissingScheduleGurusParams = {
  q?: string;
  status?: "all" | "aktif" | "non_aktif" | "cuti";
  only_zero?: boolean;
  page?: number;
  limit?: number;
};

export type ListMissingScheduleGurusResponse = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  today: string;
  min_active_minutes: number;
  min_active_hours: number;
  deactivate_after_days: number;
  data: MissingScheduleGuruItem[];
};

export async function listMissingScheduleGurus(params: ListMissingScheduleGurusParams = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.only_zero) qs.set("only_zero", "1");
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  const qstr = qs.toString();
  const url = qstr
    ? `${ENDPOINTS.GURU.MISSING_SCHEDULE}?${qstr}`
    : ENDPOINTS.GURU.MISSING_SCHEDULE;
  return baseUrl.request<ListMissingScheduleGurusResponse>(url, { method: "GET" });
}

export type TeacherScheduleReminderLogItem = {
  id: number;
  id_guru: number;
  guru_application_id: number | null;
  reminder_key: string;
  reminder_sequence: number;
  due_at: string;
  sent_at: string | null;
  status: string;
  whatsapp_status: string | null;
  whatsapp_target: string | null;
  whatsapp_error: string | null;
  in_app_status: string | null;
  in_app_notification_id: number | null;
  in_app_error: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type ListTeacherScheduleReminderLogsParams = {
  page?: number;
  limit?: number;
  status?: string;
};

export type ListTeacherScheduleReminderLogsResponse = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  data: TeacherScheduleReminderLogItem[];
};

export async function listTeacherScheduleReminderLogs(
  guruId: number | string,
  params: ListTeacherScheduleReminderLogsParams = {},
) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);

  const qstr = qs.toString();
  const urlBase = ENDPOINTS.GURU.SCHEDULE_REMINDER_LOGS(guruId);
  const url = qstr ? `${urlBase}?${qstr}` : urlBase;

  return baseUrl.request<ListTeacherScheduleReminderLogsResponse>(url, { method: "GET" });
}

