export type TAdminLiveChatParticipant = {
  id: number;
  role: "guru" | "murid";
  name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
} | null;

export type TAdminLiveChatSessionSummary = {
  chat_session_id: number;
  sesi_id: number;
  status: "scheduled" | "active" | "inactive" | "ended";
  status_label: string;
  is_active: boolean;
  end_reason: string | null;
  active_from_at: string | null;
  active_until_at: string | null;
  activated_at: string | null;
  deactivated_at: string | null;
  archived_at: string | null;
  last_message_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  message_count: number;
  photo_count: number;
  latest_message_preview: string | null;
  class_info: {
    label: string;
    paket_name: string | null;
    date: string | null;
    start_time: string | null;
    end_time: string | null;
    sesi_ke: number | null;
    location_label: string | null;
  };
  teacher: TAdminLiveChatParticipant;
  student: TAdminLiveChatParticipant;
};

export type TAdminLiveChatMessage = {
  id: number;
  kind: "text" | "image" | "system";
  text: string | null;
  image_url: string | null;
  image_deleted: boolean;
  sent_at: string;
  sender: {
    id: number | null;
    role: "guru" | "murid" | "system";
    name: string;
    avatar_url: string | null;
  };
  metadata: Record<string, unknown> | null;
};

export type TAdminLiveChatPhotoItem = {
  id: number;
  chat_session_id: number;
  sesi_id: number;
  image_url: string;
  sent_at: string;
  download_name: string;
  sender: {
    role: "guru" | "murid" | "system";
    name: string;
  };
  session_status: "scheduled" | "active" | "inactive" | "ended";
  class_label: string;
  class_date: string | null;
  teacher_name: string;
  student_name: string;
};

export type TAdminLiveChatOverview = {
  stats: {
    active_sessions: number;
    history_sessions: number;
    photo_count: number;
  };
  active_sessions: TAdminLiveChatSessionSummary[];
  history_sessions: TAdminLiveChatSessionSummary[];
  photos: TAdminLiveChatPhotoItem[];
};

export type TAdminLiveChatSessionDetail = {
  session: TAdminLiveChatSessionSummary;
  messages: TAdminLiveChatMessage[];
  photos: TAdminLiveChatPhotoItem[];
};
