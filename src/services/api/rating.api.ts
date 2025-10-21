// src/services/api/rating.api.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';

/**
 * GET /rating/guru/rating/performa-mengajar
 * - Guru: panggil tanpa guruId (server pakai req.user.id)
 * - Admin: sertakan ?guru_id=xxx
 * - Optional: ?month=YYYY-MM
 * - Optional: ?murid_id=123   ⬅️ NEW
 */
export async function getPerformaMengajar(opts?: {
  month?: string;
  guruId?: number | string;
  muridId?: number | string;       // ⬅️ NEW
}) {
  const qs = new URLSearchParams();
  if (opts?.month) qs.set('month', opts.month);
  if (opts?.guruId != null) qs.set('guru_id', String(opts.guruId)); // hanya dipakai admin
  if (opts?.muridId != null) qs.set('murid_id', String(opts.muridId)); // ⬅️ NEW

  const url = ENDPOINTS.RATING.PERFORMA_MENGAJAR() + (qs.toString() ? `?${qs.toString()}` : '');
  return baseUrl.request<any>(url, { method: 'GET' });
}
