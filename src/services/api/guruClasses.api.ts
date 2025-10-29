/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  GuruClassDTO,
  ListGuruClassesParams,
  ListGuruClassesResponse,
  ListTransaksiSessionsResponse,
  ListTransaksiRatingsResponse
} from '@/features/slices/guru/classes/types';

/**
 * GET /guru/:guruId/classes
 * List kelas per transaksi (1 baris = 1 transaksi), berisi:
 * - murid, program, instrument, jadwal
 * - sesi_done/sesi_total/sesi_label
 * - rating (avg rating per transaksi)
 */
export async function listGuruClasses(params: ListGuruClassesParams) {
  if (!params?.guruId) throw new Error('guruId wajib diisi');

  const { guruId, q, page, limit, sort_by, sort_dir } = params;
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (page) qs.set('page', String(page));
  if (limit) qs.set('limit', String(limit));
  if (sort_by) qs.set('sort_by', String(sort_by));
  if (sort_dir) qs.set('sort_dir', String(sort_dir));
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  const raw = await baseUrl.request<{ meta?: any; data?: GuruClassDTO[] }>(
    `${ENDPOINTS.GURU.CLASSES(guruId)}${qstr}`,
    { method: 'GET' }
  );

  const meta = raw?.meta ?? {};
  const data = (raw?.data ?? []) as GuruClassDTO[];

  const out: ListGuruClassesResponse = {
    total: Number(meta.total ?? data.length ?? 0),
    page: Number(meta.page ?? page ?? 1),
    limit: Number(meta.limit ?? limit ?? 10),
    data,
    has_next: Boolean(meta.has_next ?? false),
    has_prev: Boolean(meta.has_prev ?? false),
    sort_by: String(meta.sort_by ?? sort_by ?? 'jadwal_mulai'),
    sort_dir: String(meta.sort_dir ?? sort_dir ?? 'asc').toLowerCase() as 'asc' | 'desc',
    q: meta.q ?? (q ?? ''),
  };

  return out;
}

/**
 * GET /guru/:guruId/classes/sessions?transaksi_id=...
 * List SEMUA sesi untuk 1 transaksi (dipakai di page DetailClass).
 * Response.data: 1 baris = 1 sesi (sudah termasuk avg rating per transaksi pada tiap row).
 */
export async function listTransaksiSessions(params: { guruId: number; transaksiId: number }) {
  const { guruId, transaksiId } = params;
  if (!guruId || !transaksiId) throw new Error('guruId & transaksiId wajib diisi');

  const qs = new URLSearchParams({ transaksi_id: String(transaksiId) }).toString();
  const url = `${ENDPOINTS.GURU.CLASSES_SESSIONS(guruId)}?${qs}`;

  const raw = await baseUrl.request<ListTransaksiSessionsResponse>(url, { method: 'GET' });

  return {
    data: raw?.data ?? [],
    meta: raw?.meta ?? {},
  } as ListTransaksiSessionsResponse;
}

/** Normalisasi avatar murid */
export function resolveAvatarUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v\d+\/?$/, '')?.replace(/\/$/, '') ?? '';
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

export async function listTransaksiRatings(params: {
  guruId: number;
  transaksiId: number;
  muridId?: number;
}) {
  const { guruId, transaksiId, muridId } = params;
  if (!guruId || !transaksiId) throw new Error('guruId & transaksiId wajib diisi');

  const qs = new URLSearchParams({ transaksi_id: String(transaksiId) });
  if (typeof muridId === 'number') qs.set('murid_id', String(muridId));

  const url = `${ENDPOINTS.GURU.CLASSES_RATINGS(guruId)}?${qs.toString()}`;
  const raw = await baseUrl.request<ListTransaksiRatingsResponse>(url, { method: 'GET' });

  return {
    meta: raw?.meta ?? {},
    guru: raw?.guru ?? null,
    data: raw?.data ?? [],
  } as ListTransaksiRatingsResponse;
}

export async function updateRatingIsShow(
  guruId: number | string,
  ratingId: number | string,
  is_show: boolean
) {
  const url = ENDPOINTS.GURU.UPDATE_IS_SHOW(guruId).replace(':ratingId', String(ratingId));
  return baseUrl.request<any>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_show }),
  });
}
