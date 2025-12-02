/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/dashboard/pages/teacher/VerifiedTutorPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  RiUser2Fill,
  RiCheckFill,
  RiCloseFill,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckboxCircleFill,
  RiCloseLine,
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/store';

import {
  fetchGuruApplicationsThunk,
  setGAPage,
  setGALimit,
  setGAStatus,
  approveApplicationThunk,
  rejectApplicationThunk,
} from '@/features/slices/guruApplication/slice';
import type { GuruApplicationDTO } from '@/features/slices/guruApplication/types';

import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import ApproveTeacherModal, {
  type ApproveMode,
  type ApproveTeacherPayload,
} from '../../components/ApproveTeacherModal';
import LoadingScreen from '@/components/ui/common/LoadingScreen';
import defaultUser from '@/assets/images/default-user.png';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import ManageCertificateModal, {
  type CertificateItem,
  type CertStatus,
} from '@/features/dashboard/components/ManageCertificateModal';

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const PAGE_SIZE = 5;
const EMPTY_ARR: any[] = [];

/* ======================== Subcomponents (UI sama persis) ======================== */

const Header: React.FC = () => (
  <div className="flex items-center gap-3 mb-5">
    <div
      className="w-10 h-10 rounded-full grid place-items-center"
      style={{ backgroundColor: 'var(--primary-color)' }}
    >
      <RiUser2Fill size={25} className="text-black" />
    </div>
    <h2 className="text-lg font-semibold text-[#1C1C1C]">List Calon Tutor</h2>
  </div>
);

const TableHeader: React.FC = () => {
  const headCls =
    'text-md font-semibold text-neutral-900 p-4 text-left whitespace-nowrap';
  return (
    <thead>
      <tr className="bg-neutral-100">
        <th className={headCls}>Profile</th>
        <th className={headCls}>Nama Calon Tutor</th>
        <th className={headCls}>No Telepon</th>
        <th className={headCls}>Asal Kota</th>
        <th className={headCls}>Tanggal</th>
        <th className={headCls}>Mengajar ABK</th>
        <th className={headCls}>Aksi</th>
      </tr>
    </thead>
  );
};

const ActionButtons: React.FC<{
  onApprove?: () => void;
  onReject?: () => void;
}> = ({ onApprove, onReject }) => (
  <div className="flex items-center gap-4">
    <button
      type="button"
      onClick={onApprove}
      className="w-9 h-9 rounded-lg grid place-items-center bg-[var(--accent-green-light-color)] cursor-pointer"
      aria-label="Setujui"
      title="Setujui"
    >
      <RiCheckFill size={25} className="text-[#18A957]" />
    </button>

    <button
      type="button"
      onClick={onReject}
      className="grid place-items-center cursor-pointer"
      aria-label="Tolak"
      title="Tolak"
    >
      <RiCloseFill size={25} className="text-[#F14A7E]" />
    </button>
  </div>
);

