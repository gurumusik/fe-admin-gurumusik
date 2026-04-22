export type TokenPair = { access_token: string; refresh_token: string };
export type AuthMode = "legacy" | "admin_magic";

const ACCESS = 'access_token';
const REFRESH = 'refresh_token';
const AUTH_MODE = 'auth_mode';

export const tokenStorage = {
  get: () => localStorage.getItem(ACCESS),
  set: (t: string, mode: AuthMode = 'legacy') => {
    localStorage.setItem(ACCESS, t);
    localStorage.setItem(AUTH_MODE, mode);
  },
  clear: () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(AUTH_MODE);
  },

  getRefresh: () => localStorage.getItem(REFRESH),
  setRefresh: (t: string) => {
    localStorage.setItem(REFRESH, t);
    localStorage.setItem(AUTH_MODE, 'legacy');
  },
  clearRefresh: () => localStorage.removeItem(REFRESH),
  getMode: (): AuthMode | null => {
    const mode = localStorage.getItem(AUTH_MODE);
    return mode === 'legacy' || mode === 'admin_magic' ? mode : null;
  },

  setPair: ({ access_token, refresh_token }: TokenPair) => {
    localStorage.setItem(ACCESS, access_token);
    localStorage.setItem(REFRESH, refresh_token);
    localStorage.setItem(AUTH_MODE, 'legacy');
  },
  clearAll: () => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(AUTH_MODE);
  }
};
