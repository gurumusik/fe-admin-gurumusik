/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/module/pages/RequestModulePage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { RiArrowLeftLine, RiSearchLine, RiBookOpenFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Landscape from '@/assets/images/Landscape.png';

import type { RootState, AppDispatch } from '@/app/store';
import { fetchModulesAdminThunk } from '@/features/slices/module/slice';

import type {
  RequestRow,
  ModuleRow,
  ModuleType,
} from '@/features/slices/module/types';

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const typeBadge = (t: ModuleType) =>
  t === 'Video'
    ? 'bg-[var(--accent-orange-color)] text-white'
    : 'bg-[var(--accent-purple-color)] text-white';

/** Formatter: "dd/MM/yyyy" (tanpa waktu) */
function formatDateDMY(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function RequestModulePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [q, setQ] = useState('');

  // Ambil state dari slice modulesAdmin (dipakai juga di AdminModulePage)
  const { items, status, error } = useSelector((s: RootState) => (s as any).modulesAdmin ?? {
    items: [] as ModuleRow[],
    status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
    error: null as string | null,
  });

  // Fetch list saat halaman dibuka (biar nggak tergantung sudah buka AdminModulePage dulu)
  useEffect(() => {
    dispatch(fetchModulesAdminThunk());
  }, [dispatch]);

  // Build rows khusus yang "Diperiksa Admin"
  const rows: RequestRow[] = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    const base = ((items as ModuleRow[]) || []).filter(
      (m: ModuleRow) => m.statusRaw === 'Diperiksa Admin'
    );

    const adapted: RequestRow[] = base.map((m: ModuleRow) => {
      // Akses payload mentah jika tersedia di item
      const raw = m as any;

      // Ambil created_at (fallback ke updated_at jika nggak ada)
      const createdAtIso: string | undefined =
        raw?.created_at ?? raw?.updated_at;

      // Ambil nama guru dari payload raw
      const teacherName: string =
        raw?.guru?.nama ??
        raw?.teacher?.nama ??
        '-';

      return {
        id: String(m.id),
        title: m.title,
        submittedAt: formatDateDMY(createdAtIso), // ⬅️ hanya dd/MM/yyyy
        teacher: teacherName,
        type: m.type,
        image: m.image || (Landscape as unknown as string),
      };
    });

    return adapted.filter((r: RequestRow) =>
      r.title.toLowerCase().includes(keyword)
    );
  }, [items, q]);

  return (
    <div className="w-full">
      {/* ===== Table Card ===== */}
      <section className="rounded-2xl bg-white p-3 sm:p-5">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-5">
            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-neutral-300 text-sm text-[var(--secondary-color)] hover:bg-black/5"
            >
              <RiArrowLeftLine size={25} />
            </button>

            {/* Title + icon */}
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--secondary-color)] text-white">
                <RiBookOpenFill size={25} />
              </span>
              <h1 className="text-lg font-semibold text-neutral-900">Request Module</h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-[360px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/60">
              <RiSearchLine />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari Judul Modul, cth: Musik Itu Gampang"
              className="w-full rounded-2xl border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 outline-none placeholder:text-black/40 focus:border-(--secondary-color)"
            />
          </div>
        </div>

        {/* Status/error note */}
        {status === 'loading' && (
          <div className="mb-3 text-sm text-neutral-600">Memuat request modul…</div>
        )}
        {status === 'failed' && error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="overflow-hidden rounded-xl">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-neutral-100 text-left text-sm">
                <th className="w-[180px] p-4 font-medium">Gambar</th>
                <th className="w-[360px] p-4 font-medium">Judul Module</th>
                <th className="p-4 font-medium">Waktu Pengajuan</th>
                <th className="p-4 font-medium">Nama Guru</th>
                <th className="p-4 font-medium">Tipe Module</th>
                <th className="p-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    Tidak ada request module.
                  </td>
                </tr>
              ) : (
                rows.map((r: RequestRow, idx: number) => (
                  <tr
                    key={r.id}
                    className={idx === 0 ? 'text-sm' : 'border-t border-black/5 text-sm'}
                  >
                    <td className="px-4 py-3">
                      <img
                        src={r.image}
                        alt={r.title}
                        className="h-14 w-30 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-[15px] font-medium text-neutral-900">
                        {r.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-neutral-700">
                      {r.submittedAt}
                    </td>
                    <td className="px-4 py-3 align-middle text-neutral-900">
                      {r.teacher}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={cls(
                          'inline-flex min-w-[80px] items-center justify-center rounded-full px-3 py-1 text-sm font-medium',
                          typeBadge(r.type)
                        )}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <button
                        onClick={() =>
                          navigate(`/dashboard-admin/module/request/detail/${r.id}`)
                        }
                        className="inline-block rounded-full border border-(--secondary-color) px-5 py-2 text-sm font-medium text-(--secondary-color) hover:bg-(--secondary-light-color)"
                      >
                        Selengkapnya
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
