import { Link } from 'react-router-dom';
import { cx, inisial } from '../../lib/format.js';
import { IkonPanah } from '../../lib/icons.js';

export function Kartu({ className, children, ...sisa }) {
  return <div className={cx('card p-5', className)} {...sisa}>{children}</div>;
}

// Judul bagian di dalam kartu, dengan tautan/aksi opsional di kanan.
export function JudulKartu({ judul, aksi, ke, teksKe = 'Lihat semua', className }) {
  return (
    <div className={cx('mb-4 flex items-center justify-between gap-3', className)}>
      <h2 className="text-base font-bold">{judul}</h2>
      {ke && <Link to={ke} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">{teksKe}<IkonPanah className="size-4" aria-hidden /></Link>}
      {aksi}
    </div>
  );
}

// Judul halaman: judul besar, keterangan, dan tombol aksi di kanan.
export function JudulHalaman({ judul, ket, aksi, ikon: Ikon }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3.5">
        {Ikon && <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><Ikon className="size-6" aria-hidden /></span>}
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{judul}</h1>
          {ket && <p className="mt-0.5 text-sm text-muted">{ket}</p>}
        </div>
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </header>
  );
}

// Kartu angka ringkas di dashboard dan laporan.
export function KartuStat({ label, nilai, ket, ikon: Ikon, warna = 'text-brand bg-brand-soft', ke }) {
  const isi = (
    <>
      <span className={cx('grid size-11 shrink-0 place-items-center rounded-xl', warna)}><Ikon className="size-5" aria-hidden /></span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-extrabold leading-tight">{nilai}</p>
        {ket && <p className="mt-0.5 truncate text-xs text-muted">{ket}</p>}
      </div>
    </>
  );
  const kelas = 'card flex items-center gap-3.5 p-4';
  return ke
    ? <Link to={ke} className={cx(kelas, 'transition-shadow hover:shadow-md')}>{isi}</Link>
    : <div className={kelas}>{isi}</div>;
}

export function Avatar({ user, ukuran = 'size-10', teks = 'text-sm', className }) {
  return user?.foto
    ? <img src={user.foto} alt="" className={cx('shrink-0 rounded-full object-cover', ukuran, className)} />
    : <span aria-hidden className={cx('grid shrink-0 place-items-center rounded-full bg-brand font-bold text-white', ukuran, teks, className)}>{inisial(user?.nama)}</span>;
}
