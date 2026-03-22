import React, { useMemo, useState } from 'react';
import {
  RiInformationLine,
  RiNotification4Line,
  RiSendPlaneFill,
} from 'react-icons/ri';
import {
  createAdminBroadcastNotification,
  type BroadcastTargetRole,
} from '@/services/api/notification.api';

const inputClass =
  'h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none transition focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[var(--secondary-color)]/20';

const textareaClass =
  'min-h-[132px] w-full rounded-2xl border border-neutral-300 px-3 py-3 text-sm outline-none transition focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[var(--secondary-color)]/20';

const targetOptions: Array<{ value: BroadcastTargetRole; label: string; hint: string }> = [
  { value: 'all', label: 'Semua Role', hint: 'Kirim ke guru, murid, dan musician sekaligus.' },
  { value: 'guru', label: 'Guru', hint: 'Hanya dikirim ke akun guru.' },
  { value: 'murid', label: 'Murid', hint: 'Hanya dikirim ke akun murid.' },
  { value: 'musician', label: 'Musician', hint: 'Hanya dikirim ke akun musician.' },
];

type FormState = {
  targetRole: BroadcastTargetRole;
  title: string;
  message: string;
  actionUrl: string;
  kind: string;
  metadataJson: string;
};

const parseMetadataJson = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parsed = JSON.parse(trimmed);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Metadata harus berupa JSON object.');
  }

  return parsed as Record<string, unknown>;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Gagal mengirim notifikasi.';

const initialForm: FormState = {
  targetRole: 'all',
  title: '',
  message: '',
  actionUrl: '',
  kind: 'admin_broadcast',
  metadataJson: '',
};

const AdminNotificationsPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<{
    createdCount: number;
    totalRecipients: number;
    targetRoles: string[];
  } | null>(null);

  const selectedTarget = useMemo(
    () => targetOptions.find((item) => item.value === form.targetRole) || targetOptions[0],
    [form.targetRole]
  );

  const metadataPreview = useMemo(() => {
    try {
      const parsed = parseMetadataJson(form.metadataJson);
      return parsed ? Object.keys(parsed) : [];
    } catch {
      return null;
    }
  }, [form.metadataJson]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const message = form.message.trim();

    if (!title) {
      setError('Judul notifikasi wajib diisi.');
      return;
    }

    if (!message) {
      setError('Isi notifikasi wajib diisi.');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const metadata = parseMetadataJson(form.metadataJson);
      const res = await createAdminBroadcastNotification({
        targetRole: form.targetRole,
        title,
        message,
        actionUrl: form.actionUrl.trim() || null,
        kind: form.kind.trim() || 'admin_broadcast',
        metadata,
      });

      setSuccess(res.message || 'Notifikasi berhasil dikirim.');
      setResult({
        createdCount: Number(res.data?.created_count || 0),
        totalRecipients: Number(res.data?.total_recipients || 0),
        targetRoles: Array.isArray(res.data?.target_roles) ? res.data.target_roles : [],
      });
      setForm((prev) => ({
        ...prev,
        title: '',
        message: '',
        actionUrl: '',
        metadataJson: '',
      }));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--secondary-light-color)]">
              <RiNotification4Line className="text-2xl text-[var(--secondary-color)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Broadcast Notification</h2>
              <p className="text-sm text-neutral-600">
                Kirim notifikasi in-app dari admin ke role tertentu atau ke semua akun.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-[var(--accent-blue-light-color)]/60 px-4 py-3 text-sm text-neutral-700 lg:max-w-md">
            Gunakan `action URL` internal seperti `/dashboard/notification` atau
            `/dashboard-guru/teacher-change` agar tombol detail langsung mengarah ke halaman yang
            tepat di app.
          </div>
        </div>

        <form className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <section className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-blue-light-color)]/70">
                  <RiInformationLine className="text-xl text-[var(--secondary-color)]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Tujuan & Isi</h3>
                  <p className="text-sm text-neutral-600">
                    Tentukan role penerima, judul, dan deskripsi notifikasi.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-800">Target Role</span>
                  <select
                    value={form.targetRole}
                    onChange={(e) => setField('targetRole', e.target.value as BroadcastTargetRole)}
                    className={inputClass}
                  >
                    {targetOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500">{selectedTarget.hint}</p>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-800">Judul</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setField('title', e.target.value)}
                    className={inputClass}
                    placeholder="Contoh: Jadwal maintenance aplikasi"
                    maxLength={255}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-800">Isi / Deskripsi</span>
                  <textarea
                    value={form.message}
                    onChange={(e) => setField('message', e.target.value)}
                    className={textareaClass}
                    placeholder="Tuliskan isi notifikasi yang detail untuk user."
                    maxLength={5000}
                  />
                  <p className="text-right text-xs text-neutral-400">
                    {form.message.trim().length}/5000 karakter
                  </p>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-neutral-900">Pengaturan Lanjutan</h3>
              <p className="mt-1 text-sm text-neutral-600">
                `kind` untuk kategorisasi notifikasi. `metadata` opsional jika butuh payload tambahan.
              </p>

              <div className="mt-4 grid gap-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-800">Action URL</span>
                  <input
                    type="text"
                    value={form.actionUrl}
                    onChange={(e) => setField('actionUrl', e.target.value)}
                    className={inputClass}
                    placeholder="/dashboard/notification"
                    maxLength={500}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-800">Kind</span>
                  <input
                    type="text"
                    value={form.kind}
                    onChange={(e) => setField('kind', e.target.value)}
                    className={inputClass}
                    placeholder="admin_broadcast"
                    maxLength={100}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-800">Metadata JSON</span>
                  <textarea
                    value={form.metadataJson}
                    onChange={(e) => setField('metadataJson', e.target.value)}
                    className={textareaClass}
                    placeholder={`{\n  "category": "system",\n  "priority": "high"\n}`}
                  />
                  <p className="text-xs text-neutral-500">
                    Kosongkan jika tidak perlu payload tambahan.
                  </p>
                </label>
              </div>
            </section>

            {(error || success) && (
              <div className="space-y-3">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#F6C437] px-6 font-semibold text-[#0B0B0B] transition hover:brightness-95 disabled:opacity-60"
              >
                <RiSendPlaneFill className="mr-2 text-lg" />
                {sending ? 'Mengirim...' : 'Kirim Notifikasi'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setError(null);
                  setSuccess(null);
                  setResult(null);
                }}
                disabled={sending}
                className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 px-6 font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
              >
                Reset Form
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-neutral-900">Preview</h3>
              <p className="mt-1 text-sm text-neutral-600">
                Tampilan kasar notifikasi yang akan masuk ke app user.
              </p>

              <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--secondary-light-color)]">
                    <RiNotification4Line className="text-xl text-[var(--secondary-color)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--accent-blue-light-color)] px-3 py-1 text-xs font-semibold text-[var(--secondary-color)]">
                        {selectedTarget.label}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {form.kind.trim() || 'admin_broadcast'}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-neutral-900">
                      {form.title.trim() || 'Judul notifikasi'}
                    </p>
                    <p className="mt-2 whitespace-pre-line break-words text-sm text-neutral-600">
                      {form.message.trim() || 'Isi notifikasi akan tampil di sini.'}
                    </p>
                    <div className="mt-4 space-y-2 text-xs text-neutral-500">
                      <p>
                        <span className="font-semibold text-neutral-700">Action URL:</span>{' '}
                        {form.actionUrl.trim() || 'Tanpa action URL'}
                      </p>
                      <p>
                        <span className="font-semibold text-neutral-700">Metadata:</span>{' '}
                        {metadataPreview === null
                          ? 'Format JSON belum valid'
                          : metadataPreview.length
                            ? `${metadataPreview.length} key`
                            : 'Kosong'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-neutral-900">Panduan Cepat</h3>
              <div className="mt-4 space-y-3 text-sm text-neutral-600">
                <p>Gunakan `Semua Role` untuk pengumuman umum seperti maintenance atau promo nasional.</p>
                <p>Gunakan `kind` khusus kalau nanti butuh filtering atau styling berbeda di app.</p>
                <p>
                  Jika mengirim link eksternal, pakai URL penuh `https://...`. Untuk halaman app,
                  lebih aman gunakan path internal yang diawali `/`.
                </p>
              </div>
            </section>

            {result && (
              <section className="rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-5">
                <h3 className="text-base font-semibold text-green-800">Hasil Pengiriman</h3>
                <div className="mt-3 space-y-2 text-sm text-green-700">
                  <p>Total akun target: {result.totalRecipients}</p>
                  <p>Notifikasi berhasil dibuat: {result.createdCount}</p>
                  <p>Role penerima: {result.targetRoles.join(', ') || '-'}</p>
                </div>
              </section>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};

export default AdminNotificationsPage;
