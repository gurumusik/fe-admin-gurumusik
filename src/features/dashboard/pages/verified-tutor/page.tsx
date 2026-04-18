/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/dashboard/pages/teacher/VerifiedTutorPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiUser2Fill,
  RiCheckFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiCloseLine,
  RiSearchLine,
  RiArrowDownSLine,
  RiMusic2Line,
} from 'react-icons/ri';

import type { GuruApplicationDTO } from '@/features/slices/guruApplication/types';
import { decideApplication, listRecruitmentApplications } from '@/services/api/recruitment.api';
import {
  listRevisionTemplates,
  type RevisionTemplateDTO,
} from '@/services/api/revisionTemplate.api';

import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import ApproveTeacherModal, {
  type ApproveMode,
  type ApproveTeacherPayload,
  type RevisionDraftValue,
} from '../../components/ApproveTeacherModal';
import LoadingScreen from '@/components/ui/common/LoadingScreen';
import defaultUser from '@/assets/images/default-user.png';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { getRevisionFieldLabel } from './revisionFieldMap';
import GuruRevisionComposerModal from '@/features/dashboard/components/GuruRevisionComposerModal';
import GuruRevisionDetailModal from '@/features/dashboard/components/GuruRevisionDetailModal';
import ManageCertificateModal, {
  type CertificateItem,
  type CertStatus,
} from '@/features/dashboard/components/ManageCertificateModal';
import EducationCertificateModal, {
  type EducationCertificateData,
} from '@/features/dashboard/components/EducationCertificateModal';
import AwardCertificateModal, {
  type AwardCertificateData,
} from '@/features/dashboard/components/AwardCertificateModal';

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const PAGE_SIZE = 5;
type VerifiedTutorQueue =
  | 'screening'
  | 'revision'
  | 'certification'
  | 'certification_offer'
  | 'manual_certification';
type ScreeningTabKey = 'all' | 'new' | 'reviewed';
type CandidateInstrument = { name: string; iconUrl?: string };
type CandidateInstrumentOption = { value: string; label: string };
const CERTIFICATION_QUEUE_STATES = ['certification_offered', 'certification_requested'];

/* ======================== Subcomponents ======================== */

const formatDisplayDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const pushInstrument = (
  list: CandidateInstrument[],
  seen: Set<string>,
  name?: string | null,
  icon?: string | null
) => {
  const label = String(name || '').trim();
  if (!label) return;
  const key = label.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push({
    name: label,
    iconUrl: resolveImageUrl(icon ?? null) ?? undefined,
  });
};

const extractCandidateInstruments = (row: GuruApplicationDTO): CandidateInstrument[] => {
  const items: CandidateInstrument[] = [];
  const seen = new Set<string>();
  const appAny = row as any;
  const detailGuru = row.user?.detailGuru;

  const instrumentCertificates = Array.isArray(appAny.list_sertifikat)
    ? appAny.list_sertifikat
    : [];
  instrumentCertificates.forEach((item: any) => {
    pushInstrument(
      items,
      seen,
      item?.instrument?.nama_instrumen ?? item?.instrument?.nama,
      item?.instrument?.icon
    );
  });

  const guruCertificates = Array.isArray(detailGuru?.sertifikat)
    ? detailGuru?.sertifikat
    : [];
  guruCertificates.forEach((item: any) => {
    pushInstrument(
      items,
      seen,
      item?.instrument?.nama_instrumen ?? item?.instrument?.nama,
      item?.instrument?.icon
    );
  });

  const educationList = Array.isArray(appAny.pendidikan_guru)
    ? appAny.pendidikan_guru
    : [];
  educationList.forEach((item: any) => {
    pushInstrument(
      items,
      seen,
      item?.majorInstrument?.nama_instrumen,
      item?.majorInstrument?.icon
    );
    pushInstrument(
      items,
      seen,
      item?.minorInstrument?.nama_instrumen,
      item?.minorInstrument?.icon
    );
  });

  const awards = Array.isArray(appAny.sertifikat_penghargaan)
    ? appAny.sertifikat_penghargaan
    : [];
  awards.forEach((item: any) => {
    pushInstrument(
      items,
      seen,
      item?.instrument?.nama_instrumen ?? item?.instrument?.nama,
      item?.instrument?.icon
    );
  });

  return items;
};

const getScreeningTabKey = (row: GuruApplicationDTO): Exclude<ScreeningTabKey, 'all'> =>
  row.submission_state === 'REVISION' || row.screening_state === 'revision_resubmitted'
    ? 'reviewed'
    : 'new';

const getScreeningStateMeta = (row: GuruApplicationDTO) => {
  const key = getScreeningTabKey(row);
  if (key === 'reviewed') {
    return {
      key,
      label: 'Ditinjau',
      className: 'text-[#244C9A]',
    };
  }

  return {
    key,
    label: 'Baru',
    className: 'text-[#F25584]',
  };
};

const PageTitle: React.FC<{
  title?: string;
  actions?: React.ReactNode;
}> = ({ title = 'List Calon Tutor', actions }) => (
  <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
    <div className="flex items-center gap-3">
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: 'var(--primary-color)' }}
      >
        <RiUser2Fill size={24} className="text-[#202020]" />
      </div>
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#202432]">{title}</h2>
    </div>
    {actions}
  </div>
);

const ScreeningToolbar: React.FC<{
  searchQuery: string;
  instrumentFilter: string;
  instrumentOptions: CandidateInstrumentOption[];
  onSearchQueryChange: (value: string) => void;
  onInstrumentFilterChange: (value: string) => void;
}> = ({
  searchQuery,
  instrumentFilter,
  instrumentOptions,
  onSearchQueryChange,
  onInstrumentFilterChange,
}) => (
  <div className="flex w-full flex-col gap-3 md:flex-row xl:w-auto">
    <label className="relative block w-full xl:min-w-[360px]">
      <RiSearchLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#91A0B6]" />
      <input
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder="Cari Nama Guru"
        className="h-12 w-full rounded-2xl border border-[#D9E3F0] bg-white pl-12 pr-4 text-sm text-[#273142] outline-none transition focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[#0682DF]/10"
      />
    </label>

    <label className="relative block w-full md:w-[220px]">
      <select
        value={instrumentFilter}
        onChange={(event) => onInstrumentFilterChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-[#D9E3F0] bg-white px-4 pr-10 text-sm text-[#273142] outline-none transition focus:border-[var(--secondary-color)] focus:ring-2 focus:ring-[#0682DF]/10"
      >
        <option value="all">Cari Instrumen</option>
        {instrumentOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-[#7A8AA0]" />
    </label>
  </div>
);

const ScreeningTabs: React.FC<{
  activeTab: ScreeningTabKey;
  counts: Record<ScreeningTabKey, number>;
  onChange: (value: ScreeningTabKey) => void;
}> = ({ activeTab, counts, onChange }) => {
  const tabs: Array<{ key: ScreeningTabKey; label: string }> = [
    { key: 'all', label: 'Semua' },
    { key: 'new', label: 'Baru' },
    { key: 'reviewed', label: 'Ditinjau' },
  ];

  return (
    <div className="mb-4 grid grid-cols-3 border-b border-[#D8E2ED]">
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cls(
              'w-full min-w-0 border-b-2 px-4 pb-3 text-center text-sm font-medium transition',
              active
                ? 'border-[var(--secondary-color)] text-[var(--secondary-color)]'
                : 'border-transparent text-[#7B8BA3] hover:text-[#244C9A]'
            )}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        );
      })}
    </div>
  );
};

const ScreeningTableHeader: React.FC = () => {
  const headCls =
    'bg-[#F5F8FA] px-4 py-4 text-left text-md font-semibold text-[#2C3445] first:rounded-tl-[16px] last:rounded-tr-[16px]';

  return (
    <thead>
      <tr>
        <th className={headCls}>Profile</th>
        <th className={headCls}>Nama Calon Tutor</th>
        <th className={headCls}>No Telepon</th>
        <th className={headCls}>Asal Kota</th>
        <th className={headCls}>Tanggal</th>
        <th className={headCls}>Mengajar ABK</th>
        <th className={headCls}>State</th>
        <th className={headCls}>Instrumen</th>
        <th className={headCls}>Aksi</th>
      </tr>
    </thead>
  );
};

