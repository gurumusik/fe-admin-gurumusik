// src/pages/dashboard-admin/student/DetailStudentPage.tsx
'use client';

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiArrowLeftSLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiQuestionFill,
  RiStarFill,
} from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/app/store';

import {
  fetchStudentHeaderThunk,
  fetchStudentClassesThunk,
  selectStudentDetail,
  selectStudentClasses,
  setClassesPage,
  setClassesLimit,
  setClassesInstrument,
  setClassesProgram,
} from '@/features/slices/murid/slice';

import ProgramAvatarBadge from '@/components/ui/badge/ProgramAvatarBadge';
import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import TeacherVacationModal from '@/features/dashboard/components/TeacherVacationModal';
import { resolveIconUrl } from '@/utils/resolveIconUrl'; // ⬅️ tambahkan
import defaultUser from '@/assets/images/default-user.png'
import { updateMuridStatus } from '@/services/api/murid.api';
import type { StudentListItem } from '@/features/slices/murid/types';

function pageWindow(total: number, current: number) {
  const out: (number | '…')[] = [];
  const push = (x: number | '…') => { if (out[out.length - 1] !== x) out.push(x); };
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) push(i);
    else if (out[out.length - 1] !== '…') push('…');
  }
  return out;
}

const RatingCell: React.FC<{ rating?: number | null }> = ({ rating }) =>
  rating == null ? (
    <span className="text-black/70">-</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-black/80">
      <RiStarFill size={20} className="text-[var(--primary-color)]" />
      {rating.toFixed(1)} <span className="text-black/60">/5</span>
    </span>
  );

const getStatusColor = (s?: string) =>
  s === 'Aktif'
    ? 'text-(--accent-green-color)'
    : s === 'Non-Aktif'
    ? 'text-(--accent-red-color)'
    : 'text-(--accent-orange-color)';

const formatDateShort = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const safeText = (v?: string | null) => (v && String(v).trim() ? v : '-');

const DetailItem: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3">
    <div className="text-xs text-neutral-500">{label}</div>
    <div className="mt-1 text-sm font-semibold text-neutral-900">{value ?? '-'}</div>
  </div>
);

const DetailStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state?: { studentUuid?: string; studentSnapshot?: StudentListItem };
  };

  const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const fromQuery = search.get('s') || undefined;
  const activeUuid = state?.studentUuid || fromQuery;
  const snapshot = state?.studentSnapshot;

  const dispatch = useDispatch<AppDispatch>();
  const detail = useSelector(selectStudentDetail);
  const classes = useSelector(selectStudentClasses);

  const [isUpdating, setIsUpdating] = useState(false);
  type Flow =
    | null
    | 'ask-deactivate'
    | 'ok-deactivate'
    | 'fail-deactivate'
    | 'ask-activate'
    | 'ok-activate'
    | 'fail-activate';
  const [flow, setFlow] = useState<Flow>(null);
  const [openVacation, setOpenVacation] = useState(false);
  const [vacationResult, setVacationResult] = useState<null | 'ok' | 'fail'>(null);
  const [localStatus, setLocalStatus] = useState<string>('');

  const mergedStudent = useMemo(() => {
    const student = detail.item;
    return {
      uuid: student?.uuid ?? snapshot?.uuid ?? activeUuid ?? '',
      name: student?.name ?? snapshot?.name ?? '-',
      status: student?.status ?? snapshot?.status ?? '-',
      email: student?.email ?? snapshot?.email ?? null,
      phone: student?.phone ?? snapshot?.phone ?? null,
      city: student?.city ?? snapshot?.city ?? null,
      created_at: student?.created_at ?? snapshot?.created_at ?? null,
      image: student?.image ?? snapshot?.image ?? null,
    };
  }, [detail.item, snapshot, activeUuid]);

  useEffect(() => {
    if (mergedStudent.status && mergedStudent.status !== '-') {
      setLocalStatus(mergedStudent.status);
    }
  }, [mergedStudent.status]);

  const statusLabel = localStatus || mergedStudent.status || '-';
  const canActivate = statusLabel !== 'Aktif';
  const canDeactivate = statusLabel === 'Aktif';
  const canCuti = statusLabel === 'Aktif';

  useEffect(() => {
    dispatch(setClassesLimit(5));
  }, [dispatch]);

  useEffect(() => {
    if (activeUuid) dispatch(fetchStudentHeaderThunk(activeUuid));
  }, [dispatch, activeUuid]);

  useEffect(() => {
    if (activeUuid) {
      dispatch(fetchStudentClassesThunk({ uuid: activeUuid }));
    }
  }, [dispatch, activeUuid, classes.page, classes.limit, classes.instrument, classes.program]);

  const totalPages = Math.max(1, classes.totalPages || Math.ceil((classes.total || 0) / (classes.limit || 1)));
  const goTo = (p: number) => dispatch(setClassesPage(Math.min(Math.max(1, p), totalPages)));
  const prev = () => goTo(classes.page - 1);
  const next = () => goTo(classes.page + 1);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/dashboard-admin/student-list', { replace: true });
  }, [navigate]);

  const refreshHeader = useCallback(() => {
    if (activeUuid) dispatch(fetchStudentHeaderThunk(activeUuid));
  }, [dispatch, activeUuid]);

  const openDeactivateAsk = () => setFlow('ask-deactivate');
  const openActivateAsk = () => setFlow('ask-activate');

  const confirmDeactivate = async () => {
    if (!activeUuid) return;
    try {
      setFlow(null);
      setIsUpdating(true);
      await updateMuridStatus({ status_akun: 'non_aktif', uuid: activeUuid });
      setLocalStatus('Non-Aktif');
      refreshHeader();
      setFlow('ok-deactivate');
    } catch {
      setFlow('fail-deactivate');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmActivate = async () => {
    if (!activeUuid) return;
    try {
      setFlow(null);
      setIsUpdating(true);
      await updateMuridStatus({ status_akun: 'aktif', uuid: activeUuid });
      setLocalStatus('Aktif');
      refreshHeader();
      setFlow('ok-activate');
    } catch {
      setFlow('fail-activate');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVacationConfirm = async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    if (!activeUuid) return;
    try {
      setOpenVacation(false);
      setIsUpdating(true);
      await updateMuridStatus({
        status_akun: 'cuti',
        cuti_start_date: startDate,
        cuti_end_date: endDate,
        uuid: activeUuid,
      });
      setLocalStatus('Cuti');
      refreshHeader();
      setVacationResult('ok');
    } catch {
      setVacationResult('fail');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!activeUuid) {
    return (
      <div className="rounded-2xl bg-white p-6">
        <Link
          to="/dashboard-admin/student-list"
          className="inline-flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 text-sm text-neutral-800 hover:bg-black/5"
        >
          <RiArrowLeftSLine className="text-lg" />
          Kembali
        </Link>
        <div className="mt-6 text-neutral-600">Murid tidak ditemukan.</div>
      </div>
    );
  }

  const student = mergedStudent;
  const studentImg = resolveIconUrl(student?.image ?? null) || defaultUser; // ⬅️

  return (
    <div className="w-full">
      {/* HEADER */}
      <section className="rounded-2xl bg-white p-4 md:p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center size-10 rounded-xl border border-neutral-300 text-[var(--secondary-color)] hover:bg-neutral-50"
              aria-label="Kembali"
            >
              <RiArrowLeftLine size={25} />
            </button>

            {detail.status === 'loading' && (
              <div className="text-neutral-500">Memuat profil murid…</div>
            )}

            {detail.status !== 'loading' && (
              <>
                <img
                  src={studentImg} // ⬅️ pakai util
                  alt={student.name}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-black/5"
                />
                <div>
                  <div className="font-semibold text-md text-neutral-900">{safeText(student.name)}</div>
                  <div className={`text-md font-semibold ${getStatusColor(statusLabel)}`}>
                    {statusLabel}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filters kelas */}
          <div className="flex items-center gap-3">
            <input
              className="rounded-xl border w-[200px] border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              placeholder="Filter instrumen..."
              value={classes.instrument}
              onChange={(e) => dispatch(setClassesInstrument(e.target.value))}
            />
            <input
              className="rounded-xl border w-[200px] border-black/10 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
              placeholder="Filter program..."
              value={classes.program}
              onChange={(e) => dispatch(setClassesProgram(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* DETAIL MURID */}
      <section className="rounded-2xl bg-white p-4 md:p-6 mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black">Detail Murid</h3>
            <p className="text-sm text-neutral-500">Informasi dasar murid.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canActivate && (
              <button
                onClick={openActivateAsk}
                disabled={isUpdating}
                className="rounded-full border border-(--secondary-color) px-4 py-2 text-sm font-semibold text-(--secondary-color) hover:bg-(--secondary-light-color) disabled:opacity-60"
              >
                Aktifkan
              </button>
            )}
            {canDeactivate && (
              <button
                onClick={openDeactivateAsk}
                disabled={isUpdating}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-(--accent-red-color) hover:bg-red-100 disabled:opacity-60"
              >
                Nonaktifkan
              </button>
            )}
            {canCuti && (
              <button
                onClick={() => setOpenVacation(true)}
                disabled={isUpdating}
                className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
              >
                Cuti
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailItem label="Nama Murid" value={safeText(student.name)} />
          <DetailItem label="Email" value={safeText(student.email)} />
          <DetailItem label="No Telepon" value={safeText(student.phone)} />
          <DetailItem label="Asal Kota" value={safeText(student.city)} />
          <DetailItem label="Tanggal Daftar" value={formatDateShort(student.created_at)} />
          <DetailItem
            label="Status"
            value={<span className={`font-semibold ${getStatusColor(statusLabel)}`}>{statusLabel}</span>}
          />
        </div>
      </section>

      {/* TABEL KELAS (per sesi) */}
      <section className="rounded-2xl bg-white p-4 md:p-6">
        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-md">
                <th className="w-[120px] p-5 font-medium">Profile</th>
                <th className="p-5 font-medium">Nama Guru</th>
                <th className="p-5 font-medium">Jadwal</th>
                <th className="p-5 font-medium">Sesi</th>
                <th className="p-5 font-medium">Nilai Kelas</th>
                <th className="p-5 font-medium">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {classes.status === 'loading' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">Memuat kelas…</td>
                </tr>
              )}

              {classes.status === 'failed' && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-red-600">{classes.error || 'Gagal memuat kelas'}</td>
                </tr>
              )}

              {classes.status !== 'loading' && classes.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">Belum ada sesi untuk murid ini.</td>
                </tr>
              )}

              {classes.status !== 'loading' && classes.items.map((r) => {
                const teacherImg = resolveIconUrl(r.avatar) || defaultUser; // ⬅️
                const instrumentIcon = resolveIconUrl(r.instrument.icon); // ⬅️

                return (
                  <tr key={r.sesi_id}>
                    <td className="px-4 py-4">
                      <ProgramAvatarBadge
                        src={teacherImg}            // ⬅️ gunakan URL yang sudah di-resolve
                        alt={r.teacherName}
                        pkg={r.program.name || ''}
                        size={55}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-black">{r.teacherName}</span>
                        <div className="mt-1 flex items-center gap-2">
                          {instrumentIcon ? (
                            <img src={instrumentIcon} alt={r.instrument.name} className="h-5 w-5" />
                          ) : (
                            <span className="inline-block w-5 h-5 rounded-full bg-neutral-300" />
                          )}
                          <span className="text-md text-black/80">{r.instrument.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-black/80">
                      <div>{r.schedule}</div>
                    </td>
                    <td className="px-4 py-4 text-black">{r.sesi_ke} / {r.total_session}</td>
                    <td className="px-4 py-4"><RatingCell rating={r.rating} /></td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/dashboard-admin/student-list/detail-student/detail-class/${r.transaksi_id}`}
                        state={{ studentUuid: activeUuid, classId: String(r.transaksi_id) }}
                        className="inline-block rounded-full border border-(--secondary-color) px-4 py-1.5 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                      >
                        Detail Kelas
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => prev()}
            disabled={classes.page === 1 || classes.status === 'loading'}
            className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Previous page"
          >
            &lt;
          </button>

          {pageWindow(totalPages, classes.page).map((p, i) =>
            p === '…' ? (
              <span key={`dots-${i}`} className="px-3 py-2 text-md text-black/40">…</span>
            ) : (
              <button
                key={p}
                onClick={() => dispatch(setClassesPage(p))}
                className={`rounded-xl border border-[var(--secondary-color)] px-3 py-1 text-md ${
                  p === classes.page
                    ? 'border-(--secondary-color) bg-(--secondary-light-color) text-(--secondary-color)'
                    : 'text-black/70 hover:bg-black/5'
                }`}
                aria-current={p === classes.page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => next()}
            disabled={classes.page === totalPages || classes.status === 'loading'}
            className="px-3 py-2 text-md text-black/70 enabled:hover:bg-black/5 disabled:opacity-40"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </section>

      {/* ====== Modals & flows ====== */}
      <TeacherVacationModal
        isOpen={openVacation}
        onClose={() => setOpenVacation(false)}
        onConfirm={handleVacationConfirm}
        title="Yakin…Mau Mencutikan Murid?"
        description="Selama periode cuti, murid akan berstatus cuti dan tidak bisa dijadwalkan mengikuti kelas."
      />

      {[
        'ask-deactivate',
        'ok-deactivate',
        'fail-deactivate',
        'ask-activate',
        'ok-activate',
        'fail-activate',
      ].includes(String(flow)) && (
        <>
          {flow === 'ask-deactivate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-lg"
              icon={<RiQuestionFill />}
              iconTone="warning"
              title="Yakin…Mau Nonaktifkan Murid?"
              texts={[
                'Kalau dinonaktifkan, murid ini tidak dapat mengikuti kelas dan tidak bisa dijadwalkan.',
              ]}
              button2={{
                label: 'Ga Jadi Deh',
                variant: 'outline',
                onClick: () => setFlow(null),
              }}
              button1={{
                label: isUpdating ? 'Memproses…' : 'Ya, Saya Yakin',
                variant: 'primary',
                onClick: confirmDeactivate,
              }}
            />
          )}
          {flow === 'ok-deactivate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-md"
              icon={<RiCheckboxCircleFill />}
              iconTone="success"
              title="Murid Berhasil Dinonaktifkan"
              texts={[
                'Murid ini tidak dapat mengikuti kelas sampai statusnya diaktifkan kembali.',
              ]}
              button1={{
                label: 'Tutup',
                variant: 'primary',
                onClick: () => setFlow(null),
              }}
            />
          )}
          {flow === 'fail-deactivate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-md"
              icon={<RiCloseLine />}
              iconTone="danger"
              title="Murid Gagal Dinonaktifkan"
              texts={[
                'Terjadi kendala saat menonaktifkan murid ini. Silakan coba lagi beberapa saat lagi.',
              ]}
              button1={{
                label: 'Tutup',
                variant: 'primary',
                onClick: () => setFlow(null),
              }}
            />
          )}

          {flow === 'ask-activate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-lg"
              icon={<RiQuestionFill />}
              iconTone="warning"
              title="Yakin…Mau Aktifkan Murid?"
              texts={[
                'Kalau diaktifkan, murid ini bisa kembali mengikuti kelas dan dijadwalkan.',
              ]}
              button2={{
                label: 'Ga Jadi Deh',
                variant: 'outline',
                onClick: () => setFlow(null),
              }}
              button1={{
                label: isUpdating ? 'Memproses…' : 'Ya, Saya Yakin',
                variant: 'primary',
                onClick: confirmActivate,
              }}
            />
          )}
          {flow === 'ok-activate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-md"
              icon={<RiCheckboxCircleFill />}
              iconTone="success"
              title="Murid Berhasil Diaktifkan"
              texts={[
                'Murid ini sudah bisa mengikuti kelas dan dijadwalkan kembali.',
              ]}
              button1={{
                label: 'Tutup',
                variant: 'primary',
                onClick: () => setFlow(null),
              }}
            />
          )}
          {flow === 'fail-activate' && (
            <ConfirmationModal
              isOpen
              onClose={() => setFlow(null)}
              align="center"
              widthClass="max-w-md"
              icon={<RiCloseLine />}
              iconTone="danger"
              title="Murid Gagal Diaktifkan"
              texts={[
                'Terjadi kendala saat mengaktifkan murid ini. Silakan coba lagi.',
              ]}
              button1={{
                label: 'Tutup',
                variant: 'primary',
                onClick: () => setFlow(null),
              }}
            />
          )}
        </>
      )}

      {vacationResult && (
        <ConfirmationModal
          isOpen
          onClose={() => setVacationResult(null)}
          align="center"
          widthClass="max-w-md"
          icon={vacationResult === 'ok' ? <RiCheckboxCircleFill /> : <RiCloseLine />}
          iconTone={vacationResult === 'ok' ? 'success' : 'danger'}
          title={vacationResult === 'ok' ? 'Murid Berhasil Dicutikan' : 'Murid Gagal Dicutikan'}
          texts={
            vacationResult === 'ok'
              ? [
                  'Murid ini berstatus cuti selama periode yang dipilih. Setelah periode berakhir, status murid dapat diaktifkan kembali.',
                ]
              : [
                  'Terjadi kendala saat mencutikan murid ini. Silakan coba lagi beberapa saat lagi.',
                ]
          }
          button1={{
            label: 'Tutup',
            variant: 'primary',
            onClick: () => setVacationResult(null),
          }}
        />
      )}
    </div>
  );
};

export default DetailStudentPage;
