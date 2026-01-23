/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '../endpoints';

export type CreateSilabusPayload = {
  id_detail_program: number;
  title: string;
  file_base64?: string;    // image (data:image/..)
  file_url?: string;       // pdf (data:application/pdf;.. atau path publik)
  link_url?: string;       // external
  completion_pts?: Array<{ key: string; label: string; weight: number }>;
};

export async function createSilabus(payload: CreateSilabusPayload) {
  return baseUrl.request<{ message: string; data: any }>(ENDPOINTS.SILABUS.CREATE, {
    method: 'POST',
    json: payload,
  });
}

export async function updateSilabus(id: number, payload: Partial<CreateSilabusPayload> & { title?: string }) {
  return baseUrl.request<{ message: string; data: any }>(ENDPOINTS.SILABUS.UPDATE(id), {
    method: 'PUT',
    json: payload,
  });
}

/** GET public list by instrument+grade (flatten across DPs) */
export async function listPublicByInstrumentGrade(instrumentId: number, gradeId: number) {
  const qs = new URLSearchParams({
    instrument_id: String(instrumentId),
    grade_id: String(gradeId),
  }).toString();

  const res = await baseUrl.request<any>(`${ENDPOINTS.SILABUS.PUBLIC_LIST}?${qs}`, { method: 'GET' });

  // Normalisasi hasil agar selalu ada .items
  const items =
    (res as any)?.items ??
    (res as any)?.data?.items ??
    (Array.isArray((res as any)) ? (res as any) : []);

  return { ...(res as any), items };
}

/** Optional: delete */
export async function deleteSilabus(id: number) {
  return baseUrl.request<{ message: string }>(ENDPOINTS.SILABUS.DELETE(id), { method: 'DELETE' });
}
