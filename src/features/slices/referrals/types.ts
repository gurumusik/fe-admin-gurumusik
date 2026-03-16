export type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export type ListReferralReferrersParams = {
  q?: string;
  page?: number;
  limit?: number;
  status?: string;
};

export type ReferralReferrerSummaryRaw = Record<string, unknown> & {
  referrer_user_id: number | string;
  total_referred: number | string;
  total_commissions: number | string;
  total_amount: number | string;
  last_earned_at?: string | null;
};

export type ListReferralReferrersResp = {
  total: number;
  page: number;
  limit: number;
  data: ReferralReferrerSummaryRaw[];
};

export type ReferralUserBrief = {
  id: number;
  nama: string;
  email?: string | null;
  ucode?: string | null;
};

export type ReferralTeacherReferral = {
  id: number;
  referrer_user_id: number;
  referred_user_id: number;
  referral_code: string;
  referrer?: ReferralUserBrief | null;
  referred?: ReferralUserBrief | null;
};

export type ReferralTransaksiBrief = {
  id: number;
  status: string;
  category_transaksi: string;
  tanggal_transaksi: string;
  id_guru: number;
  id_murid: number;
  total_harga: number;
};

export type ReferralCommissionRow = {
  id: number;
  teacher_referral_id: number;
  transaksi_id: number;
  amount: number;
  status: string;
  earned_at: string;
  reversed_at?: string | null;
  reversal_reason?: string | null;
  teacherReferral?: ReferralTeacherReferral | null;
  transaksi?: ReferralTransaksiBrief | null;
};

export type ListReferralCommissionsParams = {
  page?: number;
  limit?: number;
  status?: string;
  referrer_user_id?: number;
  referred_user_id?: number;
  transaksi_id?: number;
};

export type ListReferralCommissionsResp = {
  total: number;
  page: number;
  limit: number;
  data: ReferralCommissionRow[];
};

