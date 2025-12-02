// src/data/dummyData.ts
import type { TNotifItem } from "@/types/TNotification";
/* ===================== MODULES / TEACHERS / STUDENTS ===================== */
export type ModuleType = 'Video' | 'E-Book';
export type ModuleItem = {
  id: number;
  uuid: string;
  title: string;
  image: string;
  price: string;           // harga sekarang (tebal)
  oldPrice: string;        // harga coret
  discountPct: number;     // persen diskon (untuk badge)
  type: ModuleType;        // 'Video' | 'E-Book'
  authorImage: string;
  authorName?: string;      // avatar kecil kanan-bawah
  lists: string[];
  location: string;
  rating: { value: number; totalReviews: number };
};

export const modules: ModuleItem[] = [
  {
    id: 1,
    uuid: 'mod-001',
    title: 'Musik Itu Gampang',
    image: '/assets/images/modul.png',
    price: 'Rp50.000',
    oldPrice: 'Rp100.000',
    discountPct: 50,
    type: 'Video',
    authorImage: 'https://i.pravatar.cc/100?img=24',
    authorName: 'Daniel Khaneman',
    lists: ['Guitar', 'Vocal', 'Piano'],
    location: 'Depok',
    rating: { value: 5, totalReviews: 67 },
  },
  {
    id: 2,
    uuid: 'mod-002',
    title: 'Musik Itu Gampang',
    image: '/assets/images/modul.png',
    price: 'Rp50.000',
    oldPrice: 'Rp100.000',
    discountPct: 50,
    type: 'E-Book',
    authorImage: 'https://i.pravatar.cc/100?img=25',
    authorName: 'Sarah Johnson',
    lists: ['Guitar', 'Vocal'],
    location: 'Depok',
    rating: { value: 5, totalReviews: 67 },
  },
  {
    id: 3,
    uuid: 'mod-003',
    title: 'Musik Itu Gampang',
    image: '/assets/images/modul.png',
    price: 'Rp50.000',
    oldPrice: 'Rp100.000',
    discountPct: 50,
    type: 'Video',
    authorImage: 'https://i.pravatar.cc/100?img=26',
    authorName: 'Ravi Kumar',
    lists: ['Guitar', 'Vocal', 'Bass'],
    location: 'Depok',
    rating: { value: 5, totalReviews: 67 },
  },
  {
    id: 4,
    uuid: 'mod-004',
    title: 'Musik Itu Gampang',
    image: '/assets/images/modul.png',
    price: 'Rp50.000',
    oldPrice: 'Rp100.000',
    discountPct: 50,
    type: 'E-Book',
    authorImage: 'https://i.pravatar.cc/100?img=27',
    authorName: 'Maria Garcia',
    lists: ['Guitar', 'Vocal', 'Bass'],
    location: 'Depok',
    rating: { value: 5, totalReviews: 67 },
  },
];

export const moduleDoubled: ModuleItem[] = [
  ...modules,
  ...modules.map((m, i) => ({ ...m, uuid: `mod-d-${i + 1}` })),
];

/* ===================== TEACHERS ===================== */
export type CertificateType = 'ABRSM' | 'Rockschool' | 'none';

export type TeacherItem = {
  id: number;
  uuid: string;
  title: string;
  image: string;
  lists: string[];
  location: string;
  rating: { value: number; totalReviews: number };
  certificate: CertificateType;     // ⬅️ baru
  abk_specialized: boolean;         // ⬅️ baru
};

export const teachers: TeacherItem[] = [
  {
    id: 1,
    uuid: "teach-001",
    title: "Mohammed Mohammed",
    image: "https://i.pravatar.cc/100?img=6",
    lists: ["Guitar", "Vocal", "Piano"],
    location: "Depok",
    rating: { value: 5, totalReviews: 67 },
    certificate: 'ABRSM',
    abk_specialized: true,
  },
  {
    id: 2,
    uuid: "teach-002",
    title: "Bence Borg",
    image: "https://i.pravatar.cc/100?img=7",
    lists: ["Guitar", "Vocal"],
    location: "Depok",
    rating: { value: 5, totalReviews: 67 },
    certificate: 'Rockschool',
    abk_specialized: false,
  },
  {
    id: 3,
    uuid: "teach-003",
    title: "Divya Singh",
    image: "https://i.pravatar.cc/100?img=8",
    lists: ["Guitar", "Vocal", "Bass"],
    location: "Depok",
    rating: { value: 5, totalReviews: 67 },
    certificate: 'none',
    abk_specialized: true,
  },
  {
    id: 4,
    uuid: "teach-004",
    title: "Alejandro González",
    image: "https://i.pravatar.cc/100?img=9",
    lists: ["Guitar", "Vocal", "Bass"],
    location: "Depok",
    rating: { value: 5, totalReviews: 67 },
    certificate: 'ABRSM',
    abk_specialized: false,
  },
];

export const teachersDoubled: TeacherItem[] = [
  ...teachers,
  ...teachers.map((t, i) => ({ ...t, uuid: `teach-d-${i + 1}` })),
];

/* (teachersHero / students tetap seperti sebelumnya) */
export const teachersHero = [
  {
    id: 1,
    uuid: "hero-001",
    title: "Mohammed Mohammed",
    image: "https://i.pravatar.cc/100?img=10",
    lists: ["Guitar", "Vocal", "Piano"],
    rating: { value: 5, totalReviews: 67 },
  },
  {
    id: 2,
    uuid: "hero-002",
    title: "Bence Borg",
    image: "https://i.pravatar.cc/100?img=11",
    lists: ["Guitar", "Vocal"],
    rating: { value: 5, totalReviews: 67 },
  },
  {
    id: 3,
    uuid: "hero-003",
    title: "Divya Singh",
    image: "https://i.pravatar.cc/100?img=12",
    lists: ["Guitar", "Vocal", "Bass"],
    rating: { value: 5, totalReviews: 67 },
  },
  {
    id: 4,
    uuid: "hero-004",
    title: "Alejandro González",
    image: "https://i.pravatar.cc/100?img=13",
    lists: ["Guitar", "Vocal", "Bass"],
    rating: { value: 5, totalReviews: 67 },
  },
];

