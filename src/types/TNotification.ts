// src/types/TNotification.ts

/* ===================== NOTIFICATION TYPES ===================== */

export type TNotifKind =
  | "reschedule_request"
  | "reschedule_rejected"
  | "reschedule_approved"
  | "general";

export type TNotifItem = {
  id: string | number;
  kind: TNotifKind;
  title?: string;
  message: string;
  studentName?: string | null;
  isRead: boolean;
  createdAt: string;        // ISO datetime string
  actionUrl?: string | null; // tombol "Detail" muncul kalau ada URL
};

/** Filter di UI */
export type TNotifReadFilter = "all" | "unread" | "read";
export type TNotifKindFilter = "all" | "reschedule" | "general";
