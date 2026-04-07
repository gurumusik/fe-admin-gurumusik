import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiSearchLine,
  RiTimeLine,
  RiUserLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiLoader4Line,
} from "react-icons/ri";
import { adminGetAllSesi, type AdminSesiItem } from "@/services/api/sesi.api";
import { adminCreateReschedule } from "@/services/api/reschedule.api";
import { toIsoDate, formatDateID, formatTime, resolveName } from "./helpers";
import { inputCls, Tag, Field, StatusPill } from "./components";

const LIMIT = 15;

/* ─── main component ─────────────────────────────────── */

const MakeReschedulePage: React.FC = () => {
  /* ── list sesi (server-side) ── */
  const [sesiList, setSesiList]   = useState<AdminSesiItem[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── search (debounced) ── */
  const [search, setSearch]   = useState("");
  const [query, setQuery]     = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── sort mode ── */
  type SortMode = "default" | "terlewat" | "belum_dimulai";
  const [sortMode, setSortMode] = useState<SortMode>("default");

  /* ── selected sesi ── */
  const [selected, setSelected] = useState<AdminSesiItem | null>(null);

  /* ── form jadwal baru ── */
  const tomorrow = toIsoDate(new Date(Date.now() + 86_400_000));
  const [newDate, setNewDate]   = useState(tomorrow);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd]     = useState("10:00");
  const [reason, setReason]     = useState("");

  /* ── submit ── */
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* ── sorted list ── */
  const STATUS_RANK: Record<string, number> = {
    "kelas terlewat": 0,
    "absen awal":     1,
    "belum dimulai":  2,
  };

  function sortedList(list: AdminSesiItem[]): AdminSesiItem[] {
    if (sortMode === "terlewat") {
      return [...list].sort((a, b) => {
        const ra = STATUS_RANK[a.status] ?? 9;
        const rb = STATUS_RANK[b.status] ?? 9;
        return ra - rb;
      });
    }
    if (sortMode === "belum_dimulai") {
      return [...list].sort((a, b) => {
        const ra = STATUS_RANK[a.status] ?? 9;
        const rb = STATUS_RANK[b.status] ?? 9;
        return rb - ra; // balik: belum dimulai dulu
      });
    }
    return list; // default: urutan server (tanggal ASC)
  }

  const displayList = sortedList(sesiList);

  /* ── fetch ── */
  const fetchSesi = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await adminGetAllSesi({ page: p, limit: LIMIT, q: q || undefined, sort_dir: "asc" });
      setSesiList(res.data ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 0);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Gagal memuat sesi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSesi(page, query); }, [fetchSesi, page, query]);

  /* ── search debounce ── */
  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setQuery(val);
    }, 400);
  }

  /* ── select sesi ── */
  function handleSelect(s: AdminSesiItem) {
    setSelected(s);
    setSubmitError(null);
    setSubmitSuccess(false);
    const sesiDate = s.tanggal ? new Date(s.tanggal) : new Date();
    sesiDate.setDate(sesiDate.getDate() + 1);
    setNewDate(toIsoDate(sesiDate));
    setNewStart(s.waktu_mulai?.slice(0, 5) ?? "09:00");
    setNewEnd(s.waktu_selesai?.slice(0, 5) ?? "10:00");
    setReason("");
  }

  /* ── submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminCreateReschedule({
        sesi_id: selected.sesi_id,
        new_date: newDate,
        new_start: newStart,
        new_end: newEnd,
        reason: reason.trim() || null,
      });
      setSubmitSuccess(true);
      setSelected(null);
      fetchSesi(page, query);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal membuat reschedule.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── pagination helpers ── */
  const canPrev = page > 1;
  const canNext = page < totalPages;

  /* ─── render ─── */
  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="rounded-2xl bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-color)] text-[var(--accent-blue-color)]">
              <RiCalendarLine size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900">Buat Reschedule (Admin)</p>
              <p className="text-sm text-neutral-500">
                Jadwal langsung berubah · Notifikasi dikirim ke guru &amp; murid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Success banner */}
      {submitSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <RiCheckLine className="shrink-0 text-emerald-600" size={22} />
          <div>
            <p className="font-semibold text-emerald-800">Reschedule berhasil dibuat</p>
            <p className="text-sm text-emerald-700">
              Jadwal diperbarui · Notifikasi dikirim ke guru &amp; murid.
            </p>
          </div>
          <button type="button" className="ml-auto shrink-0 text-emerald-500 hover:text-emerald-700" onClick={() => setSubmitSuccess(false)}>
            <RiCloseLine size={18} />
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* LEFT: Pilih Sesi */}
        <section className="lg:col-span-2 rounded-2xl bg-white shadow-sm flex flex-col">
          <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col min-h-0">
            <p className="font-semibold text-neutral-800">1. Pilih Sesi</p>

            {/* Search */}
            <div className="relative">
              <RiSearchLine size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari nama guru atau murid…"
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-4 text-sm text-neutral-800 outline-none transition focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[var(--secondary-color)]/20"
              />
            </div>

            {/* Sort buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-neutral-500">Urutkan:</span>
              {(["default", "terlewat", "belum_dimulai"] as const).map((mode) => {
                const labels = {
                  default: "Default",
                  terlewat: "Terlewat dulu",
                  belum_dimulai: "Belum dimulai dulu",
                };
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSortMode(mode)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      sortMode === mode
                        ? "bg-[var(--secondary-color)] text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>

            {/* Info */}
            {!loading && !loadError && (
              <p className="text-xs text-neutral-400">
                {query
                  ? `${total} sesi ditemukan untuk "${query}"`
                  : `Total ${total} sesi`}
              </p>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-neutral-400">
                  <RiLoader4Line className="animate-spin" size={20} />
                  <span className="text-sm">Memuat…</span>
                </div>
              )}
              {!loading && loadError && (
                <p className="py-8 text-center text-sm text-red-500">{loadError}</p>
              )}
              {!loading && !loadError && sesiList.length === 0 && (
                <p className="py-10 text-center text-sm text-neutral-400">Tidak ada sesi.</p>
              )}
              {!loading && !loadError && displayList.map((s) => {
                const isActive = selected?.sesi_id === s.sesi_id;
                const guruName  = resolveName(s.guru,  "Guru");
                const muridName = resolveName(s.murid, "Murid");
                return (
                  <button
                    key={s.sesi_id}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-[var(--secondary-color)] bg-[var(--secondary-color)]/5 ring-1 ring-[var(--secondary-color)]"
                        : "border-neutral-200 bg-white hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {s.sesi_ke != null && <Tag>Sesi ke-{s.sesi_ke}</Tag>}
                            {s.instrumen?.nama_instrumen && (
                              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                                {s.instrumen.nama_instrumen}
                              </span>
                            )}
                            <StatusPill status={s.status} />
                          </div>
                          <p className="mt-1.5 truncate text-sm font-semibold text-neutral-800">
                            {guruName}{" "}
                            <span className="font-normal text-neutral-400">↔</span>{" "}
                            {muridName}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                            <RiCalendarLine size={12} />
                            {formatDateID(s.tanggal)}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                            <RiTimeLine size={12} />
                            {formatTime(s.waktu_mulai)} – {formatTime(s.waktu_selesai)}
                          </p>
                        </div>
                      {isActive && (
                        <RiCheckLine className="mt-0.5 shrink-0 text-[var(--secondary-color)]" size={18} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {!loading && !loadError && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!canPrev}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
                >
                  <RiArrowLeftLine size={14} />
                  Prev
                </button>
                <span className="text-xs text-neutral-500">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!canNext}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40"
                >
                  Next
                  <RiArrowRightLine size={14} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: Form Jadwal Baru */}
        <section className="lg:col-span-3 rounded-2xl bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <p className="font-semibold text-neutral-800 mb-4">2. Isi Jadwal Baru</p>

            {!selected ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-neutral-400">
                <RiUserLine size={40} />
                <p className="text-sm">Pilih sesi terlebih dahulu.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Info sesi terpilih */}
                <div className="rounded-xl border border-[var(--secondary-color)]/30 bg-[var(--secondary-color)]/5 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--secondary-color)]">
                    Sesi terpilih
                  </p>
                  <p className="text-sm font-semibold text-neutral-800">
                    {resolveName(selected.guru, "Guru")} ↔ {resolveName(selected.murid, "Murid")}
                    {selected.sesi_ke != null && (
                      <span className="ml-2 text-xs font-normal text-neutral-500">· Sesi ke-{selected.sesi_ke}</span>
                    )}
                    {selected.instrumen?.nama_instrumen && (
                      <span className="ml-2 text-xs font-normal text-neutral-400">· {selected.instrumen.nama_instrumen}</span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-600">
                    Jadwal lama:{" "}
                    <span className="font-medium">
                      {formatDateID(selected.tanggal)}, {formatTime(selected.waktu_mulai)} – {formatTime(selected.waktu_selesai)}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Status: <span className="capitalize font-medium">{selected.status}</span>
                  </p>
                </div>

                <Field label="Tanggal Baru">
                  <input
                    type="date"
                    value={newDate}
                    min={tomorrow}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Jam Mulai">
                    <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} required className={inputCls} />
                  </Field>
                  <Field label="Jam Selesai">
                    <input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} required className={inputCls} />
                  </Field>
                </div>

                <Field label="Alasan Reschedule (opsional)">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Mis: permintaan murid, ketersediaan guru, dll."
                    className={inputCls + " resize-none"}
                  />
                </Field>

                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl bg-[var(--secondary-color)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RiLoader4Line className="animate-spin" size={16} />
                        Menyimpan…
                      </>
                    ) : (
                      <>
                        <RiCheckLine size={16} />
                        Terapkan Reschedule
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MakeReschedulePage;
