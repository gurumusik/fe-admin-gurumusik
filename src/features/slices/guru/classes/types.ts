export type GuruClassRow = {
  sesi_id: number;
  transaksi_id: number;
  sesi_ke: number;
  sesi_total: number;
  sesi_label: string;
  tanggal_sesi: string | null;
  status: string | null;
  waktu_mulai: string | null; 
  waktu_selesai: string | null

  murid: { id: number | null; nama: string | null; profile_pic_url: string | null };
  program: { id: number | null; nama: string | null } | null;

  // ⬇️ CHANGED: instrument sekarang di dalam detail_program
  detail_program: {
    id: number | null;
    instrument: {
      id: number | null;
      nama: string | null;
      icon: string | null;
    };
  } | null;

  jadwal: { id: number | null; hari: number | string | null; waktu_mulai: string | null; waktu_selesai: string | null };
  rating: { value: number | null; count: number };
};

export type ListGuruClassesParams = {
  guruId: number;
  page?: number;
  limit?: number;
  q?: string;
  sort_by?: 'sesi_ke' | 'murid_nama' | 'program_nama' | 'instrument_nama' | 'jadwal_mulai' | 'rating';
  sort_dir?: 'asc' | 'desc';
};

export type ListGuruClassesResponse = {
  data: GuruClassRow[];
  total: number;
  page: number;
  limit: number;
  has_next?: boolean;
  has_prev?: boolean;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  q?: string | null;
};

export type GuruClassesState = {
  items: GuruClassRow[];
  total: number;
  page: number;
  limit: number;
  q: string;
  sort_by: ListGuruClassesParams['sort_by'];
  sort_dir: NonNullable<ListGuruClassesParams['sort_dir']>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};
