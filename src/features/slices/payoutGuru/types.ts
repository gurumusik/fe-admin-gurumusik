// src/features/slices/payoutGuru/types.ts

export type PayoutType = 'regular' | 'early';
export type PayoutMetode = 'bank_transfer' | 'ewallet';
export type PayoutStatus =
  | 'requested' | 'review' | 'approved' | 'rejected'
  | 'processing' | 'paid' | 'failed' | 'cancelled';

/** === NEW: Recap types === */
export type Recap = {
  total_komisi: number;     // sum(amount) status=paid
  jumlah_guru: number;      // count users role=guru
  jumlah_pengajuan: number; // count DISTINCT id_guru status=requested
};

export type RecapMonthly = Record<string, {
  total_komisi: number;
  jumlah_guru: number;
  jumlah_pengajuan: number;
}>;

/** Minimal user info */
export type UserBrief = {
  id: number;
  nama: string;
  profile_pic_url?: string | null;
  email?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BankAccountDTO = {
  id: number;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type BankDTO = {
  code: string;
  name?: string;
  icon_url?: string | null;
};

export type PayoutFileDTO = {
  id: number;
  payout_id: number;
  url: string;
  filename?: string | null;
  mimetype?: string | null;
  created_at?: string;
};

export type ArusPendapatanGuruDTO = {
  id: number;
  payout_id: number;
  type?: string | null;
  amount?: number | null;
  notes?: string | null;
  created_at?: string;
};

export type PayoutGuruDTO = {
  id: number;
  id_guru: number;
  bank_account_id: number;

  type: PayoutType;
  early_cap_percent: number;

  amount_requested: number;
  cap_basis_snapshot: number;
  available_snapshot: number;
  unavailable_snapshot: number;

  amount: number | null; // dibayar (net)

  metode: PayoutMetode;
  status: PayoutStatus;

  payout_bank_code: string;
  payout_account_number: string;
  payout_account_name: string;

  bonus_amount: number;
  deduction_pph21: number;
  deduction_denda: number;
  deduction_transfer_fee: number;
  deduction_platform_fee: number;
  deduction_other: number;

  reviewer_admin_id: number | null;
  payer_admin_id: number | null;
  transfer_reference: string | null;

  requested_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  processed_at: string | null;
  paid_at: string | null;

  notes: string | null;
  created_at: string;
  updated_at: string;

  // === RELATIONS ===
  guru?: UserBrief | null;
  bankAccount?: BankAccountDTO | null;
  payoutBank?: BankDTO | null;
  reviewer?: UserBrief | null;
  payer?: UserBrief | null;
  files?: PayoutFileDTO[] | null;
  arus?: ArusPendapatanGuruDTO[] | null;
};

export type ListPayoutGuruResp = {
  total: number;
  page: number;
  limit: number;
  data: PayoutGuruDTO[];
  recap?: Recap;                 // ⬅️ NEW
  recapmonthly?: RecapMonthly;   // ⬅️ optional
};

export type ListPayoutGuruParams = {
  q?: string;
  search?: string;
  page?: number;
  limit?: number;
  id_guru?: number;
  status?: PayoutStatus;
  metode?: PayoutMetode;
  type?: PayoutType;
  requested_from?: string;
  requested_to?: string;
  sort_by?: string;
  sort_dir?: 'ASC' | 'DESC';
};

export type DecideAction = 'approve' | 'reject';

export type DecidePayoutGuruReq = {
  action: DecideAction;
  /** wajib diisi saat reject; abaikan saat approve */
  reason?: string;
};

export type DecidePayoutGuruResp = {
  message: string;
  data: PayoutGuruDTO;
};

export type SendSlipKomisiItem = {
  payout_id: number;
  payout_at?: string;
  transfer_reference?: string;
};

export type SendSlipKomisiReq = {
  payout_ids?: number[];
  items?: SendSlipKomisiItem[];
};

export type SendSlipKomisiResp = {
  message: string;
  updated: Array<{ payout_id: number; status: string }>;
  skipped: Array<{ payout_id: number; reason: string }>;
};
