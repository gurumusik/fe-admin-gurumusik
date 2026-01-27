// src/features/dashboard/pages/program/ManageProgramPage.tsx
import React, {
  useState,
  useEffect,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import {
  fetchProgramsThunk,
  createProgramThunk,
  updateProgramThunk,
  deleteProgramThunk,
  setPage,
} from "@/features/slices/program/slice";
import type {
  Program,
  CreateProgramPayload,
} from "@/features/slices/program/types";

// ⬇️ Modal & Icons
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
// jika file kamu ada di src/components/common/ConfirmationModal.tsx, pakai ini:
// import ConfirmationModal from "@/components/common/ConfirmationModal";

import {
  RiCheckboxCircleFill,
  RiCloseLine,
  RiQuestionFill,
} from "react-icons/ri";

type ProgramForm = {
  nama_program: string;
  headline: string;
  deskripsi: string;
  bnefits: string[];
  durasi_menit: string;
};

const initialForm: ProgramForm = {
  nama_program: "",
  headline: "",
  deskripsi: "",
  bnefits: [],
  durasi_menit: "",
};

const ManageProgramPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: programs,
    total,
    page,
    limit,
    q,
    status,
    creating,
    error,
  } = useSelector((s: RootState) => s.program);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [form, setForm] = useState<ProgramForm>(initialForm);
  const [benefitInput, setBenefitInput] = useState("");

  // ===== Result modal (success / error) =====
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalKind, setResultModalKind] = useState<"success" | "error">(
    "success"
  );
  const [resultModalTitle, setResultModalTitle] = useState("");
  const [resultModalMessage, setResultModalMessage] = useState("");

  const openResultModal = (
    kind: "success" | "error",
    title: string,
    message: string
  ) => {
    setResultModalKind(kind);
    setResultModalTitle(title);
    setResultModalMessage(message);
    setResultModalOpen(true);
  };
  const closeResultModal = () => setResultModalOpen(false);

  // ===== Delete confirm modal (warning) =====
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState(false);

  // const openDeleteConfirm = (program: Program) => {
  //   setDeleteTarget(program);
  //   setDeleteModalOpen(true);
  // };
  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };
  const reallyDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteProgramThunk(deleteTarget.id)).unwrap();
      // refetch current page
      await dispatch(fetchProgramsThunk({ q, page, limit }));
      openResultModal(
        "success",
        "Program Berhasil Dihapus",
        `Program "${deleteTarget.nama_program}" berhasil dihapus.`
      );
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      openResultModal(
        "error",
        "Gagal Menghapus Program",
        "Terjadi kendala saat menghapus program. Coba lagi."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Fetch list on mount & ketika filter/pagination berubah
  useEffect(() => {
    dispatch(fetchProgramsThunk({ q, page, limit }));
  }, [dispatch, q, page, limit]);

  const openCreateModal = () => {
    setMode("create");
    setSelectedProgram(null);
    setForm(initialForm);
    setBenefitInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (program: Program) => {
    setMode("edit");
    setSelectedProgram(program);
    setForm({
      nama_program: program?.nama_program ?? "",
      headline: program?.headline ?? "",
      deskripsi: program?.deskripsi ?? "",
      bnefits: Array.isArray(program?.bnefits) ? program.bnefits : [],
      durasi_menit:
        program?.durasi_menit != null ? String(program.durasi_menit) : "",
    });
    setBenefitInput("");
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBenefit = () => {
    const trimmed = benefitInput.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, bnefits: [...prev.bnefits, trimmed] }));
    setBenefitInput("");
  };

  const handleRemoveBenefit = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bnefits: prev.bnefits.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload: CreateProgramPayload = {
      nama_program: form.nama_program.trim(),
      headline: form.headline.trim() || undefined,
      deskripsi: form.deskripsi.trim() || undefined,
      bnefits: form.bnefits.length ? form.bnefits : undefined,
      durasi_menit: form.durasi_menit ? Number(form.durasi_menit) : undefined,
    };

    try {
      if (mode === "create") {
        await dispatch(createProgramThunk(payload)).unwrap();
        // balik ke page 1 + refetch agar state bersih
        dispatch(setPage(1));
        await dispatch(fetchProgramsThunk({ q, page: 1, limit }));
        openResultModal(
          "success",
          "Program Berhasil Dibuat",
          `Program "${payload.nama_program}" berhasil disimpan.`
        );
      } else if (mode === "edit" && selectedProgram) {
        await dispatch(
          updateProgramThunk({ id: selectedProgram.id, data: payload })
        ).unwrap();
        await dispatch(fetchProgramsThunk({ q, page, limit }));
        openResultModal(
          "success",
          "Program Berhasil Diperbarui",
          `Perubahan pada program "${
            payload.nama_program || selectedProgram.nama_program
          }" berhasil disimpan.`
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      openResultModal(
        "error",
        "Gagal Menyimpan Program",
        "Terjadi kendala saat menyimpan program. Coba lagi."
      );
    }
  };

  const isLoading = status === "loading" && !isModalOpen;

  // ===== Guard agar tidak crash saat ada item undefined =====
  const safePrograms: Program[] = (programs ?? []).filter(
    (p): p is Program => !!p && typeof p === "object" && "id" in p
  );

  return (
    <div className="w-full h-full flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manage Program</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola daftar program, headline, deskripsi, benefit, dan durasi.
          </p>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-[var(--primary-color)] shadow-sm hover:opacity-90 transition disabled:opacity-60"
          disabled={creating}
        >
          {creating ? "Menyimpan..." : "+ Tambah Program"}
        </button>
      </div>

      {/* Card: Filter & Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex gap-3 p-4 border-b border-neutral-200">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>Total program:</span>
            <span className="font-bold">{total}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                  Nama Program
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                  Headline
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                  Benefit
                </th>
                <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                  Durasi (menit)
                </th>
                <th className="px-4 py-3 text-center font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-neutral-400"
                  >
                    Memuat data program...
                  </td>
                </tr>
              ) : safePrograms.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-neutral-400"
                  >
                    Belum ada program atau tidak cocok dengan kata kunci.
                  </td>
                </tr>
              ) : (
                safePrograms.map((program) => (
                  <tr
                    key={program.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50/60 transition"
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-lg">
                        {program?.nama_program ?? "(tanpa nama)"}
                      </div>
                      {program?.deskripsi && (
                        <p className="mt-1 text-md text-neutral-500 line-clamp-2">
                          {program.deskripsi}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-md text-neutral-700">
                        {program?.headline || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {Array.isArray(program?.bnefits) &&
                      program.bnefits.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {program.bnefits.map((b, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-md text-neutral-600 bg-neutral-50"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400 italic">
                          Belum diisi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {program?.durasi_menit ?? "-"}
                    </td>
                    <td className="px-4 py-3 align-top text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(program)}
                        className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 mr-2"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Modal Create / Edit ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {mode === "create" ? "Tambah Program" : "Edit Program"}
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Isi detail program sesuai kebutuhan. Field{" "}
                  <span className="font-semibold">nama_program</span> wajib
                  diisi.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-full w-8 h-8 text-neutral-500 hover:bg-neutral-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Row 1: Nama + Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-700">
                    Nama Program<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama_program"
                    value={form.nama_program}
                    onChange={handleInputChange}
                    placeholder="Contoh: Program Piano Dasar"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-700">
                    Headline
                  </label>
                  <input
                    type="text"
                    name="headline"
                    value={form.headline}
                    onChange={handleInputChange}
                    placeholder="Contoh: Belajar dari nol sampai bisa"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">
                  Deskripsi Program
                </label>
                <textarea
                  name="deskripsi"
                  value={form.deskripsi}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Jelaskan isi program, sasaran peserta, dan hal yang akan dipelajari."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)] resize-none"
                />
              </div>

              {/* Benefit (bnefits) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-700">
                  Benefit Program
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    placeholder="Contoh: Teknik dasar"
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-[var(--primary-color,#111827)] hover:opacity-90"
                  >
                    Tambah
                  </button>
                </div>
                {form.bnefits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {form.bnefits.map((b, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm bg-neutral-100 text-neutral-700 border border-neutral-200"
                      >
                        {b}
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(idx)}
                          className="text-neutral-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Durasi */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-700">
                    Durasi (menit)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      name="durasi_menit"
                      value={form.durasi_menit}
                      onChange={handleInputChange}
                      placeholder="Contoh: 60"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                    />
                  </div>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm sm:text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm sm:text-sm font-medium bg-[var(--primary-color,#111827)] hover:opacity-90"
                >
                  {mode === "create" ? "Simpan Program" : "Update Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Confirmation modal: Hapus (warning) ===== */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteConfirm}
        icon={<RiQuestionFill />}
        iconTone="warning"
        title="Hapus Program?"
        texts={[
          <>
            Program <b>"{deleteTarget?.nama_program}"</b> akan dihapus permanen.
          </>,
          "Tindakan ini tidak bisa dibatalkan.",
        ]}
        align="center"
        widthClass="max-w-lg"
        button2={{
            label: "Batal",
            onClick: closeDeleteConfirm,
            variant: "outline",
        }}
        button1={{
          label: deleting ? "Menghapus..." : "Hapus",
          onClick: reallyDelete,
          variant: "danger",
          loading: deleting,
        }}
      />

      {/* ===== Result modal: success / error ===== */}
      <ConfirmationModal
        isOpen={resultModalOpen}
        onClose={closeResultModal}
        icon={
          resultModalKind === "success" ? (
            <RiCheckboxCircleFill />
          ) : (
            <RiCloseLine />
          )
        }
        iconTone={resultModalKind === "success" ? "success" : "danger"}
        title={resultModalTitle}
        texts={[resultModalMessage]}
        align="center"
        widthClass="max-w-lg"
        button1={{
          label: "Tutup",
          onClick: closeResultModal,
          variant: "primary",
        }}
        showCloseIcon
      />
    </div>
  );
};

export default ManageProgramPage;
