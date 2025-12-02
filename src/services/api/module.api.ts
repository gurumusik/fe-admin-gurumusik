/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api/module.api.ts
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';
import type {
  ApiModuleType,
  ModuleListRespApi,
  ApiModuleDetail,
} from '@/features/slices/module/types';

/* =========================
 * INTERNAL HELPERS (no external util)
 * ========================= */

/** Ambil origin file server dari VITE_API_BASE_URL (strip `/api/v1`) */
const FILE_ORIGIN =
  import.meta.env.VITE_API_BASE_URL
    ?.replace(/\/api\/v1\/?$/, '')
    ?.replace(/\/$/, '') ?? '';

/** Jadikan path relatif `/uploads/...` → URL absolut `http://host:port/uploads/...` */
function resolveFileUrl(p?: string | null): string {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  return p.startsWith('/') ? `${FILE_ORIGIN}${p}` : `${FILE_ORIGIN}/${p}`;
}

/** Normalisasi satu baris item list modul */
function normalizeListItem<T extends Record<string, any>>(m: T): T {
  return {
    ...m,
    thumbnail_path: resolveFileUrl(m.thumbnail_path),
    instrument: m.instrument
      ? { ...m.instrument, icon: resolveFileUrl(m.instrument.icon) }
      : m.instrument,
  };
}

/** Normalisasi detail modul (thumbnail, instrument.icon, ebooks, previews) */
function normalizeDetail(d: ApiModuleDetail): ApiModuleDetail {
  return {
    ...d,
    thumbnail_path: resolveFileUrl(d.thumbnail_path),
    instrument: d.instrument
      ? { ...d.instrument, icon: resolveFileUrl((d.instrument as any).icon) }
      : d.instrument,
    playlists: Array.isArray(d.playlists) ? d.playlists : [],
    ebooks: Array.isArray(d.ebooks)
      ? d.ebooks.map((e: any) => ({ ...e, ebook_path: resolveFileUrl(e.ebook_path) }))
      : [],
    previews: Array.isArray(d.previews)
      ? d.previews.map((p: any) => ({ ...p, file_path: resolveFileUrl(p.file_path) }))
      : [],
  };
}

/** Normalisasi response list */
function normalizeListResponse(resp: ModuleListRespApi): ModuleListRespApi {
  return {
    ...resp,
    data: Array.isArray(resp.data) ? resp.data.map(normalizeListItem) : [],
  };
}

/* =========================
 * LIST (Guru & Admin)
 * ========================= */
export async function listModulesGuru(params?: {
  q?: string;
  type?: ApiModuleType; // 'video' | 'ebook'
}) {
  const q = new URLSearchParams();
  if (params?.q) q.set('q', params.q);
  if (params?.type) q.set('type', params.type);
  const qs = q.toString() ? `?${q.toString()}` : '';

  const res = await baseUrl.request<ModuleListRespApi>(
    `${ENDPOINTS.MODULES.GURU.LIST}${qs}`,
    { method: 'GET' }
  );

  // antisipasi backend kadang kirim langsung atau bungkus { data, total, ... }
  const payload: ModuleListRespApi = (res as any)?.data && (res as any)?.total
    ? (res as any)
    : (res as any);

  return normalizeListResponse(payload);
}

export async function listModulesAdmin(params?: {
  q?: string;
  type?: ApiModuleType; // 'video' | 'ebook'
}) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.type) qs.set('type', params.type);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const res = await baseUrl.request<ModuleListRespApi>(
    `${ENDPOINTS.MODULES.ADMIN.LIST}${suffix}`,
    { method: 'GET' }
  );

  const payload: ModuleListRespApi = (res as any)?.data && (res as any)?.total
    ? (res as any)
    : (res as any);

  return normalizeListResponse(payload);
}

/* =========================
 * DETAIL (Admin)
 * ========================= */
export async function getModuleDetailAdmin(id: number) {
  const res = await baseUrl.request<ApiModuleDetail>(
    ENDPOINTS.MODULES.ADMIN.DETAIL(id),
    { method: 'GET' }
  );

  // support dua pola: {..fields} langsung, atau { data: {...fields} }
  const raw: ApiModuleDetail = (res as any)?.data ?? (res as any);
  return normalizeDetail(raw);
}

/* =========================
 * UPDATE STATUS (Admin)
 * ========================= */
export async function updateModuleStatusAdmin(
  id: number,
  status: 'aktif' | 'non_aktif' // sesuai enum DB/backend
) {
  return baseUrl.request<{ message: string; modul_id: number }>(
    ENDPOINTS.MODULES.ADMIN.UPDATE(id),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }
  );
}

/* =========================
 * UPDATE KONTEN (Admin)
 * Body type mengikuti controller `putModulUpdateAdmin`.
 * ========================= */
export type PlaylistPayload = string | { id?: number; link_playlist: string };

export type UpdateModuleAdminBody = Partial<{
  // --- Konten utama
  judul: string;
  deskripsi: string;
  preview_class: string;
  appropriate_module: string;

  // --- Harga
  harga: number;              // (legacy) – boleh diabaikan backend
  harga_bid: number;
  harga_discount: number;
  percent_discount: number;

  // --- Meta / relasi
  status: 'aktif' | 'non_aktif' | 'diperiksa_admin';
  type: ApiModuleType;        // gunakan 'type' (backend update membaca 'type')
  link_drive: string | null;
  instrument_id: number;
  grade_id: number;
  thumbnail_path: string | null; // boleh kirim data-url; backend akan simpan file

  // --- Threshold penyelesaian
  video_complete_threshold: number; // DECIMAL(5,2)
  pdf_complete_threshold: number;   // DECIMAL(5,2)

  // --- CHILDREN: PLAYLISTS (replace all ketika key ini dikirim)
  playlists: PlaylistPayload[];

  // --- CHILDREN: E-BOOKS
  ebooks: Array<{
    id?: number;
    ebook_path?: string;
    pendukung?: boolean;
    total_pages?: number;
  }>;
  ebooks_replace_all: boolean;

  // Tambah e-book baru via base64
  ebooks_append: Array<{
    file_base64: string;
    pendukung?: boolean;
  }>;

  // Hapus e-book berdasarkan id
  ebook_ids_to_delete: number[];

  // --- PREVIEWS
  preview_files_base64_append: string[];
  preview_ids_to_delete: number[];
}>;

export async function updateModuleAdmin(
  id: number,
  body: UpdateModuleAdminBody
) {
  return baseUrl.request<{ message: string; modul_id: number }>(
    ENDPOINTS.MODULES.ADMIN.UPDATE(id),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

export async function updateModuleAdminMultipart(
  id: number,
  fields: Record<string, any>,
  ebookFiles: File[]
) {
  const fd = new FormData();

  // file PDF → field harus 'ebooks_files' (sesuai router uploadEbooks.array('ebooks_files', 4))
  ebookFiles.forEach((f) => fd.append('ebooks_files', f));

  // text fields opsional (akan di-parse ke req.body)
  Object.entries(fields || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    // stringify utk array/obj; selain itu jadikan string
    if (typeof v === 'object') fd.append(k, JSON.stringify(v));
    else fd.append(k, String(v));
  });

  return baseUrl.request<{ message: string; modul_id: number }>(
    ENDPOINTS.MODULES.ADMIN.UPDATE(id),
    {
      method: 'PUT',
      // PENTING: JANGAN set headers Content-Type. Browser akan set boundary otomatis.
      body: fd,
    }
  );
}
