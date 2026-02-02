/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import {
  RiTeamLine,
  RiSearchLine,
  RiUserAddLine,
  RiCheckboxCircleFill,
  RiCloseLine,
} from 'react-icons/ri';
import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import {
  createEmployee,
  listEmployees,
  updateEmployeeStatus,
  type EmployeeItem,
} from '@/services/api/employee.api';

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const toDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const EmployeePage: React.FC = () => {
  const [rows, setRows] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [modalType, setModalType] = useState<'confirm' | 'success' | 'error' | null>(null);
  const [selected, setSelected] = useState<EmployeeItem | null>(null);
  const [nextActive, setNextActive] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listEmployees();
      const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setRows(data);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data employee.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const user = r.user || ({} as any);
      const hay = [
        r.user_id,
        user?.nama,
        user?.email,
        user?.role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const handleAdd = async () => {
    const raw = input.trim();
    if (!raw) {
      setError('Masukkan email atau user_id terlebih dahulu.');
      return;
    }

    const payload: { user_id?: number; email?: string } = {};
    if (raw.includes('@')) {
      payload.email = raw.toLowerCase();
    } else {
      const id = Number(raw);
      if (!Number.isFinite(id) || id <= 0) {
        setError('Format user_id tidak valid.');
        return;
      }
      payload.user_id = id;
    }

    try {
      setSubmitting(true);
      setError(null);
      await createEmployee(payload);
      setInput('');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Gagal menambahkan employee.');
    } finally {
      setSubmitting(false);
    }
  };

  const askToggle = (row: EmployeeItem) => {
    setSelected(row);
    setNextActive(!row.is_active);
    setModalType('confirm');
  };

  const doToggle = async () => {
    if (!selected) return;
    try {
      await updateEmployeeStatus(selected.id, nextActive);
      setModalType('success');
      await loadData();
    } catch {
      setModalType('error');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--secondary-light-color)]">
              <RiTeamLine size={22} className="text-[var(--secondary-color)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Employee Demo Access
              </h2>
              <p className="text-sm text-neutral-600">
                Tentukan siapa yang boleh akses demo (role guru/murid).
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[260px]">
              <RiSearchLine
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, role..."
                className="w-full h-11 rounded-xl border border-neutral-300 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200 p-4">
          <div className="mb-3 rounded-xl bg-[var(--accent-blue-light-color)]/60 p-3 text-sm text-neutral-700">
            Jika <b>belum ada</b> employee aktif, semua guru/murid tetap bisa akses demo.
            Setelah ada employee aktif, hanya yang terdaftar di sini yang bisa masuk.
          </div>
          <p className="text-sm text-neutral-600 mb-3">
            Tambah employee dengan email atau user_id (angka).
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="email@domain.com atau user_id"
              className="w-full h-11 rounded-xl border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting}
              className="inline-flex items-center justify-center h-11 rounded-full bg-[#F6C437] text-[#0B0B0B] font-semibold px-6 hover:brightness-95 transition disabled:opacity-60"
            >
              <RiUserAddLine className="mr-2 text-lg" />
              Tambah Employee
            </button>
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
                <th className="py-3 pl-4 pr-3 font-semibold">Nama</th>
                <th className="py-3 px-3 font-semibold">Email</th>
                <th className="py-3 px-3 font-semibold">Role</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Dibuat</th>
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

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-500">
                    Belum ada employee.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((row) => {
                  const user = row.user || ({} as any);
                  const active = row.is_active !== false;
                  return (
                    <tr key={row.id} className="border-t border-neutral-200">
                      <td className="py-3 pl-4 pr-3 text-neutral-900">
                        {user?.nama || '-'}
                      </td>
                      <td className="py-3 px-3 text-neutral-700">{user?.email || '-'}</td>
                      <td className="py-3 px-3 text-neutral-700 capitalize">
                        {user?.role || '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cls(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            active
                              ? 'bg-[var(--accent-green-light-color)] text-[var(--accent-green-color)]'
                              : 'bg-[var(--primary-light-color)] text-[var(--accent-red-color)]'
                          )}
                        >
                          {active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-700">
                        {toDate(row.created_at)}
                      </td>
                      <td className="py-3 pr-4 pl-3">
                        <button
                          type="button"
                          onClick={() => askToggle(row)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--secondary-color)] px-3 py-2 text-sm text-[var(--secondary-color)] hover:bg-[var(--secondary-light-color)]"
                        >
                          {active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmationModal
        isOpen={modalType === 'confirm'}
        onClose={() => setModalType(null)}
        icon={<RiCloseLine />}
        iconTone="warning"
        title={
          nextActive
            ? 'Aktifkan akses demo untuk user ini?'
            : 'Nonaktifkan akses demo untuk user ini?'
        }
        texts={[
          nextActive
            ? 'User akan bisa mengakses demo setelah diaktifkan.'
            : 'User tidak bisa mengakses demo setelah dinonaktifkan.',
        ]}
        align="center"
        widthClass="max-w-md"
        button2={{ label: 'Batal', onClick: () => setModalType(null), variant: 'outline' }}
        button1={{ label: nextActive ? 'Aktifkan' : 'Nonaktifkan', onClick: doToggle, variant: 'primary' }}
      />

      <ConfirmationModal
        isOpen={modalType === 'success'}
        onClose={() => setModalType(null)}
        icon={<RiCheckboxCircleFill />}
        iconTone="success"
        title="Perubahan Tersimpan"
        texts={['Status employee berhasil diperbarui.']}
        align="center"
        widthClass="max-w-md"
        button1={{ label: 'Tutup', onClick: () => setModalType(null), variant: 'primary' }}
        showCloseIcon
      />

      <ConfirmationModal
        isOpen={modalType === 'error'}
        onClose={() => setModalType(null)}
        icon={<RiCloseLine />}
        iconTone="danger"
        title="Gagal Memperbarui Status"
        texts={['Terjadi kendala saat memperbarui status employee.']}
        align="center"
        widthClass="max-w-md"
        button1={{ label: 'Tutup', onClick: () => setModalType(null), variant: 'primary' }}
        showCloseIcon
      />
    </div>
  );
};

export default EmployeePage;
