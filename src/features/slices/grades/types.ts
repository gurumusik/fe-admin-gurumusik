// src/features/grades/types.ts
import type { GradeDTO } from '@/services/api/grade.api';

export type SliceStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type GradeState = {
  items: GradeDTO[];
  total: number;
  page: number;
  limit: number;
  q: string;
  status: SliceStatus;
  error?: string | null;
};

export type ListGradesParams = { q?: string; page?: number; limit?: number };
export type ListGradesResponse = { total: number; page: number; limit: number; data: GradeDTO[] };
