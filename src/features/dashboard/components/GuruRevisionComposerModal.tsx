/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { RiErrorWarningFill } from 'react-icons/ri';
import ConfirmationModal from '@/components/ui/common/ConfirmationModal';
import { createGuruRevisionReport } from '@/services/api/guruRevision.api';
import { getRevisionFieldLabel } from '@/features/dashboard/pages/verified-tutor/revisionFieldMap';

type PickedField = { field_key: string; label?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  applicationId: number;
  applicationName?: string;
  pickedFields: PickedField[];
  onSent?: () => void;
};

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

export default function GuruRevisionComposerModal({
  open,
  onClose,
  applicationId,
  applicationName,
  pickedFields,
  onSent,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [generalMessage, setGeneralMessage] = useState('');
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ open: boolean; kind: 'success' | 'error'; title: string; texts: string[] }>({
    open: false,
    kind: 'success',
    title: '',
    texts: [],
  });

  useEffect(() => {
    if (!open) return;
    // init messages for newly selected fields
    const next: Record<string, string> = {};
    for (const f of pickedFields) next[f.field_key] = messages[f.field_key] ?? '';
    setMessages(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pickedFields.map((x) => x.field_key).join('|')]);

  const fieldsSorted = useMemo(() => {
    const list = pickedFields
      .map((f) => ({
        field_key: String(f.field_key || '').trim(),
        label: (f.label && String(f.label).trim()) || getRevisionFieldLabel(String(f.field_key || '')),
      }))
      .filter((f) => f.field_key);
    list.sort((a, b) => a.label.localeCompare(b.label));
    return list;
  }, [pickedFields]);

  const canSubmit = fieldsSorted.length > 0 && !submitting;

  const submit = async () => {
    if (!fieldsSorted.length) return;
    setSubmitting(true);
    try {
      const payload = {
        fields: fieldsSorted.map((f) => ({
          field_key: f.field_key,
          message: (messages[f.field_key] || '').trim() || null,
        })),
        general_message: generalMessage.trim() || null,
        send: true,
      };

      const resp = await createGuruRevisionReport(applicationId, payload);
      const link = resp?.token?.revision_url ? String(resp.token.revision_url) : '';

      setFeedback({
        open: true,
        kind: 'success',
        title: 'Laporan revisi terkirim',
        texts: [
          applicationName ? `Untuk: ${applicationName}` : 'Laporan berhasil dikirim.',
          link ? `Link revisi: ${link}` : 'Link revisi berhasil dibuat.',
        ],
      });

      onSent?.();
      onClose();
      setGeneralMessage('');
      setMessages({});
    } catch (err: any) {
      setFeedback({
        open: true,
        kind: 'error',
        title: 'Gagal mengirim laporan revisi',
        texts: [String(err?.message || 'Request failed')],
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90]">
        <div className="absolute inset-0 bg-[#0B1220]/60" onClick={onClose} />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div
            className="w-full max-w-[780px] rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-md font-semibold text-neutral-900">Laporan Kesalahan Data</p>
                {applicationName && (
                  <p className="text-sm text-neutral-600 mt-0.5">{applicationName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-full border border-neutral-300 text-neutral-800 hover:bg-neutral-50"
              >
                Tutup
              </button>
            </div>

            <div className="px-5 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {fieldsSorted.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-700">
                  Belum ada field yang ditandai. Tandai field yang bermasalah dulu di detail verifikasi.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 p-4">
                    <p className="text-sm font-semibold text-neutral-900 mb-2">Field yang perlu diperbaiki</p>
                    <div className="space-y-3">
                      {fieldsSorted.map((f) => (
                        <div key={f.field_key} className="grid grid-cols-1 gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-medium text-neutral-900">
                              {f.label}
                              <span className="ml-2 text-xs text-neutral-500">({f.field_key})</span>
                            </div>
                          </div>
                          <textarea
                            value={messages[f.field_key] ?? ''}
                            onChange={(e) =>
                              setMessages((prev) => ({ ...prev, [f.field_key]: e.target.value }))
                            }
                            className="w-full min-h-[70px] rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--secondary-color)]"
                            placeholder="Pesan spesifik untuk field ini (opsional)"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 p-4">
                    <p className="text-sm font-semibold text-neutral-900 mb-2">Pesan tambahan (opsional)</p>
                    <textarea
                      value={generalMessage}
                      onChange={(e) => setGeneralMessage(e.target.value)}
                      className="w-full min-h-[90px] rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--secondary-color)]"
                      placeholder="Tulis pesan general untuk calon tutor"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-6 rounded-full font-semibold border border-neutral-300 text-neutral-900 hover:bg-neutral-50"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className={cls(
                  'h-11 px-6 rounded-full font-semibold text-neutral-900',
                  canSubmit ? 'bg-[var(--primary-color)] cursor-pointer' : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                )}
              >
                {submitting ? 'Mengirim…' : 'Kirim Laporan'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={feedback.open}
        onClose={() => setFeedback((s) => ({ ...s, open: false }))}
        icon={<RiErrorWarningFill />}
        iconTone={feedback.kind === 'success' ? 'success' : 'danger'}
        title={feedback.title}
        texts={feedback.texts}
        button1={{ label: 'OK', onClick: () => setFeedback((s) => ({ ...s, open: false })) }}
        showCloseIcon
      />
    </>
  );
}
