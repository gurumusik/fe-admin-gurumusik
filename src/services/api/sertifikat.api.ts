/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';
import type { SertifikatStatusRaw } from '@/features/slices/sertifikat/types';

/**
 * PATCH status sertifikat guru
 * Body: { status: 'approved' | 'rejected' | 'under_review', alasan_penolakan?: string|null }
 */
export async function patchSertifikatStatus(
  id: number | string,
  body: { status: SertifikatStatusRaw; alasan_penolakan?: string | null }
) {
  const idStr = String(id ?? '').trim();
  if (!idStr || idStr === 'NaN' || !/^\d+$/.test(idStr)) {
    throw new Error(`id sertifikat tidak valid: "${idStr}"`);
  }

  const url = ENDPOINTS.SERTIFIKAT.UPDATE(idStr);

  if (typeof window !== 'undefined') {
    console.debug('[PATCH] Update Sertifikat Status URL:', url, 'payload:', body);
  }

  return baseUrl.request<any>(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',       // ⬅️ penting!
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),                 // ⬅️ kirim JSON string
  });
}

// List pending sertifikat (admin)
export async function listPendingGuruSertifikat() {
  return baseUrl.request<any>(ENDPOINTS.SERTIFIKAT.PENDING, { method: 'GET' });
}

// Helper
export async function approveSertifikat(id: number | string) {
  return patchSertifikatStatus(id, { status: 'approved' });
}
export async function rejectSertifikat(id: number | string, alasan?: string) {
  return patchSertifikatStatus(id, { status: 'rejected', alasan_penolakan: alasan ?? null });
}
export async function setUnderReviewSertifikat(id: number | string) {
  return patchSertifikatStatus(id, { status: 'under_review' });
}
