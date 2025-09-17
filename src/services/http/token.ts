export type TokenPair = { access_token: string; refresh_token: string };

const ACCESS = 'access_token';
const REFRESH = 'refresh_token';

export const tokenStorage = {
  get: () => localStorage.getItem(ACCESS),
  set: (t: string) => localStorage.setItem(ACCESS, t),
  clear: () => localStorage.removeItem(ACCESS),

  getRefresh: () => localStorage.getItem(REFRESH),
  setRefresh: (t: string) => localStorage.setItem(REFRESH, t),
  clearRefresh: () => localStorage.removeItem(REFRESH),

  setPair: ({ access_token, refresh_token }: TokenPair) => {
    localStorage.setItem(ACCESS, access_token);
    localStorage.setItem(REFRESH, refresh_token);
  },
  clearAll: () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  }
};
