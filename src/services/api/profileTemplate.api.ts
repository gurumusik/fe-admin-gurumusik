/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

export type ProfileTemplateDTO = {
  id: number;
  name: string;
  category: string;
  tags: string[] | null;
  headline: string | null;
  about: string | null;
  designed_for: string[] | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProfileTemplateSummaryDTO = Pick<
  ProfileTemplateDTO,
  'id' | 'name' | 'category' | 'tags' | 'sort_order' | 'is_active'
>;

export type ListProfileTemplatesParams = {
  q?: string;
  category?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
};

export type ListProfileTemplatesResp = {
  page: number;
  limit: number;
  total: number;
  data: ProfileTemplateSummaryDTO[];
};

export type GetProfileTemplateDetailResp = {
  data: ProfileTemplateDTO;
};

export type CreateProfileTemplatePayload = {
  name: string;
  category: string;
  tags?: string[];
  headline?: string | null;
  about?: string | null;
  designed_for?: string[];
  sort_order?: number;
  is_active?: boolean;
};

export type UpdateProfileTemplatePayload = Partial<CreateProfileTemplatePayload>;

const toNullableText = (v: unknown) => {
  const s = v == null ? '' : String(v);
  const t = s.trim();
  return t ? s : null;
};

const normalizePayload = (p: Record<string, unknown>) => {
  const out: Record<string, unknown> = { ...p };
  if ('headline' in out) out.headline = toNullableText(out.headline);
  if ('about' in out) out.about = toNullableText(out.about);
  if ('tags' in out && Array.isArray(out.tags)) out.tags = (out.tags as any[]).map(String);
  if ('designed_for' in out && Array.isArray(out.designed_for)) {
    out.designed_for = (out.designed_for as any[]).map(String);
  }
  return out;
};

export async function listProfileTemplates(params?: ListProfileTemplatesParams) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.category) qs.set('category', params.category);
  if (typeof params?.is_active === 'boolean') qs.set('is_active', String(params.is_active));
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<ListProfileTemplatesResp>(`${ENDPOINTS.PROFILE_TEMPLATES.LIST}${qstr}`, {
    method: 'GET',
  });
}

export async function getProfileTemplateDetail(id: number | string) {
  return baseUrl.request<GetProfileTemplateDetailResp>(ENDPOINTS.PROFILE_TEMPLATES.DETAIL(id), {
    method: 'GET',
  });
}

export async function createProfileTemplate(payload: CreateProfileTemplatePayload) {
  return baseUrl.request<{ message: string; data: ProfileTemplateDTO }>(ENDPOINTS.PROFILE_TEMPLATES.CREATE, {
    method: 'POST',
    json: normalizePayload(payload as any),
  });
}

export async function updateProfileTemplate(id: number | string, payload: UpdateProfileTemplatePayload) {
  return baseUrl.request<{ message: string; data: ProfileTemplateDTO }>(ENDPOINTS.PROFILE_TEMPLATES.UPDATE(id), {
    method: 'PUT',
    json: normalizePayload(payload as any),
  });
}

export async function enableProfileTemplate(id: number | string) {
  return baseUrl.request<{ message: string; data: ProfileTemplateDTO }>(ENDPOINTS.PROFILE_TEMPLATES.ENABLE(id), {
    method: 'PATCH',
  });
}

export async function disableProfileTemplate(id: number | string) {
  return baseUrl.request<{ message: string; data: ProfileTemplateDTO }>(ENDPOINTS.PROFILE_TEMPLATES.DISABLE(id), {
    method: 'PATCH',
  });
}

export async function deleteProfileTemplate(id: number | string) {
  return baseUrl.request<{ message: string }>(ENDPOINTS.PROFILE_TEMPLATES.DELETE(id), {
    method: 'DELETE',
  });
}