/* students … (tanpa perubahan) */
export const students = [
  { id: 1, uuid: 'stu-001', name: 'Isabella Fernández', orders: 10, package: 'Paket Semesteran', status: 'Aktif', img: 'https://i.pravatar.cc/100?img=1' },
  { id: 2, uuid: 'stu-002', name: 'Susan Taylor', orders: 10, package: 'Paket Reguler', status: 'Non-Aktif', img: 'https://i.pravatar.cc/100?img=2' },
  { id: 3, uuid: 'stu-003', name: 'Kenneth Brown', orders: 10, package: 'Paket Bulanan', status: 'Aktif', img: 'https://i.pravatar.cc/100?img=3' },
  { id: 4, uuid: 'stu-004', name: '加藤 健一', orders: 10, package: 'Paket Tahunan', status: 'Aktif', img: 'https://i.pravatar.cc/100?img=4' },
  { id: 5, uuid: 'stu-005', name: 'Sam Lau', orders: 10, package: 'Paket Reguler', status: 'Cuti', img: 'https://i.pravatar.cc/100?img=5' },
];

export const studentsDoubled = [
  ...students,
  ...students.map((s, i) => ({ ...s, uuid: `stu-d-${i + 1}` })),
];

export const studentPackages = [
  {
    id: 1,
    uuid: "pkg-001",
    studentUuid: "stu-001",
    categoryMusic: "piano",
    name: "Reguler",
    price: "Rp 5.999.000",
    date: "25 Mar 2025",
    schedule: "Setiap Kamis | 14.00 - 14.45",
    session: "5/12",
    estimation: "Rp. 2.100.000",
    commition: "Rp. 875.000",
    status: "On Going",
    rating: null,
  },
  {
    id: 2,
    uuid: "pkg-002",
    studentUuid: "stu-002",
    categoryMusic: "biola",
    name: "Internasional",
    price: "Rp 250.000",
    date: "25 Mar 2025",
    schedule: "Setiap Kamis | 14.00 - 14.45",
    session: "5/12",
    estimation: "Rp. 2.100.000",
    commition: "Rp. 875.000",
    status: "Finished",
    rating: null,
  },
  {
    id: 3,
    uuid: "pkg-003",
    studentUuid: "stu-003",
    categoryMusic: "vocal",
    name: "ABK",
    price: "Rp 1.000.000",
    date: "25 Mar 2025",
    schedule: "Setiap Kamis | 14.00 - 14.45",
    session: "5/12",
    estimation: "Rp. 2.100.000",
    commition: "Rp. 875.000",
    status: "Finished",
    rating: "4.75/5",
  },
  {
    id: 4,
    uuid: "pkg-004",
    studentUuid: "stu-004",
    categoryMusic: "guitar",
    name: "Hobby",
    price: "Rp 12.900.000",
    date: "25 Mar 2025",
    schedule: "Setiap Kamis | 14.00 - 14.45",
    session: "5/12",
    estimation: "Rp. 2.100.000",
    commition: "Rp. 875.000",
    status: "Finished",
    rating: "4.75/5",
  },
  {
    id: 5,
    uuid: "pkg-005",
    studentUuid: "stu-005",
    categoryMusic: "keyboard",
    name: "Reguler",
    price: "Rp 250.000",
    date: "25 Mar 2025",
    schedule: "Setiap Kamis | 14.00 - 14.45",
    session: "5/12",
    estimation: "Rp. 2.100.000",
    commition: "Rp. 875.000",
    status: "Finished",
    rating: "4.75/5",
  },
  {
    id: 6,
    uuid: "pkg-002",
    studentUuid: "stu-002",
    categoryMusic: "piano",
    name: "Reguler",
    price: "Rp 250.000",
    date: "25 Mar 2025",
    schedule: "Setiap Kamis | 14.00 - 14.45",
    session: "5/12",
    estimation: "Rp. 2.100.000",
    commition: "Rp. 875.000",
    status: "Finished",
    rating: "4.41/5",
  },
];

export const schedulePackages = [
  {
    id: 1,
    uuid: "scd-001",
    packageUuid: "pkg-001",
    session: "1",
    date: "25 Mar 2025",
    startClock: "13.00",
    endClock: "13.45",
    status: "Selesai Tepat Waktu",
  },
  {
    id: 2,
    uuid: "scd-002",
    packageUuid: "pkg-002",
    session: "1",
    date: "25 Mar 2025",
    startClock: "13.00",
    endClock: "13.45",
    status: "Belum Selesai",
  },
  {
    id: 3,
    uuid: "scd-003",
    packageUuid: "pkg-003",
    session: "1",
    date: "25 Mar 2025",
    startClock: "13.00",
    endClock: "13.45",
    status: "Selesai Terlambat",
  },
  {
    id: 4,
    uuid: "scd-004",
    packageUuid: "pkg-004",
    session: "1",
    date: "25 Mar 2025",
    startClock: "13.00",
    endClock: "13.45",
    status: "Dialihkan Ke Guru Lain",
  },
  {
    id: 5,
    uuid: "scd-005",
    packageUuid: "pkg-001",
    session: "2",
    date: "25 Mar 2025",
    startClock: "13.00",
    endClock: "13.45",
    status: "Belum Selesai",
  },
];

/* ===================== HISTORY / WEEKLY (GURU) ===================== */

export type HistoryStatus = "Kelas Selesai" | "Absen Akhir" | "Belum Dimulai";

export type SessionItem = {
  name: string;
  program: string;
  package: string;
  time: string;
  location: string;
  image: string;
  instrument: string;
  status: HistoryStatus;
};

export type DayBlock = {
  date: string; // YYYY-MM-DD
  sessions: SessionItem[];
};

// helpers
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const avatar = (n: number) => `https://i.pravatar.cc/100?img=${n}`;

// ========= HISTORY (H-1 & sebelumnya) =========
export const historyDays: DayBlock[] = (() => {
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1)); // H-1, H-2, ...

    const sessions: SessionItem[] = [
      {
        name: "Carlos Álvarez",
        program: "Reguler",
        package: "Paket Reguler",
        time: "13.00 - 13.45",
        location: `Jl. Musik No.${i + 3}, Jakarta`,
        image: avatar(12 + i),
        instrument: i % 2 ? "piano" : "vocal",
        status: i % 3 === 0 ? "Kelas Selesai" : i % 3 === 1 ? "Absen Akhir" : "Belum Dimulai",
      },
      {
        name: "Abhishek Ansari",
        program: "Internasional",
        package: "Paket Bulanan",
        time: "14.00 - 14.45",
        location: `Jl. Harmoni No.${i + 5}, Jakarta`,
        image: avatar(18 + i),
        instrument: "saxophone",
        status: i % 2 ? "Kelas Selesai" : "Absen Akhir",
      },
    ];

    if (i % 2 === 0) {
      sessions.push({
        name: "Muhammed Khoury",
        program: "ABK",
        package: "Paket Semesteran",
        time: "15.00 - 15.45",
        location: `Jl. Nada No.${i + 7}, Jakarta`,
        image: avatar(24 + i),
        instrument: "piano",
        status: "Kelas Selesai",
      });
    }

    return { date: fmt(d), sessions };
  }).sort((a, b) => a.date.localeCompare(b.date));
})();

