import React from "react";

export const inputCls =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[var(--secondary-color)]/20 disabled:bg-neutral-50 disabled:text-neutral-400";

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--primary-color)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-blue-color)]">
      {children}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  "belum dimulai": "bg-blue-50 text-blue-700 border-blue-200",
  "absen awal":    "bg-yellow-50 text-yellow-700 border-yellow-200",
  "kelas terlewat":"bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  "belum dimulai": "Belum Dimulai",
  "absen awal":    "Absen Awal",
  "kelas terlewat":"Kelas Terlewat",
};

export function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-600 border-neutral-200";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none ${style}`}
    >
      {label}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
    </div>
  );
}
