// src/features/slices/transaksi/types.ts

/* ========================= STATUS & ENUM ========================= */

export type TxStatusRaw =
  | 'pending'
  | 'menunggu_pembayaran'
  | 'lunas'
  | 'gagal'
  | 'expired';

export type TxStatusLabel =
  | 'Success'
  | 'On Progress'
  | 'Failed'
  | 'Expired'
  | 'Canceled';

export type TxCategoryRaw = 'les' | 'modul' | 'program' | 'paket';

/** Chip kategori di UI */
export type TxCategoryChip = 'Kursus' | 'Modul' | 'ALL';
/** Rentang tanggal cepat */
export type TxRange = '30D' | '90D' | 'ALL';

/** Status umum lifecycle async di slice */
export type SliceStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/* ========================= RELATIONAL DTOs ========================= */

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

/* ========================= LIST BY PROMO ========================= */

export type PromoTransactionDTO = {
  id: number;
  // BE unified shape → bisa datang sebagai price atau total_harga (fallback di UI sudah aman)
  price?: number;
  total_harga?: number;
  tanggal_transaksi?: string; // BE unified → UI juga handle 'date'
  date?: string;
  status: TxStatusRaw | string;
  category_transaksi?: TxCategoryRaw;
  type?: 'Modul' | 'Kursus';

  // relasi
  murid?: ApiTxUser | null;
  paket?: ApiTxPaket | null;
  detailProgram?: ApiTxDetailProgram | null;
  modul?: ApiTxModul | null;
  module?: { id: number; title: string; type?: string | null; thumbnail?: string | null } | null; // guard untuk payload unified
  program?: { id: number; name: string } | null;

  // ⬇️ NEW: info promo untuk kalkulasi rekap
  promo?: { id: number; code?: string; percent: number } | null;

  // opsional (label ramah UI dari BE)
  status_label?: TxStatusLabel;
};

export type ListPromoTransactionsResp = {
  total: number;
  page: number;
  limit: number;
  data: PromoTransactionDTO[];
  recap?: AllTxRecap;
};

export type ListTxByPromoParams = {
  page?: number;
  limit?: number;
  q?: string;
  status_label?: TxStatusLabel | 'ALL';
  category?: TxCategoryChip;
  range?: TxRange;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
};

export type FetchTxByPromoArgs = {
  promoId: number | string;
  params?: ListTxByPromoParams;
};

export type ListTxByPromoResponse = ListPromoTransactionsResp;

/* ========================= DETAIL TRANSAKSI ========================= */

export type TransaksiDetailResp = {
  transaksi: {
    id: number;
    status: TxStatusRaw | string;
    tanggal_transaksi: string;
    metode_pembayaran: string;
    promo?: { id: number; code: string; percent: number } | null;
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
    teacher: { id?: number; name?: string; city?: string; avatar?: string | null } | null;
    schedule: { day: number | string; start: string; end: string } | null;
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

export type GetTxDetailArgs = { id: number | string };

/* ========================= “ALL TRANSACTIONS” (earning page) ========================= */
/** Query untuk /transaksi/all (raw params untuk BE) */
export type ListAllTxParams = {
  page?: number;
  limit?: number;
  q?: string;
  status?: TxStatusRaw;                 // raw (opsional)
  category?: 'paket' | 'modul' | 'all'; // raw (opsional)
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
};

/**
 * Payload item untuk /transaksi/all sekarang DISAMAKAN dengan list-by-promo.
 * Dipertahankan alias AllTransactionItem agar import lama tetap bekerja.
 */
export type AllTransactionItem = PromoTransactionDTO;

/** Respon paginasi umum (masih bisa dipakai di tempat lain bila perlu) */
export type ApiListResponse<T> = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
};

/* ========================= STATE & RECAP ========================= */

// Titik rekap bulanan (ALL kategori)
export type MonthlyRecapPoint = {
  year: number;           // 2025
  month: number;          // 1..12
  count?: number;         // total transaksi bulan tersebut (all kategori)
  course_count?: number;  // jumlah kursus per bulan
  module_count?: number;  // jumlah modul per bulan
  promo_tx_count?: number;// jumlah transaksi pakai promo per bulan
};

export type AllTxRecap = {
  total_sum: number;
  course_sum: number;
  module_sum: number;
  promo_sum: number;
  course_count: number;
  module_count: number;
  promo_tx_count: number;
  by_month?: Array<Pick<MonthlyRecapPoint, 'year' | 'month' | 'course_count' | 'module_count' | 'promo_tx_count'>>;
};

export type TransaksiByPromoState = {
  // === untuk halaman promo (existing)
  items: PromoTransactionDTO[];
  total: number;
  page: number;
  limit: number;

  // filters (dipakai juga untuk ALL)
  q: string;
  statusFilter: TxStatusLabel | 'ALL';
  category: TxCategoryChip;
  range: TxRange;
  date_from?: string | null;
  date_to?: string | null;

  status: SliceStatus;
  error?: string | null;

  // detail (existing)
  detail?: TransaksiDetailResp | null;
  detailStatus: SliceStatus;
  detailError?: string | null;

  // === untuk earnings (ALL transactions)
  allItems: AllTransactionItem[];
  allStatus: SliceStatus;
  allError?: string | null;
  allTotal: number;

  allRecap?: AllTxRecap | null;
  allMonthlyRecap?: MonthlyRecapPoint[] | null; // <-- sumber data chart (tak ikut tab)
  monthlyrecap?: any | null; 
};
