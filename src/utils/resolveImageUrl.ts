// src/utils/resolveImageUrl.ts
export function resolveImageUrl(icon: string | null): string | null {
  if (!icon) return null;
  if (/^https?:\/\//i.test(icon)) return icon;
  const base =
    import.meta.env.VITE_API_BASE_URL
      ?.replace(/\/api\/v1\/?$/, '')
      ?.replace(/\/$/, '') ?? '';
  return icon.startsWith('/') ? `${base}${icon}` : `${base}/${icon}`;
}
