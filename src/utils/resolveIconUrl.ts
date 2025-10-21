// src/utils/resolveIconUrl.ts
export function resolveIconUrl(icon: string | null | undefined): string | null {
  if (!icon) return null;

  // sudah absolute? langsung balikin
  if (/^(https?:)?\/\//i.test(icon)) return icon;
  // dukung data: & blob: kalau suatu saat dipakai preview
  if (/^(data:|blob:)/i.test(icon)) return icon;

  const base =
    import.meta.env.VITE_API_BASE_URL
      ?.replace(/\/api\/v1\/?$/, '') // buang /api/v1 di belakang kalau ada
      ?.replace(/\/$/, '')           // buang trailing slash
    ?? '';

  if (!base) return icon; // fallback: kembalikan apa adanya

  return icon.startsWith('/') ? `${base}${icon}` : `${base}/${icon}`;
}
