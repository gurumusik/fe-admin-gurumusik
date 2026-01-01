// src/features/instruments/types.ts
import type { InstrumentDTO } from '@/services/api/instrument.api';

/** Status umum untuk async lifecycle di slice */
export type SliceStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/** State untuk daftar instruments */
export type InstrumentState = {
  items: InstrumentDTO[];
  total: number;
  page: number;
  limit: number;
  q: string;
  status: SliceStatus;
  error?: string | null;
};

/** Parameter query untuk list instruments */
export type ListInstrumentsParams = {
  q?: string;
  page?: number;
  limit?: number;
};

/** Response standar dari API.listInstruments */
export type ListInstrumentsResponse = {
  data: InstrumentDTO[];
  total: number;
  page: number;
  limit: number;
};

/** Payload sukses saat delete instrument */
export type DeleteInstrumentResult = {
  id: number | string;
  message: string;
};

/** Slug instrumen untuk URL (mis. "acoustic-guitar") */
export type InstrumentSlug = string;

/** Tipe parameter route untuk halaman detail instrumen */
export type InstrumentRouteParams = { type?: string };

/** Payload submit/edit dari AddInstrumentModal (mode edit di detail page) */
export type EditInstrumentPayload = {
  type?: string;
  name?: string;
  iconBase64?: string | null;
  isAbk?: boolean;
};

/** Payload submit dari AddInstrumentModal (mode create di admin list) */
export type AddInstrumentSubmitPayload = {
  name?: string;
  file?: File | null;
  isAbk?: boolean;
};

/** Peta jumlah level/grade per instrumentId */
export type LevelCountMap = Record<number, number>;

/** Response dari /detail-programs/count?instrumentIds=... */
export type CountByInstrumentResponse = {
  counts: LevelCountMap;
};

/** Jenis modal hasil/hapus yang dipakai di AdminInstrumentPage */
export type ModalKind = 'confirm' | 'success' | 'error';

/** Draft silabus per-grade yang dipakai di InstrumentDetailPage */
export type SyllabusDraft = {
  id?: number ;
  id_detail_program?: number;
  title?: string;
  
  file_base64?: string | null;
  file_url?: string | null;
  link_url?: string | null;
  completion_pts?: string[]; // sesuaikan dengan struktur yang kamu pakai
};
