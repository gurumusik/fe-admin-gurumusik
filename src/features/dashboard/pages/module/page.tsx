/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/module/pages/AdminModulePage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  RiBarChartFill,
  RiSearchLine,
  RiArrowDownSLine,
  RiPencilFill,
  RiFileForbidFill,
  RiFileUploadFill,
  RiQuestionFill,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import { getStatusColor } from "@/utils/getStatusColor";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";

import {
  fetchModulesAdminThunk,
  setModuleQuery,
  setModuleType,
  updateModuleStatusAdminThunk,
} from "@/features/slices/module/slice";

import type {
  SummaryCounts,
  ModuleRow,
  ModuleType,
  ConfirmState,
  ResultState,
} from "@/features/slices/module/types";

/* ===== Helpers ===== */
const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
const nfIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const typeBadge = (t: ModuleType) =>
  t === "Video" ? "bg-[var(--accent-orange-color)] text-white" : "bg-[var(--accent-purple-color)] text-white";

/* ===== Tone styles (ringkasan) ===== */
const toneClasses: Record<"blue" | "red" | "orange", { bg: string }> = {
  blue: { bg: "bg-[var(--secondary-light-color)]" },
  red: { bg: "bg-[var(--accent-red-light-color)]" },
  orange: { bg: "bg-[var(--accent-orange-light-color)]" },
};

/* ===== Tooltip mini (non-lib) ===== */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={cls(
          "pointer-events-none absolute z-20 whitespace-nowrap rounded-full",
          "bg-neutral-800 text-white px-3 py-1.5 text-sm font-semibold shadow-lg",
          "bottom-full mb-2 left-1/2 -translate-x-1/2",
          "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0",
          "group-focus-within:opacity-100 group-focus-within:translate-y-0",
          "transition-all duration-150 ease-out"
        )}
      >
        {label}
      </span>
    </span>
  );
}

/* ===== Pagination component ===== */
const PAGE_SIZE = 5;

function Pagination({
  page,
  totalPages,
  onChange,
  startItem,
  endItem,
  totalItems,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  startItem: number;
  endItem: number;
  totalItems: number;
}) {
  const makeRange = () => {
    const maxButtons = 5;
    let start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, Math.min(start, end - maxButtons + 1));
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const range = makeRange();

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-600">
        Menampilkan <span className="font-semibold">{totalItems === 0 ? 0 : startItem}</span>–<span className="font-semibold">{endItem}</span>{" "}
        dari <span className="font-semibold">{totalItems}</span> modul
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={cls(
            "inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-sm",
            "border-[var(--secondary-light-color)] bg-white hover:bg-[var(--secondary-light-color)]",
            page === 1 && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Halaman sebelumnya"
        >
          <RiArrowLeftSLine className="text-[18px]" />
          Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {range[0] > 1 && (
            <>
              <button
                onClick={() => onChange(1)}
                className={cls(
                  "h-9 w-9 rounded-xl border text-sm",
                  "border-[var(--secondary-light-color)] bg-white hover:bg-[var(--secondary-light-color)]"
                )}
              >
                1
              </button>
              {range[0] > 2 && <span className="px-1 text-sm text-gray-500">…</span>}
            </>
          )}

          {range.map((p) => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cls(
                "h-9 w-9 rounded-xl border text-sm",
                "border-[var(--secondary-light-color)]",
                p === page ? "bg-[var(--secondary-color)] text-white" : "bg-white hover:bg-[var(--secondary-light-color)]"
              )}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}

          {range[range.length - 1] < totalPages && (
            <>
              {range[range.length - 1] < totalPages - 1 && <span className="px-1 text-sm text-gray-500">…</span>}
              <button
                onClick={() => onChange(totalPages)}
                className={cls(
                  "h-9 w-9 rounded-xl border text-sm",
                  "border-[var(--secondary-light-color)] bg-white hover:bg-[var(--secondary-light-color)]"
                )}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={cls(
            "inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-sm",
            "border-[var(--secondary-light-color)] bg-white hover:bg-[var(--secondary-light-color)]",
            page === totalPages && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Halaman berikutnya"
        >
          Next
          <RiArrowRightSLine className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}

/* ===== Page ===== */
export default function AdminModulePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // ===== Redux State (fallback kalau reducer key beda) =====
  const { items, counts, status, error, filters } = useSelector((s: RootState) => (s as any).modulesAdmin ?? {
    items: [] as ModuleRow[],
    counts: { active: 0, inactive: 0, requests: 0 } as SummaryCounts,
    status: "idle" as "idle" | "loading" | "succeeded" | "failed",
    error: null as string | null,
    filters: { q: "", type: "ALL" as "ALL" | ModuleType },
  });

  // ===== Local UI filter tambahan: status (client-side) =====
  const [statusF, setStatusF] = useState<"ALL" | ModuleRow["status"]>("ALL");

  // ===== Pagination state =====
  const [page, setPage] = useState<number>(1);

  // Fetch on mount + ketika filter q/type berubah (thunk baca dari state)
  useEffect(() => {
    dispatch(fetchModulesAdminThunk());
  }, [dispatch, filters.q, filters.type]);

  // Derived rows (tetap filter q/type client-side supaya responsif saat user mengetik)
  const rows = useMemo<ModuleRow[]>(() => {
    const q = (filters.q || "").trim().toLowerCase();

    return ((items as ModuleRow[]) || [])
      // ⬇️ sembunyikan semua yang status aslinya "Diperiksa Admin"
      .filter((m: ModuleRow) => m.statusRaw !== "Diperiksa Admin")
      .filter((m: ModuleRow) => {
        const matchQ = m.title.toLowerCase().includes(q);
        const matchType = filters.type === "ALL" ? true : m.type === filters.type;
        const matchStatus = statusF === "ALL" ? true : m.status === statusF;
        return matchQ && matchType && matchStatus;
      });
  }, [items, filters.q, filters.type, statusF]);

  // Reset page ketika filter berubah
  useEffect(() => {
    setPage(1);
  }, [filters.q, filters.type, statusF]);

  // Paging derivation
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIdx = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(totalItems, page * PAGE_SIZE);

  const pageRows = useMemo<ModuleRow[]>(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  /* ===== Modal States & Actions ===== */
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [result, setResult] = useState<ResultState>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirm) return;
    setLoading(true);
    try {
      await dispatch(
        updateModuleStatusAdminThunk({
          id: confirm.item.id,
          mode: confirm.mode, // 'activate' | 'deactivate'
        })
      ).unwrap();

      setResult({ mode: confirm.mode, type: "success" });
    } catch {
      setResult({ mode: confirm.mode, type: "error" });
    } finally {
      setConfirm(null);
      setLoading(false);
      // Thunk sudah re-fetch list; di sini tidak wajib dispatch ulang.
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ===== Section: Ringkasan Modul ===== */}
      <section className="rounded-2xl bg-white p-4 sm:p-5">
        <header className="mb-4 sm:mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--secondary-color)]">
            <RiBarChartFill size={25} className="text-white" />
          </div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">Ringkasan Modul</h2>
        </header>

        {status === "failed" && error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <SummaryCard title="Modul Aktif" value={counts.active} tone="blue" />
          <SummaryCard title="Modul Non-Aktif" value={counts.inactive} tone="red" />
          <SummaryCard
            title="Request Modul"
            value={counts.requests}
            tone="orange"
            actionLabel="Lihat Request"
            onAction={() => navigate("/dashboard-admin/module/request")}
          />
        </div>

        {status === "loading" && (
          <p className="mt-3 text-sm text-gray-500">Memuat data modul...</p>
        )}
      </section>

      {/* ===== Section: List Modul ===== */}
      <section className="rounded-2xl bg-white p-4 sm:p-5">
        {/* Top controls */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-md">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.q}
              onChange={(e) => dispatch(setModuleQuery(e.target.value))}
              placeholder="Cari Judul Modul, cth: Musik itu Gampang"
              className="w-full pl-10 pr-3 h-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <RiArrowDownSLine className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filters.type}
                onChange={(e) => dispatch(setModuleType(e.target.value as any))}
                className="appearance-none w-48 h-10 pr-9 pl-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="ALL">Pilih Tipe Module</option>
                <option value="Video">Video</option>
                <option value="E-Book">E-Book</option>
              </select>
            </div>

            <div className="relative">
              <RiArrowDownSLine className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusF}
                onChange={(e) => setStatusF(e.target.value as any)}
                className="appearance-none w-40 h-10 pr-9 pl-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="ALL">Pilih Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[720px] overflow-hidden rounded-2xl">
            <table className="w-full text-md">
              <thead className="bg-gray-100 text-neutral-900">
                <tr>
                  <th className="p-5 text-left font-semibold">Gambar</th>
                  <th className="p-5 text-left font-semibold">Judul Module</th>
                  <th className="p-5 text-left font-semibold">Harga</th>
                  <th className="p-5 text-left font-semibold">Terjual</th>
                  <th className="p-5 text-left font-semibold">Tipe Module</th>
                  <th className="p-5 text-left font-semibold">Status</th>
                  <th className="p-5 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {status === "loading" && (
                  <tr>
                    <td colSpan={7} className="p-6 text-sm text-neutral-600">Memuat data...</td>
                  </tr>
                )}

                {status !== "loading" && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                      Tidak ada modul yang cocok dengan filter.
                    </td>
                  </tr>
                )}

                {pageRows.map((m: ModuleRow) => (
                  <tr key={m.uuid}>
                    <td className="p-5">
                      <img src={m.image} alt={m.title} className="h-16 w-28 rounded-xl object-cover" />
                    </td>
                    <td className="p-5 text-gray-900">{m.title}</td>
                    <td className="p-5 text-gray-900">{nfIDR(m.price)}</td>
                    <td className="p-5 text-gray-900">{m.sold}</td>
                    <td className="p-5">
                      <span className={cls("inline-flex items-center rounded-full px-3 py-1 min-w-[80px] text-sm justify-center font-medium", typeBadge(m.type))}>
                        {m.type}
                      </span>
                    </td>
                    <td className={cls("p-5 font-medium", getStatusColor(m.status))}>{m.status}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        {/* Edit */}
                        <Tooltip label="Edit Modul">
                          <button
                            aria-label="Edit"
                            onClick={() => navigate(`/dashboard-admin/module/edit-module/${m.id}`)}
                            className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--secondary-light-color)] text-[var(--secondary-color)] hover:bg-blue-100 focus:outline-none"
                          >
                            <RiPencilFill size={22} />
                          </button>
                        </Tooltip>

                        {/* Conditional: Non-Aktifkan / Aktifkan */}
                        {m.status === "Aktif" ? (
                          <Tooltip label="Non-Aktifkan Modul">
                            <button
                              aria-label="Non-Aktifkan"
                              disabled={loading}
                              onClick={() => setConfirm({ mode: "deactivate", item: m })}
                              className={cls(
                                "grid h-10 w-10 place-items-center rounded-xl text-[var(--accent-red-color)] hover:bg-red-100 focus:outline-none",
                                loading && "opacity-60 pointer-events-none"
                              )}
                            >
                              <RiFileForbidFill size={22} />
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip label="Aktifkan Modul">
                            <button
                              aria-label="Aktifkan"
                              disabled={loading}
                              onClick={() => setConfirm({ mode: "activate", item: m })}
                              className={cls(
                                "grid h-10 w-10 place-items-center rounded-xl text-[var(--accent-green-color)] hover:bg-green-100 focus:outline-none",
                                loading && "opacity-60 pointer-events-none"
                              )}
                            >
                              <RiFileUploadFill size={22} />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination controls */}
            {status !== "loading" && totalItems > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
                startItem={startIdx}
                endItem={endIdx}
                totalItems={totalItems}
              />
            )}
          </div>
        </div>
      </section>

      {/* ===== Modal: Warning Confirm ===== */}
      {confirm && (
        <ConfirmationModal
          isOpen
          onClose={() => setConfirm(null)}
          icon={<RiQuestionFill className="text-3xl" />}
          iconTone="warning"
          title={confirm.mode === "activate" ? "Yakin...Mau Mengaktifkan Modul?" : "Yakin...Mau Nonaktifkan Modul?"}
          texts={[
            confirm.mode === "activate"
              ? "Kalau diaktifkan, modul ini bisa dibeli oleh murid. Tenang, murid yang sudah membeli tetap bisa mengaksesnya."
              : "Kalau dinonaktifkan, modul ini tidak bisa dibeli lagi. Tenang, murid yang sudah membeli tetap bisa akses.",
          ]}
          button2={{
            label: "Ga Jadi Deh",
            variant: "outline",
            onClick: () => setConfirm(null),
          }}
          button1={{
            label: "Ya, Saya Yakin",
            variant: "primary",
            onClick: handleConfirm,
            loading,
          }}
          widthClass="max-w-md"
        />
      )}

      {/* ===== Modal: Success ===== */}
      {result && result.type === "success" && (
        <ConfirmationModal
          isOpen
          onClose={() => setResult(null)}
          icon={<RiCheckboxCircleFill className="text-3xl" />}
          iconTone="success"
          title={result.mode === "activate" ? "Modul Berhasil Diaktifkan" : "Modul Berhasil Dinonaktifkan"}
          texts={[
            result.mode === "activate"
              ? "Modul ini sekarang sudah bisa dibeli lagi oleh murid, dan murid lama tetap bisa mengaksesnya."
              : "Modul ini sudah tidak bisa dibeli lagi, tapi murid yang sudah membeli tetap bisa mengaksesnya.",
          ]}
          showCloseIcon
          widthClass="max-w-md"
        />
      )}

      {/* ===== Modal: Error ===== */}
      {result && result.type === "error" && (
        <ConfirmationModal
          isOpen
          onClose={() => setResult(null)}
          icon={<RiCloseLine className="text-3xl" />}
          iconTone="danger"
          title={result.mode === "activate" ? "Modul Gagal Diaktifkan" : "Modul Gagal Dinonaktifkan"}
          texts={["Terjadi kendala saat memproses modul ini. Silakan coba lagi beberapa saat lagi."]}
          showCloseIcon
          widthClass="max-w-md"
        />
      )}
    </div>
  );
}

/* ===== Reusable ===== */
function SummaryCard({
  title,
  value,
  tone,
  actionLabel,
  onAction,
}: {
  title: string;
  value: number | string;
  tone: keyof typeof toneClasses;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = toneClasses[tone];
  return (
    <div className={cls("rounded-2xl p-4 sm:p-5", t.bg)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-md text-gray-600">{title}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        {actionLabel ? (
          <button onClick={onAction} className="shrink-0 h-8 px-3 text-sm bg-white rounded-full border border-blue-400 text-blue-600 hover:bg-blue-50 transition">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
