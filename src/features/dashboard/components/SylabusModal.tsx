import React from "react";
import {
  RiCloseLine,
  RiLink,
  RiUpload2Line,
  RiAddLine,
  RiFileListLine,
} from "react-icons/ri";
import type { SyllabusDraft } from "@/features/slices/instrumentWizard/types";

type SylabusModalProps = {
  open: boolean;
  onClose: () => void;
  subtitle?: string;
  initial?: SyllabusDraft | undefined;
  onSaveDraft: (draft: SyllabusDraft) => void;
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const MAX_MB = 25;

const toLabelTargets = (pts: unknown) => {
  if (!Array.isArray(pts) || pts.length === 0) return ["", "", ""];
  const labels = pts
    .map((p) => {
      if (typeof p === "string") return p;
      if (p && typeof p === "object") {
        const label = (p as any).label;
        return typeof label === "string" ? label : "";
      }
      return "";
    })
    .map((s) => s.trim())
    .filter(Boolean);
  return labels.length ? labels : ["", "", ""];
};

const SylabusModal: React.FC<SylabusModalProps> = ({
  open,
  onClose,
  subtitle,
  initial,
  onSaveDraft,
}) => {
  // Tentukan tab awal dari initial
  const initialTab: "file" | "link" =
    initial?.file_url || initial?.file_base64 ? "file" : initial?.link_url ? "link" : "file";

  const [tab, setTab] = React.useState<"file" | "link">(initialTab);
  const [title, setTitle] = React.useState(initial?.title ?? "");

  // Dua jalur input file: image -> file_base64, pdf -> file_url
  const [imageBase64, setImageBase64] = React.useState<string | null>(
    initial?.file_base64 ?? null
  );
  const [pdfDataUrl, setPdfDataUrl] = React.useState<string | null>(
    initial?.file_url ?? null
  );

  const [link, setLink] = React.useState(initial?.link_url ?? "");
  const [targets, setTargets] = React.useState<string[]>(
    toLabelTargets(initial?.completion_pts)
  );
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      const t: "file" | "link" =
        initial?.file_url || initial?.file_base64 ? "file" : initial?.link_url ? "link" : "file";
      setTab(t);
      setTitle(initial?.title ?? "");
      setImageBase64(initial?.file_base64 ?? null);
      setPdfDataUrl(initial?.file_url ?? null);
      setLink(initial?.link_url ?? "");
      setTargets(toLabelTargets(initial?.completion_pts));
      setFileName(null);
      setError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const toDataURL = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    try {
      setError(null);
      const f = e.target.files?.[0] ?? null;
      if (!f) {
        setImageBase64(null);
        setPdfDataUrl(null);
        setFileName(null);
        return;
      }

      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`Ukuran file melebihi ${MAX_MB} MB`);
        setImageBase64(null);
        setPdfDataUrl(null);
        setFileName(null);
        return;
      }

      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      const isImage = /^image\//i.test(f.type);

      const dataUrl = await toDataURL(f);
      setFileName(f.name || null);

      if (isPdf) {
        // PDF → simpan ke file_url (data:application/pdf;base64,...)
        setPdfDataUrl(dataUrl);
        setImageBase64(null);
      } else if (isImage) {
        // Image → simpan ke file_base64 (data:image/...)
        setImageBase64(dataUrl);
        setPdfDataUrl(null);
      } else {
        setError("Format tidak didukung. Gunakan PDF atau gambar (PNG/JPG/WebP/SVG).");
        setImageBase64(null);
        setPdfDataUrl(null);
        setFileName(null);
        return;
      }
    } catch {
      setError("Gagal membaca file. Coba lagi.");
      setImageBase64(null);
      setPdfDataUrl(null);
      setFileName(null);
    }
  };

  const saveDraft = () => {
    const cleanTargets = targets.map((t) => t.trim()).filter(Boolean);
    if (!title.trim()) {
      setError("Judul silabus wajib diisi.");
      return;
    }

    if (tab === "file") {
      // minimal salah satu: imageBase64 atau pdfDataUrl harus ada
      if (!imageBase64 && !pdfDataUrl) {
        setError("Wajib upload PDF atau gambar.");
        return;
      }
    } else {
      if (!link.trim()) {
        setError("Link silabus wajib diisi.");
        return;
      }
    }

    const draft: SyllabusDraft = {
      title: title.trim(),
      completion_pts: cleanTargets.map((label, idx) => ({
        key: `p${idx + 1}`,
        label,
        weight: 1,
      })),
      // Jika file dipilih, kirim salah satu (image → file_base64, pdf → file_url)
      file_base64: tab === "file" ? imageBase64 ?? null : null,
      file_url: tab === "file" ? pdfDataUrl ?? null : null,
      link_url: tab === "link" ? link.trim() : null,
    };

    onSaveDraft(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[#0F172A]">Silabus</h3>
              {subtitle && <p className="text-sm text-[#6B7E93] mt-1">{subtitle}</p>}
            </div>
            <button
              aria-label="Tutup"
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 p-1"
            >
              <RiCloseLine size={24} />
            </button>
          </div>

          {/* Title */}
          <div className="mt-3">
            <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
              Judul Silabus
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Silabus Grade I"
              className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          {/* Tabs */}
          <div className="mt-4 bg-[#F2F6FB] rounded-2xl p-1 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setTab("file")}
              className={cls(
                "h-10 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold",
                tab === "file"
                  ? "bg-white text-[var(--secondary-color,#0682DF)] shadow-sm"
                  : "text-[#6B7E93]"
              )}
            >
              <RiFileListLine size={20} />
              File (PDF/Gambar)
            </button>
            <button
              type="button"
              onClick={() => setTab("link")}
              className={cls(
                "h-10 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold",
                tab === "link"
                  ? "bg-white text-[var(--secondary-color,#0682DF)] shadow-sm"
                  : "text-[#6B7E93]"
              )}
            >
              <RiLink size={20} />
              Link
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5">
          {tab === "file" ? (
            <>
              <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                Upload PDF/Gambar
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--secondary-color,#0682DF)] text-[var(--secondary-color,#0682DF)] px-4 h-10 hover:bg-[var(--secondary-light-color,#E6F4FF)]"
                >
                  <RiUpload2Line />
                  Pilih File
                </button>
                {(fileName || imageBase64 || pdfDataUrl) && (
                  <span className="text-sm text-[#6B7E93] truncate">
                    {fileName ? fileName : pdfDataUrl ? "PDF terpilih" : "Gambar terpilih"}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#6B7E93] mt-2">
                Supported: PDF / PNG / JPG / WEBP / SVG (Max {MAX_MB} MB)
              </p>

              <input
                ref={fileRef}
                type="file"
                // izinkan pdf & semua image
                accept=".pdf,application/pdf,image/*"
                className="hidden"
                onChange={onFileChange}
              />
              <hr className="my-5 border-neutral-200" />
            </>
          ) : (
            <>
              <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                Link Silabus
              </label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://contoh.com/silabus.pdf"
                className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
              />
              <hr className="my-5 border-neutral-200" />
            </>
          )}

          {/* Target Pembelajaran */}
          <div>
            <h4 className="text-[16px] font-semibold text-[#0F172A] mb-3">
              Target Pembelajaran
            </h4>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {targets.map((v, i) => (
                <input
                  key={i}
                  value={v}
                  onChange={(e) => {
                    const arr = [...targets];
                    arr[i] = e.target.value;
                    setTargets(arr);
                  }}
                  placeholder="Masukkan Target Pembelajaran"
                  className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
                />
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargets((t) => [...t, ""])}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--secondary-color,#0682DF)] text-[var(--secondary-color,#0682DF)] px-4 h-10 hover:bg-[var(--secondary-light-color,#E6F4FF)]"
              >
                <RiAddLine className="text-lg" />
                Tambah Target
              </button>
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

          {/* Footer */}
          <div className="mt-6">
            <button
              type="button"
              onClick={saveDraft}
              className="w-full h-12 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold hover:brightness-95"
            >
              Simpan Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SylabusModal;
