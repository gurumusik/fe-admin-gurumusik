import type { TUserLite } from '@/features/slices/user/types';
import type { ListGuruParams } from '@/services/api/guru.api';

/* =========================
   TYPES (digabung)
   ========================= */
export type GuruStatusLabel = 'Aktif' | 'Cuti' | 'Non-Aktif';

export type GuruListItem = {
  id: number;
  nama: string;
  phone: string | null;
  city: string | null;
  status: GuruStatusLabel;
  rating: number | null;
  image: string | null;
};

export type GuruRecap = {
  active: number;
  inactive: number;
  onLeave: number;
};

export type GuruDetailItem = TUserLite & {
  status_akun?: string | null;
  status_label?: GuruStatusLabel;
};

export type GuruDetailState = {
  item: GuruDetailItem | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentId?: number | null;
};

export type GuruListState = {
  items: GuruListItem[];
  recap: GuruRecap;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastQuery?: Omit<ListGuruParams, 'page' | 'limit'>;
};

export type GuruState = {
  detail: GuruDetailState;
  list: GuruListState;
};

export type GuruProfileResponse = {
  user: {
    id: number;
    nama: string;
    nama_panggilan: string | null;
    email: string;
    no_telp: string | null;
    alamat: string | null;
    profile_pic_url: string | null;
    province: string | null;
    city: string | null;
    bio: string | null;
    status_akun: string;
    cuti: { start_date: string | null; end_date: string | null };
    home_lat: number | null;
    home_lng: number | null;
    location_source: string | null;
  };

  detail: {
    id: number | null;
    title: string;
    intro_link: string;
    bahasa: string[];
    link_sertifikasi: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value_teacher: any[];
    appropriate: string;
    appropriate_list: string[];
    designed_for: string[];
  };

  instruments: Array<{
    instrument_id: number;
    grade_id: number;
    instrument: { id: number; nama: string; icon: string } | null;
    grade: { id: number; nama: string } | null;
  }>;

  sertifikat: Array<{
    alasan_penolakan: null;
    id: number;
    certif_path: string | null;
    keterangan: string | null;
    penyelenggara: string | null;
    status: string;
    instrument_id: number | null;
    grade_id: number | null;
  }>;

  jadwal: Array<{
    id: number;
    hari: string;
    waktu_mulai: string;
    waktu_selesai: string;
    status: string;
  }>;
};

/* =========================
   NEW: Create From Entry
   ========================= */
export type CreateGuruFromEntryCertificate = {
  title?: string;             // keterangan
  school?: string;            // penyelenggara
  instrument_id: number;
  grade_id: number;
  certif_path?: string;       // URL/path file sertifikat (BKN base64)
};

export type CreateGuruFromEntryPayload = {
  nama: string;
  nama_panggilan?: string;
  email: string;
  no_telp: string;
  province?: string;
  city?: string;
  alamat?: string;
  bio?: string | null;
  profile_pic_url?: string | null;      // URL/path, bukan base64
  intro_link?: string;                  // link video demo
  bahasa?: string[];                    // ["Bahasa Indonesia", "English"]
  certificates?: CreateGuruFromEntryCertificate[];
};

export type CreateGuruFromEntryResponse = {
  message: string;
  user: { id: number; nama: string; email: string; role: 'guru'|'admin'|'murid' };
  detail_guru: { id: number; intro_link: string; bahasa: string[] };
  sertifikat_total: number;
};
