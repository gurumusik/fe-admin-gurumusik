export type User = {
  id: number | string;
  nama: string;
  email: string;
  role: 'admin'|'guru'|'murid';
  profile_pic_url?: string | null;   // <- optional + boleh null
  is_verified?: boolean;             // <- opsional (datang dari login)
};

export type TUserLite = { id: number; nama: string; profile_pic_url?: string | null };