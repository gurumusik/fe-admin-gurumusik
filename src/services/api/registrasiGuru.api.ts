// src/services/api/registrasi-guru.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';

export type RegistrasiGuru = {
  id: number;
  nama: string;
  email: string;
  no_telp: string;
  alamat?: string | null;
  preferensi_instrumen?: string | null;
  grade_guru?: string | null;
  file_cv_url: string;
  file_sertifikasi_url: string;
  path_video_url: string;
  mengajar_abk: boolean;
  alasan_penolakan?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RegistrasiListResp = {
  total: number;
  page: number;
  limit: number;
  data: RegistrasiGuru[];
};

export async function listRegistrasi(params?: {
  q?: string;
  page?: number;
  limit?: number;
  abk?: boolean;
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (typeof params?.abk === 'boolean') q.set('abk', String(params.abk));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return baseUrl.request<RegistrasiListResp>(`${ENDPOINTS.REGISTRASI_GURU.LIST}${qs}`, {
    method: 'GET',
  });
}

export async function createRegistrasi(payload: {
  nama: string;
  email: string;
  no_telp: string;
  alamat?: string | null;
  preferensi_instrumen?: string | null;
  grade_guru?: string | null;
  file_cv_url: string;
  file_sertifikasi_url: string;
  path_video_url: string;
  mengajar_abk?: boolean;
}) {
  return baseUrl.request<{ message: string; data: { id: number; nama: string; email: string } }>(
    ENDPOINTS.REGISTRASI_GURU.CREATE,
    { method: 'POST', json: payload }
  );
}

export async function getRegistrasiDetail(id: number | string) {
  return baseUrl.request<RegistrasiGuru>(ENDPOINTS.REGISTRASI_GURU.DETAIL(id), { method: 'GET' });
}

export async function updateRegistrasi(
  id: number | string,
  patch: Partial<Omit<RegistrasiGuru, 'id' | 'created_at' | 'updated_at'>>
) {
  return baseUrl.request<{ message: string; data: { id: number } }>(
    ENDPOINTS.REGISTRASI_GURU.UPDATE(id),
    { method: 'PUT', json: patch }
  );
}

export async function deleteRegistrasi(id: number | string) {
  return baseUrl.request<{ message: string }>(ENDPOINTS.REGISTRASI_GURU.DELETE(id), {
    method: 'DELETE',
  });
}


