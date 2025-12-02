// src/services/api/transaksi.api.ts
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

/* ========================= TYPES ========================= */

/** Status mentah dari DB */
export type TxStatusRaw = 'pending' | 'menunggu_pembayaran' | 'lunas' | 'gagal' | 'expired';

/** Label status yang ramah-UI */
export type TxStatusLabel = 'Success' | 'On Progress' | 'Failed' | 'Expired' | 'Canceled';

export type TxCategoryRaw = 'les' | 'modul' | 'program' | 'paket';

/** Ringkas relasi yang dipakai di tabel promo -> transaksi */
export type ApiTxUser = {
  id: number;
  nama: string;
  profile_pic_url?: string | null;
};

export type ApiTxPaket = {
  id: number;
  nama_paket: string;
  jumlah_sesi?: number | null;
  diskon_promo?: number | null;
};

export type ApiTxProgram = {
  id: number;
  nama_program: string;
};

export type ApiTxInstrument = {
  id: number;
  nama_instrumen: string;
  icon: string | null;
};

export type ApiTxDetailProgram = {
  id: number;
  id_program?: number;
  id_instrumen?: number;
  id_grade?: number;
  base_harga?: number;
  discount_percent?: number;
  instrument?: ApiTxInstrument | null;
  program?: ApiTxProgram | null;
};

export type ApiTxModul = {
  id: number;
  judul: string;
  thumbnail_path?: string | null;
  type?: string | null;
};

export type PromoTransactionDTO = {
  id: number;
  total_harga: number;
  tanggal_transaksi: string; // ISO
  status: TxStatusRaw | string;
  category_transaksi?: TxCategoryRaw;

  // relasi yang kita butuhkan di tabel
  murid?: ApiTxUser | null;
  paket?: ApiTxPaket | null;
  detailProgram?: ApiTxDetailProgram | null;
  modul?: ApiTxModul | null;

  // payload unified untuk halaman lain
  price?: number;
  date?: string;
  module?: { id: number; title: string; type?: string | null; thumbnail?: string | null } | null;
  student?: { name?: string; avatar?: string | null } | null;
  instrument?: { name?: string; icon?: string | null } | null;
  paket_label?: string | null;

  // opsional: sudah dipetakan dari backend atau bisa dipetakan di FE via helper
  status_label?: TxStatusLabel;
  type?: 'Modul' | 'Kursus';
  program?: { id: number; name: string } | null;
};

export type ListPromoTransactionsResp = {
  total: number;
  page: number;
  limit: number;
  data: PromoTransactionDTO[];
};

/** Response detail transaksi (disederhanakan mengikuti controller getTransaksiDetail) */
export type TransaksiDetailResp = {
  transaksi: {
    id: number;
    status: TxStatusRaw | string;
    tanggal_transaksi: string;
    metode_pembayaran: string;
    promo?: {
      id: number;
      code: string;
      percent: number;
    } | null;
    renewal_due_at?: string | null;
    renewal_transaksi_id?: number | null;
  };
  summary: {
    student: {
      name: string;
      province?: string;
      city?: string;
      email?: string;
      phone?: string;
      lat?: number | null;
      lng?: number | null;
    };
    teacher: {
      id?: number;
      name?: string;
      city?: string;
      avatar?: string | null;
    } | null;
    schedule: {
      day: number | string;
      start: string;
      end: string;
    } | null;
    program: { id: number; name: string } | null;
    curriculum: Array<{ id: number; title: string; file?: string | null; completion_pts?: number; created_at?: string }>;
    instrument: { id: number; name: string; icon?: string | null } | null;
    instrument_id: number | null;
    grade_id: number | null;
    paket: { id?: number; name?: string; sessions?: number } | null;
    module?: { id: number; title: string; type?: string | null; thumbnail?: string | null } | null;
  };
  pricing: {
    sessions: number;
    unit_price: number;
    subtotal: number;
    discount_percent: number;
    paket_discount_percent: number;
    promo_discount_percent: number;
    total_before_promo: number;
    total: number;
    admin_fee: number;
    ppn_on_admin: number;
    guru_fee: number;
    pph_on_guru: number;
    currency: 'IDR';
  };
};

