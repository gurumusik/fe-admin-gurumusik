'use client';

import React, { useRef, useState } from 'react';
import { RiCloseLine, RiUpload2Line } from 'react-icons/ri';

type FeedbackTutorModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (payload: { message: string; file?: File | null }) => void;
};

const FeedbackTutorModal: React.FC<FeedbackTutorModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  if (!open) return null;

  const handleChooseFile = () => fileInputRef.current?.click();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ message, file });
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[161] w-[min(560px,95vw)] rounded-3xl bg-white shadow-2xl border border-black/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <h3 className="text-lg font-semibold text-neutral-900">
            Formulir Pemberian Masukan Guru
          </h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5" aria-label="Close">
            <RiCloseLine size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6">
          <div className="mb-4">
            <div className="text-sm text-neutral-600">Perihal:</div>
            <div className="mt-1 text-md font-semibold text-neutral-900">Masukan Untuk Guru</div>
          </div>

          <div className="mb-3">
            <button
              type="button"
              onClick={handleChooseFile}
              className="inline-flex items-center gap-2 rounded-full border border-(--secondary-color) px-4 py-2 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
            >
              <RiUpload2Line /> Upload Foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/heic,image/heif"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="mt-2 text-xs text-neutral-500">
              Format (Max 5mb): PNG, JPG, JPEG, HEIG
            </div>
            {file && (
              <div className="mt-2 text-sm text-neutral-700">
                File terpilih: <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>

          <div className="mb-5">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-black/10 bg-white p-3 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-(--secondary-light-color)"
              placeholder="Masukkan Keterangan Masukan/kritik untuk guru"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-(--primary-color) px-6 py-3 text-md font-semibold text-black hover:brightness-95"
          >
            Kirim Laporan
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackTutorModal;
