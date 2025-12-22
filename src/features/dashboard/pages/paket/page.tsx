// src/features/dashboard/pages/paket/page.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import {
  fetchPaketThunk,
  createPaketThunk,
  updatePaketThunk,
  deletePaketThunk,
  setSearch,
} from "@/features/slices/paket/slice";
import type {
  Paket,
  PaketGroupKey,
  PaketDetail,
} from "@/features/slices/paket/types";
import ConfirmationModal from "@/components/ui/common/ConfirmationModal";
import {
  RiCheckboxCircleFill,
  RiCloseLine,
  RiQuestionFill,
} from "react-icons/ri";

type PaketForm = {
  nama_paket: string;
  jumlah_sesi: string;
  deskripsi: string;
  benefits: string[];
  details: PaketDetail[];
  diskon_promo: string;
};

const initialForm: PaketForm = {
  nama_paket: "",
  jumlah_sesi: "",
  deskripsi: "",
  benefits: [],
  details: [],
  diskon_promo: "",
};

const toStringArray = (value?: string | string[] | null): string[] => {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v)).filter(Boolean);
      }
    } catch {
      /* ignore parse failure */
    }
    return value
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeDetail = (entry: unknown): PaketDetail | null => {
  if (!entry) return null;
  if (typeof entry === "string") {
    const lbl = entry.trim();
    return lbl ? { label: lbl } : null;
  }
  if (typeof entry === "object") {
    const rawLabel = (entry as any).label ?? (entry as any).title ?? "";
    const label = String(rawLabel ?? "").trim();
    if (!label) return null;

    const rawNote = (entry as any).note ?? (entry as any).description;
    const rawBestFor = (entry as any).best_for ?? (entry as any).bestFor;

    const detail: PaketDetail = { label };
    if (typeof rawNote === "string" && rawNote.trim()) {
      detail.note = rawNote.trim();
    }
    if (typeof rawBestFor === "string" && rawBestFor.trim()) {
      detail.best_for = rawBestFor.trim();
    }
    return detail;
  }
  return null;
};

const toDetailArray = (
  value?: PaketDetail[] | string | null
): PaketDetail[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeDetail).filter(Boolean) as PaketDetail[];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeDetail).filter(Boolean) as PaketDetail[];
      }
      if (parsed && typeof parsed === "object") {
        const normalized = normalizeDetail(parsed);
        return normalized ? [normalized] : [];
      }
    } catch {
      /* ignore */
    }
    const normalized = normalizeDetail(value);
    return normalized ? [normalized] : [];
  }
  return [];
};

const ManagePaketPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { grouped, total, search, status, creating, error } = useSelector(
    (s: RootState) => s.paket
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedPaket, setSelectedPaket] = useState<Paket | null>(null);
  const [form, setForm] = useState<PaketForm>(initialForm);
  const [benefitInput, setBenefitInput] = useState("");
  const [detailLabel, setDetailLabel] = useState("");
  const [detailNote, setDetailNote] = useState("");
  const [detailBestFor, setDetailBestFor] = useState("");
  const [searchInput, setSearchInput] = useState(search);
  const [packageType, setPackageType] =
    useState<PaketGroupKey>("general");
  const paketGroupConfigs: {
    key: PaketGroupKey;
    title: string;
    note: string;
    accent: string;
  }[] = [
    {
      key: "general",
      title: "Paket General",
      note: "Paket reguler/default untuk kebutuhan umum.",
      accent: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      key: "hobby",
      title: "Paket Hobby",
      note: "Paket dengan penandaan hobi.",
      accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      key: "internasional",
      title: "Paket Internasional",
      note: "Paket berlabel kurikulum internasional.",
      accent: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ];

  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalKind, setResultModalKind] = useState<"success" | "error">(
    "success"
  );
  const [resultModalTitle, setResultModalTitle] = useState("");
  const [resultModalMessage, setResultModalMessage] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Paket | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const openDeleteConfirm = (paket: Paket) => {
    setDeleteTarget(paket);
    setDeleteModalOpen(true);
  };
  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const safeGrouped = useMemo(() => {
    const isValid = (p: unknown): p is Paket =>
      !!p && typeof p === "object" && "id" in p;
    const normalize = (arr: unknown) =>
      Array.isArray(arr) ? arr.filter(isValid) : [];

    return {
      general: normalize(grouped?.general),
      hobby: normalize(grouped?.hobby),
      internasional: normalize(grouped?.internasional),
    };
  }, [grouped]);

  const filteredGrouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filterList = (list: Paket[]) =>
      term
        ? list.filter((p) =>
            (p?.nama_paket ?? "").toLowerCase().includes(term)
          )
        : list;

    return {
      general: filterList(safeGrouped.general),
      hobby: filterList(safeGrouped.hobby),
      internasional: filterList(safeGrouped.internasional),
    };
  }, [safeGrouped, search]);

  const totalFiltered =
    filteredGrouped.general.length +
    filteredGrouped.hobby.length +
    filteredGrouped.internasional.length;

  useEffect(() => {
    dispatch(fetchPaketThunk());
  }, [dispatch]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const openCreateModal = () => {
    setMode("create");
    setSelectedPaket(null);
    setForm(initialForm);
    setBenefitInput("");
    setDetailLabel("");
    setDetailNote("");
    setDetailBestFor("");
    setPackageType("general");
    setIsModalOpen(true);
  };

  const openEditModal = (paket: Paket) => {
    const initialType: PaketGroupKey = paket?.is_internasional
      ? "internasional"
      : paket?.is_hobby
      ? "hobby"
      : "general";
    setMode("edit");
    setSelectedPaket(paket);
    setForm({
      nama_paket: paket?.nama_paket ?? "",
      jumlah_sesi:
        paket?.jumlah_sesi !== undefined ? String(paket.jumlah_sesi) : "",
      deskripsi: paket?.deskripsi ?? "",
      benefits: toStringArray(paket?.benefits),
      details: toDetailArray(paket?.details),
      diskon_promo:
        paket?.diskon_promo !== undefined && paket.diskon_promo !== null
          ? String(paket.diskon_promo)
          : "",
    });
    setBenefitInput("");
    setDetailLabel("");
    setDetailNote("");
    setDetailBestFor("");
    setPackageType(initialType);
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
    setForm((prev) => ({ ...prev, benefits: [...prev.benefits, trimmed] }));
    setBenefitInput("");
  };

  const handleRemoveBenefit = (index: number) => {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleAddDetail = () => {
    const label = detailLabel.trim();
    const note = detailNote.trim();
    const bestFor = detailBestFor.trim();
    if (!label) return;
    const newDetail: PaketDetail = {
      label,
      ...(note ? { note } : {}),
      ...(bestFor ? { best_for: bestFor } : {}),
    };
    setForm((prev) => ({ ...prev, details: [...prev.details, newDetail] }));
    setDetailLabel("");
    setDetailNote("");
    setDetailBestFor("");
  };

  const handleRemoveDetail = (index: number) => {
    setForm((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const jumlah = Number(form.jumlah_sesi);
    if (!form.nama_paket.trim() || Number.isNaN(jumlah) || jumlah < 1) {
      openResultModal(
        "error",
        "Form belum lengkap",
        "Nama paket dan jumlah sesi (minimal 1) wajib diisi."
      );
      return;
    }

    const isInternasional = packageType === "internasional";
    const isHobby = packageType === "hobby";

    const payload = {
      nama_paket: form.nama_paket.trim(),
      jumlah_sesi: jumlah,
      deskripsi: form.deskripsi.trim() || undefined,
      benefits: form.benefits.length ? form.benefits : undefined,
      details: form.details.length ? form.details : undefined,
      diskon_promo: form.diskon_promo
        ? Number(form.diskon_promo)
        : undefined,
      package_by: packageType,
      is_hobby: isHobby,
      is_internasional: isInternasional,
    };

    setSubmitting(true);
    try {
      if (mode === "create") {
        await dispatch(createPaketThunk(payload)).unwrap();
        await dispatch(fetchPaketThunk());
        openResultModal(
          "success",
          "Paket berhasil dibuat",
          `Paket "${payload.nama_paket}" berhasil disimpan.`
        );
      } else if (mode === "edit" && selectedPaket) {
        await dispatch(
          updatePaketThunk({ id: selectedPaket.id, data: payload })
        ).unwrap();
        await dispatch(fetchPaketThunk());
        openResultModal(
          "success",
          "Paket diperbarui",
          `Perubahan pada paket "${payload.nama_paket}" berhasil disimpan.`
        );
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      openResultModal(
        "error",
        "Gagal menyimpan paket",
        "Terjadi kendala saat menyimpan data paket. Coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reallyDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deletePaketThunk(deleteTarget.id)).unwrap();
      await dispatch(fetchPaketThunk());
      openResultModal(
        "success",
        "Paket dihapus",
        `Paket "${deleteTarget.nama_paket}" berhasil dihapus.`
      );
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      openResultModal(
        "error",
        "Gagal menghapus paket",
        "Terjadi kendala saat menghapus paket. Coba lagi."
      );
    } finally {
      setDeleting(false);
    }
  };

  const isLoading = status === "loading" && !isModalOpen;

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(setSearch(searchInput.trim()));
  };

  const resetSearch = () => {
    setSearchInput("");
    dispatch(setSearch(""));
  };

  const renderTableBody = (list: Paket[]) => {
    if (isLoading) {
      return (
        <tr>
          <td
            colSpan={6}
            className="px-4 py-6 text-center text-sm text-neutral-400"
          >
            Memuat data paket...
          </td>
        </tr>
      );
    }

    if (list.length === 0) {
      return (
        <tr>
          <td
            colSpan={6}
            className="px-4 py-6 text-center text-sm text-neutral-400"
          >
            Belum ada paket di kategori ini atau tidak cocok dengan kata kunci.
          </td>
        </tr>
      );
    }

    return list.map((paket) => {
      const benefits = toStringArray(paket?.benefits);
      const details = toDetailArray(paket?.details);

      return (
        <tr
          key={paket.id}
          className="border-b border-neutral-100 hover:bg-neutral-50/60 transition"
        >
          <td className="px-4 py-3 align-top">
            <div className="font-medium text-lg">
              {paket?.nama_paket ?? "(tanpa nama)"}
            </div>
            {paket?.deskripsi && (
              <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
                {paket.deskripsi}
              </p>
            )}
          </td>
          <td className="px-4 py-3 align-top">
            {paket?.jumlah_sesi ?? "-"}
          </td>
          <td className="px-4 py-3 align-top">
            {paket?.diskon_promo != null && paket.diskon_promo !== 0
              ? `${paket.diskon_promo}%`
              : "-"}
          </td>
          <td className="px-4 py-3 align-top">
            {benefits.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {benefits.map((b, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600 bg-neutral-50"
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
            {details.length > 0 ? (
              <ul className="space-y-2 text-sm text-neutral-700">
                {details.map((d, idx) => (
                  <li key={idx} className="leading-tight">
                    <div className="font-semibold text-neutral-800">
                      {d.label}
                    </div>
                    {(d.note || d.best_for) && (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {d.note && (
                          <span className="text-neutral-600 text-xs">
                            {d.note}
                          </span>
                        )}
                        {d.best_for && (
                          <span className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-700 bg-neutral-50">
                            Best for: {d.best_for}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-neutral-400 italic">
                Belum diisi
              </span>
            )}
          </td>
          <td className="px-4 py-3 align-top text-center whitespace-nowrap">
            <button
              type="button"
              onClick={() => openEditModal(paket)}
              className="inline-flex items-center rounded-full border border-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 mr-2"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => openDeleteConfirm(paket)}
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white bg-red-500 hover:bg-red-600"
            >
              Hapus
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manage Paket</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Kelola daftar paket sesi belajar, diskon promo, benefit, dan detail
            deskripsi.
          </p>
          {error && (
            <p className="mt-1 text-xs text-red-500">
              {typeof error === "string" ? error : "Terjadi kendala memuat data"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-[var(--primary-color)] shadow-sm hover:opacity-90 transition disabled:opacity-60"
          disabled={creating}
        >
          {creating ? "Menyimpan..." : "+ Tambah Paket"}
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 border-b border-neutral-200">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>Total paket:</span>
              <span className="font-bold">
                {search ? `${totalFiltered} / ${total}` : total}
              </span>
              {search && (
                <span className="text-xs text-neutral-400">(terfilter)</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">
                General: {filteredGrouped.general.length}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">
                Hobby: {filteredGrouped.hobby.length}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">
                Internasional: {filteredGrouped.internasional.length}
              </span>
            </div>
          </div>
          <form
            className="flex flex-col sm:flex-row gap-2 sm:items-center"
            onSubmit={handleSearchSubmit}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama paket..."
              className="w-full sm:w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium bg-[var(--primary-color,#111827)] hover:opacity-90 text-white"
              >
                Cari
              </button>
              <button
                type="button"
                onClick={resetSearch}
                className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {paketGroupConfigs.map(({ key, title, note, accent }) => {
            const list = filteredGrouped[key];
            return (
              <div
                key={key}
                className="border border-neutral-200 rounded-xl overflow-hidden bg-white"
              >
                <div className="flex items-start justify-between gap-3 bg-neutral-50 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-800">
                        {title}
                      </h3>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${accent}`}
                      >
                        {key === "general"
                          ? "General"
                          : key === "hobby"
                          ? "Hobby"
                          : "Internasional"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">{note}</p>
                  </div>
                  <span className="text-xs font-medium text-neutral-600 bg-white border border-neutral-200 px-3 py-1 rounded-full">
                    {isLoading ? "Memuat..." : `${list.length} paket`}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                          Nama Paket
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                          Jumlah Sesi
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                          Diskon Promo
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                          Benefit
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                          Detail
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-sm text-neutral-800 uppercase tracking-wide">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>{renderTableBody(list)}</tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {mode === "create" ? "Tambah Paket" : "Edit Paket"}
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Lengkapi informasi paket. Field{" "}
                  <span className="font-semibold">nama_paket</span> dan{" "}
                  <span className="font-semibold">jumlah_sesi</span> wajib diisi.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-700">
                    Nama Paket<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama_paket"
                    value={form.nama_paket}
                    onChange={handleInputChange}
                    placeholder="Contoh: Paket Intensif 10 Sesi"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-700">
                    Jumlah Sesi<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    name="jumlah_sesi"
                    value={form.jumlah_sesi}
                    onChange={handleInputChange}
                    placeholder="Contoh: 8"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-700">
                  Jenis Paket
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      key: "general" as PaketGroupKey,
                      label: "General",
                      desc: "Paket reguler / default.",
                    },
                    {
                      key: "hobby" as PaketGroupKey,
                      label: "Hobby",
                      desc: "Paket dengan penandaan hobi.",
                    },
                    {
                      key: "internasional" as PaketGroupKey,
                      label: "Internasional",
                      desc: "Paket kurikulum internasional.",
                    },
                  ].map((opt) => {
                    const selected = packageType === opt.key;
                    return (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => setPackageType(opt.key)}
                        className={`rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-[var(--primary-color,#111827)] bg-[var(--primary-color,#111827)]/5"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-neutral-800">
                            {opt.label}
                          </span>
                          {selected && (
                            <span className="text-[11px] font-medium text-[var(--primary-color,#111827)]">
                              Dipilih
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">
                  Deskripsi
                </label>
                <textarea
                  name="deskripsi"
                  value={form.deskripsi}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Jelaskan isi paket, sasaran peserta, dll."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Benefit Paket
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="Contoh: Materi tambahan PDF"
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-[var(--primary-color,#111827)] hover:opacity-90 text-white"
                    >
                      Tambah
                    </button>
                  </div>
                  {form.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {form.benefits.map((b, idx) => (
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

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-neutral-700">
                    Detail Paket
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      value={detailLabel}
                      onChange={(e) => setDetailLabel(e.target.value)}
                      placeholder="Label* (contoh: Jadwal)"
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                    />
                    <input
                      type="text"
                      value={detailNote}
                      onChange={(e) => setDetailNote(e.target.value)}
                      placeholder="Note (contoh: 2x per minggu)"
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                    />
                    <input
                      type="text"
                      value={detailBestFor}
                      onChange={(e) => setDetailBestFor(e.target.value)}
                      placeholder="Best for (contoh: Pemula)"
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddDetail}
                      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium bg-[var(--primary-color,#111827)] hover:opacity-90 text-white"
                    >
                      Tambah detail
                    </button>
                  </div>
                  {form.details.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1">
                      {form.details.map((d, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm text-neutral-800">
                              {d.label}
                            </div>
                            {(d.note || d.best_for) && (
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-600">
                                {d.note && <span>{d.note}</span>}
                                {d.best_for && (
                                  <span className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 bg-white">
                                    Best for: {d.best_for}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDetail(idx)}
                            className="text-neutral-400 hover:text-red-500 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-neutral-700">
                    Diskon Promo (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    name="diskon_promo"
                    value={form.diskon_promo}
                    onChange={handleInputChange}
                    placeholder="Contoh: 15"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color,#111827)] focus:border-[var(--primary-color,#111827)]"
                  />
                  <p className="text-xs text-neutral-500">
                    Kosongkan jika tidak ada diskon promo.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm sm:text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm sm:text-sm font-medium bg-[var(--primary-color,#111827)] hover:opacity-90 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting
                    ? "Menyimpan..."
                    : mode === "create"
                    ? "Simpan Paket"
                    : "Update Paket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteConfirm}
        icon={<RiQuestionFill />}
        iconTone="warning"
        title="Hapus Paket?"
        texts={[
          <>
            Paket <b>"{deleteTarget?.nama_paket}"</b> akan dihapus permanen.
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

export default ManagePaketPage;
