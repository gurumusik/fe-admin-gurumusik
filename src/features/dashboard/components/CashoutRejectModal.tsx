import React, { useEffect, useRef, useState } from "react";
import { RiCloseLine, RiUpload2Line } from "react-icons/ri";

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { subject: string; note: string; file?: File | null }) => Promise<void> | void;
  submitting?: boolean;
};

const MAX_MB = 5;
const ACCEPT_LIST = ["image/png", "image/jpeg", "image/jpg", "image/heic", "image/heif"];

export default function CashoutRejectModal({ isOpen, onClose, onSubmit, submitting }: Props) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNote("");
      setFile(null);
      setErr(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) return `Ukuran maksimal ${MAX_MB}MB.`;
    if (!ACCEPT_LIST.includes(f.type)) return "Format harus PNG, JPG, JPEG, atau HEIC.";
    return null;
  };

  const chooseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const v = validate(f);
    if (v) {
      setErr(v);
      setFile(null);
    } else {
      setErr(null);
      setFile(f);
    }
  };

  const disabled = submitting || note.trim().length < 5 || !!err;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-black/10 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-neutral-900">Formulir Penolakan Pencairan Komisi</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-neutral-500 hover:text-neutral-700 text-xl cursor-pointer"
          >
            <RiCloseLine size={25} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col text-md">
            <span className="text-neutral-500 font-semibold">Perihal:</span>
            <span className="text-neutral-900 font-semibold">Penolakan Pencairan Komisi</span>
          </div>

          {/* Upload */}
          <div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_LIST.join(",")}
              onChange={chooseFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--secondary-color)] px-4 py-2 text-sm font-semibold text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
            >
              <RiUpload2Line />
              Upload Foto
            </button>
            <div className="mt-1 text-[12px] text-neutral-500">
              Format (Max 5mb): PNG, JPG, JPEG, HEIC
            </div>
            {file && (
              <div className="mt-2 text-sm text-neutral-700">
                {file.name} • {(file.size / 1024 / 1024).toFixed(2)}MB
              </div>
            )}
            {err && <div className="mt-2 text-sm text-[var(--accent-red-color)]">{err}</div>}
          </div>

          {/* Note */}
          <div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]"
              placeholder="Masukkan keterangan Penolakan Pencairan Komisi"
            />
          </div>

          {/* Submit */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSubmit({ subject: "Penolakan Pencairan Komisi", note: note.trim(), file })}
            className={cls(
              "w-full rounded-full py-3 font-semibold",
              "bg-[#F9CA24] text-black hover:brightness-95",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            {submitting ? "Mengirim..." : "Kirim Laporan"}
          </button>
        </div>
      </div>
    </div>
  );
}
