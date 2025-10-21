/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/slices/registrasiGuru/types.ts

/** Status async standar untuk slice */
export type RegistrasiStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * Tipe item registrasi guru di state.
 * Dibuat "open" supaya tetap kompatibel dengan bentuk dari API.
 */
export type RegistrasiGuru = {
  id: number;
  // field lain dibiarkan fleksibel karena tergantung API
  nama?: string;
  no_telp?: string;
  alamat?: string | null;
  preferensi_instrumen?: string | null;
  created_at?: string | null;
  // dokumen opsional yang dipakai di UI
  path_video_url?: string | null;
  file_cv_url?: string | null;
  file_sertifikasi_url?: string | null;
  [key: string]: any;
};

/** Bentuk response list umum */
export type RegistrasiListResp<T = RegistrasiGuru> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

/** State untuk slice registrasiGuru */
export type RegistrasiGuruState = {
  items: RegistrasiGuru[];
  total: number;
  page: number;
  limit: number;
  q: string;
  abk: boolean | null;
  status: RegistrasiStatus;
  error?: string | null;
  creating: boolean;
  updatingId?: number | null;
  deletingId?: number | null;
  approvingId?: number | null;
};

/* ================= UI helper types (dipakai di pages) ================= */

export type ApproveConfirmKind = 'success' | 'error';
export type ApproveConfirmContext = 'approved' | 'rejected';
