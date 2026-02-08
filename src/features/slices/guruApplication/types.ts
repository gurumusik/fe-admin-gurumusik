/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/guruApplication/types.ts

export type GAStatus = 'proses' | 'diterima' | 'ditolak';
export type GAListSortBy = 'created_at' | 'decided_at' | 'nama' | 'status';
export type GAListSortDir = 'ASC' | 'DESC';

export type GASertifikatLite = {
  id: number;
  certif_path: string;
  keterangan: string;
  penyelenggara: string;
  instrument_id: number;
  grade_id: number;
  status: 'approved' | 'under_review' | 'rejected';
  alasan_penolakan: string | null;
  instrument?: {
    id: number;
    nama: string;
    icon?: string | null;
  } | null;
  grade?: {
    id: number;
    nama: string;
  } | null;
};

export type GADetailGuruLite = {
  id: number;
  intro_link: string;
  bahasa: any | null;
  link_sertifikasi: string | null;
  rekrut_status: 'proses' | 'diterima' | 'ditolak';
  rekrut_note: string | null;
  is_abk: boolean | null;
  title: string | null;
  value_teacher: any | null;
  sertifikat?: GASertifikatLite[];
  cuplikan?: GACuplikanLite[];
};

export type GACuplikanLite = {
  id: number;
  instrument_id: number;
  title: string | null;
  deskripsi: string | null;
  link: string | null;
  instrument?: {
    id: number;
    nama_instrumen?: string | null;
    nama?: string | null;
    icon?: string | null;
  } | null;
};

export type GAPendidikanGuruLite = {
  id: number;
  nama_kampus: string | null;
  prodi_major_minor: string | null;
  url_sertifikat_kelulusan: string | null;
};

export type GAUserLite = {
  id: number;
  nama: string;
  email: string;
  profile_pic_url?: string | null;
  nama_panggilan?: string;
  status_akun?: 'aktif' | 'cuti' | 'non_aktif';
  detailGuru?: GADetailGuruLite | null;
  pendidikanGuru?: GAPendidikanGuruLite | null;
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
  sertifikat_penghargaan_url: string | null;
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
