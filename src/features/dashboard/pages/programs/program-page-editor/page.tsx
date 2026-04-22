/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiCheckboxCircleFill,
  RiExternalLinkLine,
  RiEyeLine,
  RiQuestionFill,
  RiRefreshLine,
  RiSaveLine,
  RiStopCircleLine,
} from 'react-icons/ri';

import ConfirmationModal, {
  type ConfirmationModalProps,
} from '@/components/ui/common/ConfirmationModal';
import ProgramPageGuiForm from '@/features/dashboard/components/ProgramPageGuiForm';
import {
  getProgramPageDetail,
  type ProgramPageContentPayload,
  type ProgramPageDetailDTO,
  type ProgramPageSeoPayload,
  type ProgramPageType,
  updateProgramPage,
  unpublishProgramPage,
} from '@/services/api/programPage.api';

const PROGRAM_TYPE_OPTIONS: Array<{
  type: ProgramPageType;
  label: string;
  description: string;
}> = [
  {
    type: 'regular',
    label: 'Regular',
    description: 'Program reguler untuk pembelajaran musik terstruktur.',
  },
  {
    type: 'special-need',
    label: 'Special Need',
    description: 'Program dengan pendekatan belajar yang lebih personal dan adaptif.',
  },
  {
    type: 'hobby',
    label: 'Hobby',
    description: 'Program belajar santai dengan fokus pada lagu favorit.',
  },
];

const cls = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

const inputClass =
  'h-11 w-full rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/35';
const textAreaClass =
  'w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/35';

type SeoFormState = {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
};

const emptySeoForm: SeoFormState = {
  metaTitle: '',
  metaDescription: '',
  ogImage: '',
  canonicalUrl: '',
};

const isProgramPageType = (value: string): value is ProgramPageType =>
  PROGRAM_TYPE_OPTIONS.some((item) => item.type === value);

const safeTrim = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const mapSeoToForm = (seo?: ProgramPageSeoPayload | null): SeoFormState => ({
  metaTitle: String(seo?.metaTitle ?? ''),
  metaDescription: String(seo?.metaDescription ?? ''),
  ogImage: String(seo?.ogImage ?? ''),
  canonicalUrl: String(seo?.canonicalUrl ?? ''),
});

