// src/features/dashboard/pages/promo/ManageFlashsalePage.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import {
  RiFlashlightFill, RiUser2Fill, RiCalendar2Line, RiAddLine,
  RiArrowLeftLine, RiArrowDownSLine, RiBook2Fill,
  RiCheckboxCircleFill, RiCloseLine,
} from "react-icons/ri";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/app/store";

import {
  createPromo,
  updatePromo,
  getPromo,
  getFlashsaleItemsByPromo,
  updateFlashsaleItems,
} from "@/services/api/promo.api";
import { fetchFlashPromosThunk } from "@/features/slices/promo/slice";
import type { CreatePromoPayload } from "@/features/slices/promo/types";
import { resolveImageUrl } from "@/utils/resolveImageUrl";

import TutorFlashsaleModal, { type Tutor } from "@/features/dashboard/components/TutorFlashsaleModal";
import ModulFlashsaleModal, { type Modul } from "@/features/dashboard/components/ModulFlashsaleModal";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
import NotFound from "@/assets/images/NotFound.png";

type FlashType = "Tutor" | "Modul";

type FlashsaleState = {
  id?: number | string;
  type?: FlashType;
  typeLabel?: string;
  discountPct?: number;
  startDate?: string; // dd/MM/yyyy
  endDate?: string;
  status?: "Aktif" | "Non-Aktif";
};

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

// Helper generate code
function generateCode(kind: "Tutor" | "Modul", percent: number, yyyyMmDd: string) {
  const y = yyyyMmDd.slice(0, 4);
  const m = yyyyMmDd.slice(5, 7);
  const d = yyyyMmDd.slice(8, 10);
  const pct = String(Math.max(1, Math.min(99, Math.floor(percent))));
  const rnd = String(Date.now()).slice(-4);
  return kind === "Tutor"
    ? `FLASH_TUTOR_${y}${m}${d}_${pct}_${rnd}`
    : `FLASH_MODUL_${y}${m}${d}_${pct}_${rnd}`;
}

