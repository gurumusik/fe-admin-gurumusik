// src/services/api/invoice.api.ts
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

export type InvoiceBuyer = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
};

export type InvoiceSchedule = {
  day?: number | string | null;
  start?: string | null;
  end?: string | null;
};

export type InvoiceDTO = {
  id?: number | null;
  invoice_number?: string | null;
  status?: string | null;
  transaction_status?: string | null;
  transaksi_id?: number | null;
  issued_at?: string | null;
  due_at?: string | null;
  subtotal?: number | null;
  discount_total?: number | null;
  registration_fee?: number | null;
  service_fee?: number | null;
  ppn_on_service?: number | null;
  accommodation_fee?: number | null;
  bahasa_fee?: number | null;
  total?: number | null;
  buyer?: InvoiceBuyer | null;
  language?: string | null;
  program_name?: string | null;
  paket_name?: string | null;
  instrument_name?: string | null;
  teacher_name?: string | null;
  teacher_city?: string | null;
  schedule?: InvoiceSchedule | null;
  start_session_date?: string | null;
  meta?: Record<string, unknown> | null;
};

export type GetInvoiceResp = {
  invoice: InvoiceDTO;
};

export async function getInvoice(id: number | string) {
  const safeId = encodeURIComponent(String(id));
  return baseUrl.request<GetInvoiceResp>(ENDPOINTS.INVOICE.DETAIL(safeId), {
    method: 'GET',
  });
}