// ========= WEEKLY (hari ini & 6 hari ke depan) =========
export const dashboardWeek: DayBlock[] = (() => {
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i); // today .. +6

    const sessions: SessionItem[] = [
      {
        name: "Carlos Álvarez",
        program: "Hobby",
        package: "Paket Bulanan",
        time: "13.00 - 13.45",
        location: `Jl. Musik No.${i + 1}, Jakarta`,
        image: avatar(30 + i),
        instrument: "piano",
        status: i === 0 ? "Belum Dimulai" : "Belum Dimulai",
      },
      {
        name: "Muhammed Khoury",
        program: "Reguler",
        package: "Paket Semesteran",
        time: "13.00 - 13.45",
        location: `Jl. Musik No.${i + 2}, Jakarta`,
        image: avatar(40 + i),
        instrument: "piano",
        status: "Absen Akhir",
      },
    ];

    if (i === 0) {
      sessions.unshift({
        name: "Carlos Álvarez",
        program: "Internasional",
        package: "Paket Reguler",
        time: "10.00 - 10.45",
        location: `Jl. Harmoni No.${i + 9}, Jakarta`,
        image: avatar(50 + i),
        instrument: "vocal",
        status: "Kelas Selesai",
      });
    }

    return { date: fmt(d), sessions };
  });
})();

/* ===================== TABLES / EARNINGS ===================== */

export type ModuleHistory = {
  uuid: string;
  image: string;    // cover modul
  title: string;    // nama modul
  type: "E-Book" | "Video";
  price: string;
  buyer: string;    // pembeli
  date: string;     // dd/MM/yyyy
  status: "Success" | "Pending" | "Failed" | string;
};

export const earningsModuleHistoryTable: ModuleHistory[] = [
  {
    uuid: "mh-001",
    image: "/assets/images/modul.png",
    title: "Musik Itu Mudah",
    type: "E-Book",
    price: "Rp 250.000",
    buyer: "Dicka Taksa",
    date: "01/08/2025",
    status: "Pending",
  },
  {
    uuid: "mh-002",
    image: "/assets/images/modul.png",
    title: "Musik Itu Mudah",
    type: "Video",
    price: "Rp 250.000",
    buyer: "Dicka Taksa",
    date: "01/08/2025",
    status: "Success",
  },
  {
    uuid: "mh-003",
    image: "/assets/images/modul.png",
    title: "Musik Itu Mudah",
    type: "Video",
    price: "Rp 250.000",
    buyer: "Dicka Taksa",
    date: "01/08/2025",
    status: "Success",
  },
  {
    uuid: "mh-004",
    image: "/assets/images/modul.png",
    title: "Musik Itu Mudah",
    type: "E-Book",
    price: "Rp 250.000",
    buyer: "Dicka Taksa",
    date: "01/08/2025",
    status: "Success",
  },

  // tambahan biar ada bahan paginate
  {
    uuid: "mh-005",
    image: "/assets/images/modul.png",
    title: "Teori Musik Dasar",
    type: "E-Book",
    price: "Rp 199.000",
    buyer: "Rani Putri",
    date: "28/07/2025",
    status: "Success",
  },
  {
    uuid: "mh-006",
    image: "/assets/images/modul.png",
    title: "Gitar Akustik Untuk Pemula",
    type: "Video",
    price: "Rp 149.000",
    buyer: "Arif Pratama",
    date: "27/07/2025",
    status: "Pending",
  },
  {
    uuid: "mh-007",
    image: "/assets/images/modul.png",
    title: "Melodi & Harmoni Lanjutan",
    type: "E-Book",
    price: "Rp 299.000",
    buyer: "Maya Sari",
    date: "25/07/2025",
    status: "Success",
  },
  {
    uuid: "mh-008",
    image: "/assets/images/modul.png",
    title: "Improvisasi Blues",
    type: "Video",
    price: "Rp 179.000",
    buyer: "Yoga Rahman",
    date: "22/07/2025",
    status: "Failed",
  },
  {
    uuid: "mh-009",
    image: "/assets/images/modul.png",
    title: "Teknik Vokal Dasar",
    type: "Video",
    price: "Rp 220.000",
    buyer: "Sinta Dewi",
    date: "20/07/2025",
    status: "Success",
  },
  {
    uuid: "mh-010",
    image: "/assets/images/modul.png",
    title: "Drum Groove Seru",
    type: "E-Book",
    price: "Rp 210.000",
    buyer: "Rizky Ananda",
    date: "18/07/2025",
    status: "Success",
  },
];

export const modulesTable = [
  {
    id: 1,
    uuid: "mod-001",
    title: "Isabella Fernández",
    image: "/assets/images/modul.png",
    price: "Rp 100.000",
    sold: 19,
    type: "Video",
    status: "Aktif",
  },
  {
    id: 2,
    uuid: "mod-002",
    title: "Susan Taylor",
    image: "/assets/images/modul.png",
    price: "Rp 100.000",
    sold: 19,
    type: "E-Book",
    status: "Non-Aktif",
  },
  {
    id: 3,
    uuid: "mod-003",
    title: "Kenneth Brown",
    image: "/assets/images/modul.png",
    price: "Rp 100.000",
    sold: 19,
    type: "E-Book",
    status: "Aktif",
  },
  {
    id: 4,
    uuid: "mod-004",
    title: "加藤 健一",
    image: "/assets/images/modul.png",
    price: "Rp 100.000",
    sold: 19,
    type: "E-Book",
    status: "Aktif",
  },
  {
    id: 5,
    uuid: "mod-005",
    title: "Sam Lau",
    image: "/assets/images/modul.png",
    price: "Rp 100.000",
    sold: 19,
    type: "Video",
    status: "Diperiksa Admin",
  },
];

