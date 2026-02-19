// src/services/api/murid.api.ts
import { baseUrl } from '@/services/http/url';
import { ENDPOINTS } from '@/services/endpoints';

/* ========================= TYPES (API) ========================= */

export type StudentListItem = {
  uuid: string;
  image: string | null;
  name: string;
  email?: string | null;
  phone: string | null;
  city: string | null;
  status: 'Aktif' | 'Non-Aktif' | 'Cuti';
  created_at?: string | null;
};

export type StudentRecap = {
  active: number;
  inactive: number;
  onLeave: number;
};

export type ListStudentsResp = {
  recap: StudentRecap;
  students: StudentListItem[];
  cities: string[];
  statuses: Array<'Aktif' | 'Non-Aktif' | 'Cuti'>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListStudentsParams = {
  q?: string;
  city?: string;
  province?: string;
  status?: 'aktif' | 'non_aktif' | 'cuti'; // backend expects raw
  verified?: boolean;
  hasPhone?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'nama' | 'city' | 'created_at' | 'updated_at';
  sort_dir?: 'asc' | 'desc';
};

export type StudentHeader = {
  uuid: string;
  image: string | null;
  name: string;
  status: 'Aktif' | 'Non-Aktif' | 'Cuti';
};

export type StudentHeaderResp = {
  student: StudentHeader;
};

export type StudentClassRow = {
  id: string;                 // transaksi id (string biar cocok FE)
  avatar: string | null;      // guru.profile_pic_url
  teacherName: string;
  program: string;
  instrument: string;
  schedule: string;           // "Setiap Senin | 19.00 - 20.00"
  session: number;            // total sesi
  rating: number | null;
};

export type StudentClassListResp = {
  data: StudentClassRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type StudentClassHistoryItem = {
  session: number;
  date: string;       // YYYY-MM-DD
  startClock: string; // HH.mm
  endClock: string;   // HH.mm
  status: string;     // "Belum Selesai" | "Selesai Tepat Waktu" | ...
};

export type StudentClassHistoryResp = {
  data: StudentClassHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type StudentHeaderDTO = {
  student: {
    uuid: string;
    image: string | null;
    name: string;
    status: 'Aktif' | 'Non-Aktif' | 'Cuti' | string;
  };
};

/* ========= Types untuk endpoint /murid/:muridId/classes (per sesi & latest_done) ========= */

export type MuridClassSessionRow = {
  transaksi_id: number;
  sesi_id: number;
  sesi_ke: number;
  date: string;        // YYYY-MM-DD
  startClock: string;  // HH.mm
  endClock: string;    // HH.mm
  total_session: number;

  status?: string;

  avatar: string | null;
  teacherName: string;

  instrument: { id: number | null; name: string; icon: string | null };
  program: { id: number | null; name: string };

  schedule: string;    // "Setiap Senin | 19.00 - 20.00"
  rating: number | null;
};

export type MuridClassSessionListResp = {
  data: MuridClassSessionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MuridClassesView = 'per_session' | 'latest_done';

/* ========================= API CALLS ========================= */

export async function listStudents(params?: ListStudentsParams) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.city) qs.set('city', params.city);
  if (params?.province) qs.set('province', params.province);
  if (params?.status) qs.set('status', params.status);
  if (params?.verified !== undefined) qs.set('verified', String(params.verified));
  if (params?.hasPhone !== undefined) qs.set('hasPhone', String(params.hasPhone));
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.sort_by) qs.set('sort_by', params.sort_by);
  if (params?.sort_dir) qs.set('sort_dir', params.sort_dir);
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<ListStudentsResp>(
    `${ENDPOINTS.MURID.ADMIN_LIST}${qstr}`,
    { method: 'GET' }
  );
}

export async function getStudentByUuid(uuid: string) {
  return baseUrl.request<StudentHeaderResp>(
    ENDPOINTS.MURID.DETAIL_BY_UUID(uuid),
    { method: 'GET' }
  );
}

/** Legacy (by UUID, list classes aggregated by transaksi – endpoint lama) */
export async function listStudentClasses(
  uuid: string,
  params?: { page?: number; limit?: number; instrument?: string; program?: string }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.instrument) qs.set('instrument', params.instrument);
  if (params?.program) qs.set('program', params.program);
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<StudentClassListResp>(
    `${ENDPOINTS.MURID.CLASSES_BY_UUID(uuid)}${qstr}`,
    { method: 'GET' }
  );
}

