/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import {
  RiAddLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiDeleteBin6Line,
  RiEdit2Line,
  RiQuestionFill,
} from 'react-icons/ri';

import ConfirmationModal, {
  type ConfirmationModalProps,
} from '@/components/ui/common/ConfirmationModal';
import { getStatusColor } from '@/utils/getStatusColor';
import {
  createRevisionTemplate,
  deleteRevisionTemplate,
  disableRevisionTemplate,
  enableRevisionTemplate,
  listRevisionTemplates,
  updateRevisionTemplate,
  type RevisionTemplateDTO,
  type RevisionTemplateFieldOption,
} from '@/services/api/revisionTemplate.api';
import { getRevisionFieldLabel } from '@/features/dashboard/pages/verified-tutor/revisionFieldMap';

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

type StatusFilter = 'all' | 'active' | 'inactive';

type EditorState = {
  open: boolean;
  mode: 'create' | 'edit';
  templateId: number | null;
  field_key: string;
  name: string;
  message: string;
  sort_order: number;
  is_active: boolean;
};

const emptyEditorState: EditorState = {
  open: false,
  mode: 'create',
  templateId: null,
  field_key: '',
  name: '',
  message: '',
  sort_order: 0,
  is_active: true,
};

function pageCount(total: number, limit: number) {
  return Math.max(1, Math.ceil((total || 0) / Math.max(1, limit || 20)));
}

function pageWindow(total: number, current: number) {
  const out: Array<number | '...'> = [];
  const push = (x: number | '...') => {
    if (out[out.length - 1] !== x) out.push(x);
  };
  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '...') push('...');
  }
  return out;
}

const toEditorState = (row: RevisionTemplateDTO): EditorState => ({
  open: true,
  mode: 'edit',
  templateId: row.id,
  field_key: row.field_key,
  name: row.name,
  message: row.message,
  sort_order: row.sort_order,
  is_active: row.is_active,
});

