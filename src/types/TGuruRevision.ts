export type TGuruRevisionReportStatus = 'draft' | 'sent' | 'resolved' | 'cancelled';

export type TGuruRevisionReportItem = {
  id?: number;
  field_key: string;
  message?: string | null;
  created_at?: string | null;
};

export type TGuruRevisionToken = {
  id: number;
  is_active: boolean;
  created_at?: string;
  last_used_at?: string | null;
  last_reminded_at?: string | null;
  reminder_count?: number;
};

export type TGuruRevisionReport = {
  id: number;
  guru_application_id: number;
  status: TGuruRevisionReportStatus;
  general_message?: string | null;
  sent_at?: string | null;
  revision_submitted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: TGuruRevisionReportItem[];
  tokens?: TGuruRevisionToken[];
};

export type TCreateGuruRevisionReportPayload = {
  fields: Array<{ field_key: string; message?: string | null }>;
  general_message?: string | null;
  send?: boolean;
};

