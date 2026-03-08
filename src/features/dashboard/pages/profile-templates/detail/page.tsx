/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiDeleteBin6Line,
  RiQuestionFill,
} from 'react-icons/ri';

import ConfirmationModal, { type ConfirmationModalProps } from '@/components/ui/common/ConfirmationModal';
import ProfileTemplateForm, { type ProfileTemplateFormValues } from '@/features/dashboard/components/ProfileTemplateForm';
import {
  deleteProfileTemplate,
  disableProfileTemplate,
  enableProfileTemplate,
  getProfileTemplateDetail,
  updateProfileTemplate,
} from '@/services/api/profileTemplate.api';

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

const toFormValues = (row: any): ProfileTemplateFormValues => ({
  name: String(row?.name ?? ''),
  category: String(row?.category ?? ''),
  tags: Array.isArray(row?.tags) ? row.tags.map(String) : [],
  headline: String(row?.headline ?? ''),
  about: String(row?.about ?? ''),
  designed_for: Array.isArray(row?.designed_for) ? row.designed_for.map(String) : [],
  sort_order: Number(row?.sort_order ?? 0) || 0,
  is_active: Boolean(row?.is_active ?? true),
});

export default function AdminProfileTemplateDetailPage() {
  const navigate = useNavigate();
  const params = useParams();

  const id = useMemo(() => Number(params.id), [params.id]);
  const validId = Number.isFinite(id) && id > 0;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [values, setValues] = useState<ProfileTemplateFormValues>({
    name: '',
    category: '',
    tags: [],
    headline: '',
    about: '',
    designed_for: [],
    sort_order: 0,
    is_active: true,
  });

  const [confirm, setConfirm] = useState<Pick<
    ConfirmationModalProps,
    'isOpen' | 'title' | 'texts' | 'icon' | 'iconTone' | 'button1' | 'button2' | 'showCloseIcon'
  >>({ isOpen: false, title: '', texts: [], icon: null, iconTone: 'neutral' });

  const closeConfirm = () => setConfirm((c) => ({ ...c, isOpen: false }));

  const load = async () => {
    if (!validId) {
      setErrorText('id tidak valid');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorText(null);
    try {
      const r = await getProfileTemplateDetail(id);
      setValues(toFormValues(r.data));
    } catch (e: any) {
      setErrorText(e?.message ?? 'Gagal memuat detail template');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submit = async () => {
    if (!validId) return;
    setSubmitting(true);
    setErrorText(null);
    try {
      await updateProfileTemplate(id, {
        name: values.name.trim(),
        category: values.category.trim(),
        tags: values.tags,
        headline: values.headline,
        about: values.about,
        designed_for: values.designed_for,
        sort_order: values.sort_order,
        is_active: values.is_active,
      });
      setConfirm({
        isOpen: true,
        title: 'Template Berhasil Disimpan',
        texts: ['Perubahan berhasil disimpan.'],
        icon: <RiCheckboxCircleFill />,
        iconTone: 'success',
        showCloseIcon: true,
        button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
      });
    } catch (e: any) {
      setErrorText(e?.message ?? 'Gagal menyimpan template');
      setConfirm({
        isOpen: true,
        title: 'Gagal Menyimpan Template',
        texts: [e?.message ?? 'Terjadi kendala. Silakan coba lagi.'],
        icon: <RiCloseLine />,
        iconTone: 'danger',
        showCloseIcon: true,
        button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const askToggle = () => {
    if (!validId) return;
    const willEnable = !values.is_active;
    setConfirm({
      isOpen: true,
      title: willEnable ? 'Aktifkan template ini?' : 'Nonaktifkan template ini?',
      texts: [willEnable ? 'Template akan terlihat di sisi guru.' : 'Template akan disembunyikan di sisi guru.'],
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
            if (willEnable) await enableProfileTemplate(id);
            else await disableProfileTemplate(id);
            setValues((v) => ({ ...v, is_active: willEnable }));
            setConfirm({
              isOpen: true,
              title: 'Status Diperbarui',
              texts: [willEnable ? 'Template berhasil diaktifkan.' : 'Template berhasil dinonaktifkan.'],
              icon: <RiCheckboxCircleFill />,
              iconTone: 'success',
              showCloseIcon: true,
              button1: { label: 'Tutup', onClick: closeConfirm, variant: 'primary' },
            });
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

  const askDelete = () => {
    if (!validId) return;
    setConfirm({
      isOpen: true,
      title: 'Hapus template ini?',
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
            await deleteProfileTemplate(id);
            setConfirm({
              isOpen: true,
              title: 'Template Dihapus',
              texts: ['Template berhasil dihapus.'],
              icon: <RiCheckboxCircleFill />,
              iconTone: 'success',
              showCloseIcon: true,
              button1: {
                label: 'Kembali ke List',
                onClick: () => {
                  setConfirm((c) => ({ ...c, isOpen: false }));
                  navigate('/dashboard-admin/profile-templates', { replace: true });
                },
                variant: 'primary',
              },
            });
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

  const preview = (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-neutral-900">Preview</div>
          <button
            type="button"
            onClick={() => navigate('/dashboard-admin/profile-templates')}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-sm text-neutral-700 hover:bg-black/5"
          >
            <RiArrowLeftLine />
            Kembali
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <div className="text-neutral-500 font-medium">Headline</div>
            <div className="mt-1 whitespace-pre-wrap text-neutral-900">
              {values.headline?.trim() ? values.headline : <span className="text-neutral-400">-</span>}
            </div>
          </div>

          <div>
            <div className="text-neutral-500 font-medium">About</div>
            <div className="mt-1 whitespace-pre-wrap text-neutral-900">
              {values.about?.trim() ? values.about : <span className="text-neutral-400">-</span>}
            </div>
          </div>

          <div>
            <div className="text-neutral-500 font-medium">Designed For</div>
            {values.designed_for?.length ? (
              <ul className="mt-2 list-disc pl-5 space-y-1 text-neutral-900">
                {values.designed_for.map((x, i) => (
                  <li key={`${x}-${i}`} className="whitespace-pre-wrap">
                    {x}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-1 text-neutral-400">-</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 p-5">
        <div className="font-semibold text-neutral-900">Actions</div>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={askToggle}
            className={cls(
              'w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold transition',
              values.is_active
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            )}
          >
            {values.is_active ? 'Disable' : 'Enable'}
          </button>

          <button
            type="button"
            onClick={askDelete}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-700 hover:bg-red-50"
          >
            <RiDeleteBin6Line />
            Delete
          </button>

          <button
            type="button"
            onClick={load}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 font-semibold text-neutral-700 hover:bg-black/5"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-white px-6 sm:px-8 lg:px-10 py-10 text-center text-sm text-neutral-500">
        Memuat template...
      </div>
    );
  }

  return (
    <>
      <ProfileTemplateForm
        title={`Detail / Edit Template (ID: ${validId ? id : '-'})`}
        values={values}
        onChange={setValues}
        onSubmit={submit}
        submitLabel="Simpan Perubahan"
        submitting={submitting}
        errorText={errorText}
        rightPanel={preview}
      />

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
