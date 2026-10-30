// Tampilan keadaan umum: memuat, kosong, galat, dan kotak pesan.
import Tombol from './Tombol.jsx';
import { IkonMemuat, IkonKosong, IkonPeringatan, IkonSukses, IkonInfo, IkonAwas } from '../../lib/icons.js';
import { cx } from '../../lib/format.js';

export function Memuat({ teks = 'Memuat...', className }) {
  return (
    <div role="status" className={cx('flex items-center justify-center gap-2.5 py-12 text-sm text-muted', className)}>
      <IkonMemuat className="size-5 animate-spin" aria-hidden />
      {teks}
    </div>
  );
}

export function Kosong({ ikon: Ikon = IkonKosong, judul, teks, aksi, className }) {
  return (
    <div className={cx('flex flex-col items-center px-4 py-12 text-center', className)}>
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Ikon className="size-7" aria-hidden />
      </span>
      <p className="font-bold">{judul}</p>
      {teks && <p className="mt-1 max-w-sm text-sm text-muted">{teks}</p>}
      {aksi && <div className="mt-5">{aksi}</div>}
    </div>
  );
}

export function Galat({ pesan, ulangi, className }) {
  return (
    <div role="alert" className={cx('flex flex-col items-center px-4 py-12 text-center', className)}>
      <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
        <IkonPeringatan className="size-7" aria-hidden />
      </span>
      <p className="font-bold">Data tidak dapat dimuat</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{pesan}</p>
      {ulangi && <Tombol varian="garis" className="mt-5" onClick={ulangi}>Coba lagi</Tombol>}
    </div>
  );
}

const JENIS = {
  galat: ['border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200', IkonPeringatan],
  sukses: ['border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200', IkonSukses],
  info: ['border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200', IkonInfo],
  awas: ['border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200', IkonAwas],
};

export function Pesan({ jenis = 'info', children, className }) {
  if (!children) return null;
  const [kelas, Ikon] = JENIS[jenis];
  return (
    <div role={jenis === 'galat' ? 'alert' : 'status'} className={cx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm', kelas, className)}>
      <Ikon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
