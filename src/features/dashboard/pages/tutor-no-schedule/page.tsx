import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  RiAlarmWarningLine,
  RiCloseLine,
  RiRefreshLine,
  RiSearchLine,
} from "react-icons/ri";

import defaultUser from "@/assets/images/default-user.png";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { getStatusColor } from "@/utils/getStatusColor";
import {
  listMissingScheduleGurus,
  listTeacherScheduleReminderLogs,
  type MissingScheduleGuruItem,
  type TeacherScheduleReminderLogItem,
} from "@/services/api/guruMissingSchedule.api";

dayjs.locale("id");

const PAGE_SIZE = 20;
const LOG_PAGE_SIZE = 20;

type StatusFilter = "all" | "aktif" | "non_aktif" | "cuti";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "aktif", label: "Aktif" },
  { value: "all", label: "Semua Status" },
  { value: "non_aktif", label: "Non-Aktif" },
  { value: "cuti", label: "Cuti" },
];

const statusLabel = (raw?: string | null) => {
  if (!raw) return "-";
  if (raw === "aktif") return "Aktif";
  if (raw === "non_aktif") return "Non-Aktif";
  if (raw === "cuti") return "Cuti";
  return raw;
};

function pageWindow(total: number, current: number) {
  const out: (number | "…")[] = [];
  const push = (x: number | "…") => {
    if (out[out.length - 1] !== x) out.push(x);
  };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== "…") push("…");
  }
  return out;
}

function formatDateOnly(value?: string | null) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("D MMM YYYY") : value;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = dayjs(value);
  return date.isValid() ? date.format("D MMM YYYY, HH:mm") : value;
}

