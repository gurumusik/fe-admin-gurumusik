/* ========================= TYPES for Murid List ========================= */

export type StudentListItem = {
  uuid: string;
  image: string | null;
  name: string;
  phone: string | null;
  city: string | null;
  status: 'Aktif' | 'Non-Aktif' | 'Cuti' | string;
};

export type StudentRecap = {
  active: number;
  inactive: number;
  onLeave: number;
};

export type StudentListState = {
  items: StudentListItem[];
  recap: StudentRecap;
  cities: string[];
  statuses: Array<'Aktif' | 'Non-Aktif' | 'Cuti'>;

  total: number;
  page: number;
  limit: number;
  totalPages: number;

  q: string;
  city: string;
  statusLabel: '' | 'Aktif' | 'Non-Aktif' | 'Cuti';

  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

export type ListStudentsParams = {
  q?: string;
  city?: string;
  statusLabel?: '' | 'Aktif' | 'Non-Aktif' | 'Cuti';
  page?: number;
  limit?: number;
};

export type ListStudentsResponse = {
  recap: StudentRecap;
  students: StudentListItem[];
  cities: string[];
  statuses: Array<'Aktif' | 'Non-Aktif' | 'Cuti'>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MuridClassSessionRow = {
  transaksi_id: number;
  sesi_id: number;
  sesi_ke: number;
  date: string;
  startClock: string;
  endClock: string;
  total_session: number;
  avatar: string | null;
  teacherName: string;
  instrument: { id: number | null; name: string; icon: string | null };
  program: { id: number | null; name: string };
  schedule: string;
  rating: number | null;
};

export type StudentClassesState = {
  items: MuridClassSessionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  instrument: string;
  program: string;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

export type StudentHeader = {
  uuid: string;
  image: string | null;
  name: string;
  status: 'Aktif' | 'Non-Aktif' | 'Cuti' | string;
};