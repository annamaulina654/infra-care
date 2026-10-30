import { useEffect, useRef } from 'react';
import { IkonTutup } from '../../lib/icons.js';
import { cx } from '../../lib/format.js';

// Jendela dialog. Tutup dengan tombol X, klik latar, atau tombol Escape.
// Di HP tampil sebagai lembar dari bawah, di layar lebar sebagai kotak di tengah.
export default function Dialog({ buka, tutup, judul, lebar = 'max-w-lg', children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!buka) return undefined;
    const sebelumnya = document.activeElement;
    const tekan = (e) => { if (e.key === 'Escape') tutup(); };
    window.addEventListener('keydown', tekan);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      window.removeEventListener('keydown', tekan);
      document.body.style.overflow = '';
      sebelumnya?.focus?.();
    };
  }, [buka, tutup]);

  if (!buka) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 no-print">
      <div className="absolute inset-0 bg-slate-950/55" onClick={tutup} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={judul}
        className={cx('relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface shadow-2xl outline-none sm:rounded-3xl', lebar)}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{judul}</h2>
          <button type="button" onClick={tutup} aria-label="Tutup"
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-ink"><IkonTutup aria-hidden /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