export const earningsClassTable = [
  {
    id: 1,
    uuid: "mod-001",
    title: "Isabella Fernández",
    image: "https://i.pravatar.cc/100?img=17",
    price: "Rp 100.000",
    sold: 19,
    type: "Video",
    status: "On Progress",
    instrument: "piano",
    session: "5/12",
    program: "Reguler",
    package: "Paket Semesteran",
    date: "2025/08/01",
    commision: "Rp 250.000",
  },
  {
    id: 2,
    uuid: "mod-002",
    title: "Susan Taylor",
    image: "https://i.pravatar.cc/100?img=18",
    price: "Rp 100.000",
    sold: 15,
    type: "E-Book",
    status: "On Progress",
    instrument: "guitar",
    session: "8/12",
    program: "ABK",
    package: "Paket Bulanan",
    date: "2025/07/25",
    commision: "Rp 250.000",
  },
  {
    id: 3,
    uuid: "mod-003",
    title: "Kenneth Brown",
    image: "https://i.pravatar.cc/100?img=19",
    price: "Rp 100.000",
    sold: 25,
    type: "E-Book",
    status: "Success",
    instrument: "drum",
    session: "10/12",
    program: "Internasional",
    package: "Paket Tahunan",
    date: "2025/06/18",
    commision: "Rp 250.000",
  },
  {
    id: 4,
    uuid: "mod-004",
    title: "加藤 健一",
    image: "https://i.pravatar.cc/100?img=20",
    price: "Rp 100.000",
    sold: 12,
    type: "E-Book",
    status: "Success",
    instrument: "biola",
    session: "7/12",
    program: "Reguler",
    package: "Paket Semesteran",
    date: "2025/05/09",
    commision: "Rp 250.000",
  },
  {
    id: 5,
    uuid: "mod-005",
    title: "Sam Lau",
    image: "https://i.pravatar.cc/100?img=21",
    price: "Rp 100.000",
    sold: 22,
    type: "Video",
    status: "On Progress",
    instrument: "vocal",
    session: "6/12",
    program: "Hobby",
    package: "Paket Semesteran",
    date: "2025/04/29",
    commision: "Rp 250.000",
  },
  {
    id: 6,
    uuid: "mod-005",
    title: "Sam Lau",
    image: "https://i.pravatar.cc/100?img=21",
    price: "Rp 100.000",
    sold: 22,
    type: "Video",
    status: "On Progress",
    instrument: "vocal",
    session: "6/12",
    program: "Hobby",
    package: "Paket Semesteran",
    date: "2025/04/29",
    commision: "Rp 250.000",
  },
  {
    id: 7,
    uuid: "mod-005",
    title: "Sam Lau",
    image: "https://i.pravatar.cc/100?img=21",
    price: "Rp 100.000",
    sold: 22,
    type: "Video",
    status: "On Progress",
    instrument: "vocal",
    session: "6/12",
    program: "Hobby",
    package: "Paket Semesteran",
    date: "2025/04/29",
    commision: "Rp 250.000",
  },
];

export const earningsModuleTable = [
  {
    id: 1,
    uuid: "mod-001",
    image: "/assets/images/modul.png",
    price: "Rp 100.000",
    sold: 19,
    type: "Video",
    status: "Success",
    title: "Musik Itu Mudah",
    instrument: "piano",
    income: "Rp 250.000",
    buyer: "Dicka Taksa",
    date: "01/08/2025",
  },
];

/* ===================== PROFILE (EXAMPLE) ===================== */

export const profileUser = {
  username: "Agrieva Xananda Pramuditha",
  package: "Reguler",
  imageProfile: "/assets/images/teacher-demo.png",
  instrument: "piano",
  day: "Kamis",
  timeStart: "14.00",
  timeEnd: "14.45",
  session: 25,
};

/* ===================== DASHBOARD MURID: PACKAGES & SESSIONS ===================== */
/* Paket per user lengkap dengan progres sesi + ringkasan total */

export type PackageType = "Reguler" | "Internasional" | "ABK" | "Hobby";

export type UserPackage = {
  id: number;
  uuid: string; // ex: upkg-001
  name: PackageType;
  instrument: string; // piano | guitar | vocal | ...
  teacher: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  sessionsTotal: number;
  sessionsDone: number;
  sessionLabel: string; // "x/y"
  schedule: { day: string; startClock: string; endClock: string };
  price: string;
  status: "On Going" | "Finished" | "Paused";
  rating?: string | null;
};

const sessionStr = (done: number, total: number) => `${done}/${total}`;

export const dashboardUserPackages: UserPackage[] = [
  {
    id: 1,
    uuid: "upkg-001",
    name: "Reguler",
    instrument: "piano",
    teacher: "Budi Santoso",
    location: "Jakarta Timur",
    startDate: "2025-08-01",
    endDate: "2025-10-31",
    sessionsTotal: 12,
    sessionsDone: 5,
    sessionLabel: sessionStr(5, 12),
    schedule: { day: "Kamis", startClock: "14.00", endClock: "14.45" },
    price: "Rp 5.999.000",
    status: "On Going",
    rating: null,
  },
  {
    id: 2,
    uuid: "upkg-002",
    name: "Internasional",
    instrument: "vocal",
    teacher: "Rina Putri",
    location: "Jakarta Selatan",
    startDate: "2025-06-10",
    endDate: "2025-08-05",
    sessionsTotal: 8,
    sessionsDone: 8,
    sessionLabel: sessionStr(8, 8),
    schedule: { day: "Selasa", startClock: "10.00", endClock: "10.45" },
    price: "Rp 2.499.000",
    status: "Finished",
    rating: "4.8/5",
  },
  {
    id: 3,
    uuid: "upkg-003",
    name: "Hobby",
    instrument: "guitar",
    teacher: "Andi Saputra",
    location: "Depok",
    startDate: "2025-08-20",
    endDate: "2025-09-30",
    sessionsTotal: 4,
    sessionsDone: 1,
    sessionLabel: sessionStr(1, 4),
    schedule: { day: "Sabtu", startClock: "16.00", endClock: "16.45" },
    price: "Rp 899.000",
    status: "On Going",
    rating: null,
  },
  {
    id: 4,
    uuid: "upkg-004",
    name: "ABK",
    instrument: "drum",
    teacher: "Satria W.",
    location: "Jakarta Pusat",
    startDate: "2025-08-05",
    endDate: "2025-11-05",
    sessionsTotal: 12,
    sessionsDone: 3,
    sessionLabel: sessionStr(3, 12),
    schedule: { day: "Senin", startClock: "09.00", endClock: "09.45" },
    price: "Rp 9.999.000",
    status: "Paused",
    rating: null,
  },
];

