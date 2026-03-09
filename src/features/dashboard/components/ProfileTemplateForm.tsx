import React, { useMemo } from 'react';
import StringItemsInput from '@/features/dashboard/components/StringItemsInput';

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

export const PROFILE_TEMPLATE_PLACEHOLDERS = [
  '{{name}}',
  '{{short_name}}',
  '{{instrument_name}}',
  '{{instrument_grade}}',
  '{{province}}',
  '{{city}}',
  '{{is_abk_available}}',
  '{{international_certificate}}',
] as const;

export type ProfileTemplateFormValues = {
  name: string;
  category: string;
  tags: string[];
  headline: string;
  about: string;
  designed_for: string[];
  sort_order: number;
  is_active: boolean;
};

export type ProfileTemplateFormProps = {
  title: string;
  values: ProfileTemplateFormValues;
  onChange: (next: ProfileTemplateFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting?: boolean;
  errorText?: string | null;
  rightPanel?: React.ReactNode;
};

export default function ProfileTemplateForm({
  title,
  values,
  onChange,
  onSubmit,
  submitLabel,
  submitting,
  errorText,
  rightPanel,
}: ProfileTemplateFormProps) {
  const canSubmit = useMemo(() => {
    return values.name.trim().length > 0 && values.category.trim().length > 0;
  }, [values.name, values.category]);

  const placeholderDoc = (
    <div className="mt-2 rounded-xl border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
      <div className="font-semibold text-neutral-800">Available placeholders</div>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {PROFILE_TEMPLATE_PLACEHOLDERS.map((p) => (
          <li key={p} className="font-mono text-[13px] text-neutral-700">
            {p}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="rounded-2xl bg-white">
      <div className="px-6 sm:px-8 lg:px-10 py-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-800">{title}</h1>
            <div className="mt-1 text-sm text-neutral-500">
              Template ini dipakai untuk mengisi naratif profile guru: Headline, About, Designed For.
            </div>
          </div>
        </div>

        <div className={cls('grid gap-6', rightPanel ? 'lg:grid-cols-2' : 'lg:grid-cols-1')}>
          <section>
            {errorText ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorText}
              </div>
            ) : null}

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-md font-medium text-neutral-900">Name</label>
                <input
                  value={values.name}
                  onChange={(e) => onChange({ ...values, name: e.target.value })}
                  placeholder="Nama template. Contoh: Template Profil Guru Piano (Beginner)"
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                />
              </div>

              <div>
                <label className="mb-2 block text-md font-medium text-neutral-900">Category</label>
                <input
                  value={values.category}
                  onChange={(e) => onChange({ ...values, category: e.target.value })}
                  placeholder="Contoh: General / Piano / Biola / ABK"
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                />
              </div>

              <StringItemsInput
                label="Tags"
                value={values.tags}
                onChange={(tags) => onChange({ ...values, tags })}
                placeholder="Ketik tag lalu Enter (contoh: beginner)"
                addLabel="Tambah"
              />

              <div>
                <label className="mb-2 block text-md font-medium text-neutral-900">Headline</label>
                <textarea
                  value={values.headline}
                  onChange={(e) => onChange({ ...values, headline: e.target.value })}
                  placeholder="Contoh: Instruktur Musik Berpengalaman dengan Pembelajaran Personalized"
                  rows={3}
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                />
                
              </div>

              <div>
                <label className="mb-2 block text-md font-medium text-neutral-900">About</label>
                <textarea
                  value={values.about}
                  onChange={(e) => onChange({ ...values, about: e.target.value })}
                  placeholder="Halo, saya {{name}}. Saya guru {{instrument_name}} grade {{instrument_grade}}."
                  rows={6}
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                />
                {placeholderDoc}
              </div>

              <StringItemsInput
                label="Designed For"
                value={values.designed_for}
                onChange={(designed_for) => onChange({ ...values, designed_for })}
                placeholder="Ketik item lalu Enter (contoh: Pemula yang ingin belajar dari nol)"
                addLabel="Tambah"
                helperText="Setiap item akan dirender sebagai bullet/daftar."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-md font-medium text-neutral-900">Sort Order</label>
                  <input
                    value={String(values.sort_order)}
                    inputMode="numeric"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d-]/g, '');
                      const n = Number(raw);
                      onChange({ ...values, sort_order: Number.isFinite(n) ? n : 0 });
                    }}
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-(--secondary-color)"
                  />
                  <div className="mt-1 text-sm text-neutral-500">
                    Angka lebih kecil akan muncul lebih dulu.
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-md font-medium text-neutral-900">Status</label>
                  <button
                    type="button"
                    onClick={() => onChange({ ...values, is_active: !values.is_active })}
                    className={cls(
                      'w-full rounded-xl border px-4 py-3 text-left font-semibold transition',
                      values.is_active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    )}
                  >
                    {values.is_active ? 'Aktif' : 'Non-Aktif'}
                  </button>
                  <div className="mt-1 text-sm text-neutral-500">
                    Template nonaktif tidak akan terlihat di sisi guru.
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!canSubmit || submitting}
                onClick={onSubmit}
                className={cls(
                  'mt-2 w-full rounded-xl px-4 py-3 text-center text-md font-semibold text-black transition',
                  'bg-(--primary-color) hover:brightness-95 disabled:opacity-50'
                )}
              >
                {submitting ? 'Menyimpan...' : submitLabel}
              </button>
            </div>
          </section>

          {rightPanel ? <aside>{rightPanel}</aside> : null}
        </div>
      </div>
    </div>
  );
}

