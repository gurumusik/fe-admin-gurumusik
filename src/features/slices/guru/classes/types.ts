/* =========================
   LIST PAGE (per transaksi)
   ========================= */
export type GuruClassDTO = {
  transaksi_id: number;

  murid: { id: number | null; nama: string | null; profile_pic_url: string | null };
  program: { id: number | null; nama: string | null } | null;

  detail_program: {
    id: number | null;
    instrument: { id: number | null; nama: string | null; icon: string | null };
  } | null;

  jadwal: {
    id: number | null;
    hari: number | string | null;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
  };

  // sesi (done/total)
  sesi_done: number;
  sesi_total: number;
  sesi_label: string; // ex: "6/8"

  // nilai kelas (AVG rating per transaksi)
  rating: { value: number | null; count: number };
};

export type ListGuruClassesParams = {
  guruId: number;
  q?: string;
  page?: number;
  limit?: number;
  sort_by?: 'murid_nama' | 'program_nama' | 'instrument_nama' | 'jadwal_mulai' | 'rating';
  sort_dir?: 'asc' | 'desc';
};

export type ListGuruClassesResponse = {
  total: number;
  page: number;
  limit: number;
  data: GuruClassDTO[];
  has_next?: boolean;
  has_prev?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  q?: string | null;
};

/** State untuk list page */
export type GuruClassesState = {
  items: GuruClassDTO[];
  total: number;
  page: number;
  limit: number;
  q: string;
  sort_by: NonNullable<ListGuruClassesParams['sort_by']>;
  sort_dir: NonNullable<ListGuruClassesParams['sort_dir']>; // 'asc' | 'desc'
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

/* ======================================
   DETAIL PAGE (per sesi pada transaksi)
   ====================================== */
export type TransaksiSessionRow = {
  sesi_id: number;
  transaksi_id: number;
  sesi_ke: number;
  sesi_total: number;
  sesi_label: string;
  tanggal_sesi: string | null;
  status: string | null;
  waktu_mulai: string | null;
  waktu_selesai: string | null;

  murid: { id: number | null; nama: string | null; profile_pic_url: string | null };
  program: { id: number | null; nama: string | null } | null;

  detail_program: {
    id: number | null;
    instrument: {
      id: number | null;
      nama: string | null;
      icon: string | null;
    };
  } | null;

  jadwal: {
    id: number | null;
    hari: number | string | null;
    waktu_mulai: string | null;
    waktu_selesai: string | null;
  };

  // nilai kelas (avg per transaksi) diletakkan pada setiap row agar FE mudah gunakan
  rating: { value: number | null; count: number };
};

/** Alias agar cocok dengan nama yang kamu pakai sebelumnya */
export type GuruClassRow = TransaksiSessionRow;

export type ListTransaksiSessionsResponse = {
  meta?: { transaksi_id?: number; total?: number; sesi_done?: number; sesi_total?: number };
  data: TransaksiSessionRow[];
};

export type RatingRow = {
  id: number;
  id_guru: number;
  id_murid: number;
  id_transaksi: number;
  rate: number | string; // backend contoh mengirim "5.0" (string)
  is_show: boolean;
  created_at: string;

  // ⬇️ field baru
  feedback?: string | null;
  selected_indicator?: RatingSelectedIndicatorItem[];
  rating_attachment?: RatingAttachmentItem[];
};


export type RatingsGuruInfo = {
  id: number;
  nama: string | null;
  status_akun: string | null;
  profile_pic_url: string | null;
};

export type ListTransaksiRatingsResponse = {
  meta: { guru_id: number; transaksi_id: number; murid_id: number | null; total: number };
  guru: RatingsGuruInfo | null;            // 🔹 info guru ikut pulang
  data: RatingRow[];
};

export type RatingSelectedIndicatorItem = {
  rating_id: number;
  indicator_id: number;
  indicator: {
    id: number;
    label: string;
    impact: number;
    type: 'positive' | 'negative';
    category_id: number;
    is_active: boolean;
  } | null;
};

export type RatingAttachmentItem = {
  id: number;
  rating_id: number;
  url: string;
  mime_type: string | null;
  created_at: string; // ISO
};
