/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  RiFileList2Line,
  RiSearchLine,
  RiEyeFill,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiMusic2Line,
} from 'react-icons/ri';
import defaultUser from '@/assets/images/default-user.png';

import { useAppDispatch } from '@/app/hooks';
import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import ManageCertificateModal, {
  type CertificateItem,
  type CertStatus,
} from '@/features/dashboard/components/ManageCertificateModal';
import { patchSertifikatStatusThunk } from '@/features/slices/sertifikat/slice';
import {
  listRevisionTemplates,
  type RevisionTemplateDTO,
} from '@/services/api/revisionTemplate.api';
import { listPendingGuruSertifikat } from '@/services/api/sertifikat.api';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import { getStatusColor } from '@/utils/getStatusColor';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

type CertificateRequestRow = {
  id: string | number;
  activeCertificateId: string | number;
  certificateTitle: string;
  userName: string;
  userAvatar?: string | null;
  instrumentName: string;
  instrumentIcon?: string;
  gradeName: string;
  statusLabel: CertStatus;
  certificates: CertificateItem[];
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const pickFirstFilledText = (
  values: unknown[],
  fallback: string
): string => {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return fallback;
};

const CERTIFICATE_STATUS_SORT_ORDER: Record<CertStatus, number> = {
  'Menunggu Verifikasi': 0,
  Revisi: 1,
  Disetujui: 2,
  'Tidak Disetujui': 3,
};

type InstrumentRevisionNoteModalProps = {
  ctx: {
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

            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Pesan spesifik untuk memperbaiki kolom ini"
              className="min-h-[140px] w-full rounded-[18px] border border-[#D6E1EC] px-4 py-4 text-[15px] text-[#334155] outline-none transition focus:border-[var(--secondary-color)] resize-none"
            />

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

const mapCertStatus = (raw?: string | null, reason?: string | null): CertStatus => {
  const v = String(raw || '').toLowerCase();
  const note = String(reason || '').trim();
  if (v === 'approved' || v === 'disetujui') return 'Disetujui';
  if (v === 'rejected' || v === 'tidak_disetujui' || v === 'ditolak')
    return 'Tidak Disetujui';
  if (note) return 'Revisi';
  return 'Menunggu Verifikasi';
};

const pickStatus = (obj: any) =>
  obj?.status ??
  obj?.status_sertifikat ??
  obj?.status_instrumen ??
  obj?.certificate_status ??
  null;

const pickInstrumentName = (obj: any) =>
  obj?.instrument?.nama ??
  obj?.instrument?.nama_instrumen ??
  obj?.instrument_name ??
  obj?.instrument ??
  obj?.instrument_label ??
  null;

const pickInstrumentIcon = (obj: any) =>
  obj?.instrument?.icon ?? obj?.instrument_icon ?? null;

const pickGradeName = (obj: any) =>
  obj?.grade?.nama ??
  obj?.grade?.nama_grade ??
  obj?.grade_name ??
  obj?.grade ??
  null;

const pickCertTitle = (obj: any) =>
  pickFirstFilledText(
    [obj?.keterangan, obj?.title, obj?.certificate_title],
    'Sertifikat'
  );

const pickCertSchool = (obj: any) =>
  obj?.penyelenggara ?? obj?.school ?? obj?.institution ?? '-';

const pickCertLink = (obj: any) =>
  obj?.certif_path ?? obj?.certificate_path ?? obj?.link ?? null;

const pickCertYear = (obj: any) =>
  obj?.tahun_berlaku ?? obj?.tahun ?? obj?.year ?? null;

const pickCertType = (obj: any) =>
  obj?.tipe_sertifikat ?? obj?.tipe ?? obj?.cert_type ?? obj?.certificate_type ?? null;

const pickFiles = (obj: any) => obj?.files ?? obj?.file ?? obj?.lampiran ?? null;

const pickVideoClips = (obj: any) =>
  obj?.cuplikan_kelas_guru ?? obj?.cuplikan_kelas ?? obj?.video_instrumen ?? obj?.video_clips ?? null;

const pickRejectReason = (obj: any) =>
  obj?.alasan_penolakan ?? obj?.reject_reason ?? null;

const pickUserName = (obj: any) =>
  obj?.user?.nama ??
  obj?.guru?.nama ??
  obj?.detail_guru?.guru?.nama ??
  obj?.nama ??
  obj?.user_name ??
  '-';

const pickUserAvatar = (obj: any) =>
  resolveImageUrl(
    obj?.user?.profile_pic_url ??
      obj?.guru?.profile_pic_url ??
      obj?.detail_guru?.guru?.profile_pic_url ??
      obj?.profile_pic_url ??
      null
  ) ?? null;

const toCertificateItem = (obj: any, fallback?: any): CertificateItem => {
  const src = obj ?? {};
  const base = fallback ?? {};
  const instrumentName =
    pickInstrumentName(src) ?? pickInstrumentName(base) ?? '-';
  const instrumentIconRaw =
    pickInstrumentIcon(src) ?? pickInstrumentIcon(base) ?? null;
  const instrumentIcon =
    resolveImageUrl(instrumentIconRaw) ||
    (instrumentName && instrumentName !== '-'
      ? getInstrumentIcon(String(instrumentName).toLowerCase())
      : undefined);

  const gradeName = pickGradeName(src) ?? pickGradeName(base) ?? '-';
  const statusRaw = pickStatus(src) ?? pickStatus(base);
  const rejectReason = pickRejectReason(src) ?? pickRejectReason(base);

  const rawFiles = pickFiles(src) ?? pickFiles(base);
  const filesArr = Array.isArray(rawFiles) ? rawFiles : [];
  const files: CertificateItem['files'] = filesArr.map((f: any) => ({
    id: f?.id ?? null,
    file_url: f?.file_url ?? f?.url ?? f?.path ?? null,
    file_mime: f?.file_mime ?? f?.mime ?? f?.mimetype ?? null,
    created_at: f?.created_at ?? null,
  }));

  const certLinkRaw =
    files?.[0]?.file_url ?? (pickCertLink(src) ?? pickCertLink(base));
  const certLink = resolveImageUrl(certLinkRaw) ?? (certLinkRaw || undefined);

  const rawClips = pickVideoClips(src) ?? pickVideoClips(base);
  const clipsArr = Array.isArray(rawClips) ? rawClips : [];
  const videoClips: CertificateItem['videoClips'] = clipsArr.map((v: any) => ({
    id: v?.id ?? null,
    title: v?.title ?? null,
    description: v?.deskripsi ?? v?.description ?? null,
    link: v?.link ?? v?.url ?? v?.video_url ?? null,
  }));

  const yearRaw = pickCertYear(src) ?? pickCertYear(base);
  const year =
    typeof yearRaw === 'number'
      ? yearRaw
      : yearRaw
        ? Number(yearRaw)
        : undefined;
  const certTypeRaw = String(pickCertType(src) ?? pickCertType(base) ?? '').toLowerCase();
  const certType =
    certTypeRaw === 'international' || certTypeRaw === 'internasional'
      ? 'Internasional'
      : certTypeRaw === 'local' || certTypeRaw === 'lokal'
        ? 'Lokal'
        : certTypeRaw
          ? certTypeRaw.charAt(0).toUpperCase() + certTypeRaw.slice(1)
          : undefined;

  return {
    id: src?.id ?? src?.sertifikat_id ?? base?.id ?? base?.sertifikat_id ?? '-',
    title: pickCertTitle(src),
    school: pickCertSchool(src),
    instrument: String(instrumentName ?? '-'),
    instrumentIcon,
    grade: String(gradeName ?? '-'),
    status: mapCertStatus(statusRaw, rejectReason),
    link: certLink,
    year: Number.isFinite(year as number) ? (year as number) : undefined,
    certType,
    files: files.length ? files : undefined,
    videoClips: videoClips.length ? videoClips : undefined,
    rejectReason,
  };
};

const buildGuruCertificateItems = (obj: any): CertificateItem[] => {
  const rawList =
    Array.isArray(obj?.guru_certificates) && obj.guru_certificates.length
      ? obj.guru_certificates
      : [obj];
  const unique = new Map<string, CertificateItem>();

  rawList.forEach((row: any) => {
    const item = toCertificateItem(row, row);
    unique.set(String(item.id), item);
  });

  return Array.from(unique.values());
};

const sortCertificatesForModal = (
  certificates: CertificateItem[],
  activeCertificateId: string | number
) =>
  [...certificates].sort((a, b) => {
    const aActive = String(a.id) === String(activeCertificateId);
    const bActive = String(b.id) === String(activeCertificateId);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;

    const statusDelta =
      (CERTIFICATE_STATUS_SORT_ORDER[a.status] ?? 99) -
      (CERTIFICATE_STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDelta !== 0) return statusDelta;

    return String(a.instrument || '').localeCompare(String(b.instrument || ''), 'id-ID');
  });

const CertificateInstrumentPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [rows, setRows] = useState<CertificateRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<CertificateItem[]>([]);
  const [modalTitle, setModalTitle] = useState('Kelola Sertifikat');

  const [decisionResult, setDecisionResult] = useState<null | {
    kind: 'approved' | 'rejected' | 'revision';
    success: boolean;
  }>(null);
  const [revNoteOpen, setRevNoteOpen] = useState(false);
  const [revNoteText, setRevNoteText] = useState('');
  const [revNoteCtx, setRevNoteCtx] = useState<{
    id: string | number;
    instrumentName: string;
    instrumentIcon?: string;
  } | null>(null);
  const [revNoteTemplates, setRevNoteTemplates] = useState<RevisionTemplateDTO[]>([]);
  const [revNoteTemplateId, setRevNoteTemplateId] = useState('');
  const [revNoteTemplatesLoading, setRevNoteTemplatesLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listPendingGuruSertifikat();
      const list = Array.isArray(res?.data) ? res.data : [];
      const rowsBuilt: CertificateRequestRow[] = list.map((item: any) => {
        const certificate = toCertificateItem(item, item);
        const certificates = sortCertificatesForModal(
          buildGuruCertificateItems(item),
          certificate.id
        );
        return {
          id: certificate.id ?? item?.id ?? '-',
          activeCertificateId: certificate.id ?? item?.id ?? '-',
          certificateTitle: certificate.title ?? '-',
          userName: String(pickUserName(item)),
          userAvatar: pickUserAvatar(item),
          instrumentName: certificate.instrument ?? '-',
          instrumentIcon: certificate.instrumentIcon,
          gradeName: certificate.grade ?? '-',
          statusLabel: certificate.status ?? 'Menunggu Verifikasi',
          certificates,
        };
      });

      setRows(rowsBuilt);
    } catch (e: any) {
      setError(e?.message ?? 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!revNoteOpen || !revNoteCtx) return;
    let alive = true;
    setRevNoteTemplatesLoading(true);
    listRevisionTemplates({
      field_keys: ['certificates.instrument'],
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
    return () => {
      alive = false;
    };
  }, [revNoteOpen, revNoteCtx]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.userName,
        r.instrumentName,
        r.gradeName,
        ...r.certificates.flatMap((certificate) => [
          certificate.instrument,
          certificate.grade,
          certificate.title,
          certificate.school,
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const openDetail = (row: CertificateRequestRow) => {
    setModalItems(sortCertificatesForModal(row.certificates, row.activeCertificateId));
    setModalTitle(`Sertifikat ${row.userName}`);
    setModalOpen(true);
  };

  const closeRevisionNote = () => {
    setRevNoteOpen(false);
    setRevNoteCtx(null);
    setRevNoteText('');
    setRevNoteTemplateId('');
  };

  const showDecisionResult = (
    kind: 'approved' | 'rejected' | 'revision',
    success: boolean
  ) => {
    setDecisionResult({ kind, success });
  };

  const handleApproveCertificate = async (item: CertificateItem) => {
    try {
      await dispatch(
        patchSertifikatStatusThunk({ id: item.id, status: 'approved' })
      ).unwrap();
      setModalOpen(false);
      showDecisionResult('approved', true);
      await loadData();
    } catch {
      showDecisionResult('approved', false);
    }
  };

  const handleRejectCertificate = async (
    item: CertificateItem,
    reason?: string | null
  ) => {
    try {
      await dispatch(
        patchSertifikatStatusThunk({
          id: item.id,
          status: 'rejected',
          alasan_penolakan: reason?.trim() || null,
        })
      ).unwrap();
      setModalOpen(false);
      showDecisionResult('rejected', true);
      await loadData();
    } catch {
      showDecisionResult('rejected', false);
    }
  };

  const handleRevisionSubmit = async (reason: string) => {
    if (!revNoteCtx) return;
    try {
      await dispatch(
        patchSertifikatStatusThunk({
          id: revNoteCtx.id,
          status: 'under_review',
          alasan_penolakan: reason.trim() || null,
        })
      ).unwrap();
      closeRevisionNote();
      showDecisionResult('revision', true);
      await loadData();
    } catch {
      closeRevisionNote();
      showDecisionResult('revision', false);
    }
  };

  const handleDraftDecision = (
    item: CertificateItem,
    payload: { status: 'approved' | 'rejected' | 'revision'; reason?: string | null }
  ) => {
    if (payload.status === 'revision') {
      setModalOpen(false);
      setRevNoteCtx({
        id: item.id,
        instrumentName: item.instrument || '-',
        instrumentIcon: item.instrumentIcon,
      });
      setRevNoteText(item.rejectReason ?? payload.reason ?? '');
      setRevNoteTemplateId('');
      setRevNoteOpen(true);
      return;
    }

    if (payload.status === 'approved') {
      void handleApproveCertificate(item);
      return;
    }

    void handleRejectCertificate(item, payload.reason ?? null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--secondary-light-color)]">
              <RiFileList2Line size={22} className="text-[var(--secondary-color)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Certificate Instrument
              </h2>
              <p className="text-sm text-neutral-600">
                Daftar pengajuan sertifikat instrumen untuk disetujui
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-[320px]">
            <RiSearchLine
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau instrumen..."
              className="w-full h-11 rounded-xl border border-neutral-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="min-w-full text-md">
            <thead className="bg-neutral-100 text-neutral-800">
              <tr className="text-left">
                <th className="py-3 pl-4 pr-3 font-semibold">Profile</th>
                <th className="py-3 px-3 font-semibold">Nama</th>
                <th className="py-3 px-3 font-semibold">Nama Sertifikat</th>
                <th className="py-3 px-3 font-semibold">Instrumen</th>
                <th className="py-3 px-3 font-semibold">Grade</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 pr-4 pl-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-neutral-500">
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-neutral-500">
                    Tidak ada pengajuan.
                  </td>
                </tr>
              )}

              {!loading &&
                filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-200">
                    <td className="py-3 pl-4 pr-3">
                      <img
                        src={row.userAvatar || defaultUser}
                        alt={row.userName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="py-3 px-3 text-neutral-900">{row.userName}</td>
                    <td className="py-3 px-3 text-neutral-800">
                      <div
                        className="max-w-[220px] truncate"
                        title={row.certificateTitle}
                      >
                        {row.certificateTitle}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-2 text-neutral-800">
                        {row.instrumentIcon ? (
                          <img
                            src={row.instrumentIcon}
                            alt={row.instrumentName}
                            className="h-5 w-5 object-contain"
                          />
                        ) : null}
                        <span>{row.instrumentName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-neutral-800">{row.gradeName}</td>
                    <td className={cls('py-3 px-3 font-medium', getStatusColor(row.statusLabel))}>
                      {row.statusLabel}
                    </td>
                    <td className="py-3 pr-4 pl-3">
                      <button
                        type="button"
                        onClick={() => openDetail(row)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--secondary-color)] px-3 py-2 text-sm text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                      >
                        <RiEyeFill />
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <ManageCertificateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        certificates={modalItems}
        title={modalTitle}
        initialItemId={modalItems.length === 1 ? modalItems[0].id : undefined}
        initialPhase={modalItems.length === 1 ? 'detail' : 'list'}
        decisionMode="draft"
        onDraftChange={handleDraftDecision}
      />

      {revNoteOpen && revNoteCtx && (
        <InstrumentRevisionNoteModal
          ctx={revNoteCtx}
          message={revNoteText}
          onMessageChange={setRevNoteText}
          templates={revNoteTemplates}
          templatesLoading={revNoteTemplatesLoading}
          selectedTemplateId={revNoteTemplateId}
          onSelectedTemplateIdChange={setRevNoteTemplateId}
          onClose={closeRevisionNote}
          onSave={handleRevisionSubmit}
        />
      )}

      {decisionResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setDecisionResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={decisionResult.success ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={decisionResult.success ? 'success' : 'danger'}
          title={
            decisionResult.kind === 'approved'
              ? decisionResult.success
                ? 'Sertifikat Berhasil Disetujui'
                : 'Sertifikat Gagal Disetujui'
              : decisionResult.kind === 'rejected'
                ? decisionResult.success
                  ? 'Sertifikat Berhasil Ditolak'
                  : 'Sertifikat Gagal Ditolak'
                : decisionResult.success
                  ? 'Permintaan Revisi Berhasil Dikirim'
                  : 'Permintaan Revisi Gagal Dikirim'
          }
          texts={
            decisionResult.kind === 'approved'
              ? decisionResult.success
                ? ['Sertifikat berhasil disetujui.']
                : ['Terjadi kendala saat menyetujui sertifikat. Silakan coba lagi.']
              : decisionResult.kind === 'rejected'
                ? decisionResult.success
                  ? ['Status sertifikat berhasil diperbarui menjadi Ditolak.']
                  : ['Terjadi kendala saat menolak sertifikat. Silakan coba lagi.']
                : decisionResult.success
                  ? ['Sertifikat berhasil dikembalikan ke status revisi.']
                  : ['Terjadi kendala saat mengirim revisi sertifikat. Silakan coba lagi.']
          }
          button1={{
            label: 'Tutup',
            variant: 'primary',
            onClick: () => setDecisionResult(null),
          }}
        />
      )}
    </div>
  );
};

export default CertificateInstrumentPage;
