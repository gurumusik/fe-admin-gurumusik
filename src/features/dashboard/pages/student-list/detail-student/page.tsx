// src/pages/dashboard-admin/student/DetailStudentPage.tsx
'use client';

import React, { useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiArrowLeftSLine, RiStarFill } from 'react-icons/ri';
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
import { resolveIconUrl } from '@/utils/resolveIconUrl'; // ⬅️ tambahkan
import defaultUser from '@/assets/images/default-user.png'

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

const DetailStudentPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { studentUuid?: string } };

  const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const fromQuery = search.get('s') || undefined;
  const activeUuid = state?.studentUuid || fromQuery;

  const dispatch = useDispatch<AppDispatch>();
  const detail = useSelector(selectStudentDetail);
  const classes = useSelector(selectStudentClasses);

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

  const student = detail.item;
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

            {detail.status !== 'loading' && student && (
              <>
                <img
                  src={studentImg} // ⬅️ pakai util
                  alt={student.name}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-black/5"
                />
                <div>
                  <div className="font-semibold text-md text-neutral-900">{student.name}</div>
                  <div className={`text-md font-semibold ${getStatusColor(student.status)}`}>
                    {student.status}
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
    </div>
  );
};

export default DetailStudentPage;
