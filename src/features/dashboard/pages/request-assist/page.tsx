import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilter3Line,
  RiServiceLine,
} from "react-icons/ri";
import pianoIcon from "@/assets/icons/Pionau.png";
import {
  listRequestAssistAdmin,
  updateRequestAssistStatus,
  type RequestAssistItem,
  type RequestAssistStatus,
} from "@/services/api/requestAssist.api";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { getInstrumentIcon } from "@/utils/getInstrumentIcon";

const pageSize = 10;

type StatusFilter = "all" | RequestAssistStatus;

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
];

const statusTone: Record<RequestAssistStatus, string> = {
  pending: "text-[var(--accent-orange-color)]",
  done: "text-[var(--accent-green-color)]",
};

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

function dayName(d?: number | string | null): string {
  if (d == null) return "-";
  if (typeof d === "string") return d;
  const map = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return map[d] ?? String(d);
}

function resolveUserName(row: RequestAssistItem): string {
  const u = row.user;
  return u?.nama?.trim() || u?.nama_panggilan?.trim() || "-";
}

function resolveUserContact(row: RequestAssistItem): string {
  const u = row.user;
  const email = u?.email?.trim();
  const phone = u?.no_telp?.trim();
  if (email && phone) return `${email}`;
  return email || phone || "-";
}

function resolveInstrumentLabel(row: RequestAssistItem): string {
  return row.instrument?.nama_instrumen?.trim() || "-";
}

function resolveInstrumentIcon(row: RequestAssistItem, label: string): string {
  const resolved = resolveImageUrl(row.instrument?.icon ?? null);
  const fallback = label !== "-"
    ? getInstrumentIcon(label.toLowerCase())
    : pianoIcon;
  const safeFallback =
    fallback === "/assets/icons/default.png" ? pianoIcon : fallback;
  return resolved || safeFallback;
}

const RequestAssistPage: React.FC = () => {
  const [rows, setRows] = useState<RequestAssistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRequestAssistAdmin({
        page,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRows(res?.data ?? []);
      setTotal(Number(res?.total ?? 0));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat request assist.";
      setError(message);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageRows = useMemo(() => rows, [rows]);

  const handleMarkDone = useCallback(
    async (id: number | string) => {
      try {
        setUpdatingId(id);
        await updateRequestAssistStatus(id, "done");
        if (statusFilter === "pending") {
          await loadData();
          return;
        }
        setRows((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, status: "done" } : row
          )
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal memperbarui status request assist.";
        setError(message);
      } finally {
        setUpdatingId(null);
      }
    },
    [loadData, statusFilter]
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-color)] text-[var(--accent-blue-color)]">
                <RiServiceLine size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">Request Assist</p>
                <p className="text-sm text-neutral-500">Daftar permintaan assist dari murid</p>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
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
                  <th className="p-4">Instrumen</th>
                  <th className="p-4">Murid</th>
                  <th className="p-4">Kontak</th>
                  <th className="p-4">Kota</th>
                  <th className="p-4">Hari</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Jam Mulai</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-neutral-500"
                    >
                      Memuat request assist...
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
                      Tidak ada request assist.
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  pageRows.map((row, idx) => {
                    const instrumentLabel = resolveInstrumentLabel(row);
                    const instrumentIcon = resolveInstrumentIcon(row, instrumentLabel);
                    const status =
                      (row.status || "pending").toString().toLowerCase() === "done"
                        ? "done"
                        : "pending";
                    const isDone = status === "done";
                    const isUpdating = updatingId === row.id;

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-neutral-200 last:border-none ${
                          idx % 2 === 0 ? "bg-white" : "bg-neutral-50"
                        }`}
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2 text-[15px] font-semibold text-neutral-800">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-blue-light-color,#E7EFFD)]">
                              <img
                                src={instrumentIcon || pianoIcon}
                                alt={
                                  instrumentLabel !== "-"
                                    ? `${instrumentLabel} icon`
                                    : "Instrument icon"
                                }
                                className="h-6 w-6 object-contain"
                                loading="lazy"
                              />
                            </span>
                            {instrumentLabel}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-[15px] text-neutral-900">
                          {resolveUserName(row)}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {resolveUserContact(row)}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {row.city || "-"}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {dayName(row.hari ?? null)}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {formatDateShort(row.tanggal)}
                        </td>
                        <td className="px-4 py-3 align-middle text-neutral-700">
                          {formatTimeLabel(row.waktu_mulai)}
                        </td>
                        <td
                          className={`px-4 py-3 align-middle font-semibold ${
                            statusTone[status]
                          }`}
                        >
                          {status === "done" ? "Done" : "Pending"}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <button
                            type="button"
                            disabled={isDone || isUpdating}
                            onClick={() => handleMarkDone(row.id)}
                            className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                              isDone
                                ? "border-neutral-200 text-neutral-400"
                                : "border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                            } ${isUpdating ? "opacity-60" : ""}`}
                          >
                            {isDone ? "Done" : isUpdating ? "Memproses..." : "Tandai Done"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-600">
            <p>Shows {pageRows.length} of {total} Data</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1 || loading || total === 0}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <RiArrowLeftSLine size={18} />
              </button>
              <div className="px-4 text-sm font-semibold text-neutral-700">
                {page} / {pageCount}
              </div>
              <button
                type="button"
                disabled={page === pageCount || loading || total === 0}
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

export default RequestAssistPage;
