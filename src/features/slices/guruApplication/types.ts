/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/guruApplication/types.ts

export type GAStatus = 'proses' | 'diterima' | 'ditolak';
export type GAScreeningState =
  | 'new'
  | 'revision_required'
  | 'revision_resubmitted'
  | 'certification_offered'
  | 'certification_requested'
  | 'verified'
  | 'rejected';
export type GAQueue =
  | 'screening'
  | 'revision'
  | 'certification'
  | 'certification_offer'
  | 'manual_certification';
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
    nama?: string | null;
    nama_instrumen?: string | null;
    icon?: string | null;
  } | null;
  grade?: {
    id: number;
    nama?: string | null;
    nama_grade?: string | null;
  } | null;
  tahun_berlaku?: number | null;
  tipe_sertifikat?: string | null;
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
  prodi_major_minor?: string | null;
  url_sertifikat_kelulusan: string | null;
  major_instrument_id?: number | null;
  minor_instrument_id?: number | null;
  video_url?: string | null;
  majorInstrument?: {
    id: number;
    nama_instrumen?: string | null;
    icon?: string | null;
  } | null;
  minorInstrument?: {
    id: number;
    nama_instrumen?: string | null;
    icon?: string | null;
  } | null;
};

export type GAUserLite = {
  id: number;
  nama: string;
  email: string;
  profile_pic_url?: string | null;
  nama_panggilan?: string;
  status_akun?: 'aktif' | 'cuti' | 'non_aktif';
  province?: string | null;
  city?: string | null;
  alamat?: string | null;
  home_lat?: string | number | null;
  home_lng?: string | number | null;
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
  domisili_provinsi?: string | null;
  alamat?: string | null;
  portfolio_url: string | null;
  sertifikat_penghargaan_url: string | null;
  cv_url: string | null;
  demo_url: string | null;
  judul_kelas?: string | null;
  tentang_kelas?: string | null;
  value_kelas?: string[] | null;
  bahasa?: string[] | null;
  status: GAStatus;
  screening_state?: GAScreeningState;
  screening_note?: string | null;
  screening_meta?: any | null;
  screening_state_updated_at?: string | null;
  decided_by: number | null;
  decided_at: string | null; // ISO dari backend
  note: string | null;
  is_abk: boolean;           // <-- perbaikan di sini
  created_at: string;
  updated_at: string;

  // verify tutor revision meta (may only exist on some endpoints)
  revision_count?: number;
  revision_danger_flag?: boolean;
  error_count?: number;
  submission_state?: 'NEW' | 'REVISION';
  has_pending_revision?: boolean;
  is_revision_resubmitted?: boolean;
  is_in_revision_queue?: boolean;
  is_in_certification_queue?: boolean;

  user?: GAUserLite | null;
  decider?: GADeciderLite | null;
  list_sertifikat?: GASertifikatLite[] | null;
  pendidikan_guru?: GAPendidikanGuruLite[] | null;
  sertifikat_penghargaan?: Array<{
    id: number;
    instrument_id?: number | null;
    judul_penghargaan?: string | null;
    penyelenggara?: string | null;
    detail_penghargaan?: string | null;
    video_url?: string | null;
    instrument?: {
      id: number;
      nama?: string | null;
      nama_instrumen?: string | null;
      icon?: string | null;
    } | null;
  }> | null;
};

export type GARecap = {
  proses: number;
  diterima: number;
  ditolak: number;
  screening?: number;
  revision?: number;
  certification?: number;
  certification_offered?: number;
  manual_certification?: number;
};

export type GAListParams = {
  q?: string;
  page?: number;
  limit?: number;
  status?: GAStatus;
  queue?: GAQueue;
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