const normalizeSeoForm = (seo: SeoFormState): ProgramPageSeoPayload | null => {
  const payload: ProgramPageSeoPayload = {
    metaTitle: safeTrim(seo.metaTitle),
    metaDescription: safeTrim(seo.metaDescription),
    ogImage: safeTrim(seo.ogImage),
    canonicalUrl: safeTrim(seo.canonicalUrl),
  };

  const hasValue = Object.values(payload).some(Boolean);
  return hasValue ? payload : null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const cloneContent = (content: ProgramPageContentPayload): ProgramPageContentPayload =>
  JSON.parse(JSON.stringify(content)) as ProgramPageContentPayload;

const applyDetailToState = (
  detail: ProgramPageDetailDTO,
  setDetail: (value: ProgramPageDetailDTO) => void,
  setContentSchemaVersion: (value: string) => void,
  setSeoForm: (value: SeoFormState) => void,
  setContentForm: (value: ProgramPageContentPayload) => void
) => {
  setDetail(detail);
  setContentSchemaVersion(String(detail.content_schema_version ?? 1));
  setSeoForm(mapSeoToForm(detail.seo));
  setContentForm(cloneContent(detail.draft_content));
};

export default function ProgramPageEditorPage() {
  const navigate = useNavigate();
  const params = useParams();

  const type = useMemo(() => {
    const raw = String(params.type || '').trim();
    return isProgramPageType(raw) ? raw : null;
  }, [params.type]);

  const typeMeta = useMemo(
    () => PROGRAM_TYPE_OPTIONS.find((item) => item.type === type) ?? null,
    [type]
  );

  const [detail, setDetail] = useState<ProgramPageDetailDTO | null>(null);
  const [contentForm, setContentForm] = useState<ProgramPageContentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [contentSchemaVersion, setContentSchemaVersion] = useState('1');
  const [seoForm, setSeoForm] = useState<SeoFormState>(emptySeoForm);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    Pick<
      ConfirmationModalProps,
      'isOpen' | 'title' | 'texts' | 'icon' | 'iconTone' | 'button1' | 'button2' | 'showCloseIcon'
    >
  >({ isOpen: false, title: '', texts: [], icon: null, iconTone: 'neutral' });

  const closeConfirm = () => setConfirm((current) => ({ ...current, isOpen: false }));

  const load = async () => {
    if (!type) {
      setLoading(false);
      setErrorText('type program page tidak valid');
      return;
    }

    try {
      setLoading(true);
      setErrorText(null);
      const response = await getProgramPageDetail(type);
      applyDetailToState(
        response.data,
        setDetail,
        setContentSchemaVersion,
        setSeoForm,
        setContentForm
      );
    } catch (error: any) {
      setErrorText(error?.message || 'Gagal memuat detail program page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSeoField =
    (key: keyof SeoFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSeoForm((current) => ({ ...current, [key]: event.target.value }));
      setSuccessText(null);
    };

  const handleSaveDraft = async () => {
    if (!type || !contentForm) return;

    if (contentForm.type !== type) {
      setErrorText(`Type content harus tetap "${type}".`);
      return;
    }

    const schemaVersion = Number(contentSchemaVersion);
    if (!Number.isFinite(schemaVersion) || schemaVersion < 1) {
      setErrorText('content schema version harus berupa angka minimal 1.');
      return;
    }

    try {
      setSaving(true);
      setErrorText(null);
      setSuccessText(null);

      const response = await updateProgramPage(type, {
        content_schema_version: Math.floor(schemaVersion),
        draft_content: contentForm,
        seo: normalizeSeoForm(seoForm),
      });

      applyDetailToState(
        response.data,
        setDetail,
        setContentSchemaVersion,
        setSeoForm,
        setContentForm
      );
      setSuccessText(response.message || 'Perubahan berhasil disimpan dan dipublish.');
    } catch (error: any) {
      setErrorText(error?.message || 'Gagal menyimpan perubahan halaman program.');
    } finally {
      setSaving(false);
    }
  };

  const openUnpublishConfirm = () => {
    if (!type) return;
    setConfirm({
      isOpen: true,
      title: 'Unpublish program page ini?',
      texts: ['Halaman public untuk type ini akan hilang dari frontend dan sitemap.'],
      icon: <RiQuestionFill />,
      iconTone: 'danger',
      showCloseIcon: true,
      button2: { label: 'Batal', onClick: closeConfirm, variant: 'outline' },
      button1: {
        label: unpublishing ? 'Unpublishing...' : 'Unpublish',
        variant: 'danger',
        loading: unpublishing,
        onClick: async () => {
          try {
            setUnpublishing(true);
            setConfirm((current) => ({
              ...current,
              button1: current.button1 ? { ...current.button1, loading: true } : current.button1,
              button2: current.button2 ? { ...current.button2, loading: true } : current.button2,
            }));
            const response = await unpublishProgramPage(type);
            applyDetailToState(
              response.data,
              setDetail,
              setContentSchemaVersion,
              setSeoForm,
              setContentForm
            );
            setSuccessText(response.message || 'Program page berhasil di-unpublish.');
            closeConfirm();
          } catch (error: any) {
            setErrorText(error?.message || 'Gagal unpublish program page.');
          } finally {
            setUnpublishing(false);
          }
        },
      },
    });
  };

  if (!type || !typeMeta) {
    return (
      <div className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-red-600">
        Type program page tidak valid.
      </div>
    );
  }

  if (loading || !contentForm) {
    return (
      <div className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-neutral-500">
        Memuat program page...
      </div>
    );
  }

  const previewUrl = `/program/${type}`;

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-2xl bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard-admin/programs')}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-black/5"
              >
                <RiArrowLeftLine />
                Kembali ke Manage Programs
              </button>

              <div>
                <div className="inline-flex rounded-full bg-[var(--secondary-light-color)] px-3 py-1 text-xs font-semibold text-[var(--secondary-color)]">
                  Program Page CMS
                </div>
                <h1 className="mt-3 text-2xl font-semibold text-neutral-900">
                  {typeMeta.label} Program Page
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                  {typeMeta.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <span
                  className={cls(
                    'inline-flex items-center rounded-full px-3 py-1 font-medium',
                    detail?.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  )}
                >
                  Status: {detail?.status ?? '-'}
                </span>
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700">
                  Schema v{detail?.content_schema_version ?? '-'}
                </span>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[420px]">
              <button
                type="button"
                onClick={load}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-neutral-700 hover:bg-black/5"
              >
                <RiRefreshLine />
                Reload
              </button>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-neutral-700 hover:bg-black/5"
              >
                <RiExternalLinkLine />
                Lihat Public Page
              </a>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#F6C437] px-5 text-sm font-semibold text-[#0B0B0B] hover:brightness-95 disabled:opacity-60"
              >
                <RiSaveLine />
                {saving ? 'Menyimpan...' : 'Simpan & Publish'}
              </button>
              {detail?.status === 'published' ? (
                <button
                  type="button"
                  onClick={openUnpublishConfirm}
                  disabled={unpublishing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  <RiStopCircleLine />
                  Unpublish
                </button>
              ) : null}
            </div>
          </div>

          {errorText && (
            <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorText}
            </div>
          )}

          {successText && (
            <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successText}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Published At
              </div>
              <div className="mt-2 text-sm font-semibold text-neutral-900">
                {formatDateTime(detail?.published_at)}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Updated At
              </div>
              <div className="mt-2 text-sm font-semibold text-neutral-900">
                {formatDateTime(detail?.updated_at)}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Current Label
              </div>
              <div className="mt-2 text-sm font-semibold text-neutral-900">
                {contentForm.label || '-'}
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Current Hero Badge
              </div>
              <div className="mt-2 text-sm font-semibold text-neutral-900">
                {contentForm.hero.badge || '-'}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.7fr_0.3fr]">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent-blue-light-color)]/70">
                <RiEyeLine className="text-xl text-[var(--secondary-color)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">SEO & Publish Info</h2>
                <p className="text-sm text-neutral-600">
                  Metadata ini dipakai untuk halaman public dan sitemap.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-800">Meta Title</span>
                <input
                  type="text"
                  value={seoForm.metaTitle}
                  onChange={handleSeoField('metaTitle')}
                  className={inputClass}
                  placeholder="Program Regular GuruMusik"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-800">OG Image URL</span>
                <input
                  type="text"
                  value={seoForm.ogImage}
                  onChange={handleSeoField('ogImage')}
                  className={inputClass}
                  placeholder="/assets/banner/class/bannerReguler.webp"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-neutral-800">Meta Description</span>
                <textarea
                  rows={4}
                  value={seoForm.metaDescription}
                  onChange={handleSeoField('metaDescription')}
                  className={textAreaClass}
                  placeholder="Deskripsi singkat untuk metadata halaman program."
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-800">Canonical URL</span>
                <input
                  type="text"
                  value={seoForm.canonicalUrl}
                  onChange={handleSeoField('canonicalUrl')}
                  className={inputClass}
                  placeholder="/program/regular"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-neutral-800">Content Schema Version</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={contentSchemaVersion}
                  onChange={(event) => setContentSchemaVersion(event.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50">
                <RiCheckboxCircleFill className="text-xl text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Quick Access</h2>
                <p className="text-sm text-neutral-600">
                  Pindah cepat ke editor type lain.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {PROGRAM_TYPE_OPTIONS.map((item) => (
                <Link
                  key={item.type}
                  to={`/dashboard-admin/programs/pages/${item.type}`}
                  className={cls(
                    'rounded-2xl border p-4 transition',
                    item.type === type
                      ? 'border-[var(--secondary-color)] bg-[var(--secondary-light-color)]/50'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  )}
                >
                  <div className="text-sm font-semibold text-neutral-900">{item.label}</div>
                  <p className="mt-1 text-sm text-neutral-600">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <ProgramPageGuiForm
          value={contentForm}
          onChange={(next) => {
            setContentForm(next);
            setSuccessText(null);
          }}
          disabled={saving || unpublishing}
        />
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
    </>
  );
}