export const dashboardUserSchedules = [
  // contoh untuk upkg-001 (Reguler – piano)
  { id: 1, uuid: "uscd-001", packageUuid: "upkg-001", session: "1", date: "2025-08-07", startClock: "14.00", endClock: "14.45", status: "Selesai" },
  { id: 2, uuid: "uscd-002", packageUuid: "upkg-001", session: "2", date: "2025-08-14", startClock: "14.00", endClock: "14.45", status: "Selesai" },
  { id: 3, uuid: "uscd-003", packageUuid: "upkg-001", session: "3", date: "2025-08-21", startClock: "14.00", endClock: "14.45", status: "Selesai" },
  { id: 4, uuid: "uscd-004", packageUuid: "upkg-001", session: "4", date: "2025-08-28", startClock: "14.00", endClock: "14.45", status: "Selesai" },
  { id: 5, uuid: "uscd-005", packageUuid: "upkg-001", session: "5", date: "2025-09-04", startClock: "14.00", endClock: "14.45", status: "Selesai" },
  { id: 6, uuid: "uscd-006", packageUuid: "upkg-001", session: "6", date: "2025-09-11", startClock: "14.00", endClock: "14.45", status: "Terjadwal" },

  // contoh untuk upkg-002 (Internasional – vocal) semua selesai (potong)
  { id: 7, uuid: "uscd-007", packageUuid: "upkg-002", session: "1", date: "2025-06-11", startClock: "10.00", endClock: "10.45", status: "Selesai" },
];

export const dashboardUserPackageStats = (() => {
  const totals = dashboardUserPackages.reduce(
    (acc, p) => {
      acc.totalPackages += 1;
      acc.sessions.total += p.sessionsTotal;
      acc.sessions.done += p.sessionsDone;
      acc.byType[p.name as PackageType] = (acc.byType[p.name as PackageType] ?? 0) + 1;
      return acc;
    },
    {
      totalPackages: 0,
      sessions: { total: 0, done: 0, left: 0 },
      byType: {} as Record<PackageType, number>,
    }
  );
  totals.sessions.left = Math.max(0, totals.sessions.total - totals.sessions.done);
  return totals;
})();

export const getUserPackageProgress = (pkgUuid: string) => {
  const pkg = dashboardUserPackages.find((p) => p.uuid === pkgUuid);
  if (!pkg) return { done: 0, total: 0, left: 0, label: "0/0" };
  const left = Math.max(0, pkg.sessionsTotal - pkg.sessionsDone);
  return {
    done: pkg.sessionsDone,
    total: pkg.sessionsTotal,
    left,
    label: sessionStr(pkg.sessionsDone, pkg.sessionsTotal),
  };
};

/* ===================== DASHBOARD MURID: WEEKLY & HISTORY (SESI) ===================== */

export type UserClassStatus =
  | "Belum Dimulai"
  | "Kelas Dimulai"
  | "Kelas Selesai"
  | "Re-Schedule"
  | "Ganti Guru";

export type UserSessionItem = {
  name: string;
  program: string;
  package: string;
  time: string; // "HH.mm - HH.mm"
  location: string;
  image: string; // avatar url
  instrument: string; // piano | guitar | vocal | dll
  status: UserClassStatus;
  meta?: {
    rescheduleFrom?: string;
    rescheduleTo?: string;
    reason?: string;
    oldTeacher?: string;
    newTeacher?: string;
  };
};

export type UserDayBlock = {
  date: string; // YYYY-MM-DD
  sessions: UserSessionItem[];
};

export const dashboardUserWeek: UserDayBlock[] = (() => {
  const today = new Date();
  const WEEKS_AHEAD = 12;
  const totalDays = WEEKS_AHEAD * 7;

  const cycle: UserClassStatus[] = [
    "Belum Dimulai",
    "Kelas Dimulai",
    "Kelas Selesai",
    "Re-Schedule",
    "Ganti Guru",
  ];

  const spreadOrder = [0, 2, 4, 6, 1, 3, 5];

  const roster = [
    { name: "Isabella Fernándezol", instrument: "piano" },
    { name: "Susan Tayloriss", instrument: "vocal" },
    { name: "Kenneth Brownis", instrument: "guitar" },
    { name: "Alejandro Gonzálezda", instrument: "biola" },
    { name: "Divya Singhah", instrument: "drum" },
  ];

  const out: UserDayBlock[] = [];

  for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
    const d = new Date(today);
    d.setDate(d.getDate() + dayIdx);

    const weekIndex = Math.floor(dayIdx / 7);
    const dayOfWeek = dayIdx % 7;

    const weeklyQuota = 3 + ((today.getDate() + weekIndex) % 3); // 3,4,5
    const activeDaysArr = spreadOrder.slice(0, weeklyQuota);
    const isActiveDay = activeDaysArr.includes(dayOfWeek);

    let sessions: UserSessionItem[] = [];

    if (isActiveDay) {
      const baseStatusIndex = (dayOfWeek + weekIndex) % cycle.length;
      const status: UserClassStatus = dayIdx === 0 ? "Kelas Dimulai" : cycle[baseStatusIndex];

      const r = roster[(weekIndex + dayOfWeek) % roster.length];

      const imgSeed = 30 + ((weekIndex * 7 + dayOfWeek) % 50);
      const locNo = (weekIndex + 1) * 10 + (dayOfWeek + 1);

      const item: UserSessionItem = {
        name: r.name,
        program: dayOfWeek % 2 ? "Reguler" : "Hobby",
        package: "Paket Bulanan",
        time: "13.00 - 13.45",
        location: `Jl. Musik No.${locNo}, Jakarta`,
        image: avatar(imgSeed),
        instrument: r.instrument,
        status,
      };

      if (status === "Re-Schedule") {
        item.meta = {
          rescheduleFrom: "13.00 - 13.45",
          rescheduleTo: "16.00 - 16.45",
          reason: "Bentrok jadwal",
        };
        item.time = "16.00 - 16.45";
      }
      if (status === "Ganti Guru") {
        item.meta = {
          oldTeacher: "Budi Santoso",
          newTeacher: "Rina Putri",
          reason: "Guru berhalangan",
        };
      }

      sessions = [item];
    }

    out.push({ date: fmt(d), sessions });
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
})();

export const dashboardUserHistory: UserDayBlock[] = (() => {
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1)); // H-1, H-2, ...

    const sessions: UserSessionItem[] = [
      {
        name: "Alejandro Gonzálezda",
        program: "Reguler",
        package: "Paket Bulanan",
        time: "10.00 - 10.45",
        location: `Jl. Senar No.${i + 5}, Jakarta`,
        image: avatar(60 + i),
        instrument: i % 2 ? "piano" : "vocal",
        status: "Kelas Selesai",
      },
      {
        name: "Divya Singhah",
        program: "Hobby",
        package: "Paket Reguler",
        time: "11.00 - 11.45",
        location: `Jl. Ritme No.${i + 7}, Jakarta`,
        image: avatar(65 + i),
        instrument: i % 3 ? "guitar" : "biola",
        status: "Kelas Selesai",
      },
    ];

    if (i % 2 === 0) {
      sessions.push({
        name: "Mohammed Mohammedul",
        program: "Internasional",
        package: "Paket Semesteran",
        time: "12.00 - 12.45",
        location: `Jl. Melodi No.${i + 9}, Jakarta`,
        image: avatar(70 + i),
        instrument: "saxophone",
        status: "Kelas Selesai",
      });
    }

    return { date: fmt(d), sessions };
  }).sort((a, b) => a.date.localeCompare(b.date));
})();


