import { ENDPOINTS } from "../endpoints";
import { baseUrl } from "../http/url";
import type {
  TAdminLiveChatOverview,
  TAdminLiveChatSessionDetail,
} from "@/types/TAdminLiveChat";

export async function getAdminLiveChatOverview() {
  return baseUrl.request<TAdminLiveChatOverview>(ENDPOINTS.ADMIN_LIVE_CHAT.OVERVIEW, {
    method: "GET",
  });
}

export async function getAdminLiveChatDetail(chatSessionId: number) {
  return baseUrl.request<TAdminLiveChatSessionDetail>(
    ENDPOINTS.ADMIN_LIVE_CHAT.DETAIL(chatSessionId),
    {
      method: "GET",
    }
  );
}