export default function AdminRevisionTemplatesPage() {
  const [q, setQ] = useState('');
  const [fieldKey, setFieldKey] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>(emptyEditorState);
  const [resp, setResp] = useState<{
    page: number;
    limit: number;
    total: number;
    data: RevisionTemplateDTO[];
    field_options: RevisionTemplateFieldOption[];
  }>({ page: 1, limit: 20, total: 0, data: [], field_options: [] });
  const [confirm, setConfirm] = useState<
    Pick<
      ConfirmationModalProps,
      | 'isOpen'
      | 'title'
      | 'texts'
      | 'icon'
      | 'iconTone'
      | 'button1'
      | 'button2'
      | 'showCloseIcon'
    >
  >({ isOpen: false, title: '', texts: [], icon: null, iconTone: 'neutral' });

  const closeConfirm = () => setConfirm((current) => ({ ...current, isOpen: false }));

  const is_active = useMemo(() => {
    if (status === 'active') return true;
    if (status === 'inactive') return false;
    return undefined;
  }, [status]);

  const totalPages = useMemo(() => pageCount(resp.total, resp.limit), [resp.total, resp.limit]);

  const fieldOptions = useMemo(() => {
    if (Array.isArray(resp.field_options) && resp.field_options.length) return resp.field_options;
    return [];
  }, [resp.field_options]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRevisionTemplates({
        q: q.trim() || undefined,
        field_key: fieldKey || undefined,
        is_active,
        page,
        limit,
      });
      setResp({
        page: data.page,
        limit: data.limit,
        total: data.total,
        data: Array.isArray(data.data) ? data.data : [],
        field_options: Array.isArray(data.field_options) ? data.field_options : [],
      });
    } catch (err: any) {
      setError(err?.message ?? 'Gagal memuat template revisi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const timer = window.setTimeout(async () => {
      if (!alive) return;
      await load();
    }, 300);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, fieldKey, is_active, page, limit]);

  const openCreate = () =>
    setEditor({
      ...emptyEditorState,
      open: true,
      field_key: fieldOptions[0]?.field_key ?? '',
    });

  const closeEditor = () => {
    if (!submitting) setEditor(emptyEditorState);
  };

  const submitEditor = async () => {
    if (!editor.field_key.trim() || !editor.name.trim() || !editor.message.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        field_key: editor.field_key.trim(),
        name: editor.name.trim(),
        message: editor.message.trim(),
        sort_order: editor.sort_order,
        is_active: editor.is_active,
      };
      if (editor.mode === 'create') await createRevisionTemplate(payload);
      else if (editor.templateId) await updateRevisionTemplate(editor.templateId, payload);

      setEditor(emptyEditorState);
      setConfirm({
        isOpen: true,
        title: editor.mode === 'create' ? 'Template Berhasil Dibuat' : 'Template Berhasil Disimpan',
        texts: [
          editor.mode === 'create'
            ? 'Template revisi baru berhasil ditambahkan.'
            : 'Perubahan template revisi berhasil disimpan.',
        ],
        icon: <RiCheckboxCircleFill />,
        iconTone: 'success',
        showCloseIcon: true,
        button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
      });
      await load();
    } catch (err: any) {
      setConfirm({
        isOpen: true,
        title: editor.mode === 'create' ? 'Gagal Membuat Template' : 'Gagal Menyimpan Template',
        texts: [err?.message ?? 'Terjadi kendala. Silakan coba lagi.'],
        icon: <RiCloseLine />,
        iconTone: 'danger',
        showCloseIcon: true,
        button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const askToggle = (row: RevisionTemplateDTO) => {
    const willEnable = !row.is_active;
    setConfirm({
      isOpen: true,
      title: willEnable ? `Aktifkan template "${row.name}"?` : `Nonaktifkan template "${row.name}"?`,
      texts: [
        willEnable
          ? 'Template akan tersedia di modal revisi admin.'
          : 'Template tidak akan muncul lagi sebagai pilihan di modal revisi.',
      ],
      icon: <RiQuestionFill />,
      iconTone: 'warning',
      showCloseIcon: true,
      button2: { label: 'Batal', onClick: closeConfirm, variant: 'outline' },
      button1: {
        label: willEnable ? 'Aktifkan' : 'Nonaktifkan',
        variant: 'primary',
        onClick: async () => {
          try {
            if (willEnable) await enableRevisionTemplate(row.id);
            else await disableRevisionTemplate(row.id);
            setConfirm({
              isOpen: true,
              title: 'Status Template Diperbarui',
              texts: [willEnable ? 'Template berhasil diaktifkan.' : 'Template berhasil dinonaktifkan.'],
              icon: <RiCheckboxCircleFill />,
              iconTone: 'success',
              showCloseIcon: true,
              button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
            });
            await load();
          } catch (err: any) {
            setConfirm({
              isOpen: true,
              title: 'Gagal Memperbarui Status',
              texts: [err?.message ?? 'Terjadi kendala. Silakan coba lagi.'],
              icon: <RiCloseLine />,
              iconTone: 'danger',
              showCloseIcon: true,
              button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
            });
          }
        },
      },
    });
  };

  const askDelete = (row: RevisionTemplateDTO) => {
    setConfirm({
      isOpen: true,
      title: `Hapus template "${row.name}"?`,
      texts: ['Aksi ini tidak bisa dibatalkan.'],
      icon: <RiQuestionFill />,
      iconTone: 'danger',
      showCloseIcon: true,
      button2: { label: 'Batal', onClick: closeConfirm, variant: 'outline' },
      button1: {
        label: 'Hapus',
        variant: 'danger',
        onClick: async () => {
          try {
            await deleteRevisionTemplate(row.id);
            setConfirm({
              isOpen: true,
              title: 'Template Dihapus',
              texts: ['Template revisi berhasil dihapus.'],
              icon: <RiCheckboxCircleFill />,
              iconTone: 'success',
              showCloseIcon: true,
              button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
            });
            await load();
          } catch (err: any) {
            setConfirm({
              isOpen: true,
              title: 'Gagal Menghapus Template',
              texts: [err?.message ?? 'Terjadi kendala. Silakan coba lagi.'],
              icon: <RiCloseLine />,
              iconTone: 'danger',
              showCloseIcon: true,
              button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
            });
          }
        },
      },
    });
  };

  return (
    <>
      <div className="rounded-2xl bg-white">
        <div className="px-6 sm:px-8 lg:px-10 py-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-800">Revision Templates</h1>
              <div className="mt-1 text-sm text-neutral-500">
                Kelola template pesan revisi per field untuk verifikasi calon tutor.
              </div>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center h-11 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold px-6 hover:brightness-95 transition cursor-pointer"
            >
              <RiAddLine className="text-lg" />
              <span className="ml-2">Tambah Template</span>
            </button>
          </div>

          <section className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_260px_220px_140px]">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">Search</label>
                <input
                  value={q}
                  onChange={(event) => {
                    setPage(1);
                    setQ(event.target.value);
                  }}
                  placeholder="Cari nama template atau isi pesan..."
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">Field</label>
                <select
                  value={fieldKey}
                  onChange={(event) => {
                    setPage(1);
                    setFieldKey(event.target.value);
                  }}
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-(--secondary-color)"
                >
                  <option value="">Semua field</option>
                  {fieldOptions.map((option) => (
                    <option key={option.field_key} value={option.field_key}>
                      {getRevisionFieldLabel(option.field_key) || option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">Status</label>
                <select
                  value={status}
                  onChange={(event) => {
                    setPage(1);
                    setStatus(event.target.value as StatusFilter);
                  }}
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-(--secondary-color)"
                >
                  <option value="all">Semua</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-Aktif</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">Limit</label>
                <select
                  value={String(limit)}
                  onChange={(event) => {
                    setPage(1);
                    setLimit(Number(event.target.value) || 20);
                  }}
                  className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-(--secondary-color)"
                >
                  {[10, 20, 50, 100].map((item) => (
                    <option key={item} value={String(item)}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </section>

          <section className="mt-5 rounded-2xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-700">
                  <tr>
                    <th className="py-3 pl-4 pr-3 font-semibold">Field</th>
                    <th className="py-3 px-3 font-semibold">Template</th>
                    <th className="py-3 px-3 font-semibold">Pesan</th>
                    <th className="py-3 px-3 font-semibold">Sort</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 pr-4 pl-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : null}

                  {!loading && resp.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                        Belum ada template revisi.
                      </td>
                    </tr>
                  ) : null}

                  {!loading &&
                    resp.data.map((row) => {
                      const statusLabel = row.is_active ? 'Aktif' : 'Non-Aktif';
                      return (
                        <tr key={row.id} className="border-t border-neutral-200">
                          <td className="py-3 pl-4 pr-3">
                            <div className="font-medium text-neutral-900">
                              {getRevisionFieldLabel(row.field_key)}
                            </div>
                            <div className="mt-1 text-xs text-neutral-500">{row.field_key}</div>
                          </td>
                          <td className="py-3 px-3 text-neutral-900 font-medium">{row.name}</td>
                          <td className="py-3 px-3 text-neutral-700">
                            <div className="max-w-[460px] whitespace-pre-wrap line-clamp-3">
                              {row.message}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-neutral-800">{row.sort_order}</td>
                          <td className={cls('py-3 px-3 font-semibold', getStatusColor(statusLabel))}>
                            {statusLabel}
                          </td>
                          <td className="py-3 pr-4 pl-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setEditor(toEditorState(row))}
                                className="inline-flex items-center gap-2 rounded-xl border border-[var(--secondary-color)] px-3 py-2 text-sm text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                              >
                                <RiEdit2Line />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => askToggle(row)}
                                className={cls(
                                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-black/5',
                                  row.is_active
                                    ? 'border-red-200 text-red-700'
                                    : 'border-emerald-200 text-emerald-700'
                                )}
                              >
                                {row.is_active ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                type="button"
                                onClick={() => askDelete(row)}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <RiDeleteBin6Line />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-neutral-500">
              Menampilkan {resp.data.length} dari {resp.total} template.
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="h-10 rounded-xl border border-black/10 bg-white px-4 text-sm text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5"
              >
                Prev
              </button>
              {pageWindow(totalPages, page).map((item, index) =>
                item === '...' ? (
                  <span
                    key={`dots-${index}`}
                    className="inline-flex h-10 min-w-10 items-center justify-center px-2 text-sm text-neutral-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={cls(
                      'h-10 min-w-10 rounded-xl border px-3 text-sm',
                      page === item
                        ? 'border-[var(--secondary-color)] bg-[var(--secondary-light-color)] text-[var(--secondary-color)]'
                        : 'border-black/10 bg-white text-neutral-700 hover:bg-black/5'
                    )}
                  >
                    {item}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="h-10 rounded-xl border border-black/10 bg-white px-4 text-sm text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {editor.open ? (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#0B1220]/60" onClick={closeEditor} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                <div>
                  <p className="text-md font-semibold text-neutral-900">
                    {editor.mode === 'create' ? 'Tambah Revision Template' : 'Edit Revision Template'}
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    Simpan template pesan revisi yang bisa dipakai ulang di modal verifikasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-neutral-100"
                >
                  <RiCloseLine className="text-xl text-neutral-700" />
                </button>
              </div>

              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-5 py-4">
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-800">Field</label>
                    <select
                      value={editor.field_key}
                      onChange={(event) =>
                        setEditor((current) => ({ ...current, field_key: event.target.value }))
                      }
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-(--secondary-color)"
                    >
                      <option value="">Pilih field</option>
                      {fieldOptions.map((option) => (
                        <option key={option.field_key} value={option.field_key}>
                          {getRevisionFieldLabel(option.field_key) || option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-800">Sort Order</label>
                    <input
                      type="number"
                      value={editor.sort_order}
                      onChange={(event) =>
                        setEditor((current) => ({
                          ...current,
                          sort_order: Number(event.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-(--secondary-color)"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-neutral-800">Nama Template</label>
                  <input
                    value={editor.name}
                    onChange={(event) =>
                      setEditor((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Contoh: Belum Grade 5"
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-neutral-800">Pesan Template</label>
                  <textarea
                    value={editor.message}
                    onChange={(event) =>
                      setEditor((current) => ({ ...current, message: event.target.value }))
                    }
                    placeholder="Tulis pesan template revisi di sini..."
                    className="min-h-[180px] w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
                  />
                </div>

                <label className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={editor.is_active}
                    onChange={(event) =>
                      setEditor((current) => ({ ...current, is_active: event.target.checked }))
                    }
                  />
                  Template aktif dan bisa dipakai di modal revisi
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={submitting}
                  className="h-11 rounded-full border border-neutral-300 px-6 font-semibold text-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitEditor}
                  disabled={
                    submitting ||
                    !editor.field_key.trim() ||
                    !editor.name.trim() ||
                    !editor.message.trim()
                  }
                  className="h-11 rounded-full bg-[var(--primary-color)] px-6 font-semibold text-neutral-900 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editor.mode === 'create'
                    ? 'Buat Template'
                    : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmationModal
        isOpen={confirm.isOpen}
        onClose={closeConfirm}
        icon={confirm.icon}
        iconTone={confirm.iconTone}
        title={confirm.title}
        texts={confirm.texts}
        button1={confirm.button1}
        button2={confirm.button2}
        showCloseIcon={confirm.showCloseIcon}
        align="center"
      />
    </>
  );
}