const ScreeningRowItem: React.FC<{
  row: GuruApplicationDTO;
  instruments: CandidateInstrument[];
  onReview: () => void;
}> = ({ row, instruments, onReview }) => {
  const profileUrl = resolveImageUrl(row.user?.profile_pic_url ?? null) || defaultUser;
  const state = getScreeningStateMeta(row);
  const createdAt = formatDisplayDate(row.created_at);
  const primaryInstrument = instruments[0];
  const fullInstrumentLabel = instruments.length
    ? instruments.map((instrument) => instrument.name).join(', ')
    : '-';
  const instrumentLabel = fullInstrumentLabel;
  const cellCls =
    'bg-white px-4 py-4 text-[15px] text-[#2A3241] first:rounded-l-[22px] last:rounded-r-[22px]';

  return (
    <tr className="align-middle">
      <td className={cellCls}>
        <img
          src={profileUrl}
          alt={row.nama}
          className="h-14 w-14 rounded-full object-cover shadow-[0_8px_18px_rgba(15,23,42,0.12)]"
        />
      </td>
      <td className={cls(cellCls, 'max-w-[220px]')}>
        <p className="truncate text-[16px] text-[#232C3D]">{row.nama || '-'}</p>
      </td>
      <td className={cls(cellCls, 'whitespace-nowrap text-[#344054]')}>{row.no_telp ?? '-'}</td>
      <td className={cls(cellCls, 'whitespace-nowrap text-[#344054]')}>{row.domisili ?? '-'}</td>
      <td className={cls(cellCls, 'whitespace-nowrap text-[#344054]')}>{createdAt}</td>
      <td className={cellCls}>
        {row.is_abk ? (
          <RiCheckboxCircleFill
            className="text-2xl text-[#18B968]"
            title="Bersedia mengajar ABK"
            aria-label="Bersedia mengajar ABK"
          />
        ) : (
          <RiCloseCircleFill
            className="text-2xl text-[#F25584]"
            title="Belum bersedia mengajar ABK"
            aria-label="Belum bersedia mengajar ABK"
          />
        )}
      </td>
      <td className={cellCls}>
        <span className={cls('text-[16px] font-semibold', state.className)}>{state.label}</span>
      </td>
      <td className={cls(cellCls, 'w-[170px] max-w-[170px]')}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F7FB] text-[#4A5C7A]">
            {primaryInstrument?.iconUrl ? (
              <img
                src={primaryInstrument.iconUrl}
                alt={primaryInstrument.name}
                className="h-5 w-5 object-contain"
              />
            ) : (
              <RiMusic2Line className="text-lg" />
            )}
          </span>
          <span
            className="block min-w-0 flex-1 truncate whitespace-nowrap text-[15px] text-[#344054]"
            title={fullInstrumentLabel}
          >
            {instrumentLabel}
          </span>
        </div>
      </td>
      <td className={cellCls}>
        <button
          type="button"
          onClick={onReview}
          className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--secondary-color)] px-5 text-sm font-semibold text-[var(--secondary-color)] transition hover:bg-[var(--secondary-light-color)] cursor-pointer"
        >
          Periksa
        </button>
      </td>
    </tr>
  );
};

const LegacyTableHeader: React.FC = () => {
  const headCls =
    'text-md whitespace-nowrap p-4 text-left font-semibold text-neutral-900';

  return (
    <thead>
      <tr className="bg-neutral-100">
        <th className={headCls}>Profile</th>
        <th className={headCls}>Nama Calon Tutor</th>
        <th className={headCls}>No Telepon</th>
        <th className={headCls}>Asal Kota</th>
        <th className={headCls}>Tanggal</th>
        <th className={headCls}>Mengajar ABK</th>
        <th className={headCls}>State</th>
        <th className={headCls}>Revisi</th>
        <th className={headCls}>Aksi</th>
      </tr>
    </thead>
  );
};

const LegacyActionButtons: React.FC<{
  onApprove?: () => void;
  onRevision?: () => void;
  onCertification?: () => void;
  showRevision?: boolean;
}> = ({ onApprove, onRevision, onCertification, showRevision = true }) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={onApprove}
      className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-[var(--accent-green-light-color)]"
      aria-label="Setujui"
      title="Setujui"
    >
      <RiCheckFill size={25} className="text-[#18A957]" />
    </button>

    {showRevision ? (
      <button
        type="button"
        onClick={onRevision}
        className="h-9 rounded-lg border border-[var(--accent-orange-color)] px-3 text-xs font-semibold text-[var(--accent-orange-color)] cursor-pointer"
        aria-label="Revisi"
        title="Revisi"
      >
        Revisi
      </button>
    ) : null}

    {onCertification ? (
      <button
        type="button"
        onClick={onCertification}
        className="h-9 rounded-lg border border-[var(--secondary-color)] px-3 text-xs font-semibold text-[var(--secondary-color)] cursor-pointer"
        aria-label="Tawarkan sertifikasi"
        title="Tawarkan sertifikasi"
      >
        Sertifikasi
      </button>
    ) : null}
  </div>
);

const LegacyRowItem: React.FC<{
  row: GuruApplicationDTO;
  onApprove: () => void;
  onRevision: () => void;
  onCertification: () => void;
  onOpenRevisionDetail?: () => void;
  revisionQueue?: boolean;
  certificationQueue?: boolean;
  hideRevisionAction?: boolean;
}> = ({
  row,
  onApprove,
  onRevision,
  onCertification,
  onOpenRevisionDetail,
  revisionQueue,
  certificationQueue,
  hideRevisionAction,
}) => {
  const profileUrl = resolveImageUrl(row.user?.profile_pic_url ?? null) || defaultUser;

  const createdAt = row.created_at
    ? new Date(row.created_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    : '-';

  const abk = !!row.is_abk;
  const abkLabel = abk ? 'Bersedia' : 'Tidak Bersedia';
  const abkColorVar = abk
    ? 'var(--accent-green-color)'
    : 'var(--accent-red-color)';

  const submission =
    row.screening_state === 'certification_requested'
      ? 'Pengajuan Mandiri'
      : row.screening_state === 'certification_offered'
        ? 'Ditawarkan Sertifikasi'
        : row.screening_state === 'revision_resubmitted'
          ? 'Habis Revisi'
          : row.submission_state === 'REVISION'
            ? 'Data Revisi'
            : 'Pengajuan Data Baru';
  const submissionCls =
    CERTIFICATION_QUEUE_STATES.includes(String(row.screening_state || ''))
      ? 'bg-[var(--secondary-light-color)] text-[var(--secondary-color)]'
      : row.submission_state === 'REVISION' || row.screening_state === 'revision_resubmitted'
        ? 'bg-[var(--secondary-light-color)] text-[var(--secondary-color)]'
        : 'bg-neutral-100 text-neutral-700';

  const revCount = Number(row.revision_count || 0);
  const revDanger = row.revision_danger_flag === true || revCount >= 3;
  const revCls = revDanger
    ? 'bg-[var(--accent-red-light-color)] text-[var(--accent-red-color)]'
    : 'bg-neutral-100 text-neutral-700';

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={profileUrl}
            alt={row.nama}
            className="h-12 w-12 rounded-full object-cover"
          />
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="text-md text-[#202020]">{row.nama}</span>
      </td>

      <td className="px-4 py-3">
        <span className="text-md text-[#202020]">{row.no_telp ?? '-'}</span>
      </td>

      <td className="px-4 py-3">
        <span className="text-md text-[#202020]">{row.domisili ?? '-'}</span>
      </td>

      <td className="px-4 py-3">
        <span className="text-md text-[#202020]">{createdAt}</span>
      </td>

      <td className="px-4 py-3">
        <span className="text-md" style={{ color: abkColorVar }}>
          {abkLabel}
        </span>
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${submissionCls}`}
        >
          {submission}
        </span>
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${revCls}`}
        >
          {revCount}x
        </span>
      </td>

      <td className="px-4 py-3">
        {revisionQueue ? (
          <button
            type="button"
            onClick={onOpenRevisionDetail}
            className="h-9 rounded-lg border border-[var(--secondary-color)] px-3 text-xs font-semibold text-[var(--secondary-color)] cursor-pointer"
          >
            Lihat Revisi
          </button>
        ) : (
          <LegacyActionButtons
            onApprove={onApprove}
            onRevision={onRevision}
            onCertification={certificationQueue ? undefined : onCertification}
            showRevision={!hideRevisionAction}
          />
        )}
      </td>
    </tr>
  );
};

