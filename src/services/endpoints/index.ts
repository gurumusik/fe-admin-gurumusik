export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh', // dipakai di refresh.ts
    ME: '/auth/me',
  },
  ADMIN_AUTH: {
    REQUEST_LINK: '/admin-auth/request-link',
    CONSUME: '/admin-auth/consume',
    ME: '/admin-auth/me',
    LOGOUT: '/admin-auth/logout',
  },
  USERS: {
    ME: '/users/me',
  },
  GURU: {
    LIST: '/guru',
    INCOMPLETE: '/guru/incomplete',
    MISSING_SCHEDULE: '/guru/missing-schedule',
    DETAIL: (id: number | string) => `/guru/${id}`,
    SCHEDULE_REMINDER_LOGS: (id: number | string) => `/guru/${id}/schedule-reminder-logs`,
    SCHEDULES: (id: number | string) => `/guru/${id}/schedules`,
    CLASSES: (id: number | string) => `/guru/${id}/classes`,
    CLASSES_SESSIONS: (guruId: number | string) => `/guru/${guruId}/classes/sessions`,
    CLASSES_SESSION_PROGRESS: (guruId: number | string) => `/guru/${guruId}/classes/sessions/progress`,
    CLASSES_SESSION_ABSEN_MEDIA: (guruId: number | string) => `/guru/${guruId}/classes/sessions/absen-media`,
    CLASSES_SESSION_REVIEW: (guruId: number | string) => `/guru/${guruId}/classes/sessions/review`,
    CLASSES_RATINGS: (guruId: number | string) => `/guru/${guruId}/classes/ratings`,
    PROFILE: () => `/guru/profile`,
    STATUS: (id?: number | string) => (id ? `/guru/status?id=${id}` : `/guru/status`),
    STATUS_BULK: `/guru/status/bulk`,
    UPDATE_IS_SHOW: (guruId?: number | string ) => `/guru/${guruId}/ratings/:ratingId/is_show`,
    CREATE_FROM_ENTRY: `/guru/admin/guru`,
    UPDATE_BASIC: (id?: number | string) => id ? `/guru/admin/basic?id=${id}` : `/guru/admin/basic`,
    UPDATE_DETAIL: (id?: number | string) => id ? `/guru/admin/detail?id=${id}` : `/guru/admin/detail`,
    UPDATE_LANGUAGES: (id?: number | string) => id ? `/guru/admin/languages?id=${id}` : `/guru/admin/languages`,
    UPLOAD_AVATAR: `/guru/avatar`,
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

  PROGRAMS: {
    LIST: '/programs',                 // GET public (q,page,limit)
    DETAIL: (id: number|string) => `/programs/${id}`, // GET admin
    CREATE: '/programs',        // POST admin
    UPDATE: (id: number|string) => `/programs/${id}`, // PUT admin
    DELETE: (id: number|string) => `/programs/${id}`, // DELETE admin
  },
  PROGRAM_PAGES: {
    LIST: '/program-pages',
    DETAIL: (type: 'regular' | 'special-need' | 'hobby') => `/program-pages/${type}`,
    UPDATE: (type: 'regular' | 'special-need' | 'hobby') => `/program-pages/${type}`,
    PUBLISH: (type: 'regular' | 'special-need' | 'hobby') => `/program-pages/${type}/publish`,
    UNPUBLISH: (type: 'regular' | 'special-need' | 'hobby') => `/program-pages/${type}/unpublish`,
  },
  PAKET: {
    LIST: '/paket',                              // GET ?search=&page=&limit=
    GROUPED: '/paket/grouped',
    DETAIL: (id: number | string) => `/paket/${id}`,
    CREATE: '/paket',
    UPDATE: (id: number | string) => `/paket/${id}`,
    DELETE: (id: number | string) => `/paket/${id}`,
  },

  GURU_APPLICATION: {
    LIST: '/guru-applications',
    DETAIL: (id: number|string) => `/guru-applications/${id}`,
    APPLICATIONS: '/guru-applications/applications',
    DECIDE: (id: number | string) => `/guru-applications/applications/${id}/decision`,
  },
  
  RECRUITMENT: {
      LIST: '/guru-applications/applications',
      DECIDE: (id: number | string) => `/guru-applications/applications/${id}/decision`,

      REVISION_REPORTS: (appId: number | string) => `/recruitment/applications/${appId}/revision-reports`,
      REVISION_REPORTS_LATEST: (appId: number | string) => `/recruitment/applications/${appId}/revision-reports/latest`,
      REVISION_TOKEN_DEACTIVATE: (tokenId: number | string) => `/recruitment/revision-tokens/${tokenId}/deactivate`,
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
    LIST: () => `/rating`,
    PERFORMA_MENGAJAR_ADMIN: (id: number | string) => `/rating/${id}/performa-mengajar`,
    PERFORMA_MENGAJAR_GLOBAL: () => `/rating/performance-global`, 
    PERFORMA_NILAI_GLOBAL_DAILY: () => `/rating/performance-global/daily`,
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
    STATUS: '/murid/status',
    DETAIL_BY_UUID: (uuid: string) => `/murid/by-uuid/${uuid}`, 
    CLASSES_BY_UUID: (uuid: string) => `/murid/by-uuid/${uuid}/classes`,
    CLASS_HISTORY: (uuid: string, classId: string | number) => `/murid/by-uuid/${uuid}/classes/${classId}/history`, 
      // ⬇️ endpoint baru (per sesi) berbasis muridId
    CLASSES_BY_ID: (muridId: number | string) => `/murid/${muridId}/classes`,
    CLASSES_RATINGS: (muridId: number | string) => `/murid/${muridId}/classes/ratings`,
  },

  TRANSAKSI: {
    DETAIL: (id: number | string) => `/transaksi/${id}`,
    FOLLOW_UP_APPROVAL: (id: number | string) => `/transaksi/${id}/follow-up-approval`,
    BY_PROMO: (promoId: number | string) => `/transaksi/promo/${promoId}/transactions`,
    ALL: () => `/transaksi/all`,
    RECAP: () => `/transaksi/recap`,
    MONTHLY_STATS: () => `/transaksi/monthly-stats`,
    PACKAGES: () => `/transaksi/packages`,
    QUOTE: () => `/transaksi/quote`,
    CHECKOUT: () => `/transaksi/checkout`,
    TEACHER_SCHEDULE: (guruId: number | string) => `/transaksi/teacher/${guruId}/schedule`,
  },
  INVOICE: {
    DETAIL: (id: number | string) => `/invoice/${id}`,
  },
  RESCHEDULE: {
    ADMIN_LIST: '/reschedule/admin',
    ADMIN_CREATE: '/reschedule/admin/create',
  },
  SESI: {
    ADMIN_ALL: '/sesi/admin/all',
  },
  REQUEST_ASSIST: {
    LIST: '/request-assist',
    UPDATE_STATUS: (id: number | string) => `/request-assist/${id}/status`,
  },
  ADMIN_LIVE_CHAT: {
    OVERVIEW: '/admin/live-chat/overview',
    DETAIL: (chatSessionId: number | string) => `/admin/live-chat/sessions/${chatSessionId}`,
  },
  TEACHER_CHANGE: {
    ADMIN_LIST: '/teacher-change/admin',
    APPROVE: (id: number | string) => `/teacher-change/${id}/approve`,
    REJECT: (id: number | string) => `/teacher-change/${id}/reject`,
    CLOSE: (id: number | string) => `/teacher-change/${id}/close`,
    FREEZE: (id: number | string) => `/teacher-change/${id}/freeze`,
    FEE: (id: number | string) => `/teacher-change/${id}/fee`,
  },
  WA_HANDOFFS: {
    LIST: '/wa/admin/handoffs',
    RESOLVE: (id: number | string) => `/wa/admin/handoffs/${id}/resolve`,
  },
  PAYOUT_GURU: {
    LIST: () => `/payout-guru`,
    ITEM: (id: number | string) => `/payout-guru/${id}`,
    DECISION: (id: number | string) => `/payout-guru/${id}/decision`, 
    SEND_SLIP: () => `/payout-guru/send-slip`,
  },
  WITHDRAW: {
    SLIP: (id: number | string) => `/withdraw/slip/${id}`,
  },

  EARNINGS: {
    LIST: () => `/earnings/guru/chart`,
  },

  SERTIFIKAT: {
    UPDATE: (id: number | string) => `/sertifikat/${id}/status`,
    UPDATE_VIDEO: (id: number | string) => `/sertifikat/${id}/video`,
    PENDING: '/sertifikat/pending',
  },

  WILAYAH: {
    PROVINCES: '/wilayah/provinces',                       // GET ?q=&page=&limit=
    PROVINCE: (id: number | string) => `/wilayah/provinces/${id}`,
    CITIES: '/wilayah/cities',                             // GET ?province_id=&q=&page=&limit=
    CITY: (id: number | string) => `/wilayah/cities/${id}`,
  },
  EMPLOYEES: {
    LIST: '/admin/employees',
    CREATE: '/admin/employees',
    CREATE_ADMIN: '/admin/employees/admin',
    UPDATE: (id: number | string) => `/admin/employees/${id}`,
  },

  BILLING_CONFIG: {
    DETAIL: '/admin/billing-config',
    UPDATE: '/admin/billing-config',
  },

  PROFILE_TEMPLATES: {
    LIST: '/profile-templates', // GET (admin: all+filter, guru: active only)
    DETAIL: (id: number | string) => `/profile-templates/${id}`,
    CREATE: '/profile-templates',
    UPDATE: (id: number | string) => `/profile-templates/${id}`,
    ENABLE: (id: number | string) => `/profile-templates/${id}/enable`,
    DISABLE: (id: number | string) => `/profile-templates/${id}/disable`,
    DELETE: (id: number | string) => `/profile-templates/${id}`,
  },

  REVISION_TEMPLATES: {
    LIST: '/revision-templates',
    DETAIL: (id: number | string) => `/revision-templates/${id}`,
    CREATE: '/revision-templates',
    UPDATE: (id: number | string) => `/revision-templates/${id}`,
    ENABLE: (id: number | string) => `/revision-templates/${id}/enable`,
    DISABLE: (id: number | string) => `/revision-templates/${id}/disable`,
    DELETE: (id: number | string) => `/revision-templates/${id}`,
  },

  REFERRALS: {
    REFERRERS: '/admin/referrals/referrers',
    COMMISSIONS: '/admin/referrals/commissions',
  },

  NOTIFICATIONS: {
    ADMIN_BROADCAST: '/notifications/admin/broadcast',
  },
};
