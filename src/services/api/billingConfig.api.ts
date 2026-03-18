import { ENDPOINTS } from '../endpoints';
import { baseUrl } from '../http/url';

export type BillingConfigItem = {
  registration_fee: number;
  service_fee_flat: number;
  accommodation_fee_default: number;
  guru_split_percent: number;
  admin_split_percent: number;
  guru_pph_percent: number;
  bahasa_non_id_fee: number;
  bahasa_fee_to_guru: boolean;
};

export async function getBillingConfig() {
  return baseUrl.request<{ data: BillingConfigItem }>(ENDPOINTS.BILLING_CONFIG.DETAIL, {
    method: 'GET',
  });
}

export async function updateBillingConfig(payload: Partial<BillingConfigItem>) {
  return baseUrl.request<{ data: BillingConfigItem; message?: string }>(
    ENDPOINTS.BILLING_CONFIG.UPDATE,
    {
      method: 'PUT',
      json: payload,
    }
  );
}
