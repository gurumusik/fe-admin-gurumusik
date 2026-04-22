import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { RiImageAddLine } from 'react-icons/ri';

import { publicFileUrl } from '@/utils/url';

const inputClass =
  'h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/35 disabled:bg-neutral-50';

const MAX_IMAGE_SIZE = 6 * 1024 * 1024;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });

const resolvePreviewSrc = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return '';
  if (/^data:image\//i.test(normalized)) return normalized;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('/uploads/')) return publicFileUrl(normalized);
  return normalized;
};

type ProgramPageImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  previewAlt: string;
  disabled?: boolean;
  helperText?: ReactNode;
};

export default function ProgramPageImageUploadField({
  label,
  value,
  onChange,
  previewAlt,
  disabled,
  helperText,
}: ProgramPageImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  const previewSrc = resolvePreviewSrc(value);
  const displayValue = value.trim()
    ? /^data:image\//i.test(value)
      ? 'Gambar baru siap disimpan'
      : value
    : '';

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewSrc]);

  const handlePickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorText('File harus berupa gambar.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrorText('Ukuran gambar maksimal 6MB.');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
      setErrorText(null);
    } catch (error: any) {
      setErrorText(error?.message || 'Gagal membaca file gambar.');
    }
  };

  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-neutral-800">{label}</span>

      <div className="rounded-2xl border border-dashed border-neutral-300 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-neutral-100 md:w-44">
            {previewSrc && !previewFailed ? (
              <img
                src={previewSrc}
                alt={previewAlt}
                className="h-full w-full object-cover"
                onError={() => setPreviewFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-neutral-500">
                Preview gambar belum tersedia.
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <input
              id={inputId}
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              disabled={disabled}
              onChange={handlePickFile}
              className="hidden"
            />

            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--secondary-color)] px-4 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
            >
              <RiImageAddLine className="text-lg" />
              {value.trim() ? 'Ganti Gambar' : 'Upload Gambar'}
            </button>

            <input
              type="text"
              value={displayValue}
              readOnly
              disabled
              className={inputClass}
              placeholder="Belum ada gambar"
            />

            <p className="text-xs text-neutral-500">
              Format yang didukung: PNG, JPG, JPEG, WEBP. Maksimal 6MB.
            </p>

            {helperText ? <div className="text-xs text-neutral-500">{helperText}</div> : null}
            {errorText ? <p className="text-xs text-red-600">{errorText}</p> : null}
          </div>
        </div>
      </div>
    </label>
  );
}
