// src/features/slices/program/types.ts

/** ===== Entity (dipakai app) ===== */
export type Program = {
  id: number;
  nama_program: string;
  headline?: string;
  deskripsi?: string | null;
  bnefits?: string[] | null;
  durasi_menit?: number | null;
  created_at?: string;
  updated_at?: string;
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

// Alias supaya gaya di layer API tetap sama
export type ProgramListResp = ListProgramsResponse;

export type CreateProgramPayload = {
  nama_program: string;
  headline?: string;
  deskripsi?: string;
  bnefits?: string[];
  durasi_menit?: number | null;
};

export type UpdateProgramPayload = {
  id: number | string;
  data: Partial<CreateProgramPayload>;
};
