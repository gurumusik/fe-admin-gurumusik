export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh', // dipakai di refresh.ts
    ME: '/auth/me',
  },
  USERS: {
    ME: '/users/me',
  },
  GURU: {
    LIST: '/guru',
    DETAIL: (id: number | string) => `/guru/${id}`,
    SCHEDULES: (id: number | string) => `/guru/${id}/schedules`,
    CLASSES: (id: number | string) => `/guru/${id}/classes`,
  },
  INSTRUMENTS: {
      LIST: '/instruments',
      GET: (id: number) => `/instruments/master/${id}`,
      DETAIL: (id: number | string) => `/instruments/master/${id}`,
      CREATE: '/instruments/master',
      UPDATE: (id: number | string) => `/instruments/master/${id}`,
      DELETE: (id: number | string) => `/instruments/master/${id}`,

      WIZARD: '/instruments/master/wizard',
    },  
  GRADES: {
    LIST: '/grades',
    CREATE: '/grades/master',
    DETAIL: (id: number | string) => `/grades/master/${id}`,
    UPDATE: (id: number | string) => `/grades/master/${id}`,
    DELETE: (id: number | string) => `/grades/master/${id}`,
  },
  // SESUAIKAN dengan route backend-mu utk membuat detail_programs
  DETAIL_PROGRAMS: {
    CREATE: '/detail-programs/master',
    BULK: '/detail-programs/master/bulk',
    COUNT: '/detail-programs/count',
    BY_INSTRUMENT: (id: number) => `/detail-programs/by-instrument/${id}`,
    DELETE: (id: number | string) => `/detail-programs/master/${id}`,
  },

  // SESUAIKAN dengan route yang kamu punya untuk ambil daftar program
  PROGRAMS: {
    LIST: '/programs',                 // GET public (q,page,limit)
    DETAIL: (id: number|string) => `/programs/master/${id}`, // GET admin
    CREATE: '/programs/master',        // POST admin
    UPDATE: (id: number|string) => `/programs/master/${id}`, // PUT admin
    DELETE: (id: number|string) => `/programs/master/${id}`, // DELETE admin
  },

  REGISTRASI_GURU: {
    LIST: '/registrasi-guru',
    DETAIL: (id: number|string) => `/registrasi-guru/${id}`,
    CREATE: '/registrasi-guru',
    UPDATE: (id: number|string) => `/registrasi-guru/${id}`,
    DELETE: (id: number|string) => `/registrasi-guru/${id}`,
  },
  SILABUS: {
    CREATE: '/silabus',
    UPDATE: (id: number | string) => `/silabus/${id}`,
    PUBLIC_LIST: '/silabus/public',           // ← GET ?instrument_id=&grade_id=
    PUBLIC_GRADES: '/silabus/public/grades',  // ← GET ?instrument_id=
    DELETE: (id: number | string) => `/silabus/${id}`,
  },

  MODULES: {
    ADMIN: {
      LIST: '/module/admin',
      DETAIL: (id: number | string) => `/module/admin/${id}`,
      UPDATE: (id: number | string) => `/module/admin/${id}`,
      DELETE: (id: number | string) => `/module/admin/${id}`,
    },
    GURU: {
      LIST: '/module/guru',
      DETAIL: (id: number | string) => `/module/guru/${id}`,
      UPDATE: (id: number | string) => `/module/guru/${id}`,
      DELETE: (id: number | string) => `/module/guru/${id}`,
    },
  },
  RATING: {
    PERFORMA_MENGAJAR: () => `/rating/guru/rating/performa-mengajar`,
  },
  PROMO: {
    LIST: '/promo',
    DETAIL: (id: number | string) => `/promo/${id}`,
    CREATE: '/promo',
    UPDATE: (id: number | string) => `/promo/${id}`,
    HEADLINE_AVAIL: '/promo/is-headline-avail',
    HEADLINE: '/promo/landing/headline',
    TRANSACTION_LIST: '/promo/transaction-list',
    APPLY_TO_TRANSACTION: '/promo/apply-to-transaction',
    REMOVE: '/promo/remove',
    FLASHSALE_ITEMS: (id: number | string) => `/promo/${id}/flashsale-items`,
  },

  MURID: {
    ADMIN_LIST: '/murid', 
    DETAIL_BY_UUID: (uuid: string) => `/murid/by-uuid/${uuid}`, 
    CLASSES_BY_UUID: (uuid: string) => `/murid/by-uuid/${uuid}/classes`,
    CLASS_HISTORY: (uuid: string, classId: string | number) => `/murid/by-uuid/${uuid}/classes/${classId}/history`, 
      // ⬇️ endpoint baru (per sesi) berbasis muridId
    CLASSES_BY_ID: (muridId: number | string) => `/murid/${muridId}/classes`,
  },

   TRANSAKSI: {
    DETAIL: (id: number | string) => `/transaksi/${id}`,
    BY_PROMO: (promoId: number | string) => `/transaksi/promo/${promoId}/transactions`,
    ALL: () => `/transaksi/all`,
  },
  PAYOUT_GURU: {
    LIST: () => `/payout-guru`,
    ITEM: (id: number | string) => `/payout-guru/${id}`,
    DECISION: (id: number | string) => `/payout-guru/${id}/decision`, 
  },

  EARNINGS: {
    LIST: () => `/earnings/guru/chart`,
  }
};

