import { ENDPOINTS } from '../endpoints';
import { baseUrl } from '../http/url';

export type BroadcastTargetRole = 'guru' | 'murid' | 'musician' | 'all';

export type AdminBroadcastNotificationPayload = {
  targetRole: BroadcastTargetRole;
  title: string;
  message: string;
  actionUrl?: string | null;
  kind?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type AdminBroadcastNotificationResponse = {
  message: string;
  data: {
    target_role: BroadcastTargetRole;
    target_roles: Array<'guru' | 'murid' | 'musician'>;
    total_recipients: number;
    created_count: number;
  };
};

export async function createAdminBroadcastNotification(
  payload: AdminBroadcastNotificationPayload
) {
  return baseUrl.request<AdminBroadcastNotificationResponse>(
    ENDPOINTS.NOTIFICATIONS.ADMIN_BROADCAST,
    {
      method: 'POST',
      json: payload,
    }
  );
}