const Pagination: React.FC<{
  total: number;
  page: number;
  onChange: (p: number) => void;
  pageSize?: number;
  totalPages?: number;
}> = ({ total, page, onChange, pageSize = PAGE_SIZE, totalPages }) => {
  const pages = totalPages ?? Math.ceil(Math.max(0, Number(total) || 0) / pageSize);
  const current = Math.min(Math.max(1, page), Math.max(1, pages));

  const btnCls =
    'flex h-9 min-w-9 items-center justify-center rounded-xl border border-[#2E8DFF] px-3 text-sm font-medium text-[#1F2937] transition hover:bg-[#E9F3FF]';
  const arrowBtnCls =
    'grid h-9 w-9 place-items-center rounded-xl text-[#202020] transition hover:bg-[#E9F3FF] disabled:opacity-40 disabled:hover:bg-transparent';

  const window = useMemo(() => {
    const arr: (number | '...')[] = [];
    const push = (v: number | '...') =>
      arr[arr.length - 1] === v ? undefined : arr.push(v);

    for (let i = 1; i <= pages; i++) {
      if (i <= 3 || i > pages - 2 || Math.abs(i - current) <= 1) push(i);
      else if (arr[arr.length - 1] !== '...') push('...');
    }
    return arr;
  }, [pages, current]);

  if (pages <= 1) return null;

  return (
    <div className="mt-5 flex items-center gap-2">
      <button
        className={arrowBtnCls}
        disabled={current === 1}
        onClick={() => onChange(Math.max(1, current - 1))}
        aria-label="Sebelumnya"
        title="Sebelumnya"
      >
        <RiArrowLeftSLine className="text-xl" />
      </button>

      {window.map((v, i) =>
        v === '...' ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-neutral-900">
            ...
          </span>
        ) : (
          <button
            key={v}
            className={cls(
              btnCls,
              v === current &&
                'bg-[#E9F3FF] border-[var(--secondary-color)] font-semibold text-[var(--secondary-color)]'
            )}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        )
      )}

      <button
        className={arrowBtnCls}
        disabled={current === pages}
        onClick={() => onChange(Math.min(pages, current + 1))}
        aria-label="Berikutnya"
        title="Berikutnya"
      >
        <RiArrowRightSLine className="text-xl" />
      </button>
    </div>
  );
};

/* ======================== Helpers Sertifikat ======================== */

const mapCertStatus = (raw?: string | null): CertStatus => {
  const v = String(raw || '').toLowerCase();
  if (v === 'approved' || v === 'disetujui') return 'Disetujui';
  if (v === 'rejected' || v === 'ditolak' || v === 'tidak_disetujui')
    return 'Tidak Disetujui';
  return 'Menunggu Verifikasi'; // termasuk 'under_review' / default
};

const LANGUAGE_MAP: Record<string, { label: string; code: string }> = {
  id: { label: 'Indonesia', code: 'ID' },
  en: { label: 'English', code: 'EN' },
  ja: { label: 'Jepang', code: 'JA' },
  ko: { label: 'Korea', code: 'KR' },
  cn: { label: 'China', code: 'CN' },
  zh: { label: 'China', code: 'CN' },
  fr: { label: 'Prancis', code: 'FR' },
  de: { label: 'Jerman', code: 'DE' },
  es: { label: 'Spanyol', code: 'ES' },
  it: { label: 'Italia', code: 'IT' },
  pt: { label: 'Portugal', code: 'PT' },
  ru: { label: 'Rusia', code: 'RU' },
  ar: { label: 'Arab', code: 'AR' },
  nl: { label: 'Belanda', code: 'NL' },
};

const normalizeLanguages = (values: any[]) => {
  const items = values
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .map((raw) => {
      const key = raw.toLowerCase();
      const known = LANGUAGE_MAP[key];
      if (known) return known;
      const code = raw.length <= 3 ? raw.toUpperCase() : raw.slice(0, 3).toUpperCase();
      const label = raw.length <= 3 ? raw.toUpperCase() : raw;
      return { code, label };
    });
  const seen = new Set<string>();
  return items.filter((it) => {
    if (seen.has(it.code)) return false;
    seen.add(it.code);
    return true;
  });
};

const extractRevisionFieldKeys = (meta: any): string[] => {
  let parsedMeta = meta;
  if (typeof meta === 'string') {
    try {
      parsedMeta = JSON.parse(meta);
    } catch {
      parsedMeta = null;
    }
  }

  const rawFields: any[] = Array.isArray(parsedMeta?.revision_fields)
    ? parsedMeta.revision_fields
    : Array.isArray(parsedMeta?.revisionFields)
    ? parsedMeta.revisionFields
    : [];

  return Array.from(
    new Set<string>(
      rawFields
        .map((fieldKey: any) => String(fieldKey || '').trim())
        .filter((fieldKey): fieldKey is string => Boolean(fieldKey))
    )
  );
};

const buildCertificatesFromApplication = (
  row: GuruApplicationDTO | null
): CertificateItem[] => {
  if (!row) return [];
  const userAny: any = row.user as any;
  const detailGuru = userAny?.detailGuru;
  const list: any[] =
    (Array.isArray((row as any).list_sertifikat) &&
      (row as any).list_sertifikat) ||
    detailGuru?.sertifikat ||
    [];
  const clips: any[] = detailGuru?.cuplikan ?? [];
  if (!Array.isArray(list) || !list.length) return [];

  return list.map((s: any): CertificateItem => {
    // pastikan hasil akhirnya string | undefined (bukan null)
    const filesArr = Array.isArray(s.files) ? s.files : [];
    const fileFromFiles =
      filesArr.length > 0 ? filesArr[0]?.file_url : undefined;
    const fileUrl =
      fileFromFiles || s.certif_path
        ? (resolveImageUrl((fileFromFiles || s.certif_path) ?? null) ?? undefined)
        : undefined;

    const instrumentName =
      (s.instrument && (s.instrument.nama_instrumen as string)) ||
      (s.instrument && (s.instrument.nama as string)) ||
      "-";

    const instrumentIcon =
      s.instrument && s.instrument.icon
        ? (resolveImageUrl(s.instrument.icon ?? null) ?? undefined)
        : undefined;

    const gradeName =
      (s.grade && (s.grade.nama_grade as string)) ||
      (s.grade && (s.grade.nama as string)) ||
      "-";

    const instrumentId = s.instrument_id ?? s.instrument?.id ?? null;
    const instrumentNameRaw =
      (s.instrument && (s.instrument.nama_instrumen as string)) ||
      (s.instrument && (s.instrument.nama as string)) ||
      "";
    const instrumentNameNormalized = instrumentNameRaw.trim();

    const clip =
      clips.find((c: any) => {
        const clipInstrumentId = c?.instrument_id ?? c?.instrument?.id ?? null;
        if (instrumentId && clipInstrumentId) {
          return Number(clipInstrumentId) === Number(instrumentId);
        }
        const clipName =
          (c?.instrument?.nama_instrumen as string) ||
          (c?.instrument?.nama as string) ||
          "";
        return (
          instrumentNameNormalized &&
          clipName &&
          clipName.toLowerCase() === instrumentNameNormalized.toLowerCase()
        );
      }) ?? null;

    const certTypeRaw = String(s.tipe_sertifikat || '').toLowerCase();
    const certType =
      certTypeRaw === 'international' || certTypeRaw === 'internasional'
        ? 'Internasional'
        : certTypeRaw === 'local' || certTypeRaw === 'lokal'
        ? 'Lokal'
        : certTypeRaw
        ? certTypeRaw.charAt(0).toUpperCase() + certTypeRaw.slice(1)
        : undefined;

    return {
      id: s.id,
      title: s.keterangan || "Sertifikat",
      school: s.penyelenggara || "-",
      instrument: instrumentName,
      instrumentIcon,        // sekarang: string | undefined
      grade: gradeName,
      certType,
      year: Number.isFinite(Number(s.tahun_berlaku)) ? Number(s.tahun_berlaku) : undefined,
      files: filesArr,
      status: mapCertStatus(s.status),
      link: fileUrl,         // sekarang: string | undefined
      rejectReason: s.alasan_penolakan ?? null,
      video: clip
        ? {
            title: clip.title ?? undefined,
            description: clip.deskripsi ?? undefined,
            link: clip.link ?? undefined,
          }
        : null,
    };
  });
};
/* ======================== Instrument Revision Note Modal ======================== */

