/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  RiCoinsLine,
  RiSaveLine,
  RiSettings3Line,
  RiTranslate2,
} from 'react-icons/ri';
import {
  getBillingConfig,
  updateBillingConfig,
  type BillingConfigItem,
} from '@/services/api/billingConfig.api';

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

type FormState = {
  registration_fee: string;
  service_fee_flat: string;
  accommodation_fee_default: string;
  guru_split_percent: string;
  admin_split_percent: string;
  guru_pph_percent: string;
  bahasa_non_id_fee: string;
  bahasa_fee_to_guru: boolean;
};

const inputClass =
  'h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40';

const numberToInput = (value?: number | null) => String(Number(value || 0));
const sanitizeMoneyInput = (value: string) => {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return '';
  return String(Number(digits));
};

const formatRupiahInput = (value: string) => {
  const normalized = sanitizeMoneyInput(value);
  if (!normalized) return '';
  return `Rp ${Number(normalized).toLocaleString('id-ID')}`;
};

const formatRupiahText = (value: string) =>
  `Rp ${parseNumberInput(value).toLocaleString('id-ID')}`;

const mapToForm = (item: BillingConfigItem): FormState => ({
  registration_fee: numberToInput(item.registration_fee),
  service_fee_flat: numberToInput(item.service_fee_flat),
  accommodation_fee_default: numberToInput(item.accommodation_fee_default),
  guru_split_percent: numberToInput(item.guru_split_percent),
  admin_split_percent: numberToInput(item.admin_split_percent),
  guru_pph_percent: numberToInput(item.guru_pph_percent),
  bahasa_non_id_fee: numberToInput(item.bahasa_non_id_fee),
  bahasa_fee_to_guru: Boolean(item.bahasa_fee_to_guru),
});