/* ===================== NOTIFICATIONS (DUMMY) ===================== */
/* ===================== NOTIFICATIONS (DUMMY) ===================== */
export const notifications: TNotifItem[] = [
  {
    id: 1,
    kind: "reschedule_request",
    studentName: "Nama Murid",
    message:
      "<Nama Murid> Anda mengajukan jadwal baru: Selasa, 3 September 2025 pukul 16.00 WIB.",
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: "/dashboard-guru/schedule/detail/req-1",
  },
  {
    id: 2,
    kind: "reschedule_rejected",
    studentName: "Nama Murid",
    message:
      "<Nama Murid> nggak bisa ganti ke jadwal baru yang kamu ajukan. Yuk pilih waktu lain biar tetap bisa lanjut les.",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    actionUrl: "/dashboard-guru/schedule/detail/rej-2",
  },
  {
    id: 3,
    kind: "reschedule_approved",
    studentName: "Nama Murid",
    message:
      "<Nama Murid> udah okein jadwal barumu. Jangan lupa cek detailnya biar nggak kelewatan.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    actionUrl: "/dashboard-guru/schedule/detail/app-3",
  },
  {
    id: 4,
    kind: "general",
    title: "Judul Notifikasi",
    message:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum mollis nunc a molestie dictum. Mauris venenatis, felis scelerisque aliquet lacinia, nulla nisi venenatis odio, id blandit mauris ipsum id sapien.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: 5,
    kind: "general",
    title: "Judul Notifikasi",
    message:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum mollis nunc a molestie dictum. Mauris venenatis, felis scelerisque aliquet lacinia, nulla nisi venenatis odio, id blandit mauris ipsum id sapien.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
  },
];

// DUMMY DATA ADMIN

export type VerifiedTutorRow = {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  city: string;
  date: string;           // DD/MM/YYYY
  instrument: string;     // ex: 'piano' | 'guitar' | ...
  image: string;          // avatar url
  status?: 'pending' | 'approved' | 'rejected';
};

export type AdminPageDummy = {
  verifiedTutors: VerifiedTutorRow[];
};

// const avatar = (n: number) => `https://i.pravatar.cc/100?img=${n}`;

export const adminPageDummy: AdminPageDummy = {
  verifiedTutors: [
    {
      id: 1,
      uuid: 'vteach-001',
      name: 'Isabella Fernández',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'piano',
      image: avatar(15),
      status: 'pending',
    },
    {
      id: 2,
      uuid: 'vteach-002',
      name: 'Ventela Aciatica',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'guitar',
      image: avatar(16),
      status: 'pending',
    },
    {
      id: 3,
      uuid: 'vteach-003',
      name: 'Fernando Gonzales',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'saxophone',
      image: avatar(17),
      status: 'approved',
    },
    {
      id: 4,
      uuid: 'vteach-004',
      name: 'Crezy Blitar',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'vocal',
      image: avatar(18),
      status: 'pending',
    },
    {
      id: 5,
      uuid: 'vteach-005',
      name: 'Dew`a Kuipas',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'bass',
      image: avatar(19),
      status: 'rejected',
    },
    // tambahkan lagi jika mau banyak halaman
    {
      id: 6,
      uuid: 'vteach-006',
      name: 'Rey Asynchronous',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'vocal',
      image: avatar(20),
      status: 'pending',
    },
    {
      id: 7,
      uuid: 'vteach-007',
      name: 'Kisame Hoshigaki',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'piano',
      image: avatar(21),
      status: 'pending',
    },
    {
      id: 8,
      uuid: 'vteach-008',
      name: 'Isabella Fernández',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'piano',
      image: avatar(22),
      status: 'pending',
    },
    {
      id: 9,
      uuid: 'vteach-009',
      name: 'Isabella Fernández',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'piano',
      image: avatar(23),
      status: 'pending',
    },
    {
      id: 10,
      uuid: 'vteach-010',
      name: 'Isabella Fernández',
      phone: '+62-813-8887-6690',
      city: 'Kota Depok',
      date: '12/09/2025',
      instrument: 'piano',
      image: avatar(24),
      status: 'pending',
    },
  ],
};

/* ===================== ADMIN TUTOR LIST (DUMMY) ===================== */
/* ===============  ADMIN TUTOR LIST  =============== */

export type AdminTutorStatus = 'Aktif' | 'Non-Aktif' | 'Cuti';

export type AdminTutorRow = {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  city: string;
  status: AdminTutorStatus;
  rating: number;      // ex: 4.75
  image: string;       // avatar url
};

export type AdminTutorList = {
  recap: { active: number; inactive: number; onLeave: number };
  cities: string[];
  statuses: AdminTutorStatus[];
  tutors: AdminTutorRow[];
};

export const ADMIN_TUTOR_LIST: AdminTutorList = {
  recap: { active: 300, inactive: 100, onLeave: 16 },
  cities: ['Kota Depok', 'Kota Jakarta', 'Kota Bogor', 'Kota Bekasi', 'Kota Tangerang'],
  statuses: ['Aktif', 'Non-Aktif', 'Cuti'],
  tutors: [
    { id: 1,  uuid: 'atl-001', name: 'Isabella Fernández',  phone: '+62-813-8887-6690', city: 'Kota Depok',    status: 'Aktif',     rating: 4.75, image: avatar(31) },
    { id: 2,  uuid: 'atl-002', name: 'Ventela Aciatica',    phone: '+62-813-8887-6690', city: 'Kota Depok',    status: 'Non-Aktif', rating: 4.75, image: avatar(32) },
    { id: 3,  uuid: 'atl-003', name: 'Fernando Gonzales',   phone: '+62-813-8887-6690', city: 'Kota Depok',    status: 'Aktif',     rating: 4.62, image: avatar(33) },
    { id: 4,  uuid: 'atl-004', name: 'Crezy Blitar',        phone: '+62-813-8887-6690', city: 'Kota Depok',    status: 'Aktif',     rating: 4.81, image: avatar(34) },
    { id: 5,  uuid: 'atl-005', name: 'Dewa Kuipas',         phone: '+62-813-8887-6690', city: 'Kota Depok',    status: 'Cuti',      rating: 4.75, image: avatar(35) },
    { id: 6,  uuid: 'atl-006', name: 'Rey Asynchronous',    phone: '+62-813-8887-6690', city: 'Kota Jakarta',  status: 'Aktif',     rating: 3.92, image: avatar(36) },
    { id: 7,  uuid: 'atl-007', name: 'Kisame Hoshigaki',    phone: '+62-813-8887-6690', city: 'Kota Bogor',    status: 'Non-Aktif', rating: 4.12, image: avatar(37) },
    { id: 8,  uuid: 'atl-008', name: 'Rani Putri',          phone: '+62-813-8887-6690', city: 'Kota Bekasi',   status: 'Aktif',     rating: 4.90, image: avatar(38) },
    { id: 9,  uuid: 'atl-009', name: 'Yoga Rahman',         phone: '+62-813-8887-6690', city: 'Kota Tangerang',status: 'Aktif',     rating: 4.33, image: avatar(39) },
    { id:10,  uuid: 'atl-010', name: 'Sinta Dewi',          phone: '+62-813-8887-6690', city: 'Kota Depok',    status: 'Cuti',      rating: 4.01, image: avatar(40) },
    { id:11,  uuid: 'atl-011', name: 'Rizky Ananda',        phone: '+62-813-8887-6690', city: 'Kota Jakarta',  status: 'Aktif',     rating: 4.75, image: avatar(41) },
    { id:12,  uuid: 'atl-012', name: 'Arif Pratama',        phone: '+62-813-8887-6690', city: 'Kota Depok',    status: 'Non-Aktif', rating: 3.77, image: avatar(42) },
  ],
};

