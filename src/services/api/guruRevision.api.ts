/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  TCreateGuruRevisionReportPayload,
  TGuruRevisionReport,
} from '@/types/TGuruRevision';

export async function createGuruRevisionReport(
  applicationId: number | string,
  payload: TCreateGuruRevisionReportPayload,
) {
  const resp = await baseUrl.request<any>(
    ENDPOINTS.RECRUITMENT.REVISION_REPORTS(applicationId),
    { method: 'POST', json: payload },
  );

  // { message, report, token?, notify? }
  return resp;
}

export async function getLatestGuruRevisionReport(applicationId: number | string) {
  const resp = await baseUrl.request<any>(
    ENDPOINTS.RECRUITMENT.REVISION_REPORTS_LATEST(applicationId),
    { method: 'GET' },
  );
  return (resp?.data ?? resp) as TGuruRevisionReport | null;
}

export async function listGuruRevisionReports(applicationId: number | string) {
  const resp = await baseUrl.request<any>(
    ENDPOINTS.RECRUITMENT.REVISION_REPORTS(applicationId),
    { method: 'GET' },
  );
  const data = resp?.data ?? resp;
  const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return rows as TGuruRevisionReport[];
}

export async function deactivateGuruRevisionToken(tokenId: number | string) {
  return baseUrl.request<any>(
    ENDPOINTS.RECRUITMENT.REVISION_TOKEN_DEACTIVATE(tokenId),
    { method: 'PATCH' },
  );
}

