/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';

/** =========================
 * Types sesuai WilayahStore
 * ========================= */
export type ProvinceItem = {
  id: string;     // "11", dsb
  nama: string;   // "Aceh", dsb
};

export type CityItem = {
  id: string;           // "1101", dsb
  id_provinsi: string;  // "11"
  nama: string;         // "Kota Banda Aceh"
};

export type Paginated<T> = {
  total: number;
  page: number;
  limit: number;
  data: T[];
};

/** Helper bikin querystring bersih */
function toQuery(params: Record<string, any>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s !== '') sp.append(k, s);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

/** =========================
 * PROVINCES
 * ========================= */

/**
 * GET /wilayah/provinces?q=&page=&limit=
 * Balik: { total, page, limit, data: ProvinceItem[] }
 */
export async function listProvincesApi(params?: { q?: string; page?: number; limit?: number }) {
  const url = ENDPOINTS.WILAYAH.PROVINCES + toQuery({
    q: params?.q,
    page: params?.page ?? 1,
    limit: params?.limit ?? 200,
  });

  if (typeof window !== 'undefined') {
    console.debug('[GET] Provinces URL:', url);
  }

  return baseUrl.request<Paginated<ProvinceItem>>(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

/** GET /wilayah/provinces/:id */
export async function getProvinceApi(id: number | string) {
  const idStr = String(id ?? '').trim();
  if (!idStr) throw new Error('id provinsi kosong');

  const url = ENDPOINTS.WILAYAH.PROVINCE(idStr);
  if (typeof window !== 'undefined') console.debug('[GET] Province URL:', url);

  return baseUrl.request<ProvinceItem>(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

/** =========================
 * CITIES
 * ========================= */

/**
 * GET /wilayah/cities?province_id=&q=&page=&limit=
 * Balik: { total, page, limit, data: CityItem[] }
 */
export async function listCitiesApi(params: {
  province_id: number | string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const province_id = String(params?.province_id ?? '').trim();
  if (!province_id) throw new Error('province_id wajib diisi');

  const url = ENDPOINTS.WILAYAH.CITIES + toQuery({
    province_id,
    q: params?.q,
    page: params?.page ?? 1,
    limit: params?.limit ?? 300,
  });

  if (typeof window !== 'undefined') {
    console.debug('[GET] Cities URL:', url);
  }

  return baseUrl.request<Paginated<CityItem>>(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

/** GET /wilayah/cities/:id */
export async function getCityApi(id: number | string) {
  const idStr = String(id ?? '').trim();
  if (!idStr) throw new Error('id kota/kab kosong');

  const url = ENDPOINTS.WILAYAH.CITY(idStr);
  if (typeof window !== 'undefined') console.debug('[GET] City URL:', url);

  return baseUrl.request<CityItem>(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

/** =========================
 * Convenience helpers (untuk UI)
 * ========================= */
export async function getAllProvinces() {
  const res = await listProvincesApi({ page: 1, limit: 200 });
  return res.data; // ProvinceItem[]
}
export async function getCitiesByProvince(province_id: string | number) {
  const res = await listCitiesApi({ province_id, page: 1, limit: 300 });
  return res.data; // CityItem[]
}
