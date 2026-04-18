'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RiCloseLine,
  RiErrorWarningLine,
  RiExternalLinkLine,
  RiMailLine,
  RiMapPinLine,
  RiMusic2Line,
  RiPencilLine,
  RiPhoneLine,
} from 'react-icons/ri';
import type { CertificateItem } from '@/features/dashboard/components/ManageCertificateModal';
import type { EducationCertificateData } from '@/features/dashboard/components/EducationCertificateModal';
import type { AwardCertificateData } from '@/features/dashboard/components/AwardCertificateModal';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { getLanguageIcon } from '@/utils/getLanguageIcon';
import {
  listRevisionTemplates,
  type RevisionTemplateDTO,
} from '@/services/api/revisionTemplate.api';

export type ApproveMode = 'approved' | 'revision' | 'rejected';

export type ApproveTeacherPayload =
  | { mode: 'approved' }
  | { mode: 'rejected'; reason: string; attachment?: File | null };

export type RevisionDraftValue = {
  label?: string;
  message?: string | null;
  templateId?: string | null;
};

type BaseData = {
  image?: string;
  name?: string;
  short_name?: string;
  email?: string;
  phone?: string;
  province?: string;
  city?: string;
  address?: string;
  home_lat?: string | number | null;
  home_lng?: string | number | null;
  videoUrl?: string;
  cvUrl?: string;
  certificateUrl?: string;
  awardCertificateUrl?: string;
  certificates?: CertificateItem[];
  languages?: Array<{ code: string; label: string }>;
  classInfo?: {
    title?: string;
    about?: string;
    values?: string[];
  };
  awards?: Array<{
    title?: string;
    organizer?: string;
    detail?: string;
    instrument?: string;
    instrumentIcon?: string;
    videoUrl?: string;
    certUrl?: string;
  }>;
  awardList?: AwardCertificateData[];
  educationList?: EducationCertificateData[];
  screeningState?: string | null;
  revisionCount?: number | null;
  screeningNote?: string | null;
  revisedFieldKeys?: string[];
};