const TutorNoSchedulePage: React.FC = () => {
  const [rows, setRows] = useState<MissingScheduleGuruItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("aktif");
  const [onlyZero, setOnlyZero] = useState(false);

  const [query, setQuery] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const debounceRef = useRef<number | null>(null);

  const [meta, setMeta] = useState<{
    today: string;
    min_active_minutes: number;
    min_active_hours: number;
    deactivate_after_days: number;
  } | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listMissingScheduleGurus({
        page,
        limit: PAGE_SIZE,
        q: query || undefined,
        status: statusFilter,
        only_zero: onlyZero,
      });
      setRows(res?.data ?? []);
      setTotal(Number(res?.total ?? 0));
      setMeta({
        today: res?.today ?? "",
        min_active_minutes: Number(res?.min_active_minutes ?? 0),
        min_active_hours: Number(res?.min_active_hours ?? 0),
        deactivate_after_days: Number(res?.deactivate_after_days ?? 0),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data guru.";
      setError(message);
      setRows([]);
      setTotal(0);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [onlyZero, page, query, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    setSearchText(query);
  }, [query]);

  const onSearchChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      setQuery(val.trim());
    }, 350) as unknown as number;
  };

  const visibleRows = useMemo(() => rows, [rows]);

  // ---- Logs modal ----
  const [selected, setSelected] = useState<MissingScheduleGuruItem | null>(null);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [logs, setLogs] = useState<TeacherScheduleReminderLogItem[]>([]);

  const logPageCount = Math.max(1, Math.ceil(logTotal / LOG_PAGE_SIZE));

  const closeModal = () => {
    setSelected(null);
    setLogPage(1);
    setLogTotal(0);
    setLogs([]);
    setLogError(null);
  };

  const loadLogs = useCallback(async (guruId: number, pageNum: number) => {
    setLogLoading(true);
    setLogError(null);
    try {
      const res = await listTeacherScheduleReminderLogs(guruId, {
        page: pageNum,
        limit: LOG_PAGE_SIZE,
      });
      setLogs(res?.data ?? []);
      setLogTotal(Number(res?.total ?? 0));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat log reminder.";
      setLogError(message);
      setLogs([]);
      setLogTotal(0);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (logPage > logPageCount) setLogPage(logPageCount);
  }, [logPage, logPageCount]);

  useEffect(() => {
    if (!selected?.id) return;
    loadLogs(Number(selected.id), logPage);
  }, [loadLogs, selected?.id, logPage]);

  const goTo = (p: number) => {
    const safe = Math.min(Math.max(1, p), pageCount);
    if (safe !== page) setPage(safe);
  };

  const goToLogPage = (p: number) => {
    const safe = Math.min(Math.max(1, p), logPageCount);
    if (safe !== logPage) setLogPage(safe);
  };

  const renderBody = () => {
    if (loading) {
      return (
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={`skeleton-${i}`}>
              <td className="px-4 py-4" colSpan={7}>
                <div className="h-5 w-full animate-pulse rounded bg-black/10" />
              </td>
            </tr>
          ))}
        </tbody>
      );
    }
    if (error) {
      return (
        <tbody>
          <tr>
            <td className="px-4 py-6 text-red-600" colSpan={7}>
              {error}
            </td>
          </tr>
        </tbody>
      );
    }
    if (!visibleRows.length) {
      return (
        <tbody>
          <tr>
            <td className="px-4 py-6 text-neutral-900" colSpan={7}>
              Tidak ada guru yang jadwalnya kosong.
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {visibleRows.map((row) => {
          const statusText = statusLabel(row.status_akun);
          const activeText = `${row.active_hours} jam`;
          const emptyText = row.schedule_empty_since
            ? `${formatDateOnly(row.schedule_empty_since)} (${row.schedule_empty_days} hari)`
            : "-";
          const lastLog = row.last_reminder_log;

          return (
            <tr key={row.id} className="border-b border-neutral-200 last:border-0">
              <td className="px-4 py-4">
                <div className="h-12 w-12 overflow-hidden rounded-full">
                  <img
                    src={resolveImageUrl(row.profile_pic_url ?? null) || defaultUser}
                    alt={row.nama ?? "Guru"}
                    className="h-12 w-12 object-cover"
                  />
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold text-neutral-900">{row.nama ?? "-"}</p>
                <p className="text-xs text-neutral-500">
                  {row.nama_panggilan ?? "-"} · ID {row.id}
                </p>
              </td>
              <td className="px-4 py-4 text-sm text-neutral-700">
                <p>{row.email ?? "-"}</p>
                <p>{row.no_telp ?? "-"}</p>
              </td>
              <td className="px-4 py-4">
                <span className={`font-semibold ${getStatusColor(String(row.status_akun ?? ""))}`}>
                  {statusText}
                </span>
              </td>
              <td className="px-4 py-4 text-sm">
                <p className="font-semibold text-neutral-900">{activeText}</p>
                <p className="text-xs text-neutral-500">
                  Minimum: {meta?.min_active_hours ?? "-"} jam
                </p>
              </td>
              <td className="px-4 py-4 text-sm text-neutral-700">{emptyText}</td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="hidden text-right text-xs text-neutral-500 md:block">
                    <div className="font-semibold text-neutral-700">
                      {lastLog?.status ?? "no-log"}
                    </div>
                    <div>{formatDateTime(lastLog?.sent_at ?? lastLog?.due_at ?? null)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(row);
                      setLogPage(1);
                    }}
                    className="rounded-full border border-(--secondary-color) px-4 py-1.5 text-xs font-semibold text-(--secondary-color) hover:bg-(--secondary-light-color)"
                  >
                    Lihat Log
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-(--primary-color)">
              <RiAlarmWarningLine size={22} className="text-black" />
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900">Guru Tanpa Jadwal</p>
              <p className="text-sm text-neutral-500">
                Guru yang belum memenuhi minimal jadwal aktif{" "}
                <span className="font-semibold">{meta?.min_active_hours ?? "3"} jam</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative w-full max-w-[320px]">
              <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
              <input
                className="w-full rounded-xl border border-black/10 bg-white py-2 pl-10 pr-3 text-sm outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                placeholder="Cari nama, email, telepon"
                value={searchText}
                onChange={onSearchChange}
              />
            </label>

            <select
              className="h-[42px] rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-(--secondary-color)"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value as StatusFilter);
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="flex h-[42px] items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-sm">
              <input
                type="checkbox"
                checked={onlyZero}
                onChange={(e) => {
                  setPage(1);
                  setOnlyZero(e.target.checked);
                }}
              />
              Hanya 0 jam
            </label>

            <button
              type="button"
              onClick={() => loadData()}
              className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white hover:brightness-110"
            >
              <RiRefreshLine />
              Refresh
            </button>
          </div>
        </div>

        {meta ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              Hari ini: <span className="font-semibold text-neutral-700">{meta.today}</span>
            </span>
            <span className="rounded-full bg-neutral-100 px-3 py-1">
              Auto nonaktif setelah{" "}
              <span className="font-semibold text-neutral-700">
                {meta.deactivate_after_days} hari
              </span>
            </span>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Foto
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Guru
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Kontak
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Jadwal Aktif
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Jadwal Kosong Sejak
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 text-right">
                  Log
                </th>
              </tr>
            </thead>
            {renderBody()}
          </table>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-600">
            Total: <span className="font-semibold text-neutral-900">{total}</span> guru
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              disabled={page <= 1}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                page <= 1 ? "cursor-not-allowed opacity-50" : "hover:bg-neutral-50"
              }`}
            >
              Prev
            </button>

            {pageWindow(pageCount, page).map((p, idx) =>
              p === "…" ? (
                <span key={`dots-${idx}`} className="px-2 text-neutral-400">
                  …
                </span>
              ) : (
                <button
                  key={`p-${p}`}
                  type="button"
                  onClick={() => goTo(p)}
                  className={`rounded-xl border px-3 py-1.5 text-sm ${
                    p === page ? "border-neutral-900 bg-neutral-900 text-white" : "hover:bg-neutral-50"
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => goTo(page + 1)}
              disabled={page >= pageCount}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                page >= pageCount ? "cursor-not-allowed opacity-50" : "hover:bg-neutral-50"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-neutral-900">Log Reminder Jadwal</p>
                <p className="text-sm text-neutral-500">
                  {selected.nama ?? "-"} · ID {selected.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="p-5">
              {logLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`log-skeleton-${i}`} className="h-5 w-full animate-pulse rounded bg-black/10" />
                  ))}
                </div>
              ) : logError ? (
                <div className="rounded-xl bg-rose-50 p-4 text-rose-700">{logError}</div>
              ) : !logs.length ? (
                <div className="rounded-xl bg-neutral-50 p-4 text-neutral-700">
                  Belum ada log reminder untuk guru ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Due At
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Key
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Status
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          WhatsApp
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          In-App
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Sent At
                        </th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-neutral-200 last:border-0">
                          <td className="px-3 py-3 text-neutral-700">
                            {formatDateTime(log.due_at)}
                          </td>
                          <td className="px-3 py-3 text-neutral-700">
                            <div className="font-semibold">{log.reminder_key}</div>
                            <div className="text-xs text-neutral-500">seq: {log.reminder_sequence}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`font-semibold ${getStatusColor(String(log.status ?? ""))}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-neutral-700">{log.whatsapp_status ?? "-"}</td>
                          <td className="px-3 py-3 text-neutral-700">{log.in_app_status ?? "-"}</td>
                          <td className="px-3 py-3 text-neutral-700">
                            {formatDateTime(log.sent_at)}
                          </td>
                          <td className="px-3 py-3 text-xs text-neutral-600">
                            {log.whatsapp_error || log.in_app_error || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-neutral-600">
                  Total log: <span className="font-semibold text-neutral-900">{logTotal}</span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToLogPage(logPage - 1)}
                    disabled={logPage <= 1}
                    className={`rounded-xl border px-3 py-1.5 text-sm ${
                      logPage <= 1 ? "cursor-not-allowed opacity-50" : "hover:bg-neutral-50"
                    }`}
                  >
                    Prev
                  </button>

                  {pageWindow(logPageCount, logPage).map((p, idx) =>
                    p === "…" ? (
                      <span key={`ldots-${idx}`} className="px-2 text-neutral-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={`lp-${p}`}
                        type="button"
                        onClick={() => goToLogPage(p)}
                        className={`rounded-xl border px-3 py-1.5 text-sm ${
                          p === logPage
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "hover:bg-neutral-50"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => goToLogPage(logPage + 1)}
                    disabled={logPage >= logPageCount}
                    className={`rounded-xl border px-3 py-1.5 text-sm ${
                      logPage >= logPageCount ? "cursor-not-allowed opacity-50" : "hover:bg-neutral-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TutorNoSchedulePage;