/* ===================== ADMIN: PROFILE TUTOR (STUDENTS LIST) ===================== */

export type TutorStudentRow = {
  id: string;
  name: string;
  instrument: string;      // ex: "Piano"
  schedule: string;        // ex: "Setiap Kamis | 14.00 - 14.45"
  session: string;         // ex: "5/12"
  rating?: number;         // undefined => "-"
  avatar: string;          // url
  program: string;        // badge kecil "ABK"
};

export type AdminTutorProfileDummy = {
  tutorUuid: string;       // utk nanti kalau mau ambil by tutor
  students: TutorStudentRow[];
};

export const ADMIN_TUTOR_PROFILE: AdminTutorProfileDummy = {
  tutorUuid: 'atl-001',
  students: [
    {
      id: 's-1',
      name: 'Kevin Harris',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: undefined,
      avatar: avatar(48),
      program: "ABK",
    },
    {
      id: 's-2',
      name: 'João Horvath',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: 4.5,
      avatar: avatar(49),
      program: "ABK",
    },
    {
      id: 's-3',
      name: '加藤 健一',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: 4.5,
      avatar: avatar(50),
      program: "Reguler",
    },
    {
      id: 's-4',
      name: 'Bác. Tạ Trang Nhã',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: 4.5,
      avatar: avatar(51),
      program: "Reguler",
    },
    {
      id: 's-5',
      name: 'Valentina Castro',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: 4.5,
      avatar: avatar(52),
      program: "Internasional",
    },
  ],
};

export type AdminStudentStatus = 'Aktif' | 'Non-Aktif' | 'Cuti';

export type AdminStudentRow = {
  id: number;
  uuid: string;
  name: string;
  phone: string;
  city: string;
  status: AdminStudentStatus;
  image: string; // avatar url
};

export type AdminStudentList = {
  recap: { active: number; inactive: number; onLeave: number };
  cities: string[];
  statuses: AdminStudentStatus[];
  students: AdminStudentRow[];
};

export const ADMIN_STUDENT_LIST: AdminStudentList = {
  // sesuai angka di kartu rekap pada desain
  recap: { active: 300, inactive: 100, onLeave: 16 },
  cities: ['Kota Depok', 'Kota Jakarta', 'Kota Bogor', 'Kota Bekasi', 'Kota Tangerang'],
  statuses: ['Aktif', 'Non-Aktif', 'Cuti'],
  students: [
    // 5 row pertama disamakan dengan screenshot (nama, kota, telp sama; status bervariasi)
    { id: 1,  uuid: 'stu-001', name: 'Isabella Fernández', phone: '+62-813-8887-6690', city: 'Kota Depok', status: 'Aktif',     image: avatar(61) },
    { id: 2,  uuid: 'stu-002', name: 'Romero Fernández', phone: '+62-813-8887-6690', city: 'Kota Depok', status: 'Non-Aktif', image: avatar(62) },
    { id: 3,  uuid: 'stu-003', name: 'Krisbow Fernández', phone: '+62-813-8887-6690', city: 'Kota Depok', status: 'Aktif',     image: avatar(63) },
    { id: 4,  uuid: 'stu-004', name: 'John Fernández', phone: '+62-813-8887-6690', city: 'Kota Depok', status: 'Aktif',     image: avatar(64) },
    { id: 5,  uuid: 'stu-005', name: 'Kirk Fernández', phone: '+62-813-8887-6690', city: 'Kota Depok', status: 'Cuti',      image: avatar(65) },

    // tambahan data supaya bisa dipaginate enak
    { id: 6,  uuid: 'stu-006', name: 'Susan Taylor',        phone: '+62-812-2222-1111', city: 'Kota Jakarta',  status: 'Aktif',     image: avatar(66) },
    { id: 7,  uuid: 'stu-007', name: 'Kenneth Brown',       phone: '+62-811-3333-2222', city: 'Kota Bogor',    status: 'Non-Aktif', image: avatar(67) },
    { id: 8,  uuid: 'stu-008', name: '加藤 健一',             phone: '+62-813-4444-3333', city: 'Kota Bekasi',   status: 'Aktif',     image: avatar(68) },
    { id: 9,  uuid: 'stu-009', name: 'Sam Lau',             phone: '+62-815-5555-4444', city: 'Kota Tangerang',status: 'Cuti',      image: avatar(69) },
    { id: 10, uuid: 'stu-010', name: 'Rani Putri',          phone: '+62-816-5555-6666', city: 'Kota Depok',    status: 'Aktif',     image: avatar(70) },
    { id: 11, uuid: 'stu-011', name: 'Yoga Rahman',         phone: '+62-817-1111-7777', city: 'Kota Jakarta',  status: 'Aktif',     image: avatar(71) },
    { id: 12, uuid: 'stu-012', name: 'Sinta Dewi',          phone: '+62-818-2222-8888', city: 'Kota Bogor',    status: 'Non-Aktif', image: avatar(72) },
    { id: 13, uuid: 'stu-013', name: 'Rizky Ananda',        phone: '+62-819-3333-9999', city: 'Kota Bekasi',   status: 'Aktif',     image: avatar(73) },
    { id: 14, uuid: 'stu-014', name: 'Arif Pratama',        phone: '+62-812-4444-0001', city: 'Kota Depok',    status: 'Cuti',      image: avatar(74) },
    { id: 15, uuid: 'stu-015', name: 'Kevin Harris',        phone: '+62-813-7777-0002', city: 'Kota Tangerang',status: 'Aktif',     image: avatar(75) },
    { id: 16, uuid: 'stu-016', name: 'João Horvath',        phone: '+62-814-8888-0003', city: 'Kota Depok',    status: 'Aktif',     image: avatar(76) },
    { id: 17, uuid: 'stu-017', name: 'Bác. Tạ Trang Nhã',   phone: '+62-815-9999-0004', city: 'Kota Jakarta',  status: 'Non-Aktif', image: avatar(77) },
    { id: 18, uuid: 'stu-018', name: 'Valentina Castro',    phone: '+62-816-0000-0005', city: 'Kota Bogor',    status: 'Aktif',     image: avatar(78) },
    { id: 19, uuid: 'stu-019', name: 'Maria Garcia',        phone: '+62-817-1234-5678', city: 'Kota Bekasi',   status: 'Cuti',      image: avatar(79) },
    { id: 20, uuid: 'stu-020', name: 'Ravi Kumar',          phone: '+62-818-2233-4455', city: 'Kota Depok',    status: 'Aktif',     image: avatar(80) },
  ],
};

