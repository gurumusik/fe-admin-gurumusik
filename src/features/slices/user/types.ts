export type User = {
  id: number | string;
  nama: string;
  email: string;
  role: 'admin'|'superadmin'|'guru'|'murid'|'musician'|'candidate';
  profile_pic_url?: string | null;   // <- optional + boleh null
  is_verified?: boolean;             // <- opsional (datang dari login)
};

export type TUserLite = { id: number; nama: string; profile_pic_url?: string | null };
