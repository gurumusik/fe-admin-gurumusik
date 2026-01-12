import React, { useEffect, useMemo, useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilter3Line,
  RiHistoryLine,
  RiSearchLine,
} from "react-icons/ri";
import pianoIcon from "@/assets/icons/Pionau.png";
import {
  listRescheduleAdmin,
  type RescheduleAdminItem,
} from "@/services/api/reschedule.api";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { getInstrumentIcon } from "@/utils/getInstrumentIcon";

type StatusLabel = "Menunggu Respon" | "Disetujui" | "Ditolak";
type StatusFilter = "all" | StatusLabel;

type RowData = {
  id: string;
  classLabel: string;
  instrument: string;
  instrumentIcon: string;
  student: string;
  tutor: string;
  status: StatusLabel;
  session: string;
  oldSchedule: string;
  newSchedule: string;
  submittedAt: string;
  submittedAtRaw?: string | null;
  requestType: string;
};

const statusClass: Record<StatusLabel, string> = {
  "Menunggu Respon": "text-[var(--accent-orange-color)]",
  Disetujui: "text-[var(--accent-green-color)]",
  Ditolak: "text-[var(--accent-red-color)]",
};

const badgeTone = "bg-[var(--accent-purple-color)] text-white";
const pageSize = 8;

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Pilih Status" },
  { value: "Menunggu Respon", label: "Menunggu Respon" },
  { value: "Disetujui", label: "Disetujui" },
  { value: "Ditolak", label: "Ditolak" },
];

