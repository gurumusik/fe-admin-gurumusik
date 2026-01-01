// src/components/ui/common/AddInstrumentModal.tsx
import React from "react";
import { RiCloseLine, RiUpload2Line } from "react-icons/ri";

type SubmitPayload = {
  name: string;
  iconBase64?: string | null;
  file?: File | null;
  isAbk?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: SubmitPayload) => void;
  /** Judul modal. Default: "Jenis Instrumen" */
  title?: string;
  /** Nama default (dipakai saat edit) */
  defaultName?: string;
  /** Create: true (icon wajib), Edit: false (icon opsional) */
  requireIcon?: boolean;
  /** Preview awal icon saat edit (url/data:) */
  initialPreview?: string | null;
  /** Nilai awal toggle ABK */
  defaultIsAbk?: boolean;
};

const MAX_MB = 5;

const AddInstrumentModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  title = "Jenis Instrumen",
  defaultName = "",
  requireIcon = true,
  initialPreview = null,
  defaultIsAbk = false,
}) => {
  const [name, setName] = React.useState(defaultName);
  const [file, setFile] = React.useState<File | null>(null);
  // preview: icon baru (jika upload) ATAU icon lama (initialPreview)
  const [iconPreview, setIconPreview] = React.useState<string | null>(initialPreview);
  const [error, setError] = React.useState<string | null>(null);
  const [isAbk, setIsAbk] = React.useState<boolean>(!!defaultIsAbk);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(defaultName || "");
      setFile(null);
      setIconPreview(initialPreview || null);
      setError(null);
      setIsAbk(!!defaultIsAbk);
    }
  }, [open, defaultName, initialPreview, defaultIsAbk]);

  if (!open) return null;

  const handlePick = () => fileRef.current?.click();

  const toDataURL = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    try {
      setError(null);
      const f = e.target.files?.[0] ?? null;

      if (!f) {
        // Batal pilih file → tetap pertahankan preview lama
        setFile(null);
        setIconPreview(initialPreview || null);
        return;
      }

      // Validasi ukuran
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`Ukuran file melebihi ${MAX_MB} MB`);
        setFile(null);
        setIconPreview(initialPreview || null);
        return;
      }

      // Validasi tipe
      const okType =
        /image\/(png|svg\+xml|x-icon)/.test(f.type) || /\.(png|svg|ico)$/i.test(f.name);
      if (!okType) {
        setError("Format tidak didukung. Gunakan PNG, SVG, atau ICO.");
        setFile(null);
        setIconPreview(initialPreview || null);
        return;
      }

      setFile(f);
      // DataURL untuk preview instan
      const dataUrl = await toDataURL(f);
      setIconPreview(dataUrl);
    } catch {
      setError("Gagal membaca file. Coba lagi.");
      setFile(null);
      setIconPreview(initialPreview || null);
    }
  };

  // Validasi submit
  const nameOk = Boolean(name.trim());
  const iconOk = requireIcon ? Boolean(iconPreview) : true;
  const canSubmit = nameOk && iconOk && !error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (requireIcon && !iconPreview && !error) setError("Wajib upload icon terlebih dahulu.");
      return;
    }
    const trimmed = name.trim();

    // Edit mode, user tidak upload baru -> jangan kirim iconBase64 (agar icon lama tetap)
    const sameAsInitial = iconPreview === (initialPreview || null);
    if (!requireIcon && sameAsInitial) {
      onSubmit?.({ name: trimmed, file: null, isAbk });
    } else {
      onSubmit?.({ name: trimmed, iconBase64: iconPreview ?? null, file, isAbk });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form className="p-6" onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="text-2xl font-semibold text-[#0F172A]">{title}</h3>
            <button
              type="button"
              aria-label="Tutup"
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <RiCloseLine size={24} />
            </button>
          </div>

          <div className="mt-3 h-px w-full bg-neutral-200" />

          {/* Icon Instrumen */}
          <div className="mt-5">
            <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
              Icon Instrumen{requireIcon ? <span className="text-red-600"> *</span> : null}
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePick}
                className="inline-flex items-center gap-2 rounded-full border border-[#B8C8DA] px-4 py-2.5 text-[15px] font-semibold text-[var(--secondary-color,#0682DF)] hover:bg-[var(--accent-blue-light-color,#E7EFFD)] transition"
              >
                <RiUpload2Line className="text-[18px]" />
                Upload Icon
              </button>

              {/* Preview kecil */}
              {iconPreview && (
                <img
                  src={iconPreview}
                  alt="Preview icon"
                  className="h-10 w-10 rounded-xl border border-neutral-200 object-contain"
                />
              )}

              {/* Nama file */}
              {file && (
                <span className="text-sm text-[#6B7E93] truncate max-w-[50%]">
                  {file.name}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-[#6B7E93]">
              Supported formats (Max {MAX_MB} MB): PNG, SVG, ICO
            </p>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <input
              ref={fileRef}
              type="file"
              accept=".png,.svg,.ico,image/png,image/svg+xml,image/x-icon"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Nama Instrumen */}
          <div className="mt-5">
            <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
              Nama Instrumen
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan Nama Instrumen"
              className="w-full rounded-xl border border-[#B8C8DA] bg-white px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-neutral-200"
            />
          </div>

          {/* Toggle ABK */}
          <div className="mt-5">
            <div className="flex items-center justify-between rounded-xl border border-[#B8C8DA] bg-white px-4 py-3">
              <div className="pr-4">
                <p className="text-[15px] font-semibold text-[#0F172A]">Instrumen ABK</p>
                <p className="text-sm text-[#6B7E93]">
                  Tandai jika instrumen khusus untuk pembelajaran ABK.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAbk((v) => !v)}
                aria-pressed={isAbk}
                className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${
                  isAbk
                    ? "bg-[var(--secondary-color,#0682DF)] border-[var(--secondary-color,#0682DF)]"
                    : "bg-[#E6EDF5] border-[#C7D5E5]"
                }`}
                title={isAbk ? "Instrumen ABK" : "Instrumen reguler"}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                    isAbk ? "translate-x-6" : "translate-x-1"
                  }`}
                />
                <span className="sr-only">Toggle instrumen ABK</span>
              </button>
            </div>
          </div>

          {/* Action */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold hover:brightness-95 transition disabled:opacity-60"
              disabled={!canSubmit}
              aria-disabled={!canSubmit}
              title={
                !canSubmit
                  ? requireIcon
                    ? "Isi nama & upload icon terlebih dahulu"
                    : "Isi nama terlebih dahulu"
                  : undefined
              }
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInstrumentModal;