const parseNumberInput = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const BillingConfigPage: React.FC = () => {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getBillingConfig();
      setForm(mapToForm(res.data));
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat billing config.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const splitTotal = useMemo(() => {
    if (!form) return 0;
    return parseNumberInput(form.guru_split_percent) + parseNumberInput(form.admin_split_percent);
  }, [form]);

  const splitValid = Math.abs(splitTotal - 100) < 0.001;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSuccess(null);
  };

  const setMoneyField = (
    key: 'registration_fee' | 'service_fee_flat' | 'accommodation_fee_default' | 'bahasa_non_id_fee',
    value: string
  ) => {
    setField(key, sanitizeMoneyInput(value));
  };

  const handleSubmit = async () => {
    if (!form) return;
    if (!splitValid) {
      setError('Total pembagian komisi guru dan admin harus 100%.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: BillingConfigItem = {
        registration_fee: parseNumberInput(form.registration_fee),
        service_fee_flat: parseNumberInput(form.service_fee_flat),
        accommodation_fee_default: parseNumberInput(form.accommodation_fee_default),
        guru_split_percent: parseNumberInput(form.guru_split_percent),
        admin_split_percent: parseNumberInput(form.admin_split_percent),
        guru_pph_percent: parseNumberInput(form.guru_pph_percent),
        bahasa_non_id_fee: parseNumberInput(form.bahasa_non_id_fee),
        bahasa_fee_to_guru: Boolean(form.bahasa_fee_to_guru),
      };

      const res = await updateBillingConfig(payload);
      setForm(mapToForm(res.data));
      setSuccess(res.message || 'Billing config berhasil diperbarui.');
    } catch (e: any) {
      setError(e?.message || 'Gagal menyimpan billing config.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--secondary-light-color)]">
              <RiSettings3Line size={22} className="text-[var(--secondary-color)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Billing Config</h2>
              <p className="text-sm text-neutral-600">
                Atur default biaya, split komisi, dan alokasi biaya bahasa dari dashboard admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || saving || !form || !splitValid}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#F6C437] px-6 font-semibold text-[#0B0B0B] transition hover:brightness-95 disabled:opacity-60"
          >
            <RiSaveLine className="mr-2 text-lg" />
            {saving ? 'Menyimpan...' : 'Simpan Config'}
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-[var(--accent-blue-light-color)]/60 p-4 text-sm text-neutral-700">
          Split komisi di bawah ini dipakai sebagai <b>default</b> jika program belum memiliki
          ` komisi guru / sesi `. Jika program sudah punya komisi flat sendiri, setting program akan
          meng-override split default ini.
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {success && (
          <div className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        {loading || !form ? (
          <div className="mt-6 rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-500">
            Memuat billing config...
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-blue-light-color)]/70">
                    <RiCoinsLine className="text-xl text-[var(--secondary-color)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Default Biaya</h3>
                    <p className="text-sm text-neutral-600">
                      Dipakai saat checkout jika transaksi belum punya snapshot nilai sendiri.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-neutral-800">Biaya Pendaftaran</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatRupiahInput(form.registration_fee)}
                      onChange={(e) => setMoneyField('registration_fee', e.target.value)}
                      className={inputClass}
                      placeholder="Rp 0"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-neutral-800">Biaya Layanan</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatRupiahInput(form.service_fee_flat)}
                      onChange={(e) => setMoneyField('service_fee_flat', e.target.value)}
                      className={inputClass}
                      placeholder="Rp 0"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Default Biaya Akomodasi</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatRupiahInput(form.accommodation_fee_default)}
                      onChange={(e) => setMoneyField('accommodation_fee_default', e.target.value)}
                      className={inputClass}
                      placeholder="Rp 0"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-[#FFF6DA]">
                    <RiCoinsLine className="text-xl text-[#B88800]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">Default Split Komisi</h3>
                    <p className="text-sm text-neutral-600">
                      Berlaku saat program belum set komisi flat per sesi.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-neutral-800">Guru (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={form.guru_split_percent}
                      onChange={(e) => setField('guru_split_percent', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-neutral-800">Admin (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={form.admin_split_percent}
                      onChange={(e) => setField('admin_split_percent', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-neutral-800">PPh Guru (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={form.guru_pph_percent}
                      onChange={(e) => setField('guru_pph_percent', e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>

                <div
                  className={cls(
                    'mt-4 rounded-xl p-3 text-sm',
                    splitValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  )}
                >
                  Total split saat ini: <b>{splitTotal}%</b>. Nilai guru + admin harus tepat 100%.
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#EEF7FF]">
                  <RiTranslate2 className="text-xl text-[var(--secondary-color)]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Biaya Bahasa</h3>
                  <p className="text-sm text-neutral-600">
                    Atur biaya tambahan bahasa non-Indonesia dan tentukan penerimanya.
                  </p>
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-800">Biaya Bahasa Non Indonesia</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatRupiahInput(form.bahasa_non_id_fee)}
                  onChange={(e) => setMoneyField('bahasa_non_id_fee', e.target.value)}
                  className={inputClass}
                  placeholder="Rp 0"
                />
              </label>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4">
                <input
                  type="checkbox"
                  checked={form.bahasa_fee_to_guru}
                  onChange={(e) => setField('bahasa_fee_to_guru', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-[var(--secondary-color)] focus:ring-[var(--secondary-color)]"
                />
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    Biaya bahasa masuk ke komisi guru
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    Jika dicentang, fee bahasa ditambahkan ke pendapatan guru di sesi pertama.
                    Jika tidak, fee bahasa masuk ke earnings admin.
                  </p>
                </div>
              </label>

              <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
                Ringkasan:
                <div className="mt-2">
                  Default split guru/admin: <b>{form.guru_split_percent}% / {form.admin_split_percent}%</b>
                </div>
                <div className="mt-1">
                  PPh guru: <b>{form.guru_pph_percent}%</b>
                </div>
                <div className="mt-1">
                  Biaya bahasa non-ID: <b>{formatRupiahText(form.bahasa_non_id_fee)}</b>
                </div>
                <div className="mt-1">
                  Penerima biaya bahasa: <b>{form.bahasa_fee_to_guru ? 'Guru' : 'Admin'}</b>
                </div>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
};

export default BillingConfigPage;
