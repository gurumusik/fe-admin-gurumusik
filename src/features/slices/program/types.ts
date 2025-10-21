// src/features/program/types.ts

/** ===== Entity (dipakai app) ===== */
export type Program = {
  id: number;
  nama_program: string;
  // Tambahkan field lain dari backend bila ada, mis: deskripsi?: string;
};

/** ===== State & Status ===== */
export type ProgramsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type ProgramState = {
  items: Program[];
  total: number;
  page: number;
  limit: number;
  q: string;
  status: ProgramsStatus;
  error?: string | null;
  creating: boolean; // state khusus proses create
};

/** ===== Thunk params & response shapes ===== */
export type FetchProgramsParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type ListProgramsResponse = {
  data: Program[];
  total: number;
  page: number;
  limit: number;
};

export type CreateProgramPayload = {
  nama_program: string;
};
