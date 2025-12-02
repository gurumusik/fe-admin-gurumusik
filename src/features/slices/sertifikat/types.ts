// src/features/slices/sertifikat/type.ts
export type SertifikatStatusRaw = 'under_review' | 'approved' | 'rejected';

export interface PatchSertifikatStatusPayload {
  id: number | string;
  status: SertifikatStatusRaw;
  alasan_penolakan?: string | null; // ← NEW
}

export interface PatchSertifikatStatusResponse {
  message: string;
  id: number | string;
  status: SertifikatStatusRaw;
  alasan_penolakan?: string | null; // ← NEW
}

export interface SertifikatSliceState {
  updatingById: Record<string, boolean>;
  errorById: Record<string, string | null>;
  lastUpdated: { id: number | string; status: SertifikatStatusRaw } | null;
}
