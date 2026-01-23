// src/features/slices/instrumentWizard/types.ts

export type WizardRow = {
  id_grade?: number | null;
  nama_grade: string;
  base_harga: number | '';
};

export type CompletionPoint = {
  key: string;
  label: string;
  weight: number;
};

export type SyllabusDraft = {
  id?: number;                 // id silabus existing (edit)
  id_detail_program?: number;  // dp id (opsional)
  title: string;
  completion_pts: CompletionPoint[];
  file_base64?: string | null; // IMAGE (data:image/..)
  file_url?: string | null;    // PDF/path atau data:application/pdf;...
  link_url?: string | null;    // http/https
};

export type ProgramLite = { id: number; nama_program: string };

export type RowMeta = {
  dpId?: number | null;        // dpId untuk row ini (edit)
  silabusId?: number | null;   // silabus id untuk row ini (edit)
};

export type PendingDelete = { dpId: number; silabusId?: number | null };

export type WizardState = {
  // mode
  isEditMode: boolean;

  // instrument
  draftName: string;
  draftIconBase64: string | null;
  draftIsAbk: boolean;
  draftIsActive: boolean;
  existingIconUrl: string | null;

  // program/rows
  programId: number | null;
  rows: WizardRow[];
  programs: ProgramLite[];

  // per-row
  syllabusDrafts: (SyllabusDraft | undefined)[];
  rowMetas: (RowMeta | undefined)[];

  // soft delete (edit mode): index->true jika ditandai hapus
  deletedDraftRows: Record<number, boolean>;

  // daftar yang benar-benar akan dihapus saat submit
  pendingDeletes: PendingDelete[];

  status: 'idle' | 'loading' | 'submitting' | 'succeeded' | 'failed';
  error: string | null;
  createdInstrumentId: number | null;
};
