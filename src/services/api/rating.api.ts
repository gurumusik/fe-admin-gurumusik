/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api/rating.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';

import type {
  RatingsListQuery,
  RatingsListResponse,
} from '@/features/slices/rating/types';

/** ADMIN — pakai path param :guru_id */
export async function getPerformaMengajarAdmin(
  guruId: number | string,
  opts?: { month?: string; murid_id?: number | string }
) {
  const idStr = String(guruId ?? '').trim();
  if (!idStr || idStr === 'NaN' || !/^\d+$/.test(idStr)) {
    throw new Error(`guruId tidak valid: "${idStr}"`);
  }

  const qs = new URLSearchParams();
  if (opts?.month) qs.set('month', opts.month);
  if (opts?.murid_id != null && String(opts.murid_id).trim() !== '') {
    qs.set('murid_id', String(opts.murid_id));
  }

  const url =
    ENDPOINTS.RATING.PERFORMA_MENGAJAR_ADMIN(idStr) + (qs.toString() ? `?${qs}` : '');

  if (typeof window !== 'undefined') {
    console.debug('[GET] PerformaMengajarAdmin URL:', url);
  }

  return baseUrl.request<any>(url, { method: 'GET' });
}

export async function getPerformaMengajarGlobal(opts?: { month?: string }) {
  const qs = new URLSearchParams();
  if (opts?.month) qs.set('month', opts.month);

  const url =
    ENDPOINTS.RATING.PERFORMA_MENGAJAR_GLOBAL() + (qs.toString() ? `?${qs}` : '');

  if (typeof window !== 'undefined') {
    console.debug('[GET] PerformaMengajarGlobal URL:', url);
  }

  return baseUrl.request<any>(url, { method: 'GET' });
}

export async function getPerformaNilaiGlobalDaily(opts?: { start?: string; end?: string }) {
  const qs = new URLSearchParams();
  if (opts?.start) qs.set('start', opts.start); // YYYY-MM-DD
  if (opts?.end)   qs.set('end',   opts.end);
  const url = ENDPOINTS.RATING.PERFORMA_NILAI_GLOBAL_DAILY() + (qs.toString() ? `?${qs}` : '');
  if (typeof window !== 'undefined') console.debug('[GET] PerformaNilaiGlobalDaily URL:', url);
  return baseUrl.request<any>(url, { method: 'GET' });
}

/** ===== NEW: List ratings (tabel Riwayat Nilai) ===== */
export async function listRatings(params?: RatingsListQuery) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit != null) qs.set('limit', String(params.limit)); // angka / 'all'
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.order) qs.set('order', params.order);
  if (params?.q) qs.set('q', params.q);
  if (params?.guru_id != null) qs.set('guru_id', String(params.guru_id));
  if (params?.murid_id != null) qs.set('murid_id', String(params.murid_id));
  if (typeof params?.visible === 'boolean') qs.set('visible', params.visible ? 'true' : 'false');
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);
  if (params?.min_rate != null) qs.set('min_rate', String(params.min_rate));
  if (params?.max_rate != null) qs.set('max_rate', String(params.max_rate));

  const url = ENDPOINTS.RATING.LIST() + (qs.toString() ? `?${qs}` : '');

  if (typeof window !== 'undefined') {
    console.debug('[GET] listRatings URL:', url);
  }

  // Server umumnya balikin { statusCode, status, message, meta, data }
  // Kita kembalikan apa adanya; typing pada slice akan konsumsi meta+data.
  return baseUrl.request<RatingsListResponse | any>(url, { method: 'GET' });
}
