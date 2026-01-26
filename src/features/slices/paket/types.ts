// src/features/slices/paket/types.ts

export type PaketGroupKey = 'general' | 'hobby' | 'internasional';

export type PaketDetail = {
  label: string;
  note?: string | null;
  best_for?: string | null;
};

export type Paket = {
  id: number;
  nama_paket: string;
  jumlah_sesi: number;
  deskripsi?: string | null;
  benefits?: string | string[] | null;
  details?: PaketDetail[] | string | null;
  diskon_promo?: number | null;
  is_hobby?: boolean | null;
  is_internasional?: boolean | null;
  is_trial?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type GroupedPaket = {
  general: Paket[];
  hobby: Paket[];
  internasional: Paket[];
};

export type PaketStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type PaketState = {
  items: Paket[];
  grouped: GroupedPaket;
  total: number;
  page: number;
  limit: number;
  search: string;
  status: PaketStatus;
  error?: string | null;
  creating: boolean;
};

export type FetchPaketParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export type ListPaketResponse = GroupedPaket;

export type CreatePaketPayload = {
  nama_paket: string;
  jumlah_sesi: number;
  deskripsi?: string | null;
  benefits?: string[] | string | null;
  details?: PaketDetail[] | string | null;
  diskon_promo?: number | null;
  package_by?: PaketGroupKey;
  is_hobby?: boolean | null;
  is_internasional?: boolean | null;
  is_trial?: boolean | null;
};

export type UpdatePaketPayload = {
  id: number | string;
  data: Partial<CreatePaketPayload>;
};
