/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api/detailProgram.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';

// GET /detail-programs/count?instrumentIds=1,2,3
export async function countByInstrument(instrumentIds: number[]) {
  const qs = `?instrumentIds=${instrumentIds.join(',')}`;
  return baseUrl.request<{ counts: Record<number, number> }>(
    ENDPOINTS.DETAIL_PROGRAMS.COUNT + qs,
    { method: 'GET' }
  );
}

// GET /detail-programs/by-instrument/:id
export async function listByInstrument(instrumentId: number) {
  return baseUrl.request<{ items: CreateDetailProgramPayload[] }>(
    ENDPOINTS.DETAIL_PROGRAMS.BY_INSTRUMENT(instrumentId),
    { method: 'GET' }
  );
}

export type CreateDetailProgramPayload = {
  id?: number; 
  id_program: number;
  id_instrumen: number;
  id_grade: number;
  base_harga: number;
  harga_tambah_sesi?: number | null;
  harga_ujian?: number | null;
  grade?: { id: number; nama_grade: string };
  program?: { id: number; nama_program: string };
};

export async function createDetailProgram(payload: CreateDetailProgramPayload) {
  return baseUrl.request<{ message: string; data: any }>(
    ENDPOINTS.DETAIL_PROGRAMS.CREATE,
    { method: 'POST', json: payload }
  );
}

export async function bulkCreateDetailPrograms(items: CreateDetailProgramPayload[]) {
  return baseUrl.request<{ message: string }>(
    ENDPOINTS.DETAIL_PROGRAMS.BULK,
    { method: 'POST', json: { items } }
  );
}

export async function deleteDetailProgram(id: number) {
  return baseUrl.request<{ message: string }>(`${ENDPOINTS.DETAIL_PROGRAMS}/${id}`, {
    method: 'DELETE',
  });
}