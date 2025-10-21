/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api/grade.api.ts
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

export type GradeDTO = { id: number; nama_grade: string };

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

/* ========== Tambahan yang penting ========== */

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Ambil 1 halaman daftar grade (public) */
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
  // pakai filter q agar hasil kecil; tapi tetap iterasi halaman untuk amankan sort/total
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
      const id = created?.data?.id ?? (created as any)?.id;
      if (!id) throw new Error('Gagal membuat grade');
      result[k] = Number(id);
    } catch (e: any) {
      const msg = (e?.data?.message ?? e?.message ?? '').toString().toLowerCase();
      // kalau backend bilang "sudah digunakan", cari lagi dan pakai existing
      if (msg.includes('sudah digunakan')) {
        const retry = await findByExactNameDeep(original);
        if (retry?.id) {
          result[k] = Number(retry.id);
          continue;
        }
      }
      // error selain duplikasi → lempar ke atas (biar kelihatan masalahnya)
      throw e;
    }
  }

  return result; // key = norm(nama), value = id
}
