// src/services/api/guru-classes.api.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

/* ========================= TYPES ========================= */

export type GuruClassDTO = {
  sesi_id: number;
  transaksi_id: number;
  sesi_ke: number;
  sesi_total: number;
  sesi_label: string;
  waktu_mulai: string | null; 
  waktu_selesai: string | null
  status: string | null; 
  
  murid: { id: number | null; nama: string | null; profile_pic_url: string | null };
  program: { id: number | null; nama: string | null };
  instrument: { id: number | null; nama: string | null; detail_program_id: number | null };
  jadwal: {
    id: number | null;
    hari: number | string | null;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
  };
  rating: { value: number | null; count: number };
};

export type ListGuruClassesResp = {
  total: number;
  page: number;
  limit: number;
  data: GuruClassDTO[];

  // opsional: ikutkan meta tambahan dari backend
  has_next?: boolean;
  has_prev?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  q?: string | null;
};

export type ListGuruClassesParams = {
  guruId: number;
  q?: string;
  page?: number;
  limit?: number;
  sort_by?: 'sesi_ke' | 'murid_nama' | 'program_nama' | 'instrument_nama' | 'jadwal_mulai' | 'rating';
  sort_dir?: 'asc' | 'desc';
};

/* ========================= API CALLS ========================= */

/**
 * GET /guru/:guruId/classes
 * Mengembalikan data dengan shape mirip instrument.api.ts:
 * { total, page, limit, data } (+ meta opsional)
 */
export async function listGuruClasses(params: ListGuruClassesParams) {
  if (!params?.guruId) {
    throw new Error('guruId wajib diisi');
  }

  const { guruId, q, page, limit, sort_by, sort_dir } = params;

  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (page) qs.set('page', String(page));
  if (limit) qs.set('limit', String(limit));
  if (sort_by) qs.set('sort_by', String(sort_by));
  if (sort_dir) qs.set('sort_dir', String(sort_dir));
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  // Bentuk backend: { meta: {...}, data: [...] }
  const raw = await baseUrl.request<{ meta?: any; data?: GuruClassDTO[] }>(
    `${ENDPOINTS.GURU.CLASSES(guruId)}${qstr}`,
    { method: 'GET' }
  );

  const meta = raw?.meta ?? {};
  const data = (raw?.data ?? []) as GuruClassDTO[];

  const total = Number(meta.total ?? data.length ?? 0);
  const pageOut = Number(meta.page ?? page ?? 1);
  const limitOut = Number(meta.limit ?? limit ?? 10);
  const sortDir = String(meta.sort_dir ?? sort_dir ?? 'asc').toLowerCase() as 'asc' | 'desc';

  const out: ListGuruClassesResp = {
    total,
    page: pageOut,
    limit: limitOut,
    data,
    has_next: Boolean(meta.has_next ?? false),
    has_prev: Boolean(meta.has_prev ?? false),
    sort_by: String(meta.sort_by ?? sort_by ?? 'jadwal_mulai'),
    sort_dir: sortDir,
    q: meta.q ?? (q ?? ''),
  };

  return out;
}

/* ========================= HELPERS (opsional) ========================= */

/**
 * Helper kecil kalau kamu mau normalisasi avatar murid seperti resolveIconUrl di instrument.
 * Sesuaikan BASE URL kamu kalau file avatar diserve dari path relatif.
 */
export function resolveAvatarUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base =
    import.meta.env.VITE_API_BASE_URL
      ?.replace(/\/api\/v\d+\/?$/, '')
      ?.replace(/\/$/, '') ?? '';
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}
