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
  },
};
