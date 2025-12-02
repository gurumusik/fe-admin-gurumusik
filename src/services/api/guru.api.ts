/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';
import type {
  GuruProfileResponse,
  CreateGuruFromEntryPayload,
  CreateGuruFromEntryResponse,
} from '@/features/slices/guru/types';

export async function getGuruById(id: number | string) {
  return baseUrl.request<any>(ENDPOINTS.GURU.DETAIL(id), { method: 'GET' });
}

export type ListGuruParams = {
  q?: string;
  page?: number;
  limit?: number;
  city?: string;
  status?: 'aktif' | 'cuti' | 'non_aktif';
  ratingBelow4?: boolean;
  rating_lt?: number;
};

export async function listGuru(params: ListGuruParams = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.city) qs.set('city', params.city);
  if (params.status) qs.set('status', params.status);
  if (params.ratingBelow4) qs.set('rating_lt', '4');
  if (params.rating_lt != null) qs.set('rating_lt', String(params.rating_lt));

  const qstr = qs.toString() ? `?${qs.toString()}` : '';
  return baseUrl.request<any>(`${ENDPOINTS.GURU.LIST}${qstr}`, { method: 'GET' });
}

/** Ambil profil (login / admin ?id=) */
export async function getGuruProfile(arg?: { id?: number | string } | number | string) {
  const base = ENDPOINTS.GURU.PROFILE();
  let url = base;

  const id =
    typeof arg === 'number' || typeof arg === 'string'
      ? String(arg)
      : arg?.id != null
      ? String(arg.id)
      : undefined;

  if (id) {
    const qs = new URLSearchParams({ id });
    url = `${base}?${qs.toString()}`;
  }

  return baseUrl.request<GuruProfileResponse>(url, { method: 'GET' });
}

export async function getGuruProfileById(id: number | string) {
  return getGuruProfile({ id });
}

export type UpdateGuruStatusPayload = {
  status_akun: 'aktif' | 'non_aktif' | 'cuti';
  cuti_start_date?: string;
  cuti_end_date?: string;
  id?: number | string;
};

export async function updateGuruStatus(payload: UpdateGuruStatusPayload) {
  const { id } = payload;
  const url = ENDPOINTS.GURU.STATUS(id);
  return baseUrl.request<any>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function createGuruFromEntry(
  payload: CreateGuruFromEntryPayload
) {
  return baseUrl.request<CreateGuruFromEntryResponse>(ENDPOINTS.GURU.CREATE_FROM_ENTRY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}