import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RiFileList2Line,
  RiSearchLine,
  RiMailLine,
  RiWhatsappLine,
  RiCloseLine,
} from "react-icons/ri";
import defaultUser from "@/assets/images/default-user.png";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { getStatusColor } from "@/utils/getStatusColor";
import {
  listIncompleteGurus,
  type IncompleteGuruItem,
} from "@/services/api/guruIncomplete.api";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "aktif" | "non_aktif" | "cuti";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "aktif", label: "Aktif" },
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

const normalizePhoneForWa = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

const buildMissingText = (item: IncompleteGuruItem) => {
  const labels = item.missing_fields.map((m) => m.label).filter(Boolean);
  return labels.length ? labels.join(", ") : "data profil";
};

const buildEmailLink = (item: IncompleteGuruItem) => {
  if (!item.email) return null;
  const subject = encodeURIComponent("Lengkapi Data GuruMusik");
  const body = encodeURIComponent(
    `Halo ${item.nama ?? "Kak"},\n\n` +
      `Data profil GuruMusik kamu masih belum lengkap. ` +
      `Mohon lengkapi data berikut: ${buildMissingText(item)}.\n\n` +
      `Terima kasih.\nGuruMusik Admin`
  );
  return `mailto:${item.email}?subject=${subject}&body=${body}`;
};

const buildWaLink = (item: IncompleteGuruItem) => {
  const phone = item.phone_normalized || normalizePhoneForWa(item.no_telp);
  if (!phone) return null;
  const text = encodeURIComponent(
    `Halo ${item.nama ?? "Kak"}, data profil GuruMusik kamu masih belum lengkap. ` +
      `Mohon lengkapi: ${buildMissingText(item)}. Terima kasih.`
  );
  return `https://wa.me/${phone}?text=${text}`;
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

const TutorIncompletePage: React.FC = () => {
  const [rows, setRows] = useState<IncompleteGuruItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [selected, setSelected] = useState<IncompleteGuruItem | null>(null);

  const debounceRef = useRef<number | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listIncompleteGurus({
        page,
        limit: PAGE_SIZE,
        q: query || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRows(res?.data ?? []);
      setTotal(Number(res?.total ?? 0));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data guru.";
      setError(message);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, query, statusFilter]);

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

  const renderBody = () => {
    if (loading) {
      return (
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={`skeleton-${i}`}>
              <td className="px-4 py-4" colSpan={6}>
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
            <td className="px-4 py-6 text-red-600" colSpan={6}>
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
            <td className="px-4 py-6 text-neutral-900" colSpan={6}>
              Tidak ada guru dengan data yang belum lengkap.
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {visibleRows.map((row) => {
          const statusText = statusLabel(row.status_akun);
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
                <p className="text-xs text-neutral-500">{row.nama_panggilan ?? "-"}</p>
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
              <td className="px-4 py-4">
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {row.missing_fields.length} data
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="rounded-full border border-(--secondary-color) px-4 py-1.5 text-xs font-semibold text-(--secondary-color) hover:bg-(--secondary-light-color)"
                >
                  Lihat Detail
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  const goTo = (p: number) => {
    const safe = Math.min(Math.max(1, p), pageCount);
    if (safe !== page) setPage(safe);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-(--primary-color)">
              <RiFileList2Line size={22} className="text-black" />
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900">Guru Belum Lengkap</p>
              <p className="text-sm text-neutral-500">
                Daftar guru dengan data profil yang masih kosong.
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
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPage(1);
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setPage(1);
                setQuery("");
                setSearchText("");
                setStatusFilter("all");
              }}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm text-black hover:bg-black/5"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-neutral-500">Total: {total} guru</div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="overflow-hidden rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="w-[90px] px-4 py-3 font-semibold">Profile</th>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Kontak</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Data Kosong</th>
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            {renderBody()}
          </table>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="px-3 py-2 text-sm text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Previous page"
          >
            &lt;
          </button>

          {pageWindow(pageCount, page).map((p, i) =>
            p === "…" ? (
              <span key={`dots-${i}`} className="px-3 py-2 text-sm text-black/40">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                className={`rounded-xl border border-(--secondary-color) px-3 py-1 text-sm ${
                  p === page
                    ? "bg-(--secondary-light-color) text-(--secondary-color)"
                    : "text-black/70 hover:bg-black/5"
                }`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= pageCount}
            className="px-3 py-2 text-sm text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
              aria-label="Tutup"
            >
              <RiCloseLine size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full">
                <img
                  src={resolveImageUrl(selected.profile_pic_url ?? null) || defaultUser}
                  alt={selected.nama ?? "Guru"}
                  className="h-12 w-12 object-cover"
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-neutral-900">{selected.nama ?? "-"}</p>
                <p className="text-sm text-neutral-500">{selected.email ?? "-"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-900">Data yang belum lengkap</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.missing_fields.map((field) => (
                  <span
                    key={field.key}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-700"
                  >
                    {field.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(() => {
                const mailto = buildEmailLink(selected);
                return (
                  <a
                    href={mailto ?? "#"}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-(--secondary-color) px-4 py-2 text-sm font-semibold text-(--secondary-color) hover:bg-(--secondary-light-color) ${
                      mailto ? "" : "pointer-events-none opacity-50"
                    }`}
                  >
                    <RiMailLine size={16} />
                    Kirim Email
                  </a>
                );
              })()}
              {(() => {
                const wa = buildWaLink(selected);
                return (
                  <a
                    href={wa ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 ${
                      wa ? "" : "pointer-events-none opacity-50"
                    }`}
                  >
                    <RiWhatsappLine size={16} />
                    Chat WhatsApp
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TutorIncompletePage;