export async function getStudentClassHistory(
  uuid: string,
  classId: string | number,
  params?: { page?: number; limit?: number }
) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<StudentClassHistoryResp>(
    `${ENDPOINTS.MURID.CLASS_HISTORY(uuid, classId)}${qstr}`,
    { method: 'GET' }
  );
}

/**
 * GET /murid/:muridId/classes  (controller mendukung ?uuid=... juga)
 * Gunakan `view` untuk memilih mode:
 *  - 'per_session'  : 1 baris = 1 sesi
 *  - 'latest_done'  : 1 baris = 1 transaksi, berisi sesi_ke terakhir berstatus "kelas selesai"
 */
export async function listMuridClassesById(args: {
  muridId?: number | string; // opsional, kalau tidak ada kirim 0 (server fallback ke uuid)
  uuid?: string;             // opsional, kalau pakai uuid
  page?: number;
  limit?: number;
  instrument?: string;
  program?: string;
  view?: 'per_session' | 'latest_done';
}) {
  const muridId = args.muridId ?? 0;
  const qs = new URLSearchParams();
  if (args.uuid) qs.set('uuid', args.uuid);
  if (args.page) qs.set('page', String(args.page));
  if (args.limit) qs.set('limit', String(args.limit));
  if (args.instrument) qs.set('instrument', args.instrument);
  if (args.program) qs.set('program', args.program);
  if (args.view) qs.set('view', args.view);
  const qstr = qs.toString() ? `?${qs.toString()}` : '';

  return baseUrl.request<MuridClassSessionListResp>(
    `${ENDPOINTS.MURID.CLASSES_BY_ID(muridId)}${qstr}`,
    { method: 'GET' }
  );
}

/** Helper wrapper untuk langsung ambil mode 'latest_done' */
export async function listMuridClassesLatestDone(args: {
  muridId?: number | string;
  uuid?: string;
  page?: number;
  limit?: number;
  instrument?: string;
  program?: string;
}) {
  return listMuridClassesById({ ...args, view: 'latest_done' });
}

/* =============== NEW: Daftar rating per transaksi (untuk StudentReportModal) =============== */

export type StudentRatingRow = {
  id: number;
  id_guru: number;
  id_murid: number;
  id_transaksi: number;
  rate: number | string;     
  is_show: boolean;
  created_at: string;
};

export type ListMuridTransaksiRatingsResp = {
  meta: { murid_id: number; transaksi_id: number; total: number };
  data: StudentRatingRow[];
};

/**
 * GET /murid/:muridId/classes/ratings?transaksi_id=...(&uuid=...)
 * Mengambil daftar rating (rate, created_at, is_show) dari tabel `rating`
 * untuk satu transaksi milik murid tertentu.
 *
 * Catatan:
 * - Kirim `muridId` atau cukup `uuid` (jika `muridId` tidak ada, set muridId=0).
 * - Endpoint backend: ENDPOINTS.MURID.CLASSES_RATINGS(muridId)
 */
export async function listMuridTransaksiRatings(args: {
  muridId?: number | string; // opsional — bila tidak ada, kirim 0 & gunakan uuid
  uuid?: string;             // opsional — bila pakai ini, server akan resolve ke id
  transaksiId: number | string;
}) {
  const muridId = args.muridId ?? 0;
  const qs = new URLSearchParams({ transaksi_id: String(args.transaksiId) });
  if (args.uuid) qs.set('uuid', args.uuid);

  return baseUrl.request<ListMuridTransaksiRatingsResp>(
    `${ENDPOINTS.MURID.CLASSES_RATINGS(muridId)}?${qs.toString()}`,
    { method: 'GET' }
  );
}
