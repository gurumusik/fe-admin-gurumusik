/* eslint-disable @typescript-eslint/no-explicit-any */

// ========= CORE ENTITIES =========
export type PromoStatus = 'active' | 'inactive';
export type PromoFor = 'general' | 'modul' | 'class';

export interface ApiPromo {
  id: number;
  kode_promo: string;
  persentase_diskon: number;
  notes: string | null;
  status: PromoStatus;
  user_id: number;

  // ⬇️ tanggal2 dari backend
  started_at?: string | null;    // ← TANGGAL MULAI (baru)
  expired_at: string | null;
  created_at: string;
  updated_at: string;

  max_usage: number;
  promo_for: PromoFor | null;

  // headline & visibilitas
  title: string;
  headline_text?: string | null; // ← TEKS HEADLINE (baru)
  is_show: boolean;
  is_headline_promo: boolean;

  modul_id: number | null;

  // toleransi casing lain (beberapa serializer beda)
  createdAt?: string;
  updatedAt?: string;
  expiredAt?: string | null;
  startedAt?: string | null;
}

/* ========= QUERY PARAMS / SLICE STATE ========= */
export type PromoListParams = {
  status?: PromoStatus;
  is_show?: boolean;
  is_headline_promo?: boolean;
  includeUsage?: boolean;
};

export type FetchState = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface PromoSliceState {
  // FLASH (modul|class)
  items: ApiPromo[];
  status: FetchState;
  error: string | null;

  // GENERAL (kode promo)
  generalItems: ApiPromo[];
  generalStatus: FetchState;
  generalError: string | null;
}

/* ========= API RESPONSE / PAYLOAD TYPES ========= */
export type PromoListResp = { data: ApiPromo[] };
export type PromoDetailResp = { data: ApiPromo };
export type HeadlineAvailResp = {
  data: { available: boolean; current: null; }; available: boolean; current: ApiPromo | null 
};
export type HeadlineResp = { data: ApiPromo | null };
export type PromoTransactionListResp = { data: ApiPromo[] };

// ⬇️ gunakan started_at + headline_text
export type CreatePromoPayload = {
  kode_promo: string;
  persentase_diskon: number;
  title: string;

  notes?: string | null;
  status?: PromoStatus;                 // default 'active'
  started_at?: string | null;           // ← yyyy-MM-dd (atau ISO)
  expired_at?: string | null;           // ← yyyy-MM-dd (atau ISO)
  headline_text?: string | null;        // ← teks headline
  max_usage?: number;                   // default 1
  promo_for?: PromoFor | null;          // 'general' | 'modul' | 'class' | null
  is_show?: boolean;
  is_headline_promo?: boolean;
  modul_id?: number | null;
};

export type UpdatePromoPayload = Partial<CreatePromoPayload>;

export type ApplyPromoResp = {
  applied: boolean;
  transaksi_id: number;
  promo: { id: number; kode: string; percent: number };
  pricing: any;
};

export type RemovePromoResp = { removed: true; transaksi_id: number };

/* ========= UI HELPERS ========= */
export type DisplayStatus = 'Aktif' | 'Non-Aktif';

export type FlashTypeRaw = Extract<PromoFor, 'modul' | 'class'>;
export type FlashTypeLabel = 'Modul' | 'Tutor';

export type PromoRow = {
  id: number | string;
  code: string;
  discountPct: number;
  startDate: string; // dd/MM/yyyy
  endDate: string;   // dd/MM/yyyy
  status: DisplayStatus;
};

export type FlashRow = {
  id: number | string;
  rawType: FlashTypeRaw;
  type: FlashTypeLabel;
  discountPct: number;
  startDate: string; // dd/MM/yyyy
  endDate: string;   // dd/MM/yyyy
  status: DisplayStatus;
};