/* ========================= QUERY PARAM TYPES ========================= */

export type TxRange = '30D' | '90D' | 'ALL';
export type TxCategoryChip = 'Kursus' | 'Modul' | 'ALL';

export type ListPromoTransactionsParams = {
  page?: number;
  limit?: number;

  /** Pencarian bebas (nama murid / judul modul / instrumen) */
  q?: string;       // FE-friendly
  query?: string;   // BE-friendly (kompatibilitas)

  /** Label status ramah-UI; jika BE butuh raw, map-kan di thunk dan kirim 'status' */
  status_label?: TxStatusLabel | 'ALL';
  /** Raw status untuk BE */
  status?: TxStatusRaw;

  /** Chip kategori: Kursus (paket/program), Modul, ALL */
  category?: TxCategoryChip;

  /** Shortcut rentang tanggal */
  range?: TxRange;

  /** Opsi eksplisit tanggal jika ada (YYYY-MM-DD) */
  date_from?: string;
  date_to?: string;
};

// --- untuk /transaksi/all ---
export type ListAllTransactionsParams = {
  page?: number;
  limit?: number;
  q?: string;
  /** raw status di BE: pending | menunggu_pembayaran | lunas | gagal | expired */
  status?: TxStatusRaw;
  /** raw category di BE: paket | modul | all */
  category?: 'paket' | 'modul' | 'all';
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
};

/** BE untuk /transaksi/all sekarang mengembalikan payload yang SAMA dengan listPromoTransactions */
export type ListAllTransactionsResp = ListPromoTransactionsResp;
export type AllTransactionDTO = PromoTransactionDTO;

/* ========================= HELPERS ========================= */

export function mapTxStatusLabel(raw: TxStatusRaw): TxStatusLabel {
  const v = String(raw || '').toLowerCase();
  if (v === 'lunas') return 'Success';
  if (v === 'pending' || v === 'menunggu_pembayaran') return 'On Progress';
  if (v === 'expired') return 'Expired';
  if (v === 'gagal') return 'Failed';
  return 'Canceled';
}

export function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base =
    import.meta.env.VITE_API_BASE_URL
      ?.replace(/\/api\/v1\/?$/, '')
      ?.replace(/\/$/, '') ?? '';
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

/* ========================= API CALLS ========================= */

export async function listAllTransactions(params: ListAllTransactionsParams = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.q) qs.set('q', params.q);
  if (params.status) qs.set('status', params.status);
  if (params.category) qs.set('category', params.category);
  if (params.date_from) qs.set('date_from', params.date_from);
  if (params.date_to) qs.set('date_to', params.date_to);

  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<ListAllTransactionsResp>(
    `${ENDPOINTS.TRANSAKSI.ALL()}${qstr}`,
    { method: 'GET' }
  );
}

/**
 * GET detail transaksi (untuk aksi Invoice, dll.)
 */
export async function getTransaksiDetail(id: number | string) {
  return baseUrl.request<TransaksiDetailResp>(
    ENDPOINTS.TRANSAKSI.DETAIL(id),
    { method: 'GET' }
  );
}

/**
 * GET daftar transaksi yang menggunakan promo tertentu.
 * Endpoint: /transaksi/promo/:promoId/transactions
 */
export async function listTransactionsByPromo(
  promoId: number | string,
  params?: ListPromoTransactionsParams
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  // SEARCH: kirim dua-duanya agar kompatibel dengan BE mana pun
  const qStr = (params?.q ?? params?.query ?? '').trim();
  if (qStr) {
    qs.set('q', qStr);
    qs.set('query', qStr);
  }

  // STATUS: dukung raw & label
  if (params?.status) qs.set('status', params.status);
  if (params?.status_label && params.status_label !== 'ALL') qs.set('status_label', params.status_label);

  if (params?.category && params.category !== 'ALL') qs.set('category', params.category);
  if (params?.range && params.range !== 'ALL') qs.set('range', params.range);
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);

  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<ListPromoTransactionsResp>(
    `${ENDPOINTS.TRANSAKSI.BY_PROMO(promoId)}${qstr}`,
    { method: 'GET' }
  );
}
