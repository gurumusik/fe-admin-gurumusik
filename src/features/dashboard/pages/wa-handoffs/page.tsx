import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RiCheckboxCircleLine, RiFilter3Line, RiMessage2Line } from "react-icons/ri";
import { listWaHandoffs, resolveWaHandoff, type WaHandoffItem } from "@/services/api/waHandoff.api";

const pageSize = 20;

type StatusFilter = "all" | "pending" | "done";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Pending" },
  { value: "done", label: "Done" },
];

const statusTone: Record<Exclude<StatusFilter, "all">, string> = {
  pending: "text-[var(--accent-orange-color)]",
  done: "text-[var(--accent-green-color)]",
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const WaHandoffsPage: React.FC = () => {
  const [rows, setRows] = useState<WaHandoffItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [updatingId, setUpdatingId] = useState<number | string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const solved =
        statusFilter === "all" ? undefined : statusFilter === "done" ? true : false;
      const res = await listWaHandoffs({ page, limit: pageSize, solved });
      setRows(res?.data ?? []);
      setTotal(Number(res?.total ?? 0));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat WA handoff.";
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
        await resolveWaHandoff(id);
        if (statusFilter === "pending") {
          await loadData();
          return;
        }
        setRows((prev) =>
          prev.map((row) =>
            row.id === id ? { ...row, solved: true, solved_at: new Date().toISOString() } : row
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal mengubah status.";
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
                <RiMessage2Line size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">WA Admin Queue</p>
                <p className="text-sm text-neutral-500">
                  Daftar nomor yang sedang ditangani admin
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              <div className="relative">
                <RiFilter3Line
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={18}
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

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nomor WA</th>
                  <th className="px-4 py-3 font-semibold">Alasan</th>
                  <th className="px-4 py-3 font-semibold">Pesan Masuk</th>
                  <th className="px-4 py-3 font-semibold">Pesan Terakhir</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((row) => {
                    const solved = Boolean(row.solved);
                    const statusKey: Exclude<StatusFilter, "all"> = solved ? "done" : "pending";
                    return (
                      <tr key={row.id} className="bg-white">
                        <td className="px-4 py-4 font-medium text-neutral-900">{row.from_number}</td>
                        <td className="px-4 py-4 text-neutral-600">{row.handoff_reason || "-"}</td>
                        <td className="px-4 py-4 text-neutral-600">
                          {formatDateTime(row.first_message_at)}
                        </td>
                        <td className="px-4 py-4 text-neutral-600">
                          {formatDateTime(row.last_message_at)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`font-semibold ${statusTone[statusKey]}`}>
                            {solved ? "Done" : "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {solved ? (
                            <span className="inline-flex items-center gap-2 text-emerald-600">
                              <RiCheckboxCircleLine />
                              Selesai
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkDone(row.id)}
                              disabled={updatingId === row.id}
                              className="inline-flex items-center gap-2 rounded-full border border-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RiCheckboxCircleLine size={16} />
                              Tandai Selesai
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-neutral-600">
            <p>
              Menampilkan {rows.length ? (page - 1) * pageSize + 1 : 0}-
              {Math.min(page * pageSize, total)} dari {total} data
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-9 rounded-full border border-neutral-200 px-4 font-semibold text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Prev
              </button>
              <span className="text-sm font-semibold text-neutral-700">
                {page} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount || loading}
                className="h-9 rounded-full border border-neutral-200 px-4 font-semibold text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WaHandoffsPage;
