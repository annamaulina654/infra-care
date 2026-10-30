// Penomoran halaman untuk tabel dan daftar yang dipaginasi dari server.
import { IkonKiri, IkonKanan } from '../../lib/icons.js';
import { angka, cx } from '../../lib/format.js';

// Daftar nomor yang ditampilkan: 1 … 4 5 [6] 7 8 … 20
const nomor = (sekarang, jumlah) => {
  const set = new Set([1, jumlah, sekarang - 1, sekarang, sekarang + 1]);
  const urut = [...set].filter((n) => n >= 1 && n <= jumlah).sort((a, b) => a - b);
  const hasil = [];
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) hasil.push('…' + n);
    hasil.push(n);
  });
  return hasil;
};

export default function Halaman({ halaman, total, batas, ubah, className }) {
  const jumlah = Math.max(1, Math.ceil(total / batas));
  if (total === 0) return null;
  const dari = (halaman - 1) * batas + 1;
  const sampai = Math.min(total, halaman * batas);
  const tombol = 'grid size-9 place-items-center rounded-lg border border-line text-sm font-semibold transition-colors';

  return (
    <nav aria-label="Halaman" className={cx('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      <p className="text-sm text-muted">Menampilkan {angka(dari)}–{angka(sampai)} dari {angka(total)}</p>
      {jumlah > 1 && (
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="Halaman sebelumnya" disabled={halaman <= 1} onClick={() => ubah(halaman - 1)}
            className={cx(tombol, 'bg-surface hover:bg-surface2 disabled:opacity-40')}><IkonKiri aria-hidden /></button>
          {nomor(halaman, jumlah).map((n) =>
            typeof n === 'string'
              ? <span key={n} className="px-1 text-muted" aria-hidden>…</span>
              : <button key={n} type="button" aria-current={n === halaman ? 'page' : undefined} onClick={() => ubah(n)}
                  className={cx(tombol, n === halaman ? 'border-brand bg-brand text-white' : 'bg-surface hover:bg-surface2')}>{n}</button>)}
          <button type="button" aria-label="Halaman berikutnya" disabled={halaman >= jumlah} onClick={() => ubah(halaman + 1)}
            className={cx(tombol, 'bg-surface hover:bg-surface2 disabled:opacity-40')}><IkonKanan aria-hidden /></button>
        </div>
      )}
    </nav>
  );
}
