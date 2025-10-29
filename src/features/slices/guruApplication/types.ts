// src/features/slices/guruApplication/types.ts

export type GAStatus = 'proses' | 'diterima' | 'ditolak';
export type GAListSortBy = 'created_at' | 'decided_at' | 'nama' | 'status';
export type GAListSortDir = 'ASC' | 'DESC';

export type GAUserLite = {
  id: number;
  nama: string;
  email: string;
  profile_pic_url?: string | null;
};

export type GADeciderLite = {
  id: number;
  nama: string;
  email: string;
};

export type GuruApplicationDTO = {
  id: number;
  user_id: number | null;
  nama: string;
  email: string;
  no_telp: string | null;
  domisili: string | null;
  portfolio_url: string | null;
  cv_url: string | null;
  demo_url: string | null;
  status: GAStatus;
  decided_by: number | null;
  decided_at: string | null; // ISO dari backend
  note: string | null;
  is_abk: boolean;           // <-- perbaikan di sini
  created_at: string;
  updated_at: string;

  user?: GAUserLite | null;
  decider?: GADeciderLite | null;
};

export type GARecap = {
  proses: number;
  diterima: number;
  ditolak: number;
};

export type GAListParams = {
  q?: string;
  page?: number;
  limit?: number;
  status?: GAStatus;
  created_from?: string;
  created_to?: string;
  sortBy?: GAListSortBy;
  sortDir?: GAListSortDir;
};

export type GAListResp = {
  rows: GuruApplicationDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  recap: GARecap;
  sort: { by: GAListSortBy; dir: GAListSortDir };
};
