/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api/guru.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';

export async function getGuruById(id: number | string) {
  // Tetap sama: return raw response dari baseUrl.request
  return baseUrl.request<any>(ENDPOINTS.GURU.DETAIL(id), { method: 'GET' });
}

export type ListGuruParams = {
  q?: string;
  page?: number;
  limit?: number;
  city?: string;
  status?: 'aktif' | 'cuti' | 'non_aktif';
  ratingBelow4?: boolean; // akan dikirim sebagai rating_lt=4 jika true
};

export async function listGuru(params: ListGuruParams = {}) {
  // Perbaikan: query string sekarang benar-benar menempel ke URL
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.city) qs.set('city', params.city);
  if (params.status) qs.set('status', params.status);
  if (params.ratingBelow4) qs.set('rating_lt', '4');

  const qstr = qs.toString() ? `?${qs.toString()}` : '';
  return baseUrl.request<any>(`${ENDPOINTS.GURU.LIST}${qstr}`, { method: 'GET' });
}
