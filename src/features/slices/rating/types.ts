// src/features/slices/rating/types.ts
export type Trend = 'naik' | 'turun' | 'tetap' | null;

export type PerformaCard = {
  code: string;
  name: string;
  this_month_percent: number | null;
  last_month_percent: number | null;
  delta_percent: number | null;
  delta_label: string | null;
  trend: Trend;
  good_this_month?: number | null;
  bad_this_month?: number | null;
  good_last_month?: number | null;
  bad_last_month?: number | null;
  pos_count?: number;
  neg_count?: number;
};

export type AverageRating = {
  this_month: number;
  last_month: number | null;
  delta_percent: number | null;
  delta_label: string | null;
  trend: Trend;
};

export type ClassRating = {
  this_month: number;
  last_month: number | null;
  delta_percent: number | null;
  delta_label: string | null;
  trend: Trend;
};

export type PerformaMengajarStudentScope = {   // ⬅️ NEW
  murid_id: number;
  average_rating: AverageRating;
  class_rating: ClassRating;
  categories: PerformaCard[];
};

export type PerformaMengajar = {
  month_current: string;
  month_previous: string;
  average_rating: AverageRating;
  class_rating: ClassRating;
  categories: PerformaCard[];
  student_scope?: PerformaMengajarStudentScope; // ⬅️ NEW (opsional)
};

export type PerformaMengajarState = {
  data: PerformaMengajar | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastGuruId?: number | string | null;
  lastMonth?: string | null;
};
