import { Link } from 'react-router-dom';
import { IkonMemuat } from '../../lib/icons.js';
import { cx } from '../../lib/format.js';

const VARIAN = {
  utama: 'bg-brand text-white hover:bg-brand-hover shadow-sm',
  garis: 'border border-line bg-surface text-ink hover:bg-surface2',
  lembut: 'bg-brand-soft text-brand hover:brightness-95',
  bahaya: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  hantu: 'text-muted hover:bg-surface2 hover:text-ink',
};
const UKURAN = {
  sm: 'min-h-9 gap-1.5 px-3 text-xs',
  md: 'min-h-11 gap-2 px-4 text-sm',
  lg: 'min-h-12 gap-2 px-6 text-base',
};

// <Tombol ke="/login"> memakai tautan, selain itu memakai <button>.
// `memuat` menampilkan putaran dan menonaktifkan tombol selama proses berjalan.
export default function Tombol({ varian = 'utama', ukuran = 'md', ikon: Ikon, ke, memuat, penuh, className, children, ...sisa }) {
  const kelas = cx(
    'inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    VARIAN[varian], UKURAN[ukuran], penuh && 'w-full', className,
  );
  const isi = (
    <>
      {memuat ? <IkonMemuat className="animate-spin" aria-hidden /> : Ikon && <Ikon aria-hidden className="shrink-0" />}
      {children}
    </>
  );
  if (ke) return <Link to={ke} className={kelas} {...sisa}>{isi}</Link>;
  return (
    <button type="button" disabled={memuat || sisa.disabled} className={kelas} {...sisa}>
      {isi}
    </button>
  );
}
