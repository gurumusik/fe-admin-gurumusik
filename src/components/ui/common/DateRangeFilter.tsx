import { useEffect, useMemo, useRef, useState } from 'react';
import { RiCalendar2Line, RiCloseLine } from 'react-icons/ri';

type DateRangeValue = {
  startDate?: string;
  endDate?: string;
};

type Props = {
  startDate?: string;
  endDate?: string;
  placeholder?: string;
  onChange: (value: DateRangeValue) => void;
};

type PickerMode = 'single' | 'range';

const formatDateLabel = (value?: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const inferMode = (startDate?: string, endDate?: string): PickerMode => {
  if (startDate && endDate && startDate !== endDate) return 'range';
  return 'single';
};

const buildLabel = (startDate?: string, endDate?: string, placeholder = 'Tanggal Daftar') => {
  if (!startDate && !endDate) return placeholder;
  if (startDate && endDate) {
    if (startDate === endDate) return formatDateLabel(startDate);
    return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
  }
  return formatDateLabel(startDate || endDate) || placeholder;
};

export default function DateRangeFilter({
  startDate,
  endDate,
  placeholder = 'Tanggal Daftar',
  onChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>(inferMode(startDate, endDate));
  const [singleDate, setSingleDate] = useState(startDate && startDate === endDate ? startDate : '');
  const [rangeStart, setRangeStart] = useState(startDate ?? '');
  const [rangeEnd, setRangeEnd] = useState(endDate ?? '');

  useEffect(() => {
    const nextMode = inferMode(startDate, endDate);
    setMode(nextMode);
    setSingleDate(startDate && startDate === endDate ? startDate : '');
    setRangeStart(startDate ?? '');
    setRangeEnd(endDate ?? '');
  }, [startDate, endDate]);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const label = useMemo(
    () => buildLabel(startDate, endDate, placeholder),
    [startDate, endDate, placeholder],
  );

  const hasValue = Boolean(startDate || endDate);

  const applyValue = () => {
    if (mode === 'single') {
      const normalized = singleDate || undefined;
      onChange({
        startDate: normalized,
        endDate: normalized,
      });
      setOpen(false);
      return;
    }

    const first = rangeStart || rangeEnd || undefined;
    const second = rangeEnd || rangeStart || undefined;

    if (!first && !second) {
      onChange({ startDate: undefined, endDate: undefined });
      setOpen(false);
      return;
    }

    const ordered =
      first && second && first > second
        ? { startDate: second, endDate: first }
        : { startDate: first, endDate: second };

    onChange(ordered);
    setOpen(false);
  };

  const clearValue = () => {
    setSingleDate('');
    setRangeStart('');
    setRangeEnd('');
    onChange({ startDate: undefined, endDate: undefined });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-w-[220px] items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm focus:border-(--secondary-color)"
      >
        <span className={hasValue ? 'text-neutral-900' : 'text-black/40'}>{label}</span>
        <RiCalendar2Line className="shrink-0 text-[18px] text-[var(--secondary-color)]" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[320px] rounded-2xl border border-black/10 bg-white p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-black">Filter Tanggal Daftar</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-black/50 hover:bg-black/5 hover:text-black"
              aria-label="Tutup filter tanggal"
            >
              <RiCloseLine size={18} />
            </button>
          </div>

          <div className="mb-4 inline-flex rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                mode === 'single'
                  ? 'bg-white font-medium text-black shadow-sm'
                  : 'text-black/60'
              }`}
            >
              Satu Tanggal
            </button>
            <button
              type="button"
              onClick={() => setMode('range')}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                mode === 'range'
                  ? 'bg-white font-medium text-black shadow-sm'
                  : 'text-black/60'
              }`}
            >
              Rentang
            </button>
          </div>

          {mode === 'single' ? (
            <label className="block">
              <span className="mb-2 block text-sm text-black/70">Tanggal</span>
              <input
                type="date"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
                value={singleDate}
                onChange={(event) => setSingleDate(event.target.value)}
              />
            </label>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm text-black/70">Dari</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
                  value={rangeStart}
                  onChange={(event) => setRangeStart(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-black/70">Sampai</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-(--secondary-color)"
                  value={rangeEnd}
                  onChange={(event) => setRangeEnd(event.target.value)}
                />
              </label>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearValue}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm text-black hover:bg-black/5"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applyValue}
              className="rounded-xl bg-(--secondary-color) px-3 py-2 text-sm font-medium text-white hover:brightness-95"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