const RowItem: React.FC<{
  row: GuruApplicationDTO;
  onApprove: () => void;
  onReject: () => void;
}> = ({ row, onApprove, onReject }) => {
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

  return (
    <tr>
      {/* Profile */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <img
            src={profileUrl}
            alt={row.nama}
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
      </td>

      {/* Nama */}
      <td className="py-3 px-4">
        <span className="text-[#202020] text-md">{row.nama}</span>
      </td>

      {/* Phone */}
      <td className="py-3 px-4">
        <span className="text-[#202020] text-md">{row.no_telp ?? '-'}</span>
      </td>

      {/* Kota */}
      <td className="py-3 px-4">
        <span className="text-[#202020] text-md">{row.domisili ?? '-'}</span>
      </td>

      {/* Tanggal */}
      <td className="py-3 px-4">
        <span className="text-[#202020] text-md">{createdAt}</span>
      </td>

      {/* Mengajar ABK */}
      <td className="py-3 px-4">
        <span className="text-md" style={{ color: abkColorVar }}>
          {abkLabel}
        </span>
      </td>

      {/* Aksi */}
      <td className="py-3 px-4">
        <ActionButtons onApprove={onApprove} onReject={onReject} />
      </td>
    </tr>
  );
};

const Pagination: React.FC<{
  total: number;
  page: number;
  onChange: (p: number) => void;
  pageSize?: number;
}> = ({ total, page, onChange, pageSize = PAGE_SIZE }) => {
  const pages = Math.ceil(Math.max(0, Number(total) || 0) / pageSize);

  const btnCls =
    'min-w-9 h-9 px-3 rounded-lg border border-[#E3E8EF] text-md text-[#202020] hover:bg-[#F5F7FA]';
  const arrowBtnCls =
    'w-9 h-9 grid place-items-center rounded-lg text-[#202020] hover:bg-[#F5F7FA] disabled:opacity-40 disabled:hover:bg-transparent';

  const window = useMemo(() => {
    const arr: (number | '...')[] = [];
    const push = (v: number | '...') =>
      arr[arr.length - 1] === v ? undefined : arr.push(v);

    for (let i = 1; i <= pages; i++) {
      if (i <= 3 || i > pages - 2 || Math.abs(i - page) <= 1) push(i);
      else if (arr[arr.length - 1] !== '...') push('...');
    }
    return arr;
  }, [pages, page]);

  if (pages <= 1) return null;

  return (
    <div className="flex items-center gap-2 mt-5">
      <button
        className={arrowBtnCls}
        disabled={page === 1}
        onClick={() => onChange(Math.max(1, page - 1))}
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
              v === page &&
                'bg-[var(--secondary-light-color)] border-[var(--secondary-color)] font-medium'
            )}
            onClick={() => onChange(v)}
          >
            {v}
          </button>
        )
      )}

      <button
        className={arrowBtnCls}
        disabled={page === pages}
        onClick={() => onChange(Math.min(pages, page + 1))}
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

const buildCertificatesFromApplication = (
  row: GuruApplicationDTO | null
): CertificateItem[] => {
  if (!row || !row.user) return [];
  const userAny: any = row.user as any;
  const detailGuru = userAny?.detailGuru;
  const list: any[] = detailGuru?.sertifikat ?? [];
  if (!Array.isArray(list) || !list.length) return [];

  return list.map((s: any): CertificateItem => {
    // pastikan hasil akhirnya string | undefined (bukan null)
    const fileUrl = s.certif_path
      ? (resolveImageUrl(s.certif_path ?? null) ?? undefined)
      : undefined;

    const instrumentName =
      (s.instrument && (s.instrument.nama_instrumen as string)) || "—";

    const instrumentIcon =
      s.instrument && s.instrument.icon
        ? (resolveImageUrl(s.instrument.icon ?? null) ?? undefined)
        : undefined;

    const gradeName = (s.grade && (s.grade.nama_grade as string)) || "—";

    return {
      id: s.id,
      title: s.keterangan || "Sertifikat",
      school: s.penyelenggara || "—",
      instrument: instrumentName,
      instrumentIcon,        // sekarang: string | undefined
      grade: gradeName,
      status: mapCertStatus(s.status),
      link: fileUrl,         // sekarang: string | undefined
      rejectReason: s.alasan_penolakan ?? null,
    };
  });
};

/* ======================== Main Page ======================== */

const VerifiedTutorPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const gaList = useSelector((s: RootState) => s.guruApplication.list);
  const itemsAll: GuruApplicationDTO[] = Array.isArray(gaList?.rows)
    ? gaList.rows
    : EMPTY_ARR;
  const total: number = typeof gaList?.total === 'number' ? gaList.total : 0;
  const loading: boolean = !!gaList?.loading;
  const errorMsg: string | null = gaList?.error ?? null;

  const [page, setPage] = useState<number>(gaList?.page || 1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ApproveMode>('approved');
  const [selected, setSelected] = useState<GuruApplicationDTO | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<'success' | 'error'>('success');
  const [confirmCtx, setConfirmCtx] = useState<'approved' | 'rejected'>(
    'approved'
  );

  // state untuk overlay loading submit decide
  const [deciding, setDeciding] = useState(false);

  // state untuk ManageCertificateModal
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certModalItems, setCertModalItems] = useState<CertificateItem[]>([]);
  const [certModalTitle, setCertModalTitle] =
    useState<string>('Kelola Sertifikat');

  // Load awal: hanya status 'proses'
  useEffect(() => {
    dispatch(setGALimit(PAGE_SIZE));
    dispatch(setGAPage(page));
    dispatch(setGAStatus('proses'));
    dispatch(fetchGuruApplicationsThunk());
  }, [dispatch, page]);

  // Filter client-side juga (untuk berjaga)
  const items = useMemo(
    () => itemsAll.filter((r) => r.status === 'proses'),
    [itemsAll]
  );

  const openModal = (mode: ApproveMode, row: GuruApplicationDTO) => {
    setSelected(row);
    setModalMode(mode);
    setModalOpen(true);
  };

  // Panggil endpoint APPROVE/REJECT via thunk + tampilkan LoadingScreen
  const handleSubmitModal = async (payload: ApproveTeacherPayload) => {
    if (!selected) return;
    setModalOpen(false);
    setDeciding(true);

    try {
      if (payload.mode === 'approved') {
        await dispatch(
          approveApplicationThunk({
            id: selected.id,
            note: (payload as any)?.notes,
          })
        ).unwrap();
      } else {
        const reason =
          (payload as any)?.reason ||
          (payload as any)?.notes ||
          'Ditolak oleh admin';
        await dispatch(
          rejectApplicationThunk({ id: selected.id, note: reason })
        ).unwrap();
      }
      setConfirmKind('success');
    } catch {
      setConfirmKind('error');
    } finally {
      setConfirmCtx(payload.mode);
      setSelected(null);
      // refresh list agar item yang sudah diputuskan hilang dari status 'proses'
      await dispatch(fetchGuruApplicationsThunk());
      setDeciding(false);
      setConfirmOpen(true);
    }
  };

  const confirmTitle =
    confirmCtx === 'approved'
      ? confirmKind === 'success'
        ? 'Tutor berhasil disetujui.'
        : 'Gagal menyetujui tutor'
      : confirmKind === 'success'
      ? 'Tutor berhasil ditolak.'
      : 'Gagal menolak tutor';

  const confirmTexts =
    confirmCtx === 'approved'
      ? confirmKind === 'success'
        ? [
            'Tutor ini kini resmi terdaftar di platform dan sudah dapat menerima murid.',
          ]
        : [
            'Terjadi kendala saat menyetujui tutor ini. Silakan coba lagi beberapa saat lagi.',
          ]
      : confirmKind === 'success'
      ? [
          'Tutor ini tidak akan muncul di daftar calon tutor dan tidak dapat mengajar di platform.',
        ]
      : [
          'Terjadi kendala saat menolak tutor ini. Silakan coba lagi beberapa saat lagi.',
        ];

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl">
      {/* Overlay loading approve/reject */}
      {deciding && <LoadingScreen />}

      <Header />

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white">
        <table className="w-full">
          <TableHeader />
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-6 text-sm text-neutral-600">
                  Memuat data...
                </td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-600">
                  Belum ada pendaftar.
                </td>
              </tr>
            )}

            {!loading &&
              items.map((row) => (
                <RowItem
                  key={row.id}
                  row={row}
                  onApprove={() => openModal('approved', row)}
                  onReject={() => openModal('rejected', row)}
                />
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center">
        <Pagination total={total} page={page} onChange={setPage} />
      </div>

      {/* Modal Approve / Reject */}
      <ApproveTeacherModal
        open={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitModal}
        data={{
          image: resolveImageUrl(selected?.user?.profile_pic_url ?? null) || defaultUser,
          name: selected?.nama ?? undefined,
          short_name: selected?.user?.nama_panggilan ?? undefined,
          email: selected?.email ?? undefined,
          phone: selected?.no_telp ?? undefined,
          city: selected?.domisili ?? '-',
          videoUrl: selected?.demo_url ?? undefined,
          cvUrl: selected?.cv_url ?? undefined,
          certificateUrl: selected?.portfolio_url ?? undefined,
          certificates: buildCertificatesFromApplication(selected),
        }}
        onOpenCertificates={(opts) => {
          const all = buildCertificatesFromApplication(selected);
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
          setCertModalOpen(true);
        }}
      />

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
        canDecide={false}
      />
    </div>
  );
};

export default VerifiedTutorPage;