function formatDateShort(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function formatTimeLabel(time?: string | null): string {
  if (!time) return "-";
  const cleaned = String(time).trim();
  if (!cleaned) return "-";
  const normalized = cleaned.includes(":")
    ? cleaned
    : cleaned.replace(/\./g, ":");
  const parts = normalized.split(":");
  const hh = parts[0]?.padStart(2, "0") ?? "";
  const mm = (parts[1] ?? "").padStart(2, "0").slice(0, 2);
  if (!hh) return "-";
  return `${hh}.${mm}`;
}

function formatTimeRange(start?: string | null, end?: string | null): string {
  const s = formatTimeLabel(start);
  const e = formatTimeLabel(end);
  if (s === "-" && e === "-") return "-";
  if (s !== "-" && e !== "-") return `${s} - ${e}`;
  return s !== "-" ? s : e;
}

function formatSchedule(
  date?: string | null,
  start?: string | null,
  end?: string | null
) {
  const dateLabel = formatDateShort(date);
  const timeLabel = formatTimeRange(start, end);
  if (dateLabel === "-" && timeLabel === "-") return "-";
  if (dateLabel === "-") return timeLabel;
  if (timeLabel === "-") return dateLabel;
  return `${dateLabel} ${timeLabel}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const date = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(":", ".");
  return `${date} ${time}`;
}

function normalizeStatus(status?: string | null): StatusLabel {
  const raw = (status || "").toLowerCase();
  if (raw.includes("reject")) return "Ditolak";
  if (raw.includes("approve") || raw === "accepted" || raw === "approved") {
    return "Disetujui";
  }
  return "Menunggu Respon";
}

function normalizeCategoryLabel(raw?: string | null): string | null {
  if (!raw) return null;
  const value = String(raw).toLowerCase();
  if (value === "paket") return "Paket";
  if (value === "program") return "Program";
  if (value === "modul") return "Modul";
  if (value === "les") return "Les";
  return raw;
}

function resolveClassLabel(row: RescheduleAdminItem): string {
  const trx = row.transaksi as any;
  const paketName =
    trx?.nama_paket ?? trx?.paket?.nama_paket ?? trx?.paket?.nama ?? null;
  const programName =
    trx?.detailProgram?.program?.nama_program ??
    trx?.detail_program?.program?.nama_program ??
    trx?.program?.nama_program ??
    null;
  const category = normalizeCategoryLabel(trx?.category_transaksi ?? null);
  const label = paketName || programName || category;
  return label ? String(label) : "-";
}

function resolveInstrumentLabel(row: RescheduleAdminItem): string {
  const trx = row.transaksi as any;
  const label =
    trx?.nama_instrumen ??
    trx?.detailProgram?.instrument?.nama_instrumen ??
    trx?.detail_program?.instrument?.nama_instrumen ??
    trx?.instrument?.name ??
    trx?.instrument?.nama_instrumen ??
    trx?.instrument_name ??
    null;
  return label ? String(label) : "-";
}

function resolveInstrumentIcon(
  row: RescheduleAdminItem,
  instrumentLabel: string
): string {
  const trx = row.transaksi as any;
  const rawIcon =
    trx?.detailProgram?.instrument?.icon ??
    trx?.detail_program?.instrument?.icon ??
    trx?.instrument?.icon ??
    trx?.instrument_icon ??
    null;
  const resolved = resolveImageUrl(rawIcon ?? null);
  const fallback =
    instrumentLabel && instrumentLabel !== "-"
      ? getInstrumentIcon(instrumentLabel.toLowerCase())
      : pianoIcon;
  const safeFallback =
    fallback === "/assets/icons/default.png" ? pianoIcon : fallback;
  return resolved || safeFallback;
}

function resolveSession(row: RescheduleAdminItem): string {
  const sesiKe =
    row.sesi?.sesi_ke ?? (row.sesi as any)?.session_number ?? null;
  const totalSesi =
    (row.transaksi as any)?.paket?.jumlah_sesi ??
    (row.transaksi as any)?.paket?.jumlah_session ??
    (row.transaksi as any)?.paket?.total_sesi ??
    (row.sesi as any)?.total_sesi ??
    null;
  if (!sesiKe && !totalSesi) return "-";
  if (sesiKe && totalSesi) return `${sesiKe}/${totalSesi}`;
  return String(sesiKe ?? totalSesi ?? "-");
}

function resolveRequestType(row: RescheduleAdminItem): string {
  const requestedBy = (row.requested_by || "").toLowerCase();
  const targetRole = (row.target_role || "").toLowerCase();
  if (requestedBy === "murid" || targetRole === "guru") {
    return "Murid -> Guru";
  }
  if (requestedBy === "guru" || targetRole === "murid") {
    return "Guru -> Murid";
  }
  return "-";
}

function resolveName(
  user?: { nama?: string | null; nama_panggilan?: string | null } | null,
  fallback?: string
) {
  return (
    user?.nama?.trim() || user?.nama_panggilan?.trim() || fallback || "-"
  );
}

function adaptRow(row: RescheduleAdminItem): RowData {
  const instrumentLabel = resolveInstrumentLabel(row);
  return {
    id: String(row.id ?? `${Date.now()}-${Math.random()}`),
    classLabel: resolveClassLabel(row),
    instrument: instrumentLabel,
    instrumentIcon: resolveInstrumentIcon(row, instrumentLabel),
    student: resolveName(row.transaksi?.murid ?? null, "Murid"),
    tutor: resolveName(row.transaksi?.guru ?? null, "Guru"),
    status: normalizeStatus(row.status),
    session: resolveSession(row),
    oldSchedule: formatSchedule(row.old_date, row.old_start, row.old_end),
    newSchedule: formatSchedule(row.new_date, row.new_start, row.new_end),
    submittedAt: formatDateTime(row.created_at ?? row.updated_at ?? null),
    submittedAtRaw: row.created_at ?? row.updated_at ?? null,
    requestType: resolveRequestType(row),
  };
}

function pageWindow(total: number, current: number) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "...", total] as const;
  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total] as const;
  }
  return [1, "...", current - 1, current, current + 1, "...", total] as const;
}

const ReschedulePage: React.FC = () => {
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listRescheduleAdmin();
        const data = res?.data ?? [];
        if (!active) return;
        setRows(data.map(adaptRow));
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error
            ? err.message
            : "Gagal memuat data reschedule.";
        setError(message);
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const matchSearch =
        !q ||
        row.student.toLowerCase().includes(q) ||
        row.tutor.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ? true : row.status === statusFilter;
      return matchSearch && matchStatus;
    });
    filtered.sort((a, b) => {
      const ta = a.submittedAtRaw ? new Date(a.submittedAtRaw).getTime() : 0;
      const tb = b.submittedAtRaw ? new Date(b.submittedAtRaw).getTime() : 0;
      return tb - ta;
    });
    return filtered;
  }, [rows, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage]);

  const pagination = pageWindow(pageCount, currentPage);
  const totalItems = filteredRows.length;
  const pageItems = pageRows.length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-color)] text-[var(--accent-blue-color)]">
                <RiHistoryLine size={24} />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">Reschedule</p>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                <div className="relative w-full min-w-[260px] max-w-xl sm:flex-1">
                  <RiSearchLine
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Cari Murid atau Guru"
                    className="w-full rounded-full border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-800 outline-none transition focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[var(--secondary-color)]/20 disabled:cursor-not-allowed"
                  />
              </div>

              <div className="relative">
                <RiFilter3Line
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={18}
                />
                <RiArrowDownSLine
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={16}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as StatusFilter);
                    setPage(1);
                  }}
                  className="appearance-none inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white pl-10 pr-10 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-[1100px] w-full table-auto text-sm text-neutral-900">
              <thead className="bg-neutral-200/80 text-left text-[13px] font-semibold text-neutral-800">
                <tr>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Nama Murid</th>
                  <th className="p-4">Nama Guru</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Sesi</th>
                  <th className="p-4">Tanggal &amp; Jam Awal</th>
                  <th className="p-4">Tanggal &amp; Jam Baru</th>
                  <th className="p-4">Tanggal Pengajuan</th>
                  <th className="p-4">Tipe</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-neutral-500"
                    >
                      Memuat data reschedule...
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-neutral-500"
                    >
                      Tidak ada data reschedule.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  pageRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`border-b border-neutral-200 last:border-none ${
                        idx % 2 === 0 ? "bg-white" : "bg-neutral-50"
                      }`}
                    >
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeTone}`}
                          >
                            {row.classLabel}
                          </span>
                          <div className="flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-blue-light-color,#E7EFFD)]">
                              <img
                                src={row.instrumentIcon || pianoIcon}
                                alt={
                                  row.instrument !== "-"
                                    ? `${row.instrument} icon`
                                    : "Instrument icon"
                                }
                                className="h-6 w-6 object-contain"
                                loading="lazy"
                              />
                            </span>
                            {row.instrument}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-neutral-900">
                        {row.student}
                      </td>
                      <td className="px-4 py-3 align-middle text-[15px] text-neutral-900">
                        {row.tutor}
                      </td>
                      <td className={`px-4 py-3 align-middle font-semibold ${statusClass[row.status]}`}>
                        {row.status}
                      </td>
                      <td className="px-4 py-3 align-middle text-neutral-700">
                        {row.session}
                      </td>
                      <td className="px-4 py-3 align-middle text-neutral-700">
                        {row.oldSchedule}
                      </td>
                      <td className="px-4 py-3 align-middle text-neutral-700">
                        {row.newSchedule}
                      </td>
                      <td className="px-4 py-3 align-middle text-neutral-700">
                        {row.submittedAt}
                      </td>
                      <td className="px-4 py-3 align-middle text-neutral-700">
                        {row.requestType}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
            <p>Shows {pageItems} of {totalItems} Data</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1 || loading || totalItems === 0}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <RiArrowLeftSLine size={18} />
              </button>
              <div className="flex items-center gap-2">
                {pagination.map((item, idx) =>
                  item === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-neutral-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={`h-10 w-10 rounded-2xl border border-neutral-300 bg-white text-sm font-semibold transition hover:bg-neutral-50 ${
                        item === currentPage
                          ? "bg-[var(--secondary-light-color)] text-neutral-800"
                          : ""
                      }`}
                      aria-current={item === currentPage ? "page" : undefined}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                disabled={currentPage === pageCount || loading || totalItems === 0}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              >
                <RiArrowRightSLine size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReschedulePage;
