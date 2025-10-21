export type GuruStatusLabel = 'Aktif' | 'Cuti' | 'Non-Aktif';

export type GuruListItem = {
  id: number;
  nama: string;
  phone: string | null;
  city: string | null;
  status: GuruStatusLabel;
  rating: number | null;   // 0..5 atau null bila tidak ada
  image: string | null;    // profile_pic_url
};

export type GuruRecap = {
  active: number;
  inactive: number;
  onLeave: number;
};