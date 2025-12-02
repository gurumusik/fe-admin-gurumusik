/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api/grade.api.ts
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

export type GradeDTO = { id: number; nama_grade: string };

/* ================== CREATE / UPDATE ================== */
export async function createGrade(payload: { nama_grade: string }) {
  return baseUrl.request<{ message: string; data: GradeDTO }>(
    ENDPOINTS.GRADES.CREATE,
    { method: 'POST', json: payload }
  );
}

export async function updateGrade(id: number | string, payload: { nama_grade?: string }) {
  return baseUrl.request<{ message: string; data: GradeDTO }>(
    ENDPOINTS.GRADES.UPDATE(id),
    { method: 'PUT', json: payload }
  );
}

/* ================== LIST (PUBLIC) ================== */
export type ListGradesParams = { q?: string; page?: number; limit?: number };
export type ListGradesResponse = { total: number; page: number; limit: number; data: GradeDTO[] };

/** Ambil 1 halaman daftar grade (public) */
export async function listGrades(params?: ListGradesParams): Promise<ListGradesResponse> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  const q = params?.q?.trim();
  const query = q
    ? `?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`
    : `?page=${page}&limit=${limit}`;

  return baseUrl.request<ListGradesResponse>(
    `${ENDPOINTS.GRADES.LIST}${query}`,
    { method: 'GET' }
  );
}

/** Ambil SEMUA grade (paginate) — opsional untuk dropdown tanpa paging */
export async function listAllGrades(q?: string): Promise<GradeDTO[]> {
  const first = await listGrades({ q, page: 1, limit: 200 });
  let data = first.data ?? [];
  const total = Number(first.total ?? 0);
  const limit = Number(first.limit ?? 200);
  const pages = Math.max(1, Math.ceil(total / limit));

  for (let p = 2; p <= pages; p++) {
    const res = await listGrades({ q, page: p, limit });
    data = data.concat(res.data ?? []);
  }
  return data;
}

/* ========== Tambahan util yang kamu tulis (dipertahankan) ========== */

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Ambil 1 halaman daftar grade (alias internal untuk deep-search) */
async function listGradesPage(params: { q?: string; page?: number; limit?: number }) {
  const q = params.q ? `?q=${encodeURIComponent(params.q)}&page=${params.page ?? 1}&limit=${params.limit ?? 100}` 
                     : `?page=${params.page ?? 1}&limit=${params.limit ?? 100}`;
  return baseUrl.request<{ total: number; page: number; limit: number; data: GradeDTO[] }>(
    `${ENDPOINTS.GRADES.LIST}${q}`,
    { method: 'GET' }
  );
}

/** Cari exact match secara menyeluruh (paginate) */
export async function findByExactNameDeep(name: string): Promise<GradeDTO | null> {
  const key = norm(name);
  const first = await listGradesPage({ q: name, page: 1, limit: 100 });
  const total = Number(first?.total ?? 0);
  const limit = Number(first?.limit ?? 100);
  const pages = Math.max(1, Math.ceil(total / limit));

  const inPage = (xs?: GradeDTO[]) => (xs ?? []).find(g => norm(g.nama_grade) === key) ?? null;
  let hit = inPage(first?.data);
  if (hit) return hit;

  for (let p = 2; p <= pages; p++) {
    const res = await listGradesPage({ q: name, page: p, limit });
    hit = inPage(res?.data);
    if (hit) return hit;
  }
  return null;
}

/**
 * Resolve kumpulan nama → id (tanpa ubah backend):
 * 1) deep-search exact match
 * 2) kalau tidak ada → create
 * 3) kalau create balas "sudah digunakan", deep-search lagi lalu pakai ID existing
 */
export async function resolveOrCreateGradeIds(names: string[]): Promise<Record<string, number>> {
  const originals = names.map(x => (x ?? '').toString().trim()).filter(Boolean);
  const uniqueKeys = Array.from(new Set(originals.map(norm)));

  const result: Record<string, number> = {};

  // 1) deep-search semua dulu
  for (const k of uniqueKeys) {
    const original = originals.find(n => norm(n) === k)!;
    const found = await findByExactNameDeep(original);
    if (found?.id) result[k] = Number(found.id);
  }

  // 2) create yang belum ada, tapi tahan duplikasi
  for (const k of uniqueKeys) {
    if (result[k]) continue;
    const original = originals.find(n => norm(n) === k)!;
    try {
      const created = await createGrade({ nama_grade: original });
      const id = (created as any)?.data?.id ?? (created as any)?.id;
      if (!id) throw new Error('Gagal membuat grade');
      result[k] = Number(id);
    } catch (e: any) {
      const msg = (e?.data?.message ?? e?.message ?? '').toString().toLowerCase();
      if (msg.includes('sudah digunakan')) {
        const retry = await findByExactNameDeep(original);
        if (retry?.id) {
          result[k] = Number(retry.id);
          continue;
        }
      }
      throw e;
    }
  }

  return result; // key = norm(nama), value = id
}