type InstrumentRevisionNoteModalProps = {
  ctx: {
    type: 'cert' | 'education' | 'award';
    id: string | number;
    instrumentName: string;
    instrumentIcon?: string;
  };
  message: string;
  onMessageChange: (v: string) => void;
  templates: RevisionTemplateDTO[];
  templatesLoading: boolean;
  selectedTemplateId: string;
  onSelectedTemplateIdChange: (v: string) => void;
  onClose: () => void;
  onSave: (reason: string) => void;
};

const InstrumentRevisionNoteModal: React.FC<InstrumentRevisionNoteModalProps> = ({
  ctx,
  message,
  onMessageChange,
  templates,
  templatesLoading,
  selectedTemplateId,
  onSelectedTemplateIdChange,
  onClose,
  onSave,
}) => {
  const selectedTemplate =
    templates.find((t) => String(t.id) === String(selectedTemplateId || '')) ?? null;
  const canSave = message.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[140]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#0B1220]/60" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="w-full max-w-[680px] rounded-[28px] bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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

          {/* Body */}
          <div className="border-t border-[#DCE5EF] px-6 pb-6 pt-5">
            {/* Instrument row + Gunakan Template */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F4F7FB] text-[#42526B]">
                  {ctx.instrumentIcon ? (
                    <img
                      src={ctx.instrumentIcon}
                      alt={ctx.instrumentName}
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <RiMusic2Line className="text-lg" />
                  )}
                </span>
                <span className="text-[17px] font-medium text-[#2D3445]">
                  {ctx.instrumentName}
                </span>
              </div>
              <button
                type="button"
                disabled={!selectedTemplate}
                onClick={() => {
                  if (!selectedTemplate) return;
                  onMessageChange(selectedTemplate.message || '');
                }}
                className={cls(
                  'h-11 shrink-0 rounded-full border px-6 text-[15px] font-semibold transition',
                  selectedTemplate
                    ? 'border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)] cursor-pointer'
                    : 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                )}
              >
                Gunakan Template
              </button>
            </div>

            {/* Template dropdown */}
            <select
              value={selectedTemplateId}
              onChange={(e) => onSelectedTemplateIdChange(e.target.value)}
              className="mb-3 h-14 w-full rounded-[18px] border border-[#D6E1EC] bg-white px-4 text-[15px] text-[#60708A] outline-none transition focus:border-[var(--secondary-color)]"
              disabled={templatesLoading}
            >
              <option value="">
                {templatesLoading ? 'Memuat template...' : 'Pilih Pesan Template'}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Textarea */}
            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Pesan spesifik untuk memperbaiki kolom ini"
              className="min-h-[140px] w-full rounded-[18px] border border-[#D6E1EC] px-4 py-4 text-[15px] text-[#334155] outline-none transition focus:border-[var(--secondary-color)] resize-none"
            />

            {/* Footer */}
            <div className="mt-4 border-t border-[#DCE5EF] pt-5">
              <button
                type="button"
                onClick={() => onSave(message.trim())}
                disabled={!canSave}
                className={cls(
                  'h-12 w-full rounded-full px-8 text-[15px] font-semibold text-[#1D2433] transition',
                  canSave
                    ? 'bg-[var(--primary-color)] hover:brightness-95 cursor-pointer'
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
  );
};

/* ======================== Main Page ======================== */

type CertificationCriteriaState = {
  high_skill_video: boolean;
  stable_technique: boolean;
  assessable_audio_visual: boolean;
  growth_potential: boolean;
};

const emptyCertificationCriteria: CertificationCriteriaState = {
  high_skill_video: false,
  stable_technique: false,
  assessable_audio_visual: false,
  growth_potential: false,
};

const CERTIFICATION_CRITERIA_OPTIONS: Array<{
  key: keyof CertificationCriteriaState;
  label: string;
}> = [
  { key: 'high_skill_video', label: 'Video menunjukkan skill level tinggi' },
  { key: 'stable_technique', label: 'Teknik bermain rapi, stabil, dan konsisten' },
  { key: 'assessable_audio_visual', label: 'Audio dan visual layak dinilai' },
  { key: 'growth_potential', label: 'Kandidat punya potensi berkembang' },
];

export const VerifiedTutorPageContent: React.FC<{
  queue?: VerifiedTutorQueue;
  title?: string;
}> = ({ queue = 'screening', title = 'List Calon Tutor' }) => {
  const navigate = useNavigate();
  const isScreeningQueue = queue === 'screening';
  const [itemsAll, setItemsAll] = useState<GuruApplicationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('all');
  const [screeningTab, setScreeningTab] = useState<ScreeningTabKey>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ApproveMode>('approved');
  const [selected, setSelected] = useState<GuruApplicationDTO | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<'success' | 'error'>('success');
  const [confirmCtx, setConfirmCtx] = useState<'approved' | 'rejected' | 'certification'>(
    'approved'
  );
  const [confirmErrorText, setConfirmErrorText] = useState<string | null>(null);

  // state untuk overlay loading submit decide
  const [deciding, setDeciding] = useState(false);

  // state untuk ManageCertificateModal
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certModalItems, setCertModalItems] = useState<CertificateItem[]>([]);
  const [certModalTitle, setCertModalTitle] =
    useState<string>('Kelola Sertifikat');
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [eduModalData, setEduModalData] =
    useState<EducationCertificateData | null>(null);
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [awardModalData, setAwardModalData] =
    useState<AwardCertificateData | null>(null);
  const [detailReadOnly, setDetailReadOnly] = useState(false);

  // Revision note modal (per-instrument revision)
  const [revNoteOpen, setRevNoteOpen] = useState(false);
  const [revNoteText, setRevNoteText] = useState('');
  const [revNoteCtx, setRevNoteCtx] = useState<{
    type: 'cert' | 'education' | 'award';
    id: string | number;
    instrumentName: string;
    instrumentIcon?: string;
    certItem?: CertificateItem;
  } | null>(null);
  const [revNoteTemplates, setRevNoteTemplates] = useState<RevisionTemplateDTO[]>([]);
  const [revNoteTemplateId, setRevNoteTemplateId] = useState('');
  const [revNoteTemplatesLoading, setRevNoteTemplatesLoading] = useState(false);

  const [certDrafts, setCertDrafts] = useState<
    Record<
      string,
      { status: 'approved' | 'rejected' | 'revision'; reason?: string | null }
    >
  >({});
  const [eduDrafts, setEduDrafts] = useState<
    Record<string, 'approved' | 'rejected' | 'revision'>
  >({});
  const [awardDrafts, setAwardDrafts] = useState<
    Record<string, 'approved' | 'rejected' | 'revision'>
  >({});
  const [hiddenIds, setHiddenIds] = useState<Record<number, true>>({});
  const [certOfferOpen, setCertOfferOpen] = useState(false);
  const [certOfferReason, setCertOfferReason] = useState('');
  const [certCriteria, setCertCriteria] =
    useState<CertificationCriteriaState>(emptyCertificationCriteria);

  // revision report (compose)
  const [revisionDrafts, setRevisionDrafts] = useState<Record<string, RevisionDraftValue>>({});
  const [revisionComposerOpen, setRevisionComposerOpen] = useState(false);
  const [revisionDetailOpen, setRevisionDetailOpen] = useState(false);
  const [revisionDetailApp, setRevisionDetailApp] = useState<{ id: number; name?: string } | null>(null);
  // Load templates for instrument revision note modal
  useEffect(() => {
    if (!revNoteOpen || !revNoteCtx) return;
    let alive = true;
    setRevNoteTemplatesLoading(true);
    const fieldKey =
      revNoteCtx.type === 'education'
        ? 'certificates.education'
        : revNoteCtx.type === 'award'
          ? 'certificates.award'
          : 'certificates.instrument';
    listRevisionTemplates({
      field_keys: [fieldKey],
      is_active: true,
      limit: 100,
    })
      .then((resp) => {
        if (!alive) return;
        setRevNoteTemplates(Array.isArray(resp?.data) ? resp.data : []);
      })
      .catch(() => {
        if (!alive) return;
        setRevNoteTemplates([]);
      })
      .finally(() => {
        if (alive) setRevNoteTemplatesLoading(false);
      });
    return () => { alive = false; };
  }, [revNoteOpen, revNoteCtx]);

  const reload = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const resp = await listRecruitmentApplications({ status: 'proses', queue });
      setItemsAll(Array.isArray(resp?.data) ? resp.data : []);
    } catch (err: any) {
      setErrorMsg(String(err?.message || 'Gagal memuat data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErrorMsg(null);
    listRecruitmentApplications({ status: 'proses', queue })
      .then((resp) => {
        if (!mounted) return;
        setItemsAll(Array.isArray(resp?.data) ? resp.data : []);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setErrorMsg(String(err?.message || 'Gagal memuat data'));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [queue]);

  // Filter client-side juga (untuk berjaga)
  const items = useMemo(
    () =>
      itemsAll.filter((r) => {
        if (hiddenIds[Number(r.id)]) return false;
        if (queue === 'revision') return r.screening_state === 'revision_required';
        if (queue === 'certification_offer') return r.screening_state === 'certification_offered';
        if (queue === 'manual_certification') return r.screening_state === 'certification_requested';
        if (queue === 'certification') {
          return CERTIFICATION_QUEUE_STATES.includes(String(r.screening_state || ''));
        }
        return (
          r.status === 'proses' &&
          r.screening_state !== 'revision_required' &&
          !CERTIFICATION_QUEUE_STATES.includes(String(r.screening_state || ''))
        );
      }),
    [itemsAll, hiddenIds, queue]
  );

  useEffect(() => {
    setHiddenIds({});
  }, [itemsAll]);

  useEffect(() => {
    setPage(1);
  }, [queue, searchQuery, instrumentFilter, screeningTab]);

  const instrumentsByItemId = useMemo(() => {
    const map = new Map<number, CandidateInstrument[]>();
    items.forEach((item) => {
      map.set(Number(item.id), extractCandidateInstruments(item));
    });
    return map;
  }, [items]);

  const instrumentOptions = useMemo<CandidateInstrumentOption[]>(() => {
    const map = new Map<string, CandidateInstrumentOption>();
    items.forEach((item) => {
      const rowInstruments = instrumentsByItemId.get(Number(item.id)) ?? [];
      rowInstruments.forEach((instrument) => {
        const key = instrument.name.toLowerCase();
        if (map.has(key)) return;
        map.set(key, { value: key, label: instrument.name });
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'id-ID')
    );
  }, [items, instrumentsByItemId]);

  const screeningCounts = useMemo<Record<ScreeningTabKey, number>>(() => {
    const counts: Record<ScreeningTabKey, number> = {
      all: items.length,
      new: 0,
      reviewed: 0,
    };
    items.forEach((item) => {
      counts[getScreeningTabKey(item)] += 1;
    });
    return counts;
  }, [items]);

  const visibleItems = useMemo(() => {
    if (!isScreeningQueue) return items;

    const keyword = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const itemTab = getScreeningTabKey(item);
      if (screeningTab !== 'all' && itemTab !== screeningTab) return false;

      if (keyword) {
        const haystack = [
          item.nama,
          item.user?.nama,
          item.user?.nama_panggilan,
          item.email,
        ]
          .map((value) => String(value || '').toLowerCase())
          .filter(Boolean);
        if (!haystack.some((value) => value.includes(keyword))) return false;
      }

      if (instrumentFilter !== 'all') {
        const rowInstruments = instrumentsByItemId.get(Number(item.id)) ?? [];
        if (!rowInstruments.some((instrument) => instrument.name.toLowerCase() === instrumentFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [isScreeningQueue, items, searchQuery, screeningTab, instrumentFilter, instrumentsByItemId]);

  const total = visibleItems.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleItems.slice(start, start + PAGE_SIZE);
  }, [visibleItems, currentPage]);

  const openModal = (mode: ApproveMode, row: GuruApplicationDTO) => {
    const isSameSelection = Number(selected?.id ?? 0) === Number(row.id);
    setSelected(row);
    setModalMode(mode);
    setModalOpen(true);
    if (!isSameSelection) setRevisionDrafts({});
    if (mode === 'approved') {
      setCertDrafts({});
      setEduDrafts({});
      setAwardDrafts({});
    }
  };

  const openCertificationOffer = (row: GuruApplicationDTO) => {
    setSelected(row);
    setCertOfferReason('');
    setCertCriteria(emptyCertificationCriteria);
    setCertOfferOpen(true);
  };

  const revisionSelected = useMemo(
    () =>
      Object.keys(revisionDrafts).reduce<Record<string, true>>((acc, key) => {
        acc[key] = true;
        return acc;
      }, {}),
    [revisionDrafts]
  );

  const pickedRevisionFields = useMemo(
    () =>
      Object.keys(revisionDrafts).map((k) => ({
        field_key: k,
        label: revisionDrafts[k]?.label || getRevisionFieldLabel(k),
      })),
    [revisionDrafts],
  );

  const applyDrafts = (items: CertificateItem[]) =>
    items.map((item) => {
      const draft = certDrafts[String(item.id)];
      return {
        ...item,
        draftStatus: draft?.status ?? null,
        draftReason: draft?.reason ?? null,
      };
    });

  const buildCertDecisions = (items: CertificateItem[]) =>
    items.reduce<
      Array<{
        id: string | number;
        status: 'approved' | 'rejected';
        alasan_penolakan?: string | null;
      }>
    >((acc, item) => {
      const draft = certDrafts[String(item.id)];
      if (!draft) return acc;
      if (draft?.status === 'approved') {
        acc.push({ id: item.id, status: 'approved' });
        return acc;
      }
      if (draft?.status === 'revision') return acc;
      acc.push({
        id: item.id,
        status: 'rejected',
        alasan_penolakan: draft?.reason ?? 'Ditolak oleh sistem',
      });
      return acc;
    }, []);

  const certItems = useMemo(
    () => buildCertificatesFromApplication(selected),
    [selected]
  );

  const hasInstrumentCerts = certItems.length > 0;
  const totalInstrumentCerts = certItems.length;

  const decidedInstrumentDraftCount = useMemo(
    () =>
      certItems.filter((item) => {
        const status = certDrafts[String(item.id)]?.status;
        return status === 'approved' || status === 'rejected';
      }).length,
    [certItems, certDrafts]
  );

  const selectedLanguages = useMemo(() => {
    const a = Array.isArray(selected?.bahasa) ? selected?.bahasa : [];
    const b = Array.isArray(selected?.user?.detailGuru?.bahasa)
      ? (selected?.user?.detailGuru?.bahasa as any[])
      : [];
    const merged = [...a, ...b];
    return normalizeLanguages(merged);
  }, [selected]);

  const selectedAwardList = useMemo<AwardCertificateData[]>(() => {
    if (!Array.isArray(selected?.sertifikat_penghargaan)) return [];
    return selected.sertifikat_penghargaan.map((a) => ({
      id: a.id ?? null,
      judul_penghargaan: a.judul_penghargaan ?? null,
      penyelenggara: a.penyelenggara ?? null,
      detail_penghargaan: a.detail_penghargaan ?? null,
      instrument_id: a.instrument_id ?? null,
      instrument: a.instrument ?? null,
      files: Array.isArray((a as any).files) ? (a as any).files : null,
      video_url: a.video_url ?? null,
    }));
  }, [selected]);

  const selectedEducationList = useMemo<EducationCertificateData[]>(() => {
    if (!Array.isArray(selected?.pendidikan_guru)) return [];
    return selected.pendidikan_guru.map((e) => ({
      id: e.id ?? null,
      nama_kampus: e.nama_kampus ?? null,
      major_instrument_id: e.major_instrument_id ?? null,
      minor_instrument_id: e.minor_instrument_id ?? null,
      majorInstrument: e.majorInstrument ?? null,
      minorInstrument: e.minorInstrument ?? null,
      url_sertifikat_kelulusan: e.url_sertifikat_kelulusan ?? null,
      video_url: e.video_url ?? null,
    }));
  }, [selected]);

  const awardListWithDrafts = useMemo(
    () =>
      selectedAwardList.map((a) => ({
        ...a,
        draftStatus: a.id != null ? awardDrafts[String(a.id)] ?? null : null,
      })),
    [selectedAwardList, awardDrafts]
  );

  const educationListWithDrafts = useMemo(
    () =>
      selectedEducationList.map((e) => ({
        ...e,
        draftStatus: e.id != null ? eduDrafts[String(e.id)] ?? null : null,
      })),
    [selectedEducationList, eduDrafts]
  );

  const totalAwards = awardListWithDrafts.length;
  const decidedAwardCount = awardListWithDrafts.filter(
    (a) => a.draftStatus === 'approved' || a.draftStatus === 'rejected'
  ).length;
  const totalEducation = educationListWithDrafts.length;
  const decidedEducationCount = educationListWithDrafts.filter(
    (e) => e.draftStatus === 'approved' || e.draftStatus === 'rejected'
  ).length;

  // Panggil endpoint APPROVE/REJECT via thunk + tampilkan LoadingScreen
  const handleSubmitModal = async (payload: ApproveTeacherPayload) => {
    if (!selected) return;
    setModalOpen(false);
    setDeciding(true);
    setConfirmErrorText(null);

    try {
      if (payload.mode === 'approved') {
        const cert_decisions = buildCertDecisions(certItems);
        const hasAltCerts =
          (Array.isArray(selected?.pendidikan_guru) &&
            selected.pendidikan_guru.length > 0) ||
          (Array.isArray(selected?.sertifikat_penghargaan) &&
            selected.sertifikat_penghargaan.length > 0);
        const education_decisions = educationListWithDrafts
          .filter(
            (e) =>
              e.id != null &&
              (e.draftStatus === 'approved' || e.draftStatus === 'rejected')
          )
          .map((e) => ({
            id: e.id as number | string,
            status:
              e.draftStatus === 'approved'
                ? ('approved' as const)
                : ('rejected' as const),
          }));
        const award_decisions = awardListWithDrafts
          .filter(
            (a) =>
              a.id != null &&
              (a.draftStatus === 'approved' || a.draftStatus === 'rejected')
          )
          .map((a) => ({
            id: a.id as number | string,
            status:
              a.draftStatus === 'approved'
                ? ('approved' as const)
                : ('rejected' as const),
          }));

        if (hasInstrumentCerts && cert_decisions.length !== totalInstrumentCerts) {
          throw new Error('Semua sertifikat instrumen harus diputuskan');
        }
        if (totalEducation > 0 && decidedEducationCount !== totalEducation) {
          throw new Error('Semua sertifikat pendidikan harus diputuskan');
        }
        if (totalAwards > 0 && decidedAwardCount !== totalAwards) {
          throw new Error('Semua sertifikat penghargaan harus diputuskan');
        }
        if (!hasInstrumentCerts && !hasAltCerts) {
          throw new Error('Minimal 1 sertifikat harus tersedia');
        }
        await decideApplication(selected.id, {
          decision: 'approve',
          cert_decisions: hasInstrumentCerts ? cert_decisions : [],
          education_decisions,
          award_decisions,
        });
      } else {
        const reason =
          (payload as any)?.reason ||
          (payload as any)?.notes ||
          'Ditolak oleh admin';
        await decideApplication(selected.id, { decision: 'reject', note: reason });
      }
      setConfirmKind('success');
      setHiddenIds((prev) =>
        selected?.id ? { ...prev, [Number(selected.id)]: true } : prev
      );
      await reload();
    } catch (err: any) {
      setConfirmKind('error');
      setConfirmErrorText(String(err?.message || 'Request failed'));
    } finally {
      setConfirmCtx(payload.mode);
      setSelected(null);
      setDeciding(false);
      setConfirmOpen(true);
    }
  };

  const handleCertificationOfferSubmit = async () => {
    if (!selected) return;
    const allCriteriaChecked = Object.values(certCriteria).every(Boolean);
    if (!allCriteriaChecked) {
      setConfirmKind('error');
      setConfirmCtx('certification');
      setConfirmErrorText('Semua kriteria sertifikasi wajib dicentang.');
      setConfirmOpen(true);
      return;
    }
    if (!certOfferReason.trim()) {
      setConfirmKind('error');
      setConfirmCtx('certification');
      setConfirmErrorText('Alasan penawaran sertifikasi wajib diisi.');
      setConfirmOpen(true);
      return;
    }

    setCertOfferOpen(false);
    setDeciding(true);
    setConfirmErrorText(null);
    try {
      await decideApplication(selected.id, {
        decision: 'offer_certification',
        note: certOfferReason.trim(),
        certification_criteria: certCriteria,
      });
      setConfirmKind('success');
      setHiddenIds((prev) =>
        selected?.id ? { ...prev, [Number(selected.id)]: true } : prev
      );
      await reload();
    } catch (err: any) {
      setConfirmKind('error');
      setConfirmErrorText(String(err?.message || 'Request failed'));
    } finally {
      setConfirmCtx('certification');
      setSelected(null);
      setDeciding(false);
      setConfirmOpen(true);
    }
  };

  const confirmTitle =
    confirmCtx === 'certification'
      ? confirmKind === 'success'
        ? 'Sertifikasi berhasil ditawarkan.'
        : 'Gagal menawarkan sertifikasi'
      : confirmCtx === 'approved'
      ? confirmKind === 'success'
        ? 'Tutor berhasil disetujui.'
        : 'Gagal menyetujui tutor'
      : confirmKind === 'success'
      ? 'Tutor berhasil ditolak.'
      : 'Gagal menolak tutor';

  const confirmTexts =
    confirmCtx === 'certification'
      ? confirmKind === 'success'
        ? ['Kandidat dipindahkan ke jalur sertifikasi dan tidak muncul di screening utama.']
        : [
            confirmErrorText ||
              'Terjadi kendala saat menawarkan sertifikasi. Silakan coba lagi.',
          ]
      : confirmCtx === 'approved'
      ? confirmKind === 'success'
        ? [
            'Tutor ini kini resmi terdaftar di platform dan sudah dapat menerima murid.',
          ]
        : [
            confirmErrorText ||
              'Terjadi kendala saat menyetujui tutor ini. Silakan coba lagi beberapa saat lagi.',
          ]
      : confirmKind === 'success'
      ? [
          'Tutor ini tidak akan muncul di daftar calon tutor dan tidak dapat mengajar di platform.',
        ]
      : [
          confirmErrorText ||
            'Terjadi kendala saat menolak tutor ini. Silakan coba lagi beberapa saat lagi.',
        ];

  return (
    <div
      className={cls(
        'rounded-[28px] p-4 sm:p-6',
        isScreeningQueue ? 'bg-white' : 'bg-white'
      )}
    >
      {deciding && <LoadingScreen />}

      {isScreeningQueue ? (
        <>
          <PageTitle
            title={title}
            actions={
              <ScreeningToolbar
                searchQuery={searchQuery}
                instrumentFilter={instrumentFilter}
                instrumentOptions={instrumentOptions}
                onSearchQueryChange={setSearchQuery}
                onInstrumentFilterChange={setInstrumentFilter}
              />
            }
          />
          <ScreeningTabs
            activeTab={screeningTab}
            counts={screeningCounts}
            onChange={setScreeningTab}
          />
        </>
      ) : (
        <>
          <PageTitle title={title} />
          <button
            type="button"
            onClick={() => navigate('/dashboard-admin/verified-tutor')}
            className="mb-4 h-10 rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 cursor-pointer hover:bg-neutral-50"
          >
            Kembali ke Verified Tutor
          </button>
        </>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {isScreeningQueue ? (
        <div className="overflow-hidden rounded-[26px] bg-white p-3  sm:p-4">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full border-separate border-spacing-y-3">
              <ScreeningTableHeader />
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="rounded-[22px] bg-white p-6 text-sm text-neutral-600">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading && visibleItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="rounded-[22px] bg-white p-8 text-center text-neutral-600">
                      Belum ada calon tutor yang sesuai filter.
                    </td>
                  </tr>
                )}

                {!loading &&
                  pageRows.map((row) => (
                    <ScreeningRowItem
                      key={row.id}
                      row={row}
                      instruments={instrumentsByItemId.get(Number(row.id)) ?? []}
                      onReview={() => openModal('approved', row)}
                    />
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center">
            <Pagination
              total={total}
              totalPages={totalPages}
              page={currentPage}
              pageSize={PAGE_SIZE}
              onChange={(p) => setPage(p)}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-white">
            <table className="w-full">
              <LegacyTableHeader />
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="p-6 text-sm text-neutral-600">
                      Memuat data...
                    </td>
                  </tr>
                )}

                {!loading && visibleItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-neutral-600">
                      Belum ada pendaftar.
                    </td>
                  </tr>
                )}

                {!loading &&
                  pageRows.map((row) => (
                    <LegacyRowItem
                      key={row.id}
                      row={row}
                      onApprove={() => openModal('approved', row)}
                      onRevision={() => openModal('revision', row)}
                      onCertification={() => openCertificationOffer(row)}
                      revisionQueue={queue === 'revision'}
                      certificationQueue={
                        queue === 'certification' ||
                        queue === 'certification_offer' ||
                        queue === 'manual_certification'
                      }
                      hideRevisionAction={
                        queue === 'certification_offer' ||
                        queue === 'manual_certification'
                      }
                      onOpenRevisionDetail={() => {
                        setRevisionDetailApp({ id: Number(row.id), name: row.nama ?? undefined });
                        setRevisionDetailOpen(true);
                      }}
                    />
                  ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center">
            <Pagination
              total={total}
              totalPages={totalPages}
              page={currentPage}
              pageSize={PAGE_SIZE}
              onChange={(p) => setPage(p)}
            />
          </div>
        </>
      )}

      {/* Modal Approve / Reject */}
      <ApproveTeacherModal
        open={modalOpen}
        inactive={revisionComposerOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitModal}
        onRejectFromReview={
          modalMode === 'approved'
            ? () => {
                setRevisionDrafts({});
                setModalMode('rejected');
              }
            : undefined
        }
        onRevisionFromReview={
          modalMode === 'approved' && isScreeningQueue
            ? () => {
                setModalMode('revision');
              }
            : undefined
        }
        onOfferCertificationFromReview={
          modalMode === 'approved' && isScreeningQueue
            ? () => {
                if (!selected) return;
                setModalOpen(false);
                openCertificationOffer(selected);
              }
            : undefined
        }
        approveDisabled={
          modalMode === 'approved' &&
          ((selected?.has_pending_revision === true) ||
            (revisionSelected && Object.keys(revisionSelected).length > 0) ||
            (hasInstrumentCerts && decidedInstrumentDraftCount !== totalInstrumentCerts) ||
            (totalEducation > 0 && decidedEducationCount !== totalEducation) ||
            (totalAwards > 0 && decidedAwardCount !== totalAwards))
        }
        approveDisabledHint={
          selected?.has_pending_revision === true
            ? 'Masih menunggu perbaikan data dari tutor (pending revisi).'
            : revisionSelected && Object.keys(revisionSelected).length > 0
            ? 'Tidak bisa menyetujui jika masih ada field yang ditandai perlu revisi. Kirim Laporan Kesalahan dulu atau hilangkan tanda revisi.'
            : 'Semua sertifikat instrumen, pendidikan, dan penghargaan harus diputuskan.'
        }
        data={{
          image: resolveImageUrl(selected?.user?.profile_pic_url ?? null) || defaultUser,
          name: selected?.nama ?? undefined,
          short_name: selected?.user?.nama_panggilan ?? undefined,
          email: selected?.email ?? undefined,
          phone: selected?.no_telp ?? undefined,
          province:
            selected?.domisili_provinsi ??
            selected?.user?.province ??
            undefined,
          city: selected?.domisili ?? selected?.user?.city ?? '-',
          address: selected?.user?.alamat ?? undefined,
          home_lat: selected?.user?.home_lat ?? undefined,
          home_lng: selected?.user?.home_lng ?? undefined,
          videoUrl: selected?.user?.detailGuru?.intro_link ?? undefined,
          cvUrl: selected?.cv_url ?? undefined,
          certificateUrl: selected?.portfolio_url ?? undefined,
          awardCertificateUrl:
            selected?.sertifikat_penghargaan_url ?? undefined,
          certificates: applyDrafts(certItems),
          languages: selectedLanguages,
          classInfo: {
            title: selected?.judul_kelas ?? undefined,
            about: selected?.tentang_kelas ?? undefined,
            values:
              (Array.isArray(selected?.value_kelas)
                ? selected?.value_kelas
                : selected?.user?.detailGuru?.value_teacher) ?? undefined,
          },
          awardList: awardListWithDrafts,
          educationList: educationListWithDrafts,
          screeningState: selected?.screening_state,
          revisionCount: selected?.revision_count,
          screeningNote: selected?.screening_note,
          revisedFieldKeys:
            selected?.screening_state === 'revision_resubmitted'
              ? extractRevisionFieldKeys(selected?.screening_meta)
              : [],
        }}
        onOpenCertificates={(opts) => {
          const all = applyDrafts(certItems);
          let filtered = all;
          if (opts?.instrumentName) {
            const key = opts.instrumentName.toLowerCase();
            filtered = all.filter(
              (c) => c.instrument.toLowerCase() === key
            );
            setCertModalTitle(`Sertifikat ${opts.instrumentName}`);
          } else {
            setCertModalTitle('Kelola Sertifikat');
          }
          setCertModalItems(filtered);
          setDetailReadOnly(!!opts?.readOnly);
          setCertModalOpen(true);
        }}
        onOpenCertificateDetail={(item) => {
          setCertModalTitle(item.title || 'Detail Sertifikat');
          setCertModalItems([item]);
          setCertModalOpen(true);
        }}
        onOpenEducationDetail={(edu, opts) => {
          setEduModalData(edu);
          setDetailReadOnly(!!opts?.readOnly);
          setEduModalOpen(true);
        }}
        onOpenAwardDetail={(award, opts) => {
          setAwardModalData(award);
          setDetailReadOnly(!!opts?.readOnly);
          setAwardModalOpen(true);
        }}
        revisionSelected={
          isScreeningQueue && (modalMode === 'approved' || modalMode === 'revision')
            ? revisionSelected
            : undefined
        }
        revisionDrafts={
          isScreeningQueue && (modalMode === 'approved' || modalMode === 'revision')
            ? revisionDrafts
            : undefined
        }
        onSaveRevisionDraft={
          isScreeningQueue && (modalMode === 'approved' || modalMode === 'revision')
            ? (field_key, label, draft) => {
                const key = String(field_key || '').trim();
                if (!key) return;
                setRevisionDrafts((prev) => ({
                  ...prev,
                  [key]: {
                    label,
                    message: draft.message ?? '',
                    templateId: draft.templateId ?? null,
                  },
                }));
              }
            : undefined
        }
        onDeleteRevisionDraft={
          isScreeningQueue && (modalMode === 'approved' || modalMode === 'revision')
            ? (field_key) => {
                const key = String(field_key || '').trim();
                if (!key) return;
                setRevisionDrafts((prev) => {
                  const next = { ...prev };
                  delete next[key];
                  return next;
                });
              }
            : undefined
        }
        onOpenRevisionComposer={
          modalMode === 'revision' ? () => setRevisionComposerOpen(true) : undefined
        }
      />

      <GuruRevisionComposerModal
        open={revisionComposerOpen && !!selected?.id}
        onClose={() => setRevisionComposerOpen(false)}
        applicationId={selected?.id ?? 0}
        applicationName={selected?.nama ?? undefined}
        pickedFields={pickedRevisionFields}
        initialMessages={Object.keys(revisionDrafts).reduce<Record<string, string>>((acc, key) => {
          acc[key] = String(revisionDrafts[key]?.message || '');
          return acc;
        }, {})}
        initialTemplateIds={Object.keys(revisionDrafts).reduce<Record<string, string>>((acc, key) => {
          acc[key] = String(revisionDrafts[key]?.templateId || '');
          return acc;
        }, {})}
        resetKey={modalOpen && selected?.id ? selected.id : 'closed'}
        onSent={async () => {
          const sentId = selected?.id ? Number(selected.id) : null;
          setRevisionDrafts({});
          setModalOpen(false);
          if (sentId) setHiddenIds((prev) => ({ ...prev, [sentId]: true }));
          await reload();
          setSelected(null);
        }}
      />

      <GuruRevisionDetailModal
        open={revisionDetailOpen && !!revisionDetailApp?.id}
        onClose={() => {
          setRevisionDetailOpen(false);
          setRevisionDetailApp(null);
        }}
        applicationId={revisionDetailApp?.id ?? 0}
        applicationName={revisionDetailApp?.name}
      />

      {certOfferOpen && selected ? (
        <div className="fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-[#0B1220]/60" onClick={() => setCertOfferOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Tawarkan Ujian Sertifikasi
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    {selected.nama} akan dipindahkan ke jalur sertifikasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCertOfferOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-neutral-100"
                >
                  <RiCloseLine className="text-xl" />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {CERTIFICATION_CRITERIA_OPTIONS.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 text-sm text-neutral-800"
                  >
                    <input
                      type="checkbox"
                      checked={certCriteria[item.key]}
                      onChange={(event) =>
                        setCertCriteria((prev) => ({
                          ...prev,
                          [item.key]: event.target.checked,
                        }))
                      }
                      className="mt-1"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>

              <textarea
                value={certOfferReason}
                onChange={(event) => setCertOfferReason(event.target.value)}
                placeholder="Jelaskan alasan singkat dan next step untuk kandidat"
                className="mt-4 min-h-[110px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[var(--secondary-color)]"
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCertOfferOpen(false)}
                  className="h-10 rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-900"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCertificationOfferSubmit}
                  className="h-10 rounded-lg bg-[var(--primary-color)] px-4 text-sm font-semibold text-neutral-900"
                >
                  Kirim Penawaran
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal konfirmasi approve/reject aplikasi */}
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        icon={
          confirmKind === 'success' ? (
            <RiCheckboxCircleFill />
          ) : (
            <RiCloseLine />
          )
        }
        iconTone={confirmKind === 'success' ? 'success' : 'danger'}
        title={confirmTitle}
        texts={confirmTexts}
      />

      {/* Modal kelola/pratinjau sertifikat – READ ONLY di halaman ini */}
      <ManageCertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        certificates={certModalItems}
        title={certModalTitle}
        initialItemId={certModalItems.length === 1 ? certModalItems[0].id : undefined}
        initialPhase={certModalItems.length === 1 ? 'detail' : 'list'}
        canDecide={!detailReadOnly}
        decisionMode="draft"
        onDraftChange={(item, payload) => {
          if (payload.status === 'revision') {
            setCertModalOpen(false);
            setRevNoteCtx({
              type: 'cert',
              id: item.id,
              instrumentName: item.instrument,
              instrumentIcon: item.instrumentIcon,
              certItem: item,
            });
            setRevNoteText('');
            setRevNoteOpen(true);
            return;
          }
          setCertDrafts((prev) => ({
            ...prev,
            [String(item.id)]: {
              status: payload.status,
              reason: payload.reason ?? null,
            },
          }));
          setCertModalItems((prev) =>
            prev.map((c) =>
              String(c.id) === String(item.id)
                ? {
                    ...c,
                    draftStatus: payload.status,
                    draftReason: payload.reason ?? null,
                  }
              : c
            )
          );
        }}
        onDraftReset={(item) => {
          const key = String(item.id);
          setCertDrafts((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
          setCertModalItems((prev) =>
            prev.map((c) =>
              String(c.id) === key
                ? {
                    ...c,
                    draftStatus: null,
                    draftReason: null,
                  }
                : c
            )
          );
        }}
      />

      <EducationCertificateModal
        isOpen={eduModalOpen}
        onClose={() => setEduModalOpen(false)}
        data={eduModalData}
        decisionStatus={
          eduModalData?.id != null
            ? eduDrafts[String(eduModalData.id)] ?? null
            : null
        }
        onDecisionChange={detailReadOnly ? undefined : (status) => {
          if (eduModalData?.id == null) return;
          if (status === 'revision') {
            setEduModalOpen(false);
            setRevNoteCtx({
              type: 'education',
              id: eduModalData.id,
              instrumentName: eduModalData.majorInstrument?.nama_instrumen || '-',
              instrumentIcon: eduModalData.majorInstrument?.icon
                ? resolveImageUrl(eduModalData.majorInstrument.icon) || undefined
                : undefined,
            });
            setRevNoteText('');
            setRevNoteOpen(true);
            return;
          }
          const key = String(eduModalData.id);
          setEduDrafts((prev) => {
            if (status == null) {
              const next = { ...prev };
              delete next[key];
              return next;
            }
            return {
              ...prev,
              [key]: status,
            };
          });
        }}
      />
      <AwardCertificateModal
        isOpen={awardModalOpen}
        onClose={() => setAwardModalOpen(false)}
        data={awardModalData}
        decisionStatus={
          awardModalData?.id != null
            ? awardDrafts[String(awardModalData.id)] ?? null
            : null
        }
        onDecisionChange={detailReadOnly ? undefined : (status) => {
          if (awardModalData?.id == null) return;
          if (status === 'revision') {
            setAwardModalOpen(false);
            setRevNoteCtx({
              type: 'award',
              id: awardModalData.id,
              instrumentName: awardModalData.instrument?.nama_instrumen || awardModalData.judul_penghargaan || '-',
              instrumentIcon: awardModalData.instrument?.icon
                ? resolveImageUrl(awardModalData.instrument.icon) || undefined
                : undefined,
            });
            setRevNoteText('');
            setRevNoteOpen(true);
            return;
          }
          const key = String(awardModalData.id);
          setAwardDrafts((prev) => {
            if (status == null) {
              const next = { ...prev };
              delete next[key];
              return next;
            }
            return {
              ...prev,
              [key]: status,
            };
          });
        }}
      />

      {/* Modal keterangan revisi per instrumen */}
      {revNoteOpen && revNoteCtx && (
        <InstrumentRevisionNoteModal
          ctx={revNoteCtx}
          message={revNoteText}
          onMessageChange={setRevNoteText}
          templates={revNoteTemplates}
          templatesLoading={revNoteTemplatesLoading}
          selectedTemplateId={revNoteTemplateId}
          onSelectedTemplateIdChange={setRevNoteTemplateId}
          onClose={() => { setRevNoteOpen(false); setRevNoteCtx(null); }}
          onSave={(reason) => {
            if (!revNoteCtx) return;
            const key = String(revNoteCtx.id);

            if (revNoteCtx.type === 'cert') {
              setCertDrafts((prev) => ({
                ...prev,
                [key]: { status: 'revision', reason },
              }));
              setCertModalItems((prev) =>
                prev.map((c) =>
                  String(c.id) === key
                    ? { ...c, draftStatus: 'revision' as const, draftReason: reason }
                    : c
                )
              );
            } else if (revNoteCtx.type === 'education') {
              setEduDrafts((prev) => ({ ...prev, [key]: 'revision' }));
            } else if (revNoteCtx.type === 'award') {
              setAwardDrafts((prev) => ({ ...prev, [key]: 'revision' }));
            }

            setRevNoteOpen(false);
            setRevNoteCtx(null);
            setRevNoteText('');
            setRevNoteTemplateId('');
          }}
        />
      )}
    </div>
  );
};

const VerifiedTutorPage: React.FC = () => <VerifiedTutorPageContent />;

export default VerifiedTutorPage;
