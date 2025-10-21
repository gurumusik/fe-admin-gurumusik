/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/dashboard/pages/teacher/VerifiedTutorPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  RiUser2Fill,
  RiCheckFill,
  RiCloseFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckboxCircleFill,
  RiCloseLine,
} from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import {
  fetchRegistrasiGuruThunk,
  setRegPage,
  setRegLimit,
  updateRegistrasiGuruThunk,
  deleteRegistrasiGuruThunk,
} from "@/features/slices/registrasiGuru/slice";
import type {
  RegistrasiGuru,
  RegistrasiStatus,
  ApproveConfirmKind,
  ApproveConfirmContext,
} from "@/features/slices/registrasiGuru/types";

// ⬇️ ambil daftar instruments dari slice yang sama dengan AdminInstrumentPage
import { fetchInstrumentsThunk } from "@/features/slices/instruments/slice";
import { resolveIconUrl } from "@/services/api/instrument.api";

import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
import ApproveTeacherModal, {
  type ApproveMode,
  type ApproveTeacherPayload,
} from "../../components/ApproveTeacherModal";

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const PAGE_SIZE = 5;
const PLACEHOLDER_ICON = "/assets/icons/instruments/placeholder.svg";
const EMPTY_ARR: any[] = []; // ⬅️ referensi stabil (tidak berubah antar render)
const norm = (s?: string | null) =>
  (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/* ======================== Subcomponents ======================== */

const Header: React.FC = () => (
  <div className="flex items-center gap-3 mb-5">
    <div
      className="w-10 h-10 rounded-full grid place-items-center"
      style={{ backgroundColor: "var(--primary-color)" }}
    >
      <RiUser2Fill size={25} className="text-black" />
    </div>
    <h2 className="text-lg font-semibold text-[#1C1C1C]">List Calon Tutor</h2>
  </div>
);

const TableHeader: React.FC = () => {
  const headCls =
    "text-md font-semibold text-neutral-900 p-4 text-left whitespace-nowrap";
  return (
    <thead>
      <tr className="bg-neutral-100">
        <th className={headCls}>Profile</th>
        <th className={headCls}>Nama Calon Tutor</th>
        <th className={headCls}>No Telepon</th>
        <th className={headCls}>Asal Kota</th>
        <th className={headCls}>Tanggal</th>
        <th className={headCls}>Alat Musik</th>
        <th className={headCls}>Aksi</th>
      </tr>
    </thead>
  );
};

const ActionButtons: React.FC<{
  onApprove?: () => void;
  onReject?: () => void;
}> = ({ onApprove, onReject }) => (
  <div className="flex items-center gap-4">
    <button
      type="button"
      onClick={onApprove}
      className="w-9 h-9 rounded-lg grid place-items-center bg-[var(--accent-green-light-color)] cursor-pointer"
      aria-label="Setujui"
      title="Setujui"
    >
      <RiCheckFill size={25} className="text-[#18A957]" />
    </button>

    <button
      type="button"
      onClick={onReject}
      className="grid place-items-center cursor-pointer"
      aria-label="Tolak"
      title="Tolak"
    >
      <RiCloseFill size={25} className="text-[#F14A7E]" />
    </button>
  </div>
);

const RowItem: React.FC<{
  row: RegistrasiGuru;
  iconUrl: string;
  onApprove: () => void;
  onReject: () => void;
}> = ({ row, iconUrl, onApprove, onReject }) => {
  const instrument = row.preferensi_instrumen || "unknown";
  const profileUrl = "/assets/images/teacher-demo.png";

  const createdAt = row.created_at
    ? new Date(row.created_at).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "-";

  return (
    <tr>
      {/* Profile */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <img
            src={profileUrl}
            alt={row.nama}
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
      </td>

      {/* Nama */}
      <td className="py-3 px-4">
        <span className="text-[#202020] text-md">{row.nama}</span>
      </td>

      {/* Phone */}
      <td className="py-3 px-4">
        <span className="text-[#202020] text-md">{row.no_telp}</span>
      </td>

      {/* Kota */}
      <td className="py-3 px-4">
        <span className="text-[#202020] text-md">{row.alamat ?? "-"}</span>
      </td>

      {/* Tanggal */}
      <td className="py-3 px-4">
        <span className="text-[#202020] text-md">{createdAt}</span>
      </td>

      {/* Instrument (icon dari DB) */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          <div className="grid place-items-center">
            <img
              src={iconUrl}
              alt={`${instrument} icon`}
              className="h-[25px] w-[25px] object-contain"
            />
          </div>
          <span className="text-[#202020] text-md capitalize">{instrument}</span>
        </div>
      </td>

      {/* Aksi */}
      <td className="py-3 px-4">
        <ActionButtons onApprove={onApprove} onReject={onReject} />
      </td>
    </tr>
  );
};

const Pagination: React.FC<{
  total: number;
  page: number;
  onChange: (p: number) => void;
  pageSize?: number;
}> = ({ total, page, onChange, pageSize = PAGE_SIZE }) => {
  const pages = Math.ceil(Math.max(0, Number(total) || 0) / pageSize);

  const btnCls =
    "min-w-9 h-9 px-3 rounded-lg border border-[#E3E8EF] text-md text-[#202020] hover:bg-[#F5F7FA]";
  const arrowBtnCls =
    "w-9 h-9 grid place-items-center rounded-lg text-[#202020] hover:bg-[#F5F7FA] disabled:opacity-40 disabled:hover:bg-transparent";

  const window = useMemo(() => {
    const arr: (number | "...")[] = [];
    const push = (v: number | "...") =>
      arr[arr.length - 1] === v ? undefined : arr.push(v);

    for (let i = 1; i <= pages; i++) {
      if (i <= 3 || i > pages - 2 || Math.abs(i - page) <= 1) push(i);
      else if (arr[arr.length - 1] !== "...") push("...");
    }
    return arr;
  }, [pages, page]);

  if (pages <= 1) return null;

  return (
    <div className="flex items-center gap-2 mt-5">
      <button
        className={arrowBtnCls}
        disabled={page === 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        aria-label="Sebelumnya"
        title="Sebelumnya"
      >
        <RiArrowLeftSLine className="text-xl" />
      </button>

      {window.map((v, i) =>
        v === "..." ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-neutral-900">
            ...
          </span>
        ) : (
          <button
            key={v}
            className={cls(
              btnCls,
              v === page &&
                "bg-[var(--secondary-light-color)] border-[var(--secondary-color)] font-medium"
            )}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        )
      )}

      <button
        className={arrowBtnCls}
        disabled={page === pages}
        onClick={() => onChange(Math.min(pages, page + 1))}
        aria-label="Berikutnya"
        title="Berikutnya"
      >
        <RiArrowRightSLine className="text-xl" />
      </button>
    </div>
  );
};

/* ======================== Main Page ======================== */

const VerifiedTutorPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // registrasi guru slice
  const reg = useSelector((s: RootState) => (s as any).registrasiGuru);
  const items: RegistrasiGuru[] = Array.isArray(reg?.items) ? reg.items : EMPTY_ARR;
  const total: number = typeof reg?.total === "number" ? reg.total : 0;
  const status: RegistrasiStatus = reg?.status ?? "idle";
  const errorMsg: string | null = reg?.error ?? null;

  // instrument slice
  const instrumentItemsRaw =
    useSelector((s: RootState) => (s as any).instrument?.items) || undefined;

  // local page
  const [page, setPage] = useState<number>(reg?.page || 1);

  // modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ApproveMode>("approved");
  const [selected, setSelected] = useState<RegistrasiGuru | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ApproveConfirmKind>("success");
  const [confirmCtx, setConfirmCtx] =
    useState<ApproveConfirmContext>("approved");

  // Fetch registrasi
  useEffect(() => {
    dispatch(setRegPage(page));
    dispatch(setRegLimit(PAGE_SIZE));
    dispatch(fetchRegistrasiGuruThunk({ page, limit: PAGE_SIZE }));
  }, [dispatch, page]);

  // ✅ Dependensi boolean saja → stabil
  const needInstruments = (instrumentItemsRaw?.length ?? 0) === 0;

  useEffect(() => {
    if (needInstruments) {
      dispatch(fetchInstrumentsThunk({ q: "", page: 1, limit: 500 }));
    }
  }, [dispatch, needInstruments]);

  // Build map nama -> iconUrl; depend on items RAW (bukan array fallback)
  const iconMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const it of instrumentItemsRaw ?? EMPTY_ARR) {
      const key = norm((it as any)?.nama_instrumen);
      if (!key) continue;
      const url = resolveIconUrl((it as any)?.icon);
      if (url) m[key] = url;
    }
    return m;
  }, [instrumentItemsRaw]);

  const getIconForInstrument = (name?: string | null) =>
    iconMap[norm(name)] || PLACEHOLDER_ICON;

  const openModal = (mode: ApproveMode, row: RegistrasiGuru) => {
    setSelected(row);
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleSubmitModal = async (payload: ApproveTeacherPayload) => {
    if (!selected) return;
    setModalOpen(false);

    try {
      if (payload.mode === "approved") {
        await dispatch(deleteRegistrasiGuruThunk(selected.id)).unwrap();
      } else {
        const reason =
          (payload as any)?.reason ||
          (payload as any)?.notes ||
          "Ditolak oleh admin";
        await dispatch(
          updateRegistrasiGuruThunk({
            id: selected.id,
            patch: { alasan_penolakan: reason },
          })
        ).unwrap();
      }
      setConfirmKind("success");
    } catch {
      setConfirmKind("error");
    } finally {
      setConfirmCtx(payload.mode);
      setConfirmOpen(true);
      setSelected(null);
      dispatch(fetchRegistrasiGuruThunk({ page, limit: PAGE_SIZE }));
    }
  };

  const confirmTitle =
    confirmCtx === "approved"
      ? confirmKind === "success"
        ? "Tutor berhasil disetujui."
        : "Gagal menyetujui tutor"
      : confirmKind === "success"
      ? "Tutor berhasil ditolak."
      : "Gagal menolak tutor";

  const confirmTexts =
    confirmCtx === "approved"
      ? confirmKind === "success"
        ? ["Tutor ini kini resmi terdaftar di platform dan sudah dapat menerima murid."]
        : ["Terjadi kendala saat menyetujui tutor ini. Silakan coba lagi beberapa saat lagi."]
      : confirmKind === "success"
      ? ["Tutor ini tidak akan muncul di daftar calon tutor dan tidak dapat mengajar di platform."]
      : ["Terjadi kendala saat menolak tutor ini. Silakan coba lagi beberapa saat lagi."];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl">
      <Header />

      {status === "failed" && errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white">
        <table className="w-full">
          <TableHeader />
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={7} className="p-6 text-sm text-neutral-600">
                  Memuat data...
                </td>
              </tr>
            )}

            {status !== "loading" && items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-600">
                  Belum ada pendaftar.
                </td>
              </tr>
            )}

            {items.map((row) => (
              <RowItem
                key={row.id}
                row={row}
                iconUrl={getIconForInstrument(row.preferensi_instrumen)}
                onApprove={() => openModal("approved", row)}
                onReject={() => openModal("rejected", row)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center">
        <Pagination total={total} page={page} onChange={setPage} />
      </div>

      {/* Form modal */}
      <ApproveTeacherModal
        open={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitModal}
        data={{
          image: "/assets/images/teacher-demo.png",
          name: selected?.nama ?? undefined,
          phone: selected?.no_telp ?? undefined,
          city: selected?.alamat ?? "-",
          videoUrl: selected?.path_video_url ?? undefined,
          cvUrl: selected?.file_cv_url ?? undefined,
          certificateUrl: selected?.file_sertifikasi_url ?? undefined,
        }}
      />


      {/* Confirmation modal */}
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        icon={confirmKind === "success" ? <RiCheckboxCircleFill /> : <RiCloseLine />}
        iconTone={confirmKind === "success" ? "success" : "danger"}
        title={confirmTitle}
        texts={confirmTexts}
      />
    </div>
  );
};

export default VerifiedTutorPage;