// ISO → "YYYY-MM-DD" untuk <input type="date">
function isoToInputDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const ManageFlashsalePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { state } = useLocation() as { state?: FlashsaleState };

  const LIST_URL = "/dashboard-admin/manage-promo/"; // ← target redirect setelah modal ditutup
  const goToList = () => navigate(LIST_URL);

  const isEdit = Boolean(state?.id);

  // form
  const [flashType, setFlashType] = useState<FlashType | "">(state?.type ?? "");
  const [percent, setPercent] = useState<string>(state?.discountPct != null ? String(state.discountPct) : "");
  const [quota, setQuota] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // selection
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [modules, setModules] = useState<Modul[]>([]);
  const [tutorModalOpen, setTutorModalOpen] = useState(false);
  const [modulModalOpen, setModulModalOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState<boolean>(isEdit);

  // Confirmation modal
  const [confirm, setConfirm] = useState<{
    isOpen: boolean; title: string; texts: string[];
    icon: React.ReactNode | null; iconTone: "success" | "warning" | "danger" | "info" | "neutral";
    onAfterClose?: (() => void) | null;
  }>({ isOpen: false, title: "", texts: [], icon: null, iconTone: "neutral", onAfterClose: null });

  const openSuccess = (title: string, texts: string[] = [], after?: () => void) =>
    setConfirm({ isOpen: true, title, texts, icon: <RiCheckboxCircleFill/>, iconTone: "success", onAfterClose: after ?? null });

  const openError = (title: string, texts: string[] = []) =>
    setConfirm({ isOpen: true, title, texts, icon: <RiCloseLine/>, iconTone: "danger", onAfterClose: null });

  const closeConfirm = () => {
    setConfirm(c => {
      const cb = c.onAfterClose;
      const next = { ...c, isOpen: false, onAfterClose: null };
      setTimeout(() => { if (cb) cb(); }, 0);
      return next;
    });
  };

  // ===== Edit mode: fetch promo & items =====
  useEffect(() => {
    let on = true;
    (async () => {
      if (!isEdit || !state?.id) return;
      try {
        setLoadingEdit(true);
        const detail = await getPromo(state.id);
        const p = (detail as any)?.data ?? detail;
        const pct = Number(p.persentase_diskon || 0);
        const max = Number(p.max_usage || 1);
        const pf = String(p.promo_for || '');
        const ft: FlashType = pf === 'class' ? 'Tutor' : 'Modul';

        setFlashType(ft);           // kunci tipe
        setPercent(String(pct));
        setQuota(String(max));
        setStartDate(isoToInputDate(p.started_at ?? p.startedAt ?? p.created_at ?? p.createdAt));
        setEndDate(isoToInputDate(p.expired_at ?? p.expiredAt ?? null));

        const ldfResp = await getFlashsaleItemsByPromo(state.id);
        const items = Array.isArray((ldfResp as any).data) ? (ldfResp as any).data : (Array.isArray(ldfResp) ? ldfResp : []);
        const kind = (ldfResp as any)?.type as 'class'|'modul'|undefined;

        if ((kind ?? pf) === 'class') {
          const tutorsMapped: Tutor[] = (items || [])
            .filter((x: any) => x.user)
            .map((x: any) => ({
              id: String(x.user.id),
              name: x.user.nama ?? x.user.email ?? `User#${x.user.id}`,
              city: '',
              avatar: resolveImageUrl(x.user.profile_pic_url || '') || '',
            }));
          if (on) setTutors(tutorsMapped);
        } else {
          const modulesMapped: Modul[] = (items || [])
            .filter((x: any) => x.modul)
            .map((x: any) => ({
              id: String(x.modul.id),
              title: x.modul.judul ?? `Modul #${x.modul.id}`,
              category: x.modul.instrument?.nama ?? null,
              thumbnail: resolveImageUrl(x.modul.thumbnail_path ?? null),
            }));
          if (on) setModules(modulesMapped);
        }
      } catch (e: any) {
        console.error(e);
        openError("Gagal memuat data flashsale!", [e?.message || "Coba muat ulang halaman."]);
      } finally {
        if (on) setLoadingEdit(false);
      }
    })();
    return () => { on = false; };
  }, [isEdit, state?.id]);

  const isValid = useMemo(() => {
    if (!flashType) return false;
    if (!startDate || !endDate) return false;
    const p = Number(percent);
    const q = Number(quota || "1");
    if (!Number.isFinite(p) || p <= 0) return false;
    if (!Number.isFinite(q) || q <= 0) return false;
    if (new Date(startDate) > new Date(endDate)) return false;
    if (flashType === "Tutor") return tutors.length > 0;
    if (flashType === "Modul") return modules.length > 0;
    return false;
  }, [flashType, percent, quota, startDate, endDate, tutors.length, modules.length]);

  const onRemoveTutor = (id: string) => setTutors(xs => xs.filter(t => t.id !== id));
  const onRemoveModul = (id: string) => setModules(xs => xs.filter(m => m.id !== id));

  const onSave = async () => {
    if (!isValid || saving) return;
    try {
      setSaving(true);

      const p = Number(percent);
      const q = Number(quota || "1");

      // ===== EDIT MODE =====
      if (isEdit && state?.id) {
        // 1) update data promo (tanggal/kuota/diskon)
        await updatePromo(state.id, {
          persentase_diskon: p,
          started_at: startDate,
          expired_at: endDate,
          max_usage: q,
          status: "active",
          is_show: true,
        });

        // 2) sinkron list_data_flashsale (ADD/REMOVE)
        if (flashType === "Tutor") {
          const ids = tutors.map(t => Number.parseInt(t.id, 10)).filter(Number.isFinite);
          await updateFlashsaleItems(state.id, { guru_ids: ids });
        } else {
          const ids = modules.map(m => Number.parseInt(m.id, 10)).filter(Number.isFinite);
          await updateFlashsaleItems(state.id, { modul_ids: ids });
        }

        await dispatch(fetchFlashPromosThunk(undefined));
        openSuccess(
          "Flash sale berhasil diperbarui!",
          [
            `Diskon: ${p}% | Kuota: ${q}`,
            flashType === 'Tutor' ? `Total tutor: ${tutors.length}` : `Total modul: ${modules.length}`,
          ],
          goToList // ← redirect setelah modal ditutup
        );
        return;
      }

      // ===== CREATE MODE =====
      if (flashType === "Tutor") {
        const tutorIds = tutors.map(t => Number.parseInt(t.id, 10)).filter(Number.isFinite);
        const kode_promo = generateCode("Tutor", p, endDate);
        const title = `Flashsale Tutor ${p}%`;

        const payload: CreatePromoPayload & { guru_ids?: number[] } = {
          kode_promo,
          title,
          persentase_diskon: p,
          status: "active",
          started_at: startDate,
          expired_at: endDate,
          max_usage: q,
          promo_for: "class",
          is_show: true,
          guru_ids: tutorIds,
        };
        await createPromo(payload);
        await dispatch(fetchFlashPromosThunk(undefined));
        openSuccess(
          "Flash sale Tutor berhasil dibuat!",
          [
            `Periode: ${startDate} s/d ${endDate}`,
            `Total guru: ${tutorIds.length}`,
          ],
          goToList // ← redirect setelah modal ditutup
        );
        return;
      }

      // MODUL
      const modulIds = modules.map(m => Number.parseInt(m.id, 10)).filter(Number.isFinite);
      const kode_promo = generateCode("Modul", p, endDate);
      const title = `Flashsale Modul ${p}%`;

      const payload: CreatePromoPayload & { modul_ids?: number[] } = {
        kode_promo,
        title,
        persentase_diskon: p,
        status: "active",
        started_at: startDate,
        expired_at: endDate,
        max_usage: q,
        promo_for: "modul",
        is_show: true,
        modul_ids: modulIds,
      };
      await createPromo(payload);
      await dispatch(fetchFlashPromosThunk(undefined));
      openSuccess(
        "Flash sale Modul berhasil dibuat!",
        [
          `Periode: ${startDate} s/d ${endDate}`,
          `Total modul: ${modulIds.length}`,
        ],
        goToList // ← redirect setelah modal ditutup
      );
    } catch (e: any) {
      console.error(e);
      openError(isEdit ? "Gagal memperbarui flash sale!" : "Gagal membuat flash sale!", [
        e?.message || "Terjadi kendala saat menyimpan. Silakan coba lagi.",
      ]);
    } finally {
      setSaving(false);
    }
  };

  const typeLocked = isEdit; // tetap tidak bisa ganti tipe

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-white p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="text-[var(--secondary-color)] w-9 h-9 rounded-xl border border-neutral-300 flex justify-center items-center"
            onClick={() => navigate(-1)}
          >
            <RiArrowLeftLine size={20} />
          </button>
          <span className="grid size-10 place-items-center rounded-full bg-(--secondary-color)">
            <RiFlashlightFill size={22} className="text-white" />
          </span>
          <h2 className="text-lg md:text-xl font-semibold text-neutral-900">
            {isEdit ? "Edit Flash Sale" : "Tambah Flash Sale"}
          </h2>
        </div>

        <button
          onClick={onSave}
          disabled={!isValid || saving || loadingEdit}
          className={cls(
            "rounded-full px-6 py-2 text-sm font-semibold shadow-sm transition-colors",
            !isValid || saving || loadingEdit
              ? "bg-neutral-300 text-neutral-600 cursor-not-allowed"
              : "bg-[var(--primary-color)] hover:brightness-95"
          )}
        >
          {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan"}
        </button>
      </div>

      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* LEFT: Form */}
        <section className="rounded-2xl bg-white p-4 md:p-6">
          <div className="space-y-4">
            {/* Tipe Flashsale (locked di edit) */}
            <div className="flex flex-col gap-2">
              <label className="text-md font-medium text-neutral-800">
                Tipe Flashsale {typeLocked && <span className="text-xs text-neutral-500">(dikunci)</span>}
              </label>
              <div className="relative">
                <select
                  value={flashType}
                  onChange={(e) => setFlashType(e.target.value as FlashType)}
                  className={cls(
                    "w-full appearance-none rounded-xl border border-black/10 py-3 pr-10 pl-4 text-md outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40",
                    typeLocked && "bg-neutral-100 cursor-not-allowed"
                  )}
                  disabled={typeLocked}
                >
                  <option value="">Pilih Tipe Promo</option>
                  <option value="Tutor">Tutor</option>
                  <option value="Modul">Modul</option>
                </select>
                <span className="pointer-events-none text-neutral-900 absolute right-4 top-1/2 -translate-y-1/2">
                  <RiArrowDownSLine size={20} />
                </span>
              </div>
            </div>

            {/* Besar Promo */}
            <div className="flex flex-col gap-2">
              <label className="text-md font-medium text-neutral-800">Besar Promo</label>
              <input
                inputMode="numeric"
                value={percent}
                onChange={(e) => setPercent(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="Besaran Promo Dalam Persen, cth: 50"
                className="w-full rounded-xl border border-black/10 py-3 px-4 text-md outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
              />
            </div>

            {/* Kuota Promo */}
            <div className="flex flex-col gap-2">
              <label className="text-md font-medium text-neutral-800">Kuota Promo</label>
              <input
                inputMode="numeric"
                value={quota}
                onChange={(e) => setQuota(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="Kuota maksimal promo, cth: 1000 pengguna"
                className="w-full rounded-xl border border-black/10 py-3 px-4 text-md outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
              />
            </div>

            {/* Tanggal */}
            <div className="flex flex-col gap-2">
              <label className="text-md font-medium text-neutral-800">Tanggal Awal</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-color)]">
                  <RiCalendar2Line />
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-black/10 py-3 pr-4 pl-9 text-md outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-md font-medium text-neutral-800">Tanggal Akhir</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary-color)]">
                  <RiCalendar2Line />
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-black/10 py-3 pr-4 pl-9 text-md outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: List */}
        <section className="rounded-2xl bg-white p-4 md:p-6">
          {flashType !== "Modul" ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[var(--accent-purple-color)]">
                    <RiUser2Fill size={25} className="text-white" />
                  </span>
                  <h3 className="text-base md:text-lg font-semibold text-neutral-900">
                    List Tutor Flash Sale
                  </h3>
                </div>
                <button
                  onClick={() => setTutorModalOpen(true)}   // ENABLED IN EDIT
                  className="flex items-center gap-1 rounded-full border border-[var(--secondary-color)] px-4 py-1.5 text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/10"
                >
                  <RiAddLine /> Tambah Guru
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
                {tutors.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl p-2.5">
                    <div className="flex items-center gap-3">
                      <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                      <div className="leading-tight">
                        <div className="text-md font-medium text-neutral-900">{t.name}</div>
                        <div className="text-md text-neutral-800">{t.city}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveTutor(t.id)}   // ENABLED IN EDIT
                      className="rounded-full border border-[var(--accent-red-color)] px-4 py-1.5 text-sm font-semibold text-[var(--accent-red-color)] hover:bg-[var(--accent-red-color)]/10"
                    >
                      Hapus
                    </button>
                  </div>
                ))}

                {tutors.length === 0 && (
                  <div className="text-md mt-20 text-neutral-500 text-center py-6">
                    <div className="mx-auto w-36 h-36">
                      <img src={NotFound} />
                    </div>
                    Belum ada tutor.
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[var(--accent-green-color)]">
                    <RiBook2Fill size={25} className="text-white" />
                  </span>
                  <h3 className="text-base md:text-lg font-semibold text-neutral-900">
                    List Modul Flash Sale
                  </h3>
                </div>
                <button
                  onClick={() => setModulModalOpen(true)}  // ENABLED IN EDIT
                  className="flex items-center gap-1 rounded-full border border-[var(--secondary-color)] px-4 py-1.5 text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/10"
                >
                  <RiAddLine /> Tambah Modul
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
                {modules.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl p-2.5">
                    <div className="flex items-center gap-3">
                      {m.thumbnail ? (
                        <img src={m.thumbnail} alt={m.title} className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-neutral-200 grid place-items-center text-neutral-500 text-sm">
                          MOD
                        </div>
                      )}
                      <div className="leading-tight">
                        <div className="text-md font-medium text-neutral-900">{m.title}</div>
                        {m.category && <div className="text-md text-neutral-800">{m.category}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveModul(m.id)}  // ENABLED IN EDIT
                      className="rounded-full border border-[var(--accent-red-color)] px-4 py-1.5 text-sm font-semibold text-[var(--accent-red-color)] hover:bg-[var(--accent-red-color)]/10"
                    >
                      Hapus
                    </button>
                  </div>
                ))}

                {modules.length === 0 && (
                  <div className="text-md mt-20 text-neutral-500 text-center py-6">
                    <div className="mx-auto w-36 h-36">
                      <img src={NotFound} />
                    </div>
                    Belum ada modul.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modals */}
      <TutorFlashsaleModal
        open={tutorModalOpen}
        onClose={() => setTutorModalOpen(false)}
        selectedIds={new Set(tutors.map((t) => t.id))}
        onSave={(picked) => {
          const existing = new Set(tutors.map((t) => t.id));
                const normalized = picked.map((t) => ({
            ...t,
            avatar: resolveImageUrl(t.avatar || '') || '',
          }));
          const merged = [...tutors, ...normalized.filter((t) => !existing.has(t.id))];
          setTutors(merged);
          setTutorModalOpen(false);
        }}
      />

      <ModulFlashsaleModal
        open={modulModalOpen}
        onClose={() => setModulModalOpen(false)}
        selectedIds={new Set(modules.map((m) => m.id))}
        onSave={(picked) => {
          const existing = new Set(modules.map((m) => m.id));
          const normalized = picked.map((m) => ({
            ...m,
            thumbnail: resolveImageUrl(m.thumbnail ?? null),
          }));
          const merged = [...modules, ...normalized.filter((m) => !existing.has(m.id))];
          setModules(merged);
          setModulModalOpen(false);
        }}
      />

      {/* Confirmation */}
      <ConfirmationModal
        isOpen={confirm.isOpen}
        onClose={closeConfirm}
        icon={confirm.icon}
        iconTone={confirm.iconTone}
        title={confirm.title}
        texts={confirm.texts}
        align="center"
        button1={{ label: "Oke", onClick: closeConfirm, variant: "primary" }}
      />
    </div>
  );
};

export default ManageFlashsalePage;
