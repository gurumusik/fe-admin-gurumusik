/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api/promo.api.ts
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  ApiPromo,
  PromoListParams,
  PromoListResp,
  PromoDetailResp,
  HeadlineAvailResp,
  HeadlineResp,
  PromoTransactionListResp,
  CreatePromoPayload,
  UpdatePromoPayload,
  ApplyPromoResp,
  RemovePromoResp,
} from '@/features/slices/promo/types';

/* ========================= API CALLS ========================= */

/** GET /promo (protected: admin,guru) */
export async function listPromos(params?: PromoListParams) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (typeof params?.is_show === 'boolean') qs.set('is_show', String(params.is_show));
  if (typeof params?.is_headline_promo === 'boolean') {
    qs.set('is_headline_promo', String(params.is_headline_promo));
  }
  if (params?.includeUsage) qs.set('includeUsage', '1');
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  const resp = await baseUrl.request<PromoListResp>(
    `${ENDPOINTS.PROMO.LIST}${qstr}`,
    { method: 'GET' }
  );
  return resp.data; // ApiPromo[]
}

/** GET /promo/:id (protected: admin,guru) */
export async function getPromo(id: number | string) {
  return baseUrl.request<PromoDetailResp>(
    ENDPOINTS.PROMO.DETAIL(id),
    { method: 'GET' }
  );
}

/** POST /promo (protected: admin,guru) */
export async function createPromo(payload: CreatePromoPayload) {
  // Safety: terima camelCase dari FE jika ada
  const body: Record<string, unknown> = { ...payload };

  if ((body as any).startedAt && !body.started_at) {
    body.started_at = (body as any).startedAt;
    delete (body as any).startedAt;
  }
  if ((body as any).headlineText && !body.headline_text) {
    body.headline_text = (body as any).headlineText;
    delete (body as any).headlineText;
  }

  return baseUrl.request<{ message: string; data: ApiPromo }>(
    ENDPOINTS.PROMO.CREATE,
    { method: 'POST', json: body }
  );
}

/** PUT /promo/:id (protected: admin,guru) */
export async function updatePromo(id: number | string, payload: UpdatePromoPayload) {
  const body: Record<string, unknown> = { ...payload };

  if ((body as any).startedAt && !body.started_at) {
    body.started_at = (body as any).startedAt;
    delete (body as any).startedAt;
  }
  if ((body as any).headlineText && !body.headline_text) {
    body.headline_text = (body as any).headlineText;
    delete (body as any).headlineText;
  }

  return baseUrl.request<{ message: string; data: ApiPromo }>(
    ENDPOINTS.PROMO.UPDATE(id),
    { method: 'PUT', json: body }
  );
}

/** GET /promo/is-headline-avail (protected: admin,guru) */
export async function getHeadlineAvail() {
  return baseUrl.request<HeadlineAvailResp>(
    ENDPOINTS.PROMO.HEADLINE_AVAIL,
    { method: 'GET' }
  );
}

/** GET /promo/landing/headline (public) */
export async function getHeadlineForLanding() {
  return baseUrl.request<HeadlineResp>(
    ENDPOINTS.PROMO.HEADLINE,
    { method: 'GET' }
  );
}

/**
 * GET /promo/transaction-list (public)
 * scope: 'module' | 'class' | ''; modul_id opsional
 */
export async function listPromosForTransaction(params?: { scope?: 'module' | 'class' | ''; modul_id?: number }) {
  const qs = new URLSearchParams();
  if (params?.scope) qs.set('scope', params.scope);
  if (params?.modul_id) qs.set('modul_id', String(params.modul_id));
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<PromoTransactionListResp>(
    `${ENDPOINTS.PROMO.TRANSACTION_LIST}${qstr}`,
    { method: 'GET' }
  );
}

/** GET /promo/apply-to-transaction (protected) */
export async function applyPromoToTransaction(params: { transaksi_id: number | string; kode: string }) {
  const qs = new URLSearchParams();
  qs.set('transaksi_id', String(params.transaksi_id));
  qs.set('kode', params.kode);

  return baseUrl.request<ApplyPromoResp>(
    `${ENDPOINTS.PROMO.APPLY_TO_TRANSACTION}?${qs.toString()}`,
    { method: 'GET' }
  );
}

/** POST /promo/remove (protected) */
export async function removePromoFromTransaction(transaksi_id: number | string) {
  return baseUrl.request<RemovePromoResp>(
    ENDPOINTS.PROMO.REMOVE,
    { method: 'POST', json: { transaksi_id } }
  );
}

/* ========================= HELPERS (opsional) ========================= */

/** Hanya promo_for = 'general' */
export async function listGeneralPromos(params?: PromoListParams) {
  const data = await listPromos(params);
  return data.filter(p => p.promo_for === 'general');
}

/** Hanya promo_for = 'modul' | 'class' (flash) */
export async function listFlashPromos(params?: PromoListParams) {
  const data = await listPromos(params);
  return data.filter(p => p.promo_for === 'modul' || p.promo_for === 'class');
}

export async function getFlashsaleItemsByPromo(promo_id: number | string) {
  return baseUrl.request<{ data: Array<{
      id: number;
      user_id: number | null;
      modul_id: number | null;
      user: { id: number; nama: string; email: string; avatar?: string | null } | null;
      modul: { id: number; judul: string; thumbnail_path: string | null; tipe: 'video'|'ebook'; instrument?: { id:number; nama:string; icon?: string|null } | null } | null;
    }>; type: 'class' | 'modul';
  }>(
    ENDPOINTS.PROMO.FLASHSALE_ITEMS(promo_id),
    { method: 'GET' }
  );
}

export async function updateFlashsaleItems(
  promoId: number | string,
  payload: { guru_ids?: number[]; modul_ids?: number[] }
) {
  return baseUrl.request<{ updated: true; added_count: number; removed_count: number }>(
    ENDPOINTS.PROMO.FLASHSALE_ITEMS(promoId),
    { method: 'PUT', json: payload }
  );
}