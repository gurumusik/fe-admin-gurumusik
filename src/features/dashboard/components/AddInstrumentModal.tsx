// src/components/ui/common/AddInstrumentModal.tsx
import React from "react";
import { RiCloseLine, RiUpload2Line } from "react-icons/ri";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: { name: string; file?: File | null }) => void; // optional
  title?: string;             // default: "Jenis Instrumen"
  defaultName?: string;       // saat mode edit
};

const AddInstrumentModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  title = "Jenis Instrumen",
  defaultName = "",
}) => {
  const [name, setName] = React.useState(defaultName);
  const [file, setFile] = React.useState<File | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(defaultName || "");
      setFile(null);
    }
  }, [open, defaultName]);

  if (!open) return null;

  const handlePick = () => fileRef.current?.click();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ name: name.trim(), file });
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
              Icon Instrumen
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

              {/* preview nama file (opsional) */}
              {file && (
                <span className="text-sm text-[#6B7E93] truncate max-w-[50%]">
                  {file.name}
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-[#6B7E93]">
              Supported formats (Max 5 mb): PNG, SVG, ICO
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".png,.svg,.ico,image/png,image/svg+xml,image/x-icon"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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

          {/* Action */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full h-12 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold hover:brightness-95 transition"
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
