/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  RiFileList2Line,
  RiSearchLine,
  RiEyeFill,
  RiCheckboxCircleFill,
  RiCloseLine,
} from 'react-icons/ri';
import defaultUser from '@/assets/images/default-user.png';

import { useAppDispatch } from '@/app/hooks';
import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import ManageCertificateModal, {
  type CertificateItem,
  type CertStatus,
} from '@/features/dashboard/components/ManageCertificateModal';
import { patchSertifikatStatusThunk } from '@/features/slices/sertifikat/slice';
import { listPendingGuruSertifikat } from '@/services/api/sertifikat.api';
import { getInstrumentIcon } from '@/utils/getInstrumentIcon';
import { getStatusColor } from '@/utils/getStatusColor';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

type CertificateRequestRow = {
  id: string | number;
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

const mapCertStatus = (raw?: string | null): CertStatus => {
  const v = String(raw || '').toLowerCase();
  if (v === 'approved' || v === 'disetujui') return 'Disetujui';
  if (v === 'rejected' || v === 'tidak_disetujui' || v === 'ditolak')
    return 'Tidak Disetujui';
  return 'Menunggu Verifikasi'; // termasuk 'under_review'
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
  obj?.keterangan ?? obj?.title ?? obj?.certificate_title ?? 'Sertifikat';

const pickCertSchool = (obj: any) =>
  obj?.penyelenggara ?? obj?.school ?? obj?.institution ?? '-';

const pickCertLink = (obj: any) =>
  obj?.certif_path ?? obj?.certificate_path ?? obj?.link ?? null;

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
  const certLinkRaw = pickCertLink(src) ?? pickCertLink(base);
  const certLink = resolveImageUrl(certLinkRaw) ?? (certLinkRaw || undefined);

  return {
    id: src?.id ?? src?.sertifikat_id ?? base?.id ?? base?.sertifikat_id ?? '-',
    title: pickCertTitle(src),
    school: pickCertSchool(src),
    instrument: String(instrumentName ?? '-'),
    instrumentIcon,
    grade: String(gradeName ?? '-'),
    status: mapCertStatus(statusRaw),
    link: certLink,
    rejectReason: pickRejectReason(src),
  };
};

const CertificateInstrumentPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [rows, setRows] = useState<CertificateRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<CertificateItem[]>([]);
  const [modalTitle, setModalTitle] = useState('Kelola Sertifikat');

  const [approveResult, setApproveResult] = useState<null | 'ok' | 'fail'>(null);
  const [rejectResult, setRejectResult] = useState<null | 'ok' | 'fail'>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listPendingGuruSertifikat();
      const list = Array.isArray(res?.data) ? res.data : [];
      const rowsBuilt: CertificateRequestRow[] = list.map((item: any) => {
        const certificate = toCertificateItem(item, item);
        return {
          id: certificate.id ?? item?.id ?? '-',
          userName: String(pickUserName(item)),
          userAvatar: pickUserAvatar(item),
          instrumentName: certificate.instrument ?? '-',
          instrumentIcon: certificate.instrumentIcon,
          gradeName: certificate.grade ?? '-',
          statusLabel: certificate.status ?? 'Menunggu Verifikasi',
          certificates: [certificate],
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

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.userName,
        r.instrumentName,
        r.gradeName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const openDetail = (row: CertificateRequestRow) => {
    setModalItems(row.certificates);
    setModalTitle(`Sertifikat ${row.userName}`);
    setModalOpen(true);
  };

  const handleApproveCertificate = async (item: CertificateItem) => {
    try {
      await dispatch(
        patchSertifikatStatusThunk({ id: item.id, status: 'approved' })
      ).unwrap();
      setModalOpen(false);
      setApproveResult('ok');
      await loadData();
    } catch {
      setApproveResult('fail');
    }
  };

  const handleRejectSubmit = async (item: CertificateItem, payload: { reason: string }) => {
    try {
      await dispatch(
        patchSertifikatStatusThunk({
          id: item.id,
          status: 'rejected',
          alasan_penolakan: payload.reason,
        })
      ).unwrap();
      setModalOpen(false);
      setRejectResult('ok');
      await loadData();
    } catch {
      setRejectResult('fail');
    }
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
                <th className="py-3 px-3 font-semibold">Instrumen</th>
                <th className="py-3 px-3 font-semibold">Grade</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 pr-4 pl-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                    Memuat data...
                  </td>
                </tr>
              )}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
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
        onApprove={handleApproveCertificate}
        onRejectSubmit={handleRejectSubmit}
      />

      {approveResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setApproveResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={approveResult === 'ok' ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={approveResult === 'ok' ? 'success' : 'danger'}
          title={
            approveResult === 'ok'
              ? 'Sertifikat Berhasil Disetujui'
              : 'Sertifikat Gagal Disetujui'
          }
          texts={
            approveResult === 'ok'
              ? ['Sertifikat berhasil disetujui.']
              : ['Terjadi kendala saat menyetujui sertifikat. Silakan coba lagi.']
          }
          button1={{
            label: 'Tutup',
            variant: 'primary',
            onClick: () => setApproveResult(null),
          }}
        />
      )}

      {rejectResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setRejectResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={rejectResult === 'ok' ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={rejectResult === 'ok' ? 'success' : 'danger'}
          title={
            rejectResult === 'ok'
              ? 'Laporan Penolakan Terkirim'
              : 'Gagal Mengirim Laporan'
          }
          texts={
            rejectResult === 'ok'
              ? ['Status sertifikat diperbarui menjadi Ditolak.']
              : ['Terjadi kendala saat menolak sertifikat. Silakan coba lagi.']
          }
          button1={{
            label: 'Tutup',
            variant: 'primary',
            onClick: () => setRejectResult(null),
          }}
        />
      )}
    </div>
  );
};

export default CertificateInstrumentPage;
