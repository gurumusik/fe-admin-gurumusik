/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { RiFileList2Fill, RiCloseLine, RiShieldFlashLine } from 'react-icons/ri';
import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import LoadingScreen from '@/components/ui/common/LoadingScreen';
import { deactivateGuruRevisionToken, getLatestGuruRevisionReport } from '@/services/api/guruRevision.api';
import type { TGuruRevisionReport } from '@/types/TGuruRevision';
import { getRevisionFieldLabel } from '@/features/dashboard/pages/verified-tutor/revisionFieldMap';

type Props = {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  applicationName?: string;
};

function formatDate(raw?: string | null) {
  if (!raw) return '-';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function GuruRevisionDetailModal({ open, onClose, applicationId, applicationName }: Props) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TGuruRevisionReport | null>(null);
  const [confirm, setConfirm] = useState<{ open: boolean; tokenId?: number; loading?: boolean }>({ open: false });
  const [toast, setToast] = useState<{ open: boolean; kind: 'success' | 'error'; title: string; texts: string[] }>({
    open: false,
    kind: 'success',
    title: '',
    texts: [],
  });

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    getLatestGuruRevisionReport(applicationId)
      .then((r) => {
        if (!mounted) return;
        setReport(r);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setToast({ open: true, kind: 'error', title: 'Gagal memuat laporan revisi', texts: [String(err?.message || 'Request failed')] });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [open, applicationId]);

  const items = useMemo(() => {
    const list = Array.isArray(report?.items) ? report!.items! : [];
    return list
      .map((it) => ({
        field_key: String((it as any).field_key || '').trim(),
        label: getRevisionFieldLabel(String((it as any).field_key || '')),
        message: (it as any).message ? String((it as any).message) : '',
      }))
      .filter((x) => x.field_key)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [report]);

  const activeToken = useMemo(() => {
    const tokens = Array.isArray((report as any)?.tokens) ? ((report as any).tokens as any[]) : [];
    const active = tokens.find((t) => t && t.is_active);
    return active ? { id: Number(active.id), ...active } : null;
  }, [report]);

  const deactivateToken = async (tokenId: number) => {
    setConfirm({ open: true, tokenId, loading: true });
    try {
      await deactivateGuruRevisionToken(tokenId);
      setToast({ open: true, kind: 'success', title: 'Token dinonaktifkan', texts: ['Token revisi sudah tidak berlaku.'] });
      const latest = await getLatestGuruRevisionReport(applicationId);
      setReport(latest);
    } catch (err: any) {
      setToast({ open: true, kind: 'error', title: 'Gagal menonaktifkan token', texts: [String(err?.message || 'Request failed')] });
    } finally {
      setConfirm({ open: false });
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[95]">
        <div className="absolute inset-0 bg-[#0B1220]/60" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className="w-full max-w-[860px] rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full grid place-items-center bg-neutral-100 text-neutral-700">
                  <RiFileList2Fill size={20} />
                </div>
                <div>
                  <p className="text-md font-semibold text-neutral-900">Laporan Revisi</p>
                  {applicationName && <p className="text-sm text-neutral-600 mt-0.5">{applicationName}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-full grid place-items-center hover:bg-neutral-100"
                aria-label="Tutup"
              >
                <RiCloseLine />
              </button>
            </div>

            <div className="px-5 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {loading ? (
                <LoadingScreen />
              ) : !report ? (
                <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-700">
                  Belum ada laporan revisi untuk pengajuan ini.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-neutral-500">Status</p>
                        <p className="font-semibold text-neutral-900">{String(report.status || '-')}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Terkirim</p>
                        <p className="font-semibold text-neutral-900">{formatDate(report.sent_at ?? null)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Submit revisi</p>
                        <p className="font-semibold text-neutral-900">{formatDate(report.revision_submitted_at ?? null)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Token</p>
                        <p className="font-semibold text-neutral-900">
                          {activeToken ? 'Aktif' : 'Tidak ada / nonaktif'}
                        </p>
                      </div>
                    </div>

                    {activeToken && (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3">
                        <div className="text-sm text-neutral-700">
                          <div>Reminder terakhir: <span className="font-medium">{formatDate((activeToken as any).last_reminded_at ?? null)}</span></div>
                          <div>Dipakai terakhir: <span className="font-medium">{formatDate((activeToken as any).last_used_at ?? null)}</span></div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirm({ open: true, tokenId: activeToken.id })}
                          className="h-10 px-4 rounded-full font-semibold bg-[var(--accent-red-light-color)] text-[var(--accent-red-color)] hover:brightness-95"
                        >
                          Nonaktifkan Token
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-neutral-200 p-4">
                    <p className="text-sm font-semibold text-neutral-900 mb-2">Field yang perlu diperbaiki</p>
                    {items.length === 0 ? (
                      <p className="text-sm text-neutral-600">Tidak ada item field.</p>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((it) => (
                          <li key={it.field_key} className="rounded-lg border border-neutral-200 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-neutral-900">{it.label}</div>
                              <div className="text-xs text-neutral-500">{it.field_key}</div>
                            </div>
                            {!!it.message && <div className="mt-2 text-sm text-neutral-700">{it.message}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {report.general_message && (
                    <div className="rounded-xl border border-neutral-200 p-4">
                      <p className="text-sm font-semibold text-neutral-900 mb-2">Pesan tambahan</p>
                      <div className="text-sm text-neutral-700 whitespace-pre-wrap">{String(report.general_message)}</div>
                    </div>
                  )}

                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-6 rounded-full font-semibold bg-[var(--primary-color)] text-neutral-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirm.open}
        onClose={() => setConfirm({ open: false })}
        icon={<RiShieldFlashLine />}
        iconTone="warning"
        title="Nonaktifkan token revisi?"
        texts={['Token akan berhenti berlaku dan link revisi tidak bisa digunakan lagi.']}
        button2={{ label: 'Batal', onClick: () => setConfirm({ open: false }), variant: 'outline' }}
        button1={{
          label: confirm.loading ? 'Memproses…' : 'Nonaktifkan',
          onClick: () => (confirm.tokenId ? deactivateToken(confirm.tokenId) : undefined),
          loading: !!confirm.loading,
          variant: 'danger',
        }}
      />

      <ConfirmationModal
        isOpen={toast.open}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
        icon={<RiShieldFlashLine />}
        iconTone={toast.kind === 'success' ? 'success' : 'danger'}
        title={toast.title}
        texts={toast.texts}
        button1={{ label: 'OK', onClick: () => setToast((s) => ({ ...s, open: false })) }}
      />
    </>
  );
}
