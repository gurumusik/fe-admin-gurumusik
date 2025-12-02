// src/features/slices/rating/types.ts

export type Trend = 'naik' | 'turun' | 'tetap' | null;

export type PerformaCard = {
  code: string;
  name: string;
  this_month_percent: number | null;
  last_month_percent: number | null;
  delta_percent: number | null;
  delta_label: string | null;
  trend: Trend;
  good_this_month?: number | null;
  bad_this_month?: number | null;
  good_last_month?: number | null;
  bad_last_month?: number | null;
  pos_count?: number;
  neg_count?: number;
};

export type AverageRating = {
  real_rating: number | null;
  previous_real_rating: number | null;
  delta_percent_real: number | null;

  fake_rating: number | null;
  previous_fake_rating: number | null;
  delta_percent_fake: number | null;
};

export type ClassRating = {
  this_month: number;
  last_month: number | null;
  delta_percent: number | null;
  delta_label: string | null;
  trend: Trend;
};

/** Cakupan murid opsional pada endpoint per-guru */
export type StudentScope = {
  murid_id: number | string;
  average_rating: AverageRating;
  class_rating: ClassRating;
  categories: PerformaCard[];
};

export type PerformaMengajar = {
  month_current: string;
  month_previous: string;
  average_rating: AverageRating;
  class_rating: ClassRating;
  categories: PerformaCard[];
  student_scope?: StudentScope;
};

/** State untuk endpoint per-guru (admin) */
export type PerformaMengajarState = {
  data: PerformaMengajar | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastGuruId?: number | string | null;
  lastMonth?: string | null;
};

/** State gabungan untuk slice ini (tambahkan state GLOBAL) */
export type PerformaMengajarSliceState = PerformaMengajarState & {
  globalData: PerformaMengajar | null;
  globalStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  globalError: string | null;
  lastMonthGlobal?: string | null;
};

/** Tipe baris riwayat pada Page (dipakai tabel demo) */
export type RatingHistoryRow = {
  id: string;
  avatar: string;     // url/path
  program: string;
  name: string;
  instrument: string;
  date: string;       // dd/mm/yyyy
  scoreText: string;  // "4,00/5"
  scoreValue: number; // angka murni untuk filter
  visible: boolean;
};

/* ====== Daily timeseries (chart) ====== */
export type RatingDailyPoint = {
  day: string;             // 'YYYY-MM-DD'
  avg_real: number | null; // 0..5 atau null kalau tidak ada data
  avg_fake: number | null; // 0..5 atau null kalau tidak ada data
  count: number;           // jumlah rating hari tsb
};

export type RatingDailyResponse = {
  start: string; // 'YYYY-MM-DD'
  end: string;   // 'YYYY-MM-DD'
  days: RatingDailyPoint[];
};

/* ====== LIST RATINGS (untuk tabel) ====== */
export type RatingsListSort = 'id' | 'rate' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export type RatingsListQuery = {
  page?: number;
  limit?: number | 'all';
  sort?: RatingsListSort;
  order?: SortOrder;

  q?: string;
  guru_id?: number | string;
  murid_id?: number | string;
  visible?: boolean;

  date_from?: string; // 'YYYY-MM-DD'
  date_to?: string;   // 'YYYY-MM-DD'
  min_rate?: number;
  max_rate?: number;
};

export type ApiRatingStudent = {
  id: number;
  nama: string;
  avatar_url: string | null;
} | null;

export type ApiRatingTeacher = {
  id: number;
  nama: string;
} | null;

export type ApiRatingItem = {
  id: number;
  id_guru: number;
  id_murid: number;
  id_transaksi: number | null;
  rate: number | null;        // 0..5
  rate_text: string;          // "4,00/5"
  is_show: boolean;
  created_at: string;         // ISO
  date_display: string;       // "dd/mm/yyyy"
  student: ApiRatingStudent;
  teacher: ApiRatingTeacher;
};

export type RatingsListMeta = {
  page: number;
  limit: number | 'all';
  total: number;
  total_pages: number;
  sort: RatingsListSort;
  order: SortOrder;
  has_next: boolean;
  has_prev: boolean;
};

export type RatingsListResponse = {
  meta: RatingsListMeta;
  data: ApiRatingItem[];
};
