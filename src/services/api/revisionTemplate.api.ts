/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

export type RevisionTemplateDTO = {
  id: number;
  field_key: string;
  name: string;
  message: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RevisionTemplateFieldOption = {
  field_key: string;
  label: string;
};

export type ListRevisionTemplatesParams = {
  q?: string;
  field_key?: string;
  field_keys?: string[];
  is_active?: boolean;
  page?: number;
  limit?: number;
};

export type ListRevisionTemplatesResp = {
  page: number;
  limit: number;
  total: number;
  data: RevisionTemplateDTO[];
  field_options?: RevisionTemplateFieldOption[];
};

export type CreateRevisionTemplatePayload = {
  field_key: string;
  name: string;
  message: string;
  sort_order?: number;
  is_active?: boolean;
};

export type UpdateRevisionTemplatePayload = Partial<CreateRevisionTemplatePayload>;

export async function listRevisionTemplates(params?: ListRevisionTemplatesParams) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.field_key) qs.set('field_key', params.field_key);
  if (Array.isArray(params?.field_keys) && params.field_keys.length) {
    for (const fieldKey of params.field_keys) {
      if (fieldKey) qs.append('field_key', fieldKey);
    }
  }
  if (typeof params?.is_active === 'boolean') qs.set('is_active', String(params.is_active));
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const qstr = qs.toString() ? `?${qs.toString()}` : '';
  return baseUrl.request<ListRevisionTemplatesResp>(
    `${ENDPOINTS.REVISION_TEMPLATES.LIST}${qstr}`,
    { method: 'GET' }
  );
}

export async function createRevisionTemplate(payload: CreateRevisionTemplatePayload) {
  return baseUrl.request<{ message: string; data: RevisionTemplateDTO }>(
    ENDPOINTS.REVISION_TEMPLATES.CREATE,
    {
      method: 'POST',
      json: payload as any,
    }
  );
}

export async function updateRevisionTemplate(
  id: number | string,
  payload: UpdateRevisionTemplatePayload
) {
  return baseUrl.request<{ message: string; data: RevisionTemplateDTO }>(
    ENDPOINTS.REVISION_TEMPLATES.UPDATE(id),
    {
      method: 'PUT',
      json: payload as any,
    }
  );
}

export async function enableRevisionTemplate(id: number | string) {
  return baseUrl.request<{ message: string; data: RevisionTemplateDTO }>(
    ENDPOINTS.REVISION_TEMPLATES.ENABLE(id),
    { method: 'PATCH' }
  );
}

export async function disableRevisionTemplate(id: number | string) {
  return baseUrl.request<{ message: string; data: RevisionTemplateDTO }>(
    ENDPOINTS.REVISION_TEMPLATES.DISABLE(id),
    { method: 'PATCH' }
  );
}

export async function deleteRevisionTemplate(id: number | string) {
  return baseUrl.request<{ message: string }>(
    ENDPOINTS.REVISION_TEMPLATES.DELETE(id),
    { method: 'DELETE' }
  );
}
