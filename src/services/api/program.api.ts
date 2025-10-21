// src/services/api/program.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';

export type Program = {
  id: number;
  nama_program: string;
  created_at?: string;
  updated_at?: string;
};

export type ProgramListResp = {
  total: number;
  page: number;
  limit: number;
  data: Program[];
};

export async function listPrograms(params?: { q?: string; page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString() ? `?${q.toString()}` : '';
  return baseUrl.request<ProgramListResp>(`${ENDPOINTS.PROGRAMS.LIST}${qs}`, { method: 'GET' });
}

export async function createProgram(payload: { nama_program: string }) {
  return baseUrl.request<{ message: string; data: Program }>(ENDPOINTS.PROGRAMS.CREATE, {
    method: 'POST',
    json: payload,
  });
}

// (opsional)
export async function getProgramDetail(id: number | string) {
  return baseUrl.request<Program>(ENDPOINTS.PROGRAMS.DETAIL(id), { method: 'GET' });
}
