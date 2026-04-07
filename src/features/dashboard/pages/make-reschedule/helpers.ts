function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateID(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatTime(t?: string | null) {
  if (!t) return "-";
  return t.slice(0, 5);
}

export function resolveName(
  user?: { nama?: string | null; nama_panggilan?: string | null } | null,
  fallback = "-"
) {
  return user?.nama_panggilan?.trim() || user?.nama?.trim() || fallback;
}
