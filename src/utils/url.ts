 // src/utils/url.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── helpers ────────────────────────────────────────────────────────────────────
export const stripTrailing = (s: string = ''): string => s.replace(/\/+$/, '');
export const stripLeading  = (s: string = ''): string => s.replace(/^\/+/, '');
export const isBrowser = typeof window !== 'undefined';
const isAbs = (u?: string | null) => !!u && /^https?:\/\//i.test(u || '');

// ── env (Vite) ────────────────────────────────────────────────────────────────
const RAW_API_BASE  = (import.meta as any)?.env?.VITE_API_BASE_URL  || ''; // ex: http://localhost:3001/api/v1
const RAW_FILE_BASE = (import.meta as any)?.env?.VITE_FILE_BASE_URL || ''; // ex: http://localhost:3001

export const API_BASE  = stripTrailing(String(RAW_API_BASE));
export const FILE_BASE = stripTrailing(
  String(RAW_FILE_BASE || '').trim() ||
  // fallback pintar: kalau FILE_BASE gak diisi, coba buang suffix /api[/vN]
  String(RAW_API_BASE || '').replace(/\/api(?:\/v\d+)?$/, '')
);

// ── query builder ─────────────────────────────────────────────────────────────
export type Query =
  | Record<string, string | number | boolean | null | undefined>
  | URLSearchParams;

export function toSearchString(query?: Query): string {
  if (!query) return '';
  const sp = query instanceof URLSearchParams ? query : new URLSearchParams();
  if (!(query instanceof URLSearchParams)) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      sp.append(k, String(v));
    });
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ── API URL ───────────────────────────────────────────────────────────────────

export function buildUrl(path: string = '', query?: Query): string {
  const normalized = stripLeading(String(path));
  const base = API_BASE ? `${API_BASE}/` : '';
  return `${base}${normalized}${toSearchString(query)}`;
}


// ── FILE URL (/uploads, dsb.) ────────────────────────────────────────────────
export function publicFileUrl(path?: string | null): string {
  if (!path) return '';
  if (isAbs(path)) return path;               // sudah absolut → pakai langsung
  const p = stripLeading(path);               // relatif → gabung dengan FILE_BASE
  if (!FILE_BASE) {
    if ((import.meta as any)?.env?.DEV) {
      console.warn('[publicFileUrl] FILE_BASE kosong, return relatif:', path);
    }
    return `/${p}`;
  }
  return `${FILE_BASE}/${p}`;
}
