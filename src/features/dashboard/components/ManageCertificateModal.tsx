'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getStatusColor } from "@/utils/getStatusColor";
import {
  RiCloseLine,
  RiEyeFill,
  RiMusic2Line,
  RiStickyNoteFill,
  RiCheckboxMultipleFill,
  RiArrowLeftSLine,
  RiUpload2Line,
} from "react-icons/ri";

export type CertStatus = "Menunggu Verifikasi" | "Disetujui" | "Tidak Disetujui";

export type CertificateItem = {
  id: string | number;
  title: string;
  school: string;
  instrument: string;
  grade: string;
  status: CertStatus;
  /** gunakan ini sebagai URL gambar sertifikat di phase 3 (preview) */
  link?: string;
};

type RejectPayload = {
  reason: string;
  files: File[];
  imagesBase64: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  certificates?: CertificateItem[];
  title?: string;

  // optional actions
  onPreview?: (item: CertificateItem) => void;
  onApprove?: (item: CertificateItem) => void;
  onReject?: (item: CertificateItem) => void; // legacy fallback
  onRejectSubmit?: (item: CertificateItem, payload: RejectPayload) => void | Promise<void>;
  onShowRejectNote?: (item: CertificateItem) => void;
};

const FALLBACK: CertificateItem[] = [
  { id: 1, title: "Rockstar 3", school: "Javas Music School", instrument: "Piano", grade: "Grade III", status: "Menunggu Verifikasi",  link: "/assets/images/certificate-demo.jpg" },
  { id: 2, title: "Rockstar 3", school: "Javas Music School", instrument: "Piano", grade: "Grade III", status: "Disetujui",            link: "/assets/images/certificate-demo.jpg" },
  { id: 3, title: "Rockstar 3", school: "Javas Music School", instrument: "Piano", grade: "Grade III", status: "Tidak Disetujui",      link: "/assets/images/certificate-demo.jpg" },
  { id: 4, title: "Rockstar 3", school: "Javas Music School", instrument: "Piano", grade: "Grade III", status: "Disetujui",            link: "/assets/images/certificate-demo.jpg" },
];

const BtnSquare: React.FC<
  React.PropsWithChildren<{ bordered?: boolean; onClick?: () => void; ariaLabel: string }>
> = ({ bordered = true, onClick, ariaLabel, children }) => (
  <button
    aria-label={ariaLabel}
    onClick={onClick}
    className={[
      "inline-grid place-items-center w-10 h-10 rounded-xl bg-white transition active:scale-95",
      bordered ? "border border-neutral-300 hover:bg-neutral-50" : "hover:bg-neutral-50",
    ].join(" ")}
  >
    {children}
  </button>
);

// helper konversi File -> base64 dataURL
const fileToDataURL = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic",
  "image/heif",
]);
const isHeicByName = (name: string) => /\.hei(c|f)$/i.test(name);

const ManageCertificateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  certificates,
  title = "Kelola Sertifikat",
  onApprove,
  onReject,           // legacy
  onRejectSubmit,     // submit penolakan (phase 4)
  onPreview,
  onShowRejectNote,
}) => {
  const items = useMemo(
    () => (certificates && certificates.length ? certificates : FALLBACK),
    [certificates]
  );

  /** ===== PHASE HANDLING ===== */
  const [phase, setPhase] = useState<"list" | "detail" | "preview" | "reject">("list");
  const [selected, setSelected] = useState<CertificateItem | null>(null);

  const openDetail = (item: CertificateItem) => {
    setSelected(item);
    setPhase("detail");
  };
  const openPreview = (item: CertificateItem) => {
    setSelected(item);
    setPhase("preview");
    onPreview?.(item);
  };
  const openReject = () => setPhase("reject");

  const backToList = () => {
    setPhase("list");
    setSelected(null);
  };
  const backToDetail = () => setPhase("detail");
  const backToPreview = () => setPhase("preview");

  // ====== STATE: Phase 4 (Reject form) ======
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetRejectForm = () => {
    setFiles([]);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews([]);
    setReason("");
    setErr(null);
    setSubmitting(false);
  };

  // esc + lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (phase === "reject") backToPreview();
        else if (phase === "preview") backToDetail();
        else if (phase === "detail") backToList();
        else onClose();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, phase]);

  // reset saat tutup / pindah dari reject
  useEffect(() => {
    if (!isOpen) resetRejectForm();
  }, [isOpen]);
  useEffect(() => {
    if (phase !== "reject") resetRejectForm();
  }, [phase]);

  if (!isOpen) return null;

  // handlers upload (phase 4)
  const pickFiles = () => fileInputRef.current?.click();
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setErr(null);
    const chosen = Array.from(e.target.files ?? []);
    if (!chosen.length) return;

    const valid: File[] = [];
    for (const f of chosen) {
      const okType = ALLOWED_MIMES.has(f.type) || isHeicByName(f.name);
      if (!okType) {
        setErr("Format tidak didukung. Gunakan PNG, JPG/JPEG, atau HEIC/HEIF.");
        continue;
      }
      if (f.size > MAX_BYTES) {
        setErr("Ukuran file melebihi 5MB.");
        continue;
      }
      valid.push(f);
    }
    const merged = [...files, ...valid].slice(0, 5);
    setFiles(merged);

    // generate / refresh previews
    previews.forEach((u) => URL.revokeObjectURL(u));
    const nextPreviews = merged.map((f) => URL.createObjectURL(f));
    setPreviews(nextPreviews);
  };
  const removeAt = (i: number) => {
    const nf = files.slice();
    nf.splice(i, 1);
    setFiles(nf);
    previews.forEach((u) => URL.revokeObjectURL(u));
    setPreviews(nf.map((f) => URL.createObjectURL(f)));
  };
  const canSubmitReject = reason.trim().length >= 5 && !submitting;

  const submitReject = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      const imagesBase64 = await Promise.all(files.map(fileToDataURL));
      if (onRejectSubmit) {
        await onRejectSubmit(selected, {
          reason: reason.trim(),
          files,
          imagesBase64,
        });
      } else if (onReject) {
        // fallback legacy
        onReject(selected);
      }
      onClose(); // default: tutup modal setelah submit
    } catch {
      setErr("Gagal mengirim laporan. Coba lagi beberapa saat.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={() => {
        if (phase === "reject") backToPreview();
        else if (phase === "preview") backToDetail();
        else if (phase === "detail") backToList();
        else onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ===================== PHASE 1: LIST ===================== */}
        {phase === "list" && (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 p-5 pb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                <p className="text-md text-neutral-600 mt-1">
                  {items.length} Sertifikat
                </p>
              </div>
              <button
                aria-label="Tutup"
                onClick={onClose}
                className="shrink-0 inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                title="Tutup"
              >
                <RiCloseLine size={25} className="text-neutral-800" />
              </button>
            </div>

            <hr className="border-t border-neutral-300 mb-2 mx-5" />

            {/* Body */}
            <div className="px-5 pb-5">
              <ul>
                {items.map((item) => {
                  return (
                    <li key={item.id} className="py-3 border-b border-neutral-300 px-3">
                      <div className="flex items-center gap-3">
                        {/* LEFT */}
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-semibold text-neutral-900 leading-tight">
                            {item.title}
                          </div>

                          <div className="mt-2 flex items-center gap-3 flex-wrap">
                            <div className="text-md text-neutral-600 leading-tight">
                              {item.school}
                            </div>
                            <span className="inline-flex items-center gap-1 text-md text-neutral-800">
                              <RiMusic2Line />
                              <span className="font-medium">{item.instrument}</span>
                              <span className="text-neutral-400">•</span>
                              <span className="font-medium">{item.grade}</span>
                            </span>

                            <span className={`text-md font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>

                        {/* RIGHT actions — sesuai ketentuan */}
                        {item.status === "Disetujui" && (
                          <BtnSquare
                            ariaLabel="Lihat detail sertifikat"
                            onClick={() => openDetail(item)} // -> PHASE 2
                            bordered
                          >
                            <RiEyeFill size={22} className="text-[var(--secondary-color)]" />
                          </BtnSquare>
                        )}

                        {item.status === "Menunggu Verifikasi" && (
                          <BtnSquare
                            ariaLabel="Setujui sertifikat"
                            onClick={() => openDetail(item)} // -> PHASE 2
                            bordered
                          >
                            <RiCheckboxMultipleFill size={22} className="text-[var(--secondary-color)]" />
                          </BtnSquare>
                        )}

                        {item.status === "Tidak Disetujui" && (
                          <div className="flex items-center gap-3">
                            <BtnSquare
                              ariaLabel="Lihat alasan penolakan"
                              onClick={() =>
                                onShowRejectNote ? onShowRejectNote(item) : console.log("alasan", item)
                              }
                              bordered={false}
                            >
                              <RiStickyNoteFill size={22} className="text-[var(--secondary-color)]" />
                            </BtnSquare>

                            <BtnSquare
                              ariaLabel="Lihat detail sertifikat"
                              onClick={() => openDetail(item)} // -> PHASE 2
                              bordered
                            >
                              <RiEyeFill size={22} className="text-[var(--secondary-color)]" />
                            </BtnSquare>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {/* ===================== PHASE 2: DETAIL ===================== */}
        {phase === "detail" && selected && (
          <>
            {/* Header: back ← | title center | close × */}
            <div className="px-5 pt-5 pb-3">
              <div className="grid grid-cols-3 items-center">
                <div className="justify-self-start">
                  <button
                    onClick={backToList}
                    className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                    aria-label="Kembali"
                  >
                    <RiArrowLeftSLine size={20} className="text-neutral-800" />
                  </button>
                </div>
                <div className="justify-self-center">
                  <h3 className="text-[18px] font-semibold text-neutral-900">
                    Pengajuan Sertifikasi
                  </h3>
                </div>
                <div className="justify-self-end">
                  <button
                    aria-label="Tutup"
                    onClick={onClose}
                    className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                    title="Tutup"
                  >
                    <RiCloseLine size={20} className="text-neutral-800" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              {/* Nama Sertifikasi */}
              <div className="mb-4">
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">
                  Nama Sertifikasi
                </div>
                <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-700">
                  {selected.title || "-"}
                </div>
              </div>

              {/* Penyelenggara Sertifikasi */}
              <div className="mb-4">
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">
                  Penyelenggara Sertifikasi
                </div>
                <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-700">
                  {selected.school || "-"}
                </div>
              </div>

              {/* Alat Musik & Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">
                    Alat Musik
                  </div>
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-2 text-neutral-800 flex items-center gap-2">
                    <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-white border border-neutral-300">
                      🎹
                    </span>
                    <span className="font-medium">{selected.instrument || "-"}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[15px] font-semibold text-neutral-900 mb-2">
                    Grade
                  </div>
                  <div className="rounded-xl border border-neutral-300 bg-neutral-100/50 px-4 py-3 text-neutral-800 font-medium">
                    {selected.grade || "-"}
                  </div>
                </div>
              </div>

              {/* File Sertifikasi -> MASUK PHASE 3 */}
              <div>
                <div className="text-[15px] font-semibold text-neutral-900 mb-2">
                  File Sertifikasi
                </div>
                <button
                  className="inline-flex items-center rounded-full px-4 py-2 border text-[14px]
                             border-[var(--secondary-color)] text-[var(--secondary-color)]
                             hover:bg-[var(--secondary-color)]/5"
                  onClick={() => openPreview(selected)}   // <= pindah ke PHASE 3
                >
                  Lihat Sertifikat
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===================== PHASE 3: PREVIEW + APPROVAL ===================== */}
        {phase === "preview" && selected && (
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="grid grid-cols-3 items-center">
                <div className="justify-self-start">
                  <button
                    onClick={backToDetail}
                    className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                    aria-label="Kembali"
                  >
                    <RiArrowLeftSLine size={20} className="text-neutral-800" />
                  </button>
                </div>
                <div className="justify-self-center">
                  <h3 className="text-[18px] font-semibold text-neutral-900">
                    {selected.title}
                  </h3>
                </div>
                <div className="justify-self-end">
                  <button
                    aria-label="Tutup"
                    onClick={onClose}
                    className="inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                    title="Tutup"
                  >
                    <RiCloseLine size={20} className="text-neutral-800" />
                  </button>
                </div>
              </div>
            </div>

            <hr className="text-neutral-300 m-6 mt-0" />

            {/* Gambar sertifikat */}
            <div className="px-5">
              <div className="w-full rounded-2xl overflow-hidden bg-neutral-200">
                <div className="w-full aspect-video">
                  <img
                    src={selected.link || "/assets/images/certificate-demo.jpg"}
                    alt={selected.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              {/* Tolak -> Phase 4 */}
              <button
                onClick={openReject}
                className="rounded-full px-8 py-3 border-2 bg-white
                           text-[var(--accent-red-color)] border-[var(--accent-red-color)]
                           hover:bg-[var(--accent-pink-color)]/5"
              >
                Tolak
              </button>

              {/* Setujui */}
              <button
                onClick={() => (onApprove ? onApprove(selected) : console.log("approve", selected))}
                className="rounded-full px-8 py-3 font-semibold shadow
                           bg-[var(--primary-color)] text-neutral-900 hover:brightness-95"
              >
                Setujui
              </button>
            </div>
          </>
        )}

        {/* ===================== PHASE 4: REJECT FORM ===================== */}
        {phase === "reject" && selected && (
          <>
            {/* Header: seperti desain */}
            <div className="flex items-start gap-3 p-5 pb-3">
              <div className="flex-1">
                <h3 className="text-[16px] md:text-[18px] font-semibold text-neutral-900">
                  Formulir Penolakan Instrumen
                </h3>
              </div>
              <button
                aria-label="Tutup"
                onClick={onClose}
                className="shrink-0 inline-grid place-items-center w-9 h-9 rounded-full hover:bg-neutral-100"
                title="Tutup"
              >
                <RiCloseLine size={20} className="text-neutral-800" />
              </button>
            </div>

            <hr className="border-t border-neutral-300 mb-2 mx-5" />

            {/* Body */}
            <div className="px-5 md:px-6 pb-4 space-y-4">
              <div className="text-sm">
                <span className="text-neutral-500 mr-1">Perihal:</span>
                <span className="font-medium text-neutral-900">
                  Penolakan Pengajuan Instrumen {selected.instrument || "Observasi Pembelajaran"}
                </span>
              </div>

              {/* Upload */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/heic,image/heif"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={pickFiles}
                  type="button"
                  className="inline-flex items-center gap-2 border border-[var(--secondary-color)] text-[var(--secondary-color)] px-4 py-2 rounded-full text-sm hover:bg-[var(--secondary-light-color)]/40"
                >
                  <RiUpload2Line />
                  Upload Foto
                </button>
                <div className="text-xs text-neutral-500">
                  Format (Max 5mb): PNG, JPG, JPEG, HEIC
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    {previews.map((src, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-20 rounded-xl overflow-hidden bg-neutral-100 border border-black/5"
                      >
                        <img src={src} alt={`lampiran-${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          aria-label="Hapus lampiran"
                          onClick={() => removeAt(i)}
                          className="absolute top-1 right-1 inline-grid place-items-center w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black/70"
                        >
                          <RiCloseLine size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
                  placeholder="Masukkan Keterangan Penolakan Instrumen"
                />
              </div>

              {err && <div className="text-sm text-red-600">{err}</div>}
            </div>

            {/* footer */}
            <div className="px-5 md:px-6 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={backToPreview}
                  className="rounded-full px-6 py-3 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  Kembali
                </button>
                <button
                  onClick={submitReject}
                  disabled={!canSubmitReject}
                  className="rounded-full px-6 py-3 font-semibold bg-[var(--primary-color)] text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 transition"
                >
                  {submitting ? "Mengirim…" : "Kirim Laporan"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageCertificateModal;
