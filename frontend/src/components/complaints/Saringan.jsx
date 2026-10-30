import { useEffect, useState } from 'react';
import { IkonCari, IkonTutup } from '../../lib/icons.js';
import { STATUS, KATEGORI } from '../../lib/constants.js';
import { useDebounce } from '../../hooks/useMisc.js';

// Pencarian dan penyaring daftar. `nilai` berisi q, status, kategori, dusun; `ubah(patch)` mengirim perubahan.
// Isian pencarian ditunda 350 ms supaya server tidak dipanggil di setiap huruf.
export default function Saringan({ nilai, ubah, dusun = [], tampilDusun = true }) {
  const [teks, setTeks] = useState(nilai.q || '');
  const tertunda = useDebounce(teks);

  useEffect(() => { if (tertunda !== (nilai.q || '')) ubah({ q: tertunda }); /* eslint-disable-next-line */ }, [tertunda]);
  useEffect(() => { setTeks(nilai.q || ''); }, [nilai.q]);

  const adaSaringan = nilai.q || nilai.status || nilai.kategori || nilai.dusun;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_repeat(3,minmax(0,11rem))_auto]">
      <div className="relative sm:col-span-2 lg:col-span-1">
        <IkonCari className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" value={teks} onChange={(e) => setTeks(e.target.value)} placeholder="Cari judul, kode, kategori..."
          aria-label="Cari pengaduan" className="field pl-10" />
      </div>
      <select aria-label="Saring status" value={nilai.status || ''} onChange={(e) => ubah({ status: e.target.value })} className="field">
        <option value="">Semua status</option>
        {STATUS.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select aria-label="Saring kategori" value={nilai.kategori || ''} onChange={(e) => ubah({ kategori: e.target.value })} className="field">
        <option value="">Semua kategori</option>
        {KATEGORI.map((k) => <option key={k}>{k}</option>)}
      </select>
      {tampilDusun
        ? (
          <select aria-label="Saring dusun" value={nilai.dusun || ''} onChange={(e) => ubah({ dusun: e.target.value })} className="field">
            <option value="">Semua dusun</option>
            {dusun.map((d) => <option key={d}>{d}</option>)}
          </select>
        ) : <span className="hidden lg:block" />}
      {adaSaringan
        ? <button type="button" onClick={() => { setTeks(''); ubah({ q: '', status: '', kategori: '', dusun: '' }); }}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface2 hover:text-ink"><IkonTutup aria-hidden />Reset</button>
        : <span className="hidden lg:block" />}
    </div>
  );
}
