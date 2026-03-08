import React from 'react';
import { RiAddLine, RiCloseLine } from 'react-icons/ri';

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

export type StringItemsInputProps = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  helperText?: React.ReactNode;
  addLabel?: string;
  disabled?: boolean;
};

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

export default function StringItemsInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  addLabel = 'Tambah',
  disabled,
}: StringItemsInputProps) {
  const [draft, setDraft] = React.useState('');

  const add = () => {
    if (disabled) return;
    const nextItem = normalize(draft);
    if (!nextItem) return;
    const exists = value.some((v) => normalize(v).toLowerCase() === nextItem.toLowerCase());
    const next = exists ? value : [...value, nextItem];
    onChange(next);
    setDraft('');
  };

  const removeAt = (idx: number) => {
    if (disabled) return;
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="mb-2 block text-md font-medium text-neutral-900">{label}</label>

      <div className="flex gap-2">
        <input
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color) disabled:bg-neutral-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={add}
          className={cls(
            'inline-flex h-[46px] items-center gap-2 rounded-xl px-4 font-semibold transition',
            'bg-(--secondary-color) text-white hover:brightness-95 disabled:opacity-60'
          )}
        >
          <RiAddLine />
          {addLabel}
        </button>
      </div>

      {helperText ? <div className="mt-2 text-sm text-neutral-600">{helperText}</div> : null}

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-800"
            >
              {t}
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={disabled}
                className="grid size-5 place-items-center rounded-full hover:bg-black/5 disabled:opacity-60"
                aria-label={`Hapus ${t}`}
                title="Hapus"
              >
                <RiCloseLine />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