type ApproveTeacherModalProps = {
  open: boolean;
  inactive?: boolean;
  mode: ApproveMode;
  onClose: () => void;
  onSubmit: (payload: ApproveTeacherPayload) => void;
  onRejectFromReview?: () => void;
  onRevisionFromReview?: () => void;
  onOfferCertificationFromReview?: () => void;
  data?: BaseData;
  onOpenCertificates?: (opts?: { instrumentName?: string | null; readOnly?: boolean }) => void;
  onOpenCertificateDetail?: (item: CertificateItem) => void;
  onOpenEducationDetail?: (item: EducationCertificateData, opts?: { readOnly?: boolean }) => void;
  onOpenAwardDetail?: (item: AwardCertificateData, opts?: { readOnly?: boolean }) => void;
  approveDisabled?: boolean;
  approveDisabledHint?: string;

  // optional: revision reporting (admin verify tutor)
  revisionSelected?: Record<string, true>;
  revisionDrafts?: Record<string, RevisionDraftValue>;
  onSaveRevisionDraft?: (
    field_key: string,
    label: string,
    draft: RevisionDraftValue,
  ) => void;
  onDeleteRevisionDraft?: (field_key: string) => void;
  onOpenRevisionComposer?: () => void;
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const inputCls =
  'h-[52px] w-full rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 text-[15px] text-[#334155] outline-none';
const FieldLabel: React.FC<{
  children: React.ReactNode;
  isNew?: boolean;
}> = ({ children, isNew }) => (
  <label className="text-md text-neutral-900 mb-1 inline-flex items-center gap-1.5">
    <span>{children}</span>
    {isNew ? (
      <span className="inline-flex items-center rounded-full bg-[var(--secondary-light-color)] px-2 py-0.5 text-xs font-semibold text-[var(--secondary-color)]">
        (Baru)
      </span>
    ) : null}
  </label>
);

const revisedFieldAliases: Record<string, string[]> = {
  'profile.nama': ['profile.name', 'nama'],
  'location.address': ['location.alamat'],
  'location.coordinates': ['location.coordinate'],
  'certificates.instrument': ['documents.portfolio'],
  'certificates.award': ['documents.award_certificate'],
};

const RevisionFieldAction: React.FC<{
  field_key: string;
  label: string;
  checked?: boolean;
  onToggle?: (field_key: string, label: string, next: boolean) => void;
  onEdit?: (field_key: string, label: string) => void;
}> = ({ field_key, label, checked, onToggle, onEdit }) => {
  if (!onToggle && !onEdit) return null;
  const active = !!checked;
  return (
    <div className="ml-auto flex items-center gap-2">
      {active && onEdit ? (
        <button
          type="button"
          onClick={() => onEdit(field_key, label)}
          className="grid h-8 w-8 place-items-center rounded-full text-[var(--secondary-color)] transition hover:bg-[var(--secondary-light-color)] cursor-pointer"
          title="Edit draft revisi"
        >
          <RiPencilLine className="text-lg" />
        </button>
      ) : null}
      {onToggle ? (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-[#617086]">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => onToggle(field_key, label, event.target.checked)}
            className="h-[18px] w-[18px] cursor-pointer rounded border border-[#6D7C91] accent-[var(--secondary-color)] checked:border-[var(--secondary-color)] checked:bg-[var(--secondary-color)] focus:ring-[var(--secondary-color)]"
          />
          <span>Revisi</span>
        </label>
      ) : null}
    </div>
  );
};

type RevisionDraftFieldModalProps = {
  open: boolean;
  fieldKey: string;
  label: string;
  draft?: RevisionDraftValue;
  onClose: () => void;
  onSave: (draft: RevisionDraftValue) => void;
  onDelete?: () => void;
};

const RevisionDraftFieldModal: React.FC<RevisionDraftFieldModalProps> = ({
  open,
  fieldKey,
  label,
  draft,
  onClose,
  onSave,
  onDelete,
}) => {
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState<RevisionTemplateDTO[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMessage(String(draft?.message || ''));
    setSelectedTemplateId(String(draft?.templateId || ''));
  }, [open, draft?.message, draft?.templateId]);

  useEffect(() => {
    if (!open || !fieldKey) return;
    let alive = true;
    setLoadingTemplates(true);
    setTemplatesError(null);
    listRevisionTemplates({
      field_keys: [fieldKey],
      is_active: true,
      limit: 100,
    })
      .then((resp) => {
        if (!alive) return;
        setTemplates(Array.isArray(resp?.data) ? resp.data : []);
      })
      .catch((err: any) => {
        if (!alive) return;
        setTemplates([]);
        setTemplatesError(String(err?.message || 'Gagal memuat template revisi'));
      })
      .finally(() => {
        if (alive) setLoadingTemplates(false);
      });

    return () => {
      alive = false;
    };
  }, [open, fieldKey]);

  if (!open) return null;

  const selectedTemplate =
    templates.find((item) => String(item.id) === String(selectedTemplateId || '')) ?? null;
  const canSave = message.trim().length > 0;

  const modal = (
    <div className="fixed inset-0 z-[140]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0B1220]/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[680px] rounded-[28px] bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-6">
            <p className="text-[28px] font-semibold tracking-[-0.02em] text-[#1D2433]">
              Laporan Kesalahan Data
            </p>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full text-[#2E3646] transition hover:bg-neutral-100"
            >
              <RiCloseLine className="text-[28px]" />
            </button>
          </div>

          <div className="border-t border-[#DCE5EF] px-6 pb-6 pt-5">
            <p className="mb-4 text-[17px] font-medium text-[#2D3445]">{label}</p>

            <div className="flex flex-col gap-3 md:flex-row">
              <select
                value={selectedTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="h-14 flex-1 rounded-[18px] border border-[#D6E1EC] bg-white px-4 text-[15px] text-[#60708A] outline-none transition focus:border-[var(--secondary-color)]"
                disabled={loadingTemplates}
              >
                <option value="">
                  {loadingTemplates ? 'Memuat template...' : 'Pilih Pesan Template'}
                </option>
                {templates.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!selectedTemplate) return;
                  setMessage(selectedTemplate.message || '');
                }}
                disabled={!selectedTemplate}
                className={cls(
                  'h-14 rounded-full border px-7 text-[15px] font-semibold transition',
                  selectedTemplate
                    ? 'border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]'
                    : 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                )}
              >
                Gunakan
              </button>
            </div>

            {templatesError ? (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {templatesError}
              </div>
            ) : null}

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Pesan spesifik untuk memperbaiki kolom ini"
              className="mt-3 min-h-[140px] w-full rounded-[18px] border border-[#D6E1EC] px-4 py-4 text-[15px] text-[#334155] outline-none transition focus:border-[var(--secondary-color)]"
            />

            <div className="mt-4 border-t border-[#DCE5EF] pt-5">
              <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-between">
                <div>
                  {draft && onDelete ? (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="h-12 w-full rounded-full border border-[#FF5B8A] px-8 text-[15px] font-semibold text-[#FF5B8A] transition hover:bg-[#FFF0F5] md:w-auto"
                    >
                      Hapus
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onSave({
                      label,
                      message: message.trim(),
                      templateId: selectedTemplateId || null,
                    })
                  }
                  disabled={!canSave}
                  className={cls(
                    'h-12 w-full rounded-full px-8 text-[15px] font-semibold text-[#1D2433] transition md:w-auto',
                    canSave
                      ? 'bg-[var(--primary-color)] hover:brightness-95'
                      : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                  )}
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modal, document.body)
    : null;
};

const getDisplayCertStatus = (c: CertificateItem) => {
  if (c.draftStatus === 'approved') return 'Disetujui';
  if (c.draftStatus === 'rejected') return 'Tidak Disetujui';
  if (c.draftStatus === 'revision') return 'Revisi';
  return c.status;
};

type InstrumentSummaryStatus =
  | 'pending'
  | 'revisi'
  | 'verified'
  | 'rejected'
  | 'certification';

const getInstrumentSummaryStatus = (items: CertificateItem[]): InstrumentSummaryStatus => {
  const statuses = items.map((item) => getDisplayCertStatus(item));
  if (statuses.some((status) => status === 'Revisi')) return 'revisi';
  if (statuses.some((status) => status === 'Menunggu Verifikasi')) return 'pending';
  if (statuses.some((status) => status === 'Tidak Disetujui')) return 'rejected';
  if (statuses.every((status) => status === 'Disetujui')) return 'verified';
  return 'certification';
};

const getInstrumentStatusUi = (status: InstrumentSummaryStatus) => {
  if (status === 'pending') {
    return {
      label: 'Menunggu Verifikasi',
      className: 'bg-[var(--accent-orange-light-color)] text-[var(--accent-orange-color)]',
    };
  }
  if (status === 'verified') {
    return {
      label: 'Terverifikasi',
      className: 'bg-[#E8FFF1] text-[#18B968]',
    };
  }
  if (status === 'rejected') {
    return {
      label: 'Ditolak',
      className: 'bg-[#FFE8F0] text-[#F25584]',
    };
  }
  if (status === 'certification') {
    return {
      label: 'Diajukan Untuk Ujian',
      className: 'bg-[#F2E8FF] text-[#9B59E2]',
    };
  }
  return {
    label: 'Revisi',
    className: 'bg-[#FFF7E6] text-[#F5B014]',
  };
};

const ApproveTeacherModal: React.FC<ApproveTeacherModalProps> = ({
  open,
  inactive = false,
  mode,
  onClose,
  onSubmit,
  onRejectFromReview,
  onRevisionFromReview,
  onOfferCertificationFromReview,
  data,
  onOpenCertificates,
  onOpenEducationDetail,
  onOpenAwardDetail,
  approveDisabled = false,
  approveDisabledHint,
  revisionSelected,
  revisionDrafts,
  onSaveRevisionDraft,
  onDeleteRevisionDraft,
  onOpenRevisionComposer,
}) => {
  const [file] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [activeRevisionField, setActiveRevisionField] = useState<{
    field_key: string;
    label: string;
  } | null>(null);
  const isRevisionMode = mode === 'revision';
  const isReviewMode = mode === 'approved' || isRevisionMode;
  const selectedRevisionCount = Object.keys(revisionDrafts || {}).length;

  useEffect(() => {
    if (open && isReviewMode) setStep(1);
  }, [open, isReviewMode, mode]);

  useEffect(() => {
    if (!open) {
      setActiveRevisionField(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !inactive) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }, [open, inactive]);

  const certs = data?.certificates ?? [];
  const revisedFieldKeySet = useMemo(() => {
    if (data?.screeningState !== 'revision_resubmitted') return new Set<string>();
    const keys = Array.isArray(data?.revisedFieldKeys) ? data.revisedFieldKeys : [];
    return new Set(keys.map((key) => String(key || '').trim()).filter(Boolean));
  }, [data?.screeningState, data?.revisedFieldKeys]);

  const isRevisedField = (fieldKey: string) => {
    if (revisedFieldKeySet.has(fieldKey)) return true;
    return (revisedFieldAliases[fieldKey] || []).some((alias) => revisedFieldKeySet.has(alias));
  };

  const [, setActiveInstrument] = useState<string | null>(null);

  const openRevisionDraftModal = (field_key: string, label: string) => {
    if (!isReviewMode || !onSaveRevisionDraft) return;
    setActiveRevisionField({
      field_key,
      label,
    });
  };

  const handleRevisionFieldToggle = (
    field_key: string,
    label: string,
    next: boolean,
  ) => {
    if (!isReviewMode) return;
    if (next) {
      openRevisionDraftModal(field_key, label);
      return;
    }
    onDeleteRevisionDraft?.(field_key);
  };

  const currentRevisionDraft =
    activeRevisionField?.field_key != null
      ? revisionDrafts?.[activeRevisionField.field_key]
      : undefined;

  const submitApproved = () => onSubmit({ mode: 'approved' });
  const submitRevision = () => onOpenRevisionComposer?.();
  const submitRejected = () =>
    onSubmit({ mode: 'rejected', reason, attachment: file });
  const submitFailedVerificationMessage = () =>
    onSubmit({
      mode: 'rejected',
      reason:
        'Guru belum lolos verifikasi. Silakan periksa kembali email dan WhatsApp Anda untuk detail selanjutnya.',
    });

  const hasEducation =
    Array.isArray(data?.educationList) && data!.educationList!.length > 0;
  const hasAwards = Array.isArray(data?.awardList) && data!.awardList!.length > 0;
  const hasLanguages =
    Array.isArray(data?.languages) && data!.languages!.length > 0;
  const classValuesText = Array.isArray(data?.classInfo?.values)
    ? data.classInfo.values.filter(Boolean).join(', ')
    : '';
  const revisionActionProps = isReviewMode && onSaveRevisionDraft
    ? {
      onToggle: handleRevisionFieldToggle,
      onEdit: openRevisionDraftModal,
    }
    : undefined;

  const instrumentSummaryRows = useMemo(() => {
    const map = new Map<
      string,
      {
        instrument: string;
        icon?: string;
        items: CertificateItem[];
      }
    >();

    certs.forEach((item) => {
      const key = String(item.instrument || '').trim().toLowerCase() || `cert-${item.id}`;
      const current = map.get(key);
      if (current) {
        current.items.push(item);
        if (!current.icon && item.instrumentIcon) current.icon = item.instrumentIcon;
        return;
      }

      map.set(key, {
        instrument: item.instrument || '-',
        icon: item.instrumentIcon,
        items: [item],
      });
    });

    return Array.from(map.values()).map((entry) => ({
      ...entry,
      status: getInstrumentSummaryStatus(entry.items),
    }));
  }, [certs]);

  // Combined instrument list for step 4: merges instruments from certificates, educationList, and awardList
  type AllInstrumentRow = {
    instrument: string;
    icon?: string;
    source: 'certificate' | 'education' | 'award';
    status: InstrumentSummaryStatus;
    certItems?: CertificateItem[];
    educationItem?: EducationCertificateData;
    awardItem?: AwardCertificateData;
  };
  const allInstrumentSummaryRows = useMemo((): AllInstrumentRow[] => {
    const rows: AllInstrumentRow[] = [];

    // From regular certificates (grouped by instrument)
    const certMap = new Map<string, { instrument: string; icon?: string; items: CertificateItem[] }>();
    certs.forEach((item) => {
      const key = String(item.instrument || '').trim().toLowerCase() || `cert-${item.id}`;
      const current = certMap.get(key);
      if (current) {
        current.items.push(item);
        if (!current.icon && item.instrumentIcon) current.icon = item.instrumentIcon;
        return;
      }
      certMap.set(key, { instrument: item.instrument || '-', icon: item.instrumentIcon, items: [item] });
    });
    certMap.forEach((entry) => {
      rows.push({
        instrument: entry.instrument,
        icon: entry.icon,
        source: 'certificate',
        status: getInstrumentSummaryStatus(entry.items),
        certItems: entry.items,
      });
    });

    // From education certificates
    (data?.educationList ?? []).forEach((e) => {
      const name = e.majorInstrument?.nama_instrumen || '-';
      const icon = e.majorInstrument?.icon ? resolveImageUrl(e.majorInstrument.icon) || undefined : undefined;
      let status: InstrumentSummaryStatus = 'pending';
      if (e.draftStatus === 'approved') status = 'verified';
      else if (e.draftStatus === 'rejected') status = 'rejected';
      else if (e.draftStatus === 'revision') status = 'revisi';
      rows.push({ instrument: name, icon, source: 'education', status, educationItem: e });
    });

    // From award certificates
    (data?.awardList ?? []).forEach((a) => {
      const name = a.instrument?.nama_instrumen || a.judul_penghargaan || '-';
      const icon = a.instrument?.icon ? resolveImageUrl(a.instrument.icon) || undefined : undefined;
      let status: InstrumentSummaryStatus = 'pending';
      if (a.draftStatus === 'approved') status = 'verified';
      else if (a.draftStatus === 'rejected') status = 'rejected';
      else if (a.draftStatus === 'revision') status = 'revisi';
      rows.push({ instrument: name, icon, source: 'award', status, awardItem: a });
    });

    return rows;
  }, [certs, data?.educationList, data?.awardList]);

  const acceptedAllInstrumentRows = useMemo(
    () => allInstrumentSummaryRows.filter((row) => row.status === 'verified'),
    [allInstrumentSummaryRows]
  );
  const notAcceptedAllInstrumentRows = useMemo(
    () => allInstrumentSummaryRows.filter((row) => row.status !== 'verified'),
    [allInstrumentSummaryRows]
  );

  const acceptedInstrumentRows = useMemo(
    () =>
      instrumentSummaryRows.filter((row) =>
        row.items.some((item) => getDisplayCertStatus(item) === 'Disetujui')
      ),
    [instrumentSummaryRows]
  );
  const notAcceptedInstrumentRows = useMemo(
    () =>
      instrumentSummaryRows.filter((row) =>
        row.items.every((item) => getDisplayCertStatus(item) !== 'Disetujui')
      ),
    [instrumentSummaryRows]
  );
  const hasApprovedInstrumentDecision = acceptedInstrumentRows.length > 0;
  const hasPendingInstrumentDecision = certs.some(
    (item) => {
      const status = getDisplayCertStatus(item);
      return status === 'Menunggu Verifikasi' || status === 'Revisi';
    }
  );
  const hasPendingEducationDecision = (data?.educationList ?? []).some(
    (item) => !item.draftStatus || item.draftStatus === 'revision'
  );
  const hasPendingAwardDecision = (data?.awardList ?? []).some(
    (item) => !item.draftStatus || item.draftStatus === 'revision'
  );
  const rejectDisabled =
    hasPendingInstrumentDecision ||
    hasPendingEducationDecision ||
    hasPendingAwardDecision;
  const rejectDisabledHint =
    'Semua sertifikat instrumen, pendidikan, dan penghargaan harus diputuskan sebelum mengirim pesan.';
  const reviewPrimaryAction = isRevisionMode
    ? submitRevision
    : hasApprovedInstrumentDecision
      ? submitApproved
      : submitFailedVerificationMessage;
  const reviewPrimaryDisabled = isRevisionMode
    ? selectedRevisionCount === 0
    : hasApprovedInstrumentDecision
      ? approveDisabled
      : rejectDisabled;
  const reviewPrimaryLabel = isRevisionMode
    ? 'Kirim Laporan Kesalahan'
    : hasApprovedInstrumentDecision
      ? 'Verifikasi Guru'
      : 'Kirim Pesan';
  const displayTeacherName = [data?.name, data?.short_name].filter(Boolean).join(' / ') || '-';
  const displayTeacherLocation = [data?.city, data?.province].filter(Boolean).join(', ') || '-';

  const latNum =
    data?.home_lat === null || data?.home_lat === undefined || data?.home_lat === ''
      ? null
      : Number(data.home_lat);
  const lngNum =
    data?.home_lng === null || data?.home_lng === undefined || data?.home_lng === ''
      ? null
      : Number(data.home_lng);
  const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);
  const coordText = hasCoords ? `${latNum}, ${lngNum}` : '';
  const gmapsQuery = hasCoords ? `${latNum},${lngNum}` : '';
  const gmapsUrl = hasCoords ? `https://www.google.com/maps?q=${encodeURIComponent(gmapsQuery)}` : '';
  const gmapsEmbedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${encodeURIComponent(gmapsQuery)}&z=15&output=embed`
    : '';

  if (!open) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-[80]',
        inactive ? 'pointer-events-none select-none' : '',
      ].join(' ')}
      aria-hidden={inactive}
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-[#0B1220]/60"
        onClick={onClose}
        aria-hidden
      />
      {/* dialog */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[calc(100vh-2rem)] overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between border-b border-[#E6EAF0] px-5 py-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                {mode === 'approved'
                  ? 'Formulir Calon Tutor'
                  : isRevisionMode
                    ? 'Formulir Revisi Calon Tutor'
                    : 'Formulir Penolakan Calon Tutor'}
              </h3>
              {isReviewMode ? (
                <p className="text-sm font-medium text-[#7B8BA3]">
                  {step === 1
                    ? 'Profil Guru (1/4)'
                    : step === 2
                      ? 'Keahlian (2/4)'
                      : step === 3
                        ? 'Preview Kelas (3/4)'
                        : 'Verifikasi Data (4/4)'}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 grid place-items-center rounded-full hover:bg-neutral-100 cursor-pointer"
                aria-label="Tutup"
                title="Tutup"
              >
                <RiCloseLine className="text-2xl text-neutral-900" />
              </button>
            </div>
          </div>

          {/* body */}
          {isReviewMode ? (
            <div className="px-5 pb-5 pt-4 max-h-[calc(100vh-7.5rem)] overflow-y-auto">
              {data?.screeningState === 'revision_resubmitted' ? (
                <div className="mb-4 rounded-lg border border-[var(--secondary-color)] bg-[var(--secondary-light-color)] px-4 py-3 text-sm text-neutral-900">
                  <p className="font-semibold">Data ini hasil submit ulang revisi.</p>
                  <p className="mt-1 text-neutral-700">
                    Total revisi: {Number(data?.revisionCount || 0)}x
                    {data?.screeningNote ? ` - Catatan terakhir: ${data.screeningNote}` : ''}
                  </p>
                </div>
              ) : null}

              {step === 1 ? (
                <>
                  <div className="space-y-6">
                    <div>
                      <p className="mb-5 text-[24px] font-medium tracking-[-0.02em] text-[#8CA0BE]">
                        Profil Guru
                      </p>

                      <div className="mb-6">
                        <div className="mb-4 flex items-center gap-3">
                          <FieldLabel isNew={isRevisedField('profile.avatar')}>Foto Profil</FieldLabel>
                          <RevisionFieldAction
                            field_key="profile.avatar"
                            label="Foto profil"
                            checked={!!revisionSelected?.['profile.avatar']}
                            onToggle={revisionActionProps?.onToggle}
                            onEdit={revisionActionProps?.onEdit}
                          />
                        </div>
                        <div className="h-[92px] w-[92px] overflow-hidden rounded-full shadow-[0_10px_22px_rgba(15,23,42,0.14)]">
                          <img
                            src={data?.image ?? 'https://i.pravatar.cc/100?img=1'}
                            alt="avatar"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <FieldLabel isNew={isRevisedField('profile.nama')}>Nama Lengkap</FieldLabel>
                            <RevisionFieldAction
                              field_key="profile.nama"
                              label="Nama lengkap"
                              checked={!!revisionSelected?.['profile.nama']}
                              onToggle={revisionActionProps?.onToggle}
                              onEdit={revisionActionProps?.onEdit}
                            />
                          </div>
                          <input className={inputCls} value={data?.name ?? ''} readOnly />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <FieldLabel isNew={isRevisedField('profile.nama_panggilan')}>Nama Panggilan</FieldLabel>
                            <RevisionFieldAction
                              field_key="profile.nama_panggilan"
                              label="Nama panggilan"
                              checked={!!revisionSelected?.['profile.nama_panggilan']}
                              onToggle={revisionActionProps?.onToggle}
                              onEdit={revisionActionProps?.onEdit}
                            />
                          </div>
                          <input className={inputCls} value={data?.short_name ?? ''} readOnly />
                        </div>

                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <FieldLabel isNew={isRevisedField('profile.email')}>Email</FieldLabel>
                            <RevisionFieldAction
                              field_key="profile.email"
                              label="Email"
                              checked={!!revisionSelected?.['profile.email']}
                              onToggle={revisionActionProps?.onToggle}
                              onEdit={revisionActionProps?.onEdit}
                            />
                          </div>
                          <input className={inputCls} value={data?.email ?? ''} readOnly />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <FieldLabel isNew={isRevisedField('profile.phone')}>No Telepon</FieldLabel>
                            <RevisionFieldAction
                              field_key="profile.phone"
                              label="Nomor telepon"
                              checked={!!revisionSelected?.['profile.phone']}
                              onToggle={revisionActionProps?.onToggle}
                              onEdit={revisionActionProps?.onEdit}
                            />
                          </div>
                          <input className={inputCls} value={data?.phone ?? ''} readOnly />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#DCE5EF] pt-5">
                      <p className="mb-5 text-[24px] font-semibold tracking-[-0.02em] text-[#8CA0BE]">
                        Alamat
                      </p>

                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <FieldLabel isNew={isRevisedField('location.province')}>Provinsi</FieldLabel>
                            <RevisionFieldAction
                              field_key="location.province"
                              label="Provinsi"
                              checked={!!revisionSelected?.['location.province']}
                              onToggle={revisionActionProps?.onToggle}
                              onEdit={revisionActionProps?.onEdit}
                            />
                          </div>
                          <input className={inputCls} value={data?.province ?? ''} readOnly />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <FieldLabel isNew={isRevisedField('location.city')}>Kota</FieldLabel>
                            <RevisionFieldAction
                              field_key="location.city"
                              label="Kota"
                              checked={!!revisionSelected?.['location.city']}
                              onToggle={revisionActionProps?.onToggle}
                              onEdit={revisionActionProps?.onEdit}
                            />
                          </div>
                          <input className={inputCls} value={data?.city ?? ''} readOnly />
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center gap-2">
                          <FieldLabel isNew={isRevisedField('location.address')}>Detail Alamat</FieldLabel>
                          <RevisionFieldAction
                            field_key="location.address"
                            label="Detail alamat"
                            checked={!!revisionSelected?.['location.address']}
                            onToggle={revisionActionProps?.onToggle}
                            onEdit={revisionActionProps?.onEdit}
                          />
                        </div>
                        <textarea
                          className="min-h-[112px] w-full rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-4 text-[15px] text-[#334155] outline-none resize-none"
                          value={data?.address ?? ''}
                          readOnly
                        />
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center gap-2">
                          <FieldLabel isNew={isRevisedField('location.coordinates')}>Titik Koordinat</FieldLabel>
                          <RevisionFieldAction
                            field_key="location.coordinates"
                            label="Titik koordinat"
                            checked={!!revisionSelected?.['location.coordinates']}
                            onToggle={revisionActionProps?.onToggle}
                            onEdit={revisionActionProps?.onEdit}
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              className="h-11 w-full rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 pr-12 text-[15px] text-[#334155] outline-none"
                              value={coordText || '-'}
                              readOnly
                            />
                            {hasCoords ? (
                              <a
                                href={gmapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-1 text-[#334155] transition hover:bg-[#E8EEF6]"
                                title="Buka di Google Maps"
                              >
                                <RiExternalLinkLine className="text-xl" />
                              </a>
                            ) : null}
                          </div>

                          {hasCoords ? (
                            <div className="overflow-hidden rounded-[18px] border border-[#D8E1EC]">
                              <iframe
                                title="Lokasi tutor"
                                src={gmapsEmbedUrl}
                                className="h-[220px] w-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-neutral-500">
                              Koordinat belum diisi oleh tutor.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-12 w-full rounded-full bg-[var(--primary-color)] px-6 text-[16px] font-semibold text-neutral-900 cursor-pointer"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </>
              ) : step === 2 ? (
                <>
                  <div className="space-y-6">
                    <div className="rounded-[18px] border border-[#234C97] bg-[#EEF5FF] px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-[#234C97]">
                          <RiErrorWarningLine className="text-[22px]" />
                        </span>
                        <p className="text-[15px] leading-7 text-[#234C97]">
                          Verifikasi semua instrumen dibawah untuk melanjutkan. Pastikan semua
                          status berubah menjadi <span className="font-semibold">Terverifikasi</span>,
                          <span className="font-semibold"> Ditolak</span>, atau
                          <span className="font-semibold"> Diajukan Untuk Ujian</span>.
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <FieldLabel isNew={isRevisedField('certificates.instrument')}>
                          Instrumen
                        </FieldLabel>
                      </div>

                      <div className="space-y-2">
                        {instrumentSummaryRows.length ? (
                          instrumentSummaryRows.map((row) => {
                            const statusUi = getInstrumentStatusUi(row.status);
                            return (
                              <div
                                key={row.instrument}
                                className="flex items-center gap-3 rounded-[16px] border border-[#D7E2EE] px-4 py-3 transition hover:bg-[#F8FBFF]"
                              >
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F7FB] text-[#42526B]">
                                  {row.icon ? (
                                    <img
                                      src={row.icon}
                                      alt={row.instrument}
                                      className="h-5 w-5 object-contain"
                                    />
                                  ) : (
                                    <RiMusic2Line className="text-lg" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#2D3445]">
                                  {row.instrument}
                                </span>
                                <span
                                  className={cls(
                                    'rounded-full px-3 py-1 text-xs font-semibold',
                                    statusUi.className
                                  )}
                                >
                                  {statusUi.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveInstrument(row.instrument);
                                    onOpenCertificates?.({ instrumentName: row.instrument });
                                  }}
                                  className="grid h-8 w-8 place-items-center rounded-full text-[#61708A] transition hover:bg-[#EAF2FF] hover:text-[#234C97]"
                                  title={`Buka ${row.instrument}`}
                                >
                                  <RiExternalLinkLine className="text-xl" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-[16px] border border-[#D7E2EE] px-4 py-4 text-sm text-neutral-500">
                            Belum ada sertifikat instrumen.
                          </div>
                        )}
                      </div>
                    </div>

                    {hasEducation && (
                      <div className="border-t border-[#DCE5EF] pt-5">
                        <div className="mb-3 flex items-center gap-2">
                          <FieldLabel isNew={isRevisedField('certificates.education')}>
                            Sertifikat Pendidikan
                          </FieldLabel>
                        </div>
                        <div className="space-y-2">
                          {data!.educationList!.map((e, idx) => (
                            <div
                              key={String(e.id ?? idx)}
                              className="flex items-center gap-3 rounded-[16px] border border-[#D7E2EE] px-4 py-3 transition hover:bg-[#F8FBFF] cursor-pointer"
                              onClick={() => onOpenEducationDetail?.(e)}
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F7FB] text-[#42526B]">
                                {e.majorInstrument?.icon ? (
                                  <img
                                    src={resolveImageUrl(e.majorInstrument?.icon) || ''}
                                    alt={e.majorInstrument?.nama_instrumen ?? 'Instrumen'}
                                    className="h-5 w-5 object-contain"
                                  />
                                ) : (
                                  <RiMusic2Line className="text-lg" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#2D3445]">
                                {e.majorInstrument?.nama_instrumen || '-'}
                              </span>
                              <span
                                className={cls(
                                  'rounded-full px-3 py-1 text-xs font-semibold',
                                  e.draftStatus === 'approved'
                                    ? 'bg-[#E8FFF1] text-[#18B968]'
                                    : e.draftStatus === 'rejected'
                                      ? 'bg-[#FFE8F0] text-[#F25584]'
                                      : e.draftStatus === 'revision'
                                        ? 'bg-[#FFF7E6] text-[#F5B014]'
                                        : 'bg-[var(--accent-orange-light-color)] text-[var(--accent-orange-color)]'
                                )}
                              >
                                {e.draftStatus === 'approved'
                                  ? 'Terverifikasi'
                                  : e.draftStatus === 'rejected'
                                    ? 'Ditolak'
                                    : e.draftStatus === 'revision'
                                      ? 'Revisi'
                                      : 'Menunggu Verifikasi'}
                              </span>
                              <RiExternalLinkLine className="text-xl text-[#61708A]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasAwards && (
                      <div className="border-t border-[#DCE5EF] pt-5">
                        <div className="mb-3 flex items-center gap-2">
                          <FieldLabel isNew={isRevisedField('certificates.award')}>
                            Sertifikat Penghargaan
                          </FieldLabel>
                        </div>
                        <div className="space-y-2">
                          {data!.awardList!.map((a, idx) => (
                            <div
                              key={`${a.judul_penghargaan ?? 'award'}-${idx}`}
                              className="flex items-center gap-3 rounded-[16px] border border-[#D7E2EE] px-4 py-3 transition hover:bg-[#F8FBFF] cursor-pointer"
                              onClick={() => onOpenAwardDetail?.(a)}
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F7FB] text-[#42526B]">
                                {a.instrument?.icon ? (
                                  <img
                                    src={resolveImageUrl(a.instrument?.icon) || ''}
                                    alt={a.instrument?.nama_instrumen ?? 'Instrumen'}
                                    className="h-5 w-5 object-contain"
                                  />
                                ) : (
                                  <RiMusic2Line className="text-lg" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#2D3445]">
                                {a.instrument?.nama_instrumen || a.judul_penghargaan || '-'}
                              </span>
                              <span
                                className={cls(
                                  'rounded-full px-3 py-1 text-xs font-semibold',
                                  a.draftStatus === 'approved'
                                    ? 'bg-[#E8FFF1] text-[#18B968]'
                                    : a.draftStatus === 'rejected'
                                      ? 'bg-[#FFE8F0] text-[#F25584]'
                                      : a.draftStatus === 'revision'
                                        ? 'bg-[#FFF7E6] text-[#F5B014]'
                                        : 'bg-[var(--accent-orange-light-color)] text-[var(--accent-orange-color)]'
                                )}
                              >
                                {a.draftStatus === 'approved'
                                  ? 'Terverifikasi'
                                  : a.draftStatus === 'rejected'
                                    ? 'Ditolak'
                                    : a.draftStatus === 'revision'
                                      ? 'Revisi'
                                      : 'Menunggu Verifikasi'}
                              </span>
                              <RiExternalLinkLine className="text-xl text-[#61708A]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasLanguages && (
                      <div className="border-t border-[#DCE5EF] pt-5">
                        <div className="mb-3 flex items-center gap-2">
                          <FieldLabel isNew={isRevisedField('languages')}>Bahasa</FieldLabel>
                          <RevisionFieldAction
                            field_key="languages"
                            label="Bahasa"
                            checked={!!revisionSelected?.languages}
                            onToggle={revisionActionProps?.onToggle}
                            onEdit={revisionActionProps?.onEdit}
                          />
                        </div>
                        <div className="rounded-[16px] border border-[#D7E2EE] px-4 py-3">
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                            {data!.languages!.map((lang) => (
                              <span
                                key={lang.code}
                                className="inline-flex items-center gap-2 text-[15px] font-medium text-[#2D3445]"
                              >
                                <img
                                  src={getLanguageIcon(lang.code)}
                                  alt={lang.label}
                                  className="h-6 w-6 rounded-full object-contain"
                                  loading="lazy"
                                />
                                {lang.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6">
                    <div className="flex flex-col gap-3 md:flex-row">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="h-12 rounded-full border border-[var(--secondary-color)] px-8 text-[16px] font-semibold text-[var(--secondary-color)] transition hover:bg-[var(--secondary-light-color)] md:min-w-[160px]"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="h-12 flex-1 rounded-full bg-[var(--primary-color)] px-8 text-[16px] font-semibold text-neutral-900 cursor-pointer"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                </>
              ) : step === 3 ? (
                <>
                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <FieldLabel isNew={isRevisedField('class.title')}>Judul Kelas</FieldLabel>
                        <RevisionFieldAction
                          field_key="class.title"
                          label="Judul kelas"
                          checked={!!revisionSelected?.['class.title']}
                          onToggle={revisionActionProps?.onToggle}
                          onEdit={revisionActionProps?.onEdit}
                        />
                      </div>
                      <input
                        className={inputCls}
                        value={data?.classInfo?.title ?? ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <FieldLabel isNew={isRevisedField('class.about')}>Tentang Kelas</FieldLabel>
                        <RevisionFieldAction
                          field_key="class.about"
                          label="Tentang kelas"
                          checked={!!revisionSelected?.['class.about']}
                          onToggle={revisionActionProps?.onToggle}
                          onEdit={revisionActionProps?.onEdit}
                        />
                      </div>
                      <textarea
                        className="min-h-[132px] w-full rounded-[14px] border border-[#D8E1EC] bg-[#F6F9FC] px-4 py-4 text-[15px] leading-7 text-[#334155] outline-none resize-none"
                        value={data?.classInfo?.about ?? ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <FieldLabel isNew={isRevisedField('class.values')}>Didesain untuk</FieldLabel>
                        <RevisionFieldAction
                          field_key="class.values"
                          label="Didesain untuk"
                          checked={!!revisionSelected?.['class.values']}
                          onToggle={revisionActionProps?.onToggle}
                          onEdit={revisionActionProps?.onEdit}
                        />
                      </div>
                      <input
                        className={inputCls}
                        value={classValuesText}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#DCE5EF] pt-6">
                    <div className="flex flex-col gap-3 md:flex-row">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="h-12 rounded-full border border-[var(--secondary-color)] px-8 text-[16px] font-semibold text-[var(--secondary-color)] transition hover:bg-[var(--secondary-light-color)] md:min-w-[160px]"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="h-12 flex-1 rounded-full bg-[var(--primary-color)] px-8 text-[16px] font-semibold text-neutral-900 cursor-pointer"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-5">
                    <div className="rounded-[22px] bg-[#F4F8FC] px-5 py-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full bg-white shadow-[0_10px_22px_rgba(15,23,42,0.10)]">
                          <img
                            src={data?.image ?? 'https://i.pravatar.cc/100?img=1'}
                            alt={displayTeacherName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[18px] font-semibold text-[#1D2433]">
                            {displayTeacherName}
                          </p>
                          <div className="mt-2 flex flex-col gap-2 text-[15px] text-[#4B5565] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                            <span className="inline-flex items-center gap-2">
                              <RiMailLine className="text-[18px] text-[#61708A]" />
                              <span className="truncate">{data?.email || '-'}</span>
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <RiPhoneLine className="text-[18px] text-[#61708A]" />
                              <span>{data?.phone || '-'}</span>
                            </span>
                          </div>
                          <div className="mt-2 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--secondary-color)]">
                            <RiMapPinLine className="text-[18px]" />
                            <span>{displayTeacherLocation}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {acceptedAllInstrumentRows.length > 0 ? (
                      <div>
                        <p className="mb-3 text-[16px] font-semibold text-[#2D3445]">
                          Instrumen Yang Diterima
                        </p>
                        <div className="space-y-2">
                          {acceptedAllInstrumentRows.map((row, idx) => {
                            const statusUi = getInstrumentStatusUi('verified');
                            return (
                              <div
                                key={`accepted-${row.source}-${row.instrument}-${idx}`}
                                className="flex items-center gap-3 rounded-[16px] border border-[#D7E2EE] px-4 py-3"
                              >
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F7FB] text-[#42526B]">
                                  {row.icon ? (
                                    <img
                                      src={row.icon}
                                      alt={row.instrument}
                                      className="h-5 w-5 object-contain"
                                    />
                                  ) : (
                                    <RiMusic2Line className="text-lg" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#2D3445]">
                                  {row.instrument}
                                </span>
                                <span
                                  className={cls(
                                    'rounded-full px-3 py-1 text-xs font-semibold',
                                    statusUi.className
                                  )}
                                >
                                  {statusUi.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (row.source === 'education' && row.educationItem) {
                                      onOpenEducationDetail?.(row.educationItem, { readOnly: true });
                                    } else if (row.source === 'award' && row.awardItem) {
                                      onOpenAwardDetail?.(row.awardItem, { readOnly: true });
                                    } else {
                                      onOpenCertificates?.({ instrumentName: row.instrument, readOnly: true });
                                    }
                                  }}
                                  className="grid h-8 w-8 place-items-center rounded-full text-[#61708A] transition hover:bg-[#EAF2FF] hover:text-[#234C97]"
                                  title={`Buka ${row.instrument}`}
                                >
                                  <RiExternalLinkLine className="text-xl" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-3 text-[16px] font-semibold text-[#2D3445]">
                        Instrumen Yang Tidak Diterima
                      </p>
                      <div className="space-y-2">
                        {notAcceptedAllInstrumentRows.length ? (
                          notAcceptedAllInstrumentRows.map((row, idx) => {
                            const statusUi = getInstrumentStatusUi(row.status);
                            return (
                              <div
                                key={`not-accepted-${row.source}-${row.instrument}-${idx}`}
                                className="flex items-center gap-3 rounded-[16px] border border-[#D7E2EE] px-4 py-3"
                              >
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F7FB] text-[#42526B]">
                                  {row.icon ? (
                                    <img
                                      src={row.icon}
                                      alt={row.instrument}
                                      className="h-5 w-5 object-contain"
                                    />
                                  ) : (
                                    <RiMusic2Line className="text-lg" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#2D3445]">
                                  {row.instrument}
                                </span>
                                <span
                                  className={cls(
                                    'rounded-full px-3 py-1 text-xs font-semibold',
                                    statusUi.className
                                  )}
                                >
                                  {statusUi.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (row.source === 'education' && row.educationItem) {
                                      onOpenEducationDetail?.(row.educationItem, { readOnly: true });
                                    } else if (row.source === 'award' && row.awardItem) {
                                      onOpenAwardDetail?.(row.awardItem, { readOnly: true });
                                    } else {
                                      onOpenCertificates?.({ instrumentName: row.instrument, readOnly: true });
                                    }
                                  }}
                                  className="grid h-8 w-8 place-items-center rounded-full text-[#61708A] transition hover:bg-[#EAF2FF] hover:text-[#234C97]"
                                  title={`Buka ${row.instrument}`}
                                >
                                  <RiExternalLinkLine className="text-xl" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-[16px] border border-[#D7E2EE] px-4 py-4 text-sm text-neutral-500">
                            {acceptedAllInstrumentRows.length > 0
                              ? 'Semua instrumen sudah terverifikasi.'
                              : 'Belum ada instrumen yang dapat ditampilkan.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#DCE5EF] pt-5">

                    <div className="flex flex-col gap-3 md:flex-row">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="h-12 rounded-full border border-[var(--secondary-color)] px-8 text-[16px] font-semibold text-[var(--secondary-color)] transition hover:bg-[var(--secondary-light-color)] md:min-w-[160px]"
                      >
                        Sebelumnya
                      </button>
                      <div className="flex-1 text-right">
                        <button
                          type="button"
                          onClick={reviewPrimaryAction}
                          disabled={reviewPrimaryDisabled}
                          className={[
                            'h-12 w-full rounded-full px-6 text-[16px] font-semibold text-neutral-900',
                            isRevisionMode
                              ? selectedRevisionCount === 0
                                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                : 'bg-[var(--primary-color)] cursor-pointer'
                              : reviewPrimaryDisabled
                                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                : 'bg-[var(--primary-color)] cursor-pointer',
                          ].join(' ')}
                        >
                          {reviewPrimaryLabel}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      {isRevisionMode && selectedRevisionCount === 0 ? (
                        <p className="mt-2 text-sm text-neutral-600">
                          Tandai minimal 1 field yang perlu direvisi.
                        </p>
                      ) : !isRevisionMode && reviewPrimaryDisabled ? (
                        <p className="mt-2 text-sm text-neutral-600">
                          {hasApprovedInstrumentDecision
                            ? approveDisabledHint
                            : rejectDisabledHint}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="px-5 pb-5 pt-4 max-h-[calc(100vh-7.5rem)] overflow-y-auto">
              {/* Perihal */}
              <div className="mb-3">
                <p className="text-sm text-neutral-600">Perihal:</p>
                <p className="text-md text-neutral-900">
                  <span className="font-medium">
                    Hasil Seleksi Calon Tutor Guru Musik
                  </span>
                </p>
              </div>

              {/* Reason */}
              <div className="mt-3">
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-[var(--secondary-color)] px-3 py-2 text-md outline-none"
                  placeholder="Masukkan keterangan Penolakan Calon Tutor"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {/* actions */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={submitRejected}
                  className="w-full h-11 rounded-full font-semibold bg-[var(--primary-color)] text-neutral-900 cursor-pointer"
                >
                  Kirim Laporan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <RevisionDraftFieldModal
        open={!!activeRevisionField}
        fieldKey={activeRevisionField?.field_key ?? ''}
        label={activeRevisionField?.label ?? ''}
        draft={currentRevisionDraft}
        onClose={() => setActiveRevisionField(null)}
        onSave={(draft) => {
          if (!activeRevisionField) return;
          onSaveRevisionDraft?.(
            activeRevisionField.field_key,
            activeRevisionField.label,
            draft,
          );
          setActiveRevisionField(null);
        }}
        onDelete={
          activeRevisionField?.field_key && currentRevisionDraft
            ? () => {
              onDeleteRevisionDraft?.(activeRevisionField.field_key);
              setActiveRevisionField(null);
            }
            : undefined
        }
      />
    </div>
  );
};

export default ApproveTeacherModal;
