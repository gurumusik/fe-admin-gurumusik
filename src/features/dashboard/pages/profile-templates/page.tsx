/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiEyeFill,
  RiQuestionFill,
  RiCheckboxCircleFill,
  RiCloseLine,
} from 'react-icons/ri';

import ConfirmationModal, { type ConfirmationModalProps } from '@/components/ui/common/ConfirmationModal';
import { getStatusColor } from '@/utils/getStatusColor';
import {
  deleteProfileTemplate,
  disableProfileTemplate,
  enableProfileTemplate,
  listProfileTemplates,
  type ProfileTemplateSummaryDTO,
} from '@/services/api/profileTemplate.api';

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

type StatusFilter = 'all' | 'active' | 'inactive';

function pageCount(total: number, limit: number) {
  return Math.max(1, Math.ceil((total || 0) / Math.max(1, limit || 20)));
}

function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => {
    if (out[out.length - 1] !== x) out.push(x);
  };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

export default function AdminProfileTemplatesPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resp, setResp] = useState<{ page: number; limit: number; total: number; data: ProfileTemplateSummaryDTO[] }>(
    { page: 1, limit: 20, total: 0, data: [] }
  );

  // Confirmation modal (reuse for confirm+result)
  const [confirm, setConfirm] = useState<Pick<
    ConfirmationModalProps,
    'isOpen' | 'title' | 'texts' | 'icon' | 'iconTone' | 'button1' | 'button2' | 'showCloseIcon'
  >>({ isOpen: false, title: '', texts: [], icon: null, iconTone: 'neutral' });

  const closeConfirm = () => setConfirm((c) => ({ ...c, isOpen: false }));

  const is_active = useMemo(() => {
    if (status === 'active') return true;
    if (status === 'inactive') return false;
    return undefined;
  }, [status]);

  // fetch (debounced for q)
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await listProfileTemplates({
          q: q.trim() || undefined,
          category: category.trim() || undefined,
          is_active,
          page,
          limit,
        });
        if (!alive) return;
        setResp(r);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Gagal memuat data');
      } finally {
        if (alive) setLoading(false);
      }
    }, 350);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, category, is_active, page, limit]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const row of resp.data || []) {
      if (row?.category) set.add(String(row.category));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [resp.data]);

  const totalPages = useMemo(() => pageCount(resp.total, resp.limit), [resp.total, resp.limit]);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listProfileTemplates({
        q: q.trim() || undefined,
        category: category.trim() || undefined,
        is_active,
        page,
        limit,
      });
      setResp(r);
    } catch (e: any) {
      setError(e?.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const askToggle = (row: ProfileTemplateSummaryDTO) => {
    const willEnable = !row.is_active;
    setConfirm({
      isOpen: true,
      title: willEnable ? `Aktifkan template "${row.name}"?` : `Nonaktifkan template "${row.name}"?`,
      texts: [
        willEnable
          ? 'Template akan terlihat di sisi guru.'
          : 'Template tidak akan terlihat di sisi guru.',
      ],
      icon: <RiQuestionFill />,
      iconTone: 'warning',
      showCloseIcon: true,
      button2: { label: 'Batal', onClick: closeConfirm, variant: 'outline' },
      button1: {
        label: willEnable ? 'Aktifkan' : 'Nonaktifkan',
        onClick: async () => {
          try {
            setConfirm((c) => ({
              ...c,
              button1: c.button1 ? { ...c.button1, loading: true } : c.button1,
              button2: c.button2 ? { ...c.button2, loading: true } : c.button2,
            }));
            if (willEnable) await enableProfileTemplate(row.id);
            else await disableProfileTemplate(row.id);
            setConfirm({
              isOpen: true,
              title: 'Status Template Diperbarui',
              texts: [willEnable ? 'Template berhasil diaktifkan.' : 'Template berhasil dinonaktifkan.'],
              icon: <RiCheckboxCircleFill />,
              iconTone: 'success',
              showCloseIcon: true,
              button1: { label: 'Tutup', onClick: () => setConfirm((c) => ({ ...c, isOpen: false })) },
            });
            await refetch();
          } catch (e: any) {
            setConfirm({
              isOpen: true,
              title: 'Gagal Memperbarui Status',
              texts: [e?.message ?? 'Terjadi kendala. Silakan coba lagi.'],
              icon: <RiCloseLine />,
              iconTone: 'danger',
              showCloseIcon: true,
              button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
            });
          }
        },
        variant: 'primary',
      },
    });
  };

  const askDelete = (row: ProfileTemplateSummaryDTO) => {
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
            setConfirm((c) => ({
              ...c,
              button1: c.button1 ? { ...c.button1, loading: true } : c.button1,
              button2: c.button2 ? { ...c.button2, loading: true } : c.button2,
            }));
            await deleteProfileTemplate(row.id);
            setConfirm({
              isOpen: true,
              title: 'Template Dihapus',
              texts: ['Template berhasil dihapus.'],
              icon: <RiCheckboxCircleFill />,
              iconTone: 'success',
              showCloseIcon: true,
              button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
            });
            if (page > 1 && resp.data.length === 1) setPage((p) => Math.max(1, p - 1));
            else await refetch();
          } catch (e: any) {
            setConfirm({
              isOpen: true,
              title: 'Gagal Menghapus Template',
              texts: [e?.message ?? 'Terjadi kendala. Silakan coba lagi.'],
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
    <div className="rounded-2xl bg-white">
      <div className="px-6 sm:px-8 lg:px-10 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-800">Template Profile Guru</h1>
            <div className="mt-1 text-sm text-neutral-500">
              Kelola template naratif untuk Headline, About, dan Designed For.
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard-admin/profile-templates/new')}
            className="inline-flex items-center justify-center h-11 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold px-6 hover:brightness-95 transition cursor-pointer"
          >
            <RiAddLine className="text-lg" />
            <span className="ml-2">Tambah Template</span>
          </button>
        </div>

        {/* Filters */}
        <section className="rounded-2xl border border-neutral-200 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_140px]">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">Search</label>
              <input
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                placeholder="Cari berdasarkan nama template..."
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setPage(1);
                  setCategory(e.target.value);
                }}
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-(--secondary-color)"
              >
                <option value="">Semua</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-800">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value as StatusFilter);
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
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value) || 20);
                }}
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-neutral-900 outline-none focus:border-(--secondary-color)"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
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

        {/* Table */}
        <section className="mt-5 rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-700">
                <tr>
                  <th className="py-3 pl-4 pr-3 font-semibold">Name</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-3 font-semibold">Tags</th>
                  <th className="py-3 px-3 font-semibold">Sort Order</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 pr-4 pl-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading && (resp.data?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                      Belum ada template.
                    </td>
                  </tr>
                )}

                {!loading &&
                  (resp.data || []).map((row) => {
                    const statusLabel = row.is_active ? 'Aktif' : 'Non-Aktif';
                    const tags = Array.isArray(row.tags) ? row.tags : [];
                    return (
                      <tr key={row.id} className="border-t border-neutral-200">
                        <td className="py-3 pl-4 pr-3 text-neutral-900 font-medium">{row.name}</td>
                        <td className="py-3 px-3 text-neutral-800">{row.category}</td>
                        <td className="py-3 px-3">
                          {tags.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {tags.slice(0, 4).map((t, i) => (
                                <span
                                  key={`${t}-${i}`}
                                  className="rounded-full border border-black/10 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700"
                                >
                                  {t}
                                </span>
                              ))}
                              {tags.length > 4 ? (
                                <span className="text-xs text-neutral-500">+{tags.length - 4}</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-neutral-800">{row.sort_order}</td>
                        <td className={cls('py-3 px-3 font-semibold', getStatusColor(statusLabel))}>
                          {statusLabel}
                        </td>
                        <td className="py-3 pr-4 pl-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/dashboard-admin/profile-templates/${row.id}`)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[var(--secondary-color)] px-3 py-2 text-sm text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                            >
                              <RiEyeFill />
                              Detail / Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => askToggle(row)}
                              className={cls(
                                'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-black/5',
                                row.is_active ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'
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

          {!loading && totalPages > 1 && (
            <div className="border-t border-neutral-200 bg-white px-4 py-4 flex items-center justify-center gap-2">
              {pageWindow(totalPages, page).map((p, i) =>
                p === '…' ? (
                  <span
                    key={`dots-${i}`}
                    className="grid h-9 min-w-9 place-items-center rounded-xl border border-black/10 text-sm text-black/40"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cls(
                      'grid h-9 min-w-9 place-items-center rounded-xl border px-3 text-sm',
                      p === page
                        ? 'border-(--secondary-color) bg-[var(--secondary-color)]/20'
                        : 'border-[var(--secondary-color)] hover:bg-[var(--secondary-color)]/20'
                    )}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          )}
        </section>
      </div>

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
    </div>
  );
}
