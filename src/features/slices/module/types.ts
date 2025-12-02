// src/features/dashboard/pages/module/types.ts

/* ===== Common unions ===== */
export type ModuleType = 'Video' | 'E-Book';
export type ModuleStatus = 'Aktif' | 'Non-Aktif';

/* ===== Dashboard summary ===== */
export type SummaryCounts = {
  active: number;
  inactive: number;
  requests: number;
};

/* ===== Admin list row (UI) ===== */
export type ModuleRow = {
  id: number;
  uuid: string;
  title: string;
  image: string;   // URL atau path import asset
  price: number;   // IDR
  sold: number;
  type: ModuleType;
  status: ModuleStatus;
  statusRaw?: ApiModuleStatusLabel;
  created_at?: string; // ISO
  updated_at?: string; // ISO
  guru?: { id: number; nama: string; ucode?: string | null } | null;
};

/* ===== Admin actions & modal states ===== */
export type Mode = 'activate' | 'deactivate';
export type ActionResultType = 'success' | 'error';

export type ConfirmState = { mode: Mode; item: ModuleRow } | null;
export type ResultState = { mode: Mode; type: ActionResultType } | null;

/* ===== Edit / Detail form ===== */
export type MoneyInput = number | ''; // input angka yang bisa kosong

export type ModuleForm = {
  title: string;
  basePrice: MoneyInput;
  salePrice: MoneyInput;
  promoPrice: MoneyInput;
  instrument: string;
  previewUrl: string;
  description: string; // HTML
  audience: string;
  playlists: string[];
  thumbnail?: File | null;

  // Khusus Edit: ada clips
  clips?: File[];
  instrumentId?: number | null;
  gradeId?: number | null;
};

/* ===== Upload item (ebooks/clips) ===== */
export type UploadItem = {
  id: string;
  file: File;
  url: string;
  progress: number; // 0..100
  done: boolean;
};

/* ===== Router state (data dari navigate state) ===== */
export type OwnerRouteState = { ownerName?: string; ownerId?: string; avatar?: string };
export type RequesterRouteState = { requesterName?: string; requesterId?: string; requesterAvatar?: string };

/* ===== Request module list ===== */
export type RequestRow = {
  id: string;
  title: string;
  submittedAt: string; // "dd/MM/yyyy | HH.mm"
  teacher: string;
  type: ModuleType;
  image: string;
};

/* ===== Detail Request: confirmation kinds ===== */
export type ConfirmKind = 'approved-ok' | 'approved-fail' | 'rejected-ok' | 'rejected-fail';

/** Tipe "type" langsung dari DB/backend */
export type ApiModuleType = 'video' | 'ebook';

/** Label status yang dikirim controller (hasil statusLabel) */
export type ApiModuleStatusLabel = 'Aktif' | 'Non-Aktif' | 'Diperiksa Admin';

/** Item list dari endpoint GET /module/guru */
export type ModuleListItemApi = {
  id: number;
  judul: string;
  harga: number;

  // meta harga
  harga_bid: number;
  harga_discount: number;
  percent_discount: number;

  link_drive: string | null;
  notif_update: boolean;

  thumbnail_path: string;
  tipe: ApiModuleType;   // 'video' | 'ebook'
  terjual: number;       // sold
  status: ApiModuleStatusLabel;

  instrument: { id: number; nama: string; icon: string | null } | null;
  grade: { id: number; nama: string } | null;
   created_at: string;    // ISO string
  guru: { id: number; nama: string; ucode?: string | null } | null;

  updated_at: string;    // ISO string
  
};

export type ModuleListRespApi = {
  total: number;
  data: ModuleListItemApi[];
};

export type ModuleListStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/** Filter yang dipakai untuk fetch ke server + filter UI */
export type ModuleFilters = {
  q: string;
  /** 'ALL' untuk UI; kirim ke API hanya jika bukan 'ALL' (map ke 'video' | 'ebook') */
  type: 'ALL' | ModuleType;
};

/** State standar untuk slice module list (admin) */
export type ModuleSliceState = {
  items: ModuleRow[];         // data yang sudah diadaptasi untuk UI
  total: number;
  counts: SummaryCounts;      // ringkasan (active / inactive / requests)
  status: ModuleListStatus;
  error: string | null;
  filters: ModuleFilters;     // q dan tipe (ALL/E-Book/Video)
};

export type ApiModuleDetail = {
  id: number;
  guru: { id: number; nama: string; profile_pic_url:string | null; ucode: string| null } | null,
  judul: string;
  deskripsi: string;
  harga: number;
  harga_bid: number;
  harga_discount: number;
  percent_discount: number;
  link_drive: string | null;
  notif_update: boolean;
  thumbnail_path: string;
  preview_class: string;
  appropriate_module: string;
  instrument: { id: number; nama: string; icon: string | null } | null;
  grade: { id: number; nama: string } | null;
  tipe: ApiModuleType; // 'video' | 'ebook'
  playlists: { id: number; link_playlist: string }[];
  ebooks: { id: number; ebook_path: string; total_pages: number; pendukung: boolean }[];
  previews: { id: number; file_path: string; mime_type: string; file_size: number; sort_order: number }[];
  terjual: number;
  status: ApiModuleStatusLabel; // 'Aktif' | 'Non-Aktif' | 'Diperiksa Admin'
  created_at: string;
  updated_at: string;
  id_guru: number;
};

export type ModuleDetailState = {
  item: ApiModuleDetail | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};