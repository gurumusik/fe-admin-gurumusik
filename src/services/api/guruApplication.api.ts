/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';
import type { GAListParams, GAListResp, GuruApplicationDTO } from '@/features/slices/guruApplication/types';

export async function listGuruApplications(params?: GAListParams) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  if (params?.created_from) qs.set('created_from', params.created_from);
  if (params?.created_to) qs.set('created_to', params.created_to);
  if (params?.sortBy) qs.set('sortBy', params.sortBy);
  if (params?.sortDir) qs.set('sortDir', params.sortDir);

  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  const resp = await baseUrl.request<any>(
    `${ENDPOINTS.GURU_APPLICATION.LIST}${qstr}`,
    { method: 'GET' }
  );

  // Normalisasi: jika API mengembalikan wrapper, ambil field `data`
  const data: GAListResp = resp?.rows ? resp : resp?.data;
  return data;
}

export async function getGuruApplication(id: number | string) {
  const resp = await baseUrl.request<any>(
    ENDPOINTS.GURU_APPLICATION.DETAIL(id),
    { method: 'GET' }
  );
  return resp?.id ? resp as GuruApplicationDTO : (resp?.data as GuruApplicationDTO);
}