/* ===================== ADMIN: KELAS PER MURID ===================== */

export type StudentClassRow = {
  id: string;
  teacherName: string;
  instrument: string;      // Piano | Guitar | dst.
  schedule: string;        // "Setiap Kamis | 14.00 - 14.45"
  session: string;         // "5/12"
  rating?: number;         // undefined => "-"
  avatar: string;          // avatar guru
  program: string;         // Reguler | ABK | Internasional | Hobby
};

export const STUDENT_CLASSES_BY_STUDENT: Record<string, StudentClassRow[]> = {
  /* contoh sesuai screenshot */
  'stu-001': [
    {
      id: 'c-1',
      teacherName: 'Isabella Fernández',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: undefined,
      avatar: avatar(44),
      program: 'ABK',
    },
    {
      id: 'c-2',
      teacherName: 'Isabella Fernández',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: 4.5,
      avatar: avatar(44),
      program: 'ABK',
    },
    {
      id: 'c-3',
      teacherName: 'Isabella Fernández',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: 4.5,
      avatar: avatar(44),
      program: 'Reguler',
    },
    {
      id: 'c-4',
      teacherName: 'Isabella Fernández',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: 4.5,
      avatar: avatar(44),
      program: 'Reguler',
    },
    {
      id: 'c-5',
      teacherName: 'Isabella Fernández',
      instrument: 'Piano',
      schedule: 'Setiap Kamis | 14.00 - 14.45',
      session: '5/12',
      rating: 4.5,
      avatar: avatar(44),
      program: 'Internasional',
    },
  ],

  // opsional: dummy ringan untuk murid lain agar tidak kosong
  'stu-002': [
    {
      id: 'c-6',
      teacherName: 'Rina Putri',
      instrument: 'Vokal',
      schedule: 'Setiap Selasa | 10.00 - 10.45',
      session: '8/8',
      rating: 4.3,
      avatar: avatar(45),
      program: 'Internasional',
    },
  ],
  'stu-003': [
    {
      id: 'c-7',
      teacherName: 'Andi Saputra',
      instrument: 'Guitar',
      schedule: 'Setiap Sabtu | 16.00 - 16.45',
      session: '1/4',
      rating: undefined,
      avatar: avatar(46),
      program: 'Hobby',
    },
  ],
  'stu-004': [
    {
      id: 'c-8',
      teacherName: 'Budi Santoso',
      instrument: 'Biola',
      schedule: 'Setiap Jumat | 09.00 - 09.45',
      session: '7/12',
      rating: 4.7,
      avatar: avatar(47),
      program: 'Reguler',
    },
  ],
  'stu-005': [
    {
      id: 'c-9',
      teacherName: 'Satria W.',
      instrument: 'Drum',
      schedule: 'Setiap Senin | 09.00 - 09.45',
      session: '3/12',
      rating: undefined,
      avatar: avatar(48),
      program: 'ABK',
    },
  ],
};

/* ====== ADMIN: RIWAYAT KELAS PER CLASS-ID ====== */
export type StudentClassHistoryItem = {
  session: number;         // 1..n
  date: string;            // dd/MM/yyyy
  startClock: string;      // "13.00"
  endClock: string;        // "13.45"
  status: string;          // gunakan label yang dikenali getStatusColor
};

export const STUDENT_CLASS_HISTORY: Record<string, StudentClassHistoryItem[]> = {
  // contoh untuk c-1 sesuai screenshot
  'c-1': [
    { session: 4, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 3, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Terlambat' },
    { session: 2, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Dialihkan Ke Guru Lain' },
    { session: 1, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Belum Selesai' },
  ],
  // kelas lain bisa reuse pola yang sama
  'c-2': [
    { session: 4, date: '08/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 3, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 2, date: '25/07/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Terlambat' },
    { session: 1, date: '18/07/2025', startClock: '13.00', endClock: '13.45', status: 'Belum Selesai' },
  ],
  'c-3': [
    { session: 2, date: '05/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 1, date: '29/07/2025', startClock: '13.00', endClock: '13.45', status: 'Dialihkan Ke Guru Lain' },
  ],
  'c-4': [
    { session: 1, date: '22/07/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
  ],
  'c-5': [
    { session: 3, date: '10/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 2, date: '03/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Terlambat' },
    { session: 1, date: '27/07/2025', startClock: '13.00', endClock: '13.45', status: 'Belum Selesai' },
  ],
  's-1': [
    { session: 4, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 3, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Terlambat' },
    { session: 2, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Dialihkan Ke Guru Lain' },
    { session: 1, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Belum Selesai' },
  ],
  // kelas lain bisa reuse pola yang sama
  's-2': [
    { session: 4, date: '08/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 3, date: '01/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 2, date: '25/07/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Terlambat' },
    { session: 1, date: '18/07/2025', startClock: '13.00', endClock: '13.45', status: 'Belum Selesai' },
  ],
  's-3': [
    { session: 2, date: '05/08/2025', startClock: '13.00', endClock: '13.45', status: 'Selesai Tepat Waktu' },
    { session: 1, date: '29/07/2025', startClock: '13.00', endClock: '13.45', status: 'Dialihkan Ke Guru Lain' },
  ],
};
