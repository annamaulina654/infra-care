import { useState } from 'react';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import { Kartu, JudulHalaman, KartuStat } from '../../components/ui/Kartu.jsx';
import { Memuat, Galat, Pesan } from '../../components/ui/Status.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api, qs, unduh } from '../../lib/api.js';
import { IkonLaporan, IkonExcel, IkonCetak, IkonDaftar, IkonSukses, IkonJam } from '../../lib/icons.js';
import { angka, tglPendek } from '../../lib/format.js';

function Tabel({ judul, kolom, baris }) {
  return (
    <Kartu className="break-inside-avoid">
      <h2 className="mb-3 text-base font-bold">{judul}</h2>
      {baris.length === 0
        ? <p className="text-sm text-muted">Tidak ada data.</p>
        : <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="py-2 font-semibold">{kolom}</th><th className="py-2 text-right font-semibold">Jumlah</th></tr></thead>
            <tbody className="divide-y divide-line">{baris.map(([k, n]) => <tr key={k}><td className="py-2">{k}</td><td className="py-2 text-right font-bold">{angka(n)}</td></tr>)}</tbody>
          </table>}
    </Kartu>
  );
}

export default function Laporan() {
  useJudul('Laporan');
  const { desa } = useDesa();
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const [galatUnduh, setGalatUnduh] = useState('');
  const { data: r, loading, error, reload } = useFetch(() => api(`/reports/summary${qs({ dari, sampai })}`), [dari, sampai]);

  const periode = dari || sampai ? `${dari ? tglPendek(dari) : 'awal'} s.d. ${sampai ? tglPendek(sampai) : 'sekarang'}` : 'Semua waktu';
  const selesai = r?.per_status.find((s) => s.status === 'Selesai')?.n || 0;

  const csv = async () => {
    setGalatUnduh('');
    try { await unduh(`/reports/export.csv${qs({ dari, sampai })}`, 'laporan-pengaduan.csv'); } catch (e) { setGalatUnduh(e.message); }
  };

  return (
    <>
      <div className="no-print">
        <JudulHalaman ikon={IkonLaporan} judul="Laporan" ket="Ringkasan pengaduan untuk rapat dan pelaporan."
          aksi={<><Tombol varian="garis" ikon={IkonExcel} onClick={csv}>Unduh CSV</Tombol><Tombol ikon={IkonCetak} onClick={() => window.print()}>Cetak / PDF</Tombol></>} />
        <Kartu className="mb-6 grid gap-4 sm:grid-cols-2">
          <Bidang label="Dari tanggal" id="dari"><input id="dari" type="date" value={dari} max={sampai || undefined} onChange={(e) => setDari(e.target.value)} className="field" /></Bidang>
          <Bidang label="Sampai tanggal" id="sampai"><input id="sampai" type="date" value={sampai} min={dari || undefined} onChange={(e) => setSampai(e.target.value)} className="field" /></Bidang>
        </Kartu>
        {galatUnduh && <Pesan jenis="galat" className="mb-4">{galatUnduh}</Pesan>}
      </div>

      <div className="print-only mb-6">
        <h1 className="text-2xl font-extrabold">Laporan Pengaduan Infrastruktur</h1>
        <p>{desa} · Periode: {periode}</p>
      </div>

      {loading && !r && <Memuat />}
      {error && <Galat pesan={error} ulangi={reload} />}
      {r && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <KartuStat label="Total pengaduan" nilai={angka(r.total)} ikon={IkonDaftar} ket={periode} />
            <KartuStat label="Selesai" nilai={angka(selesai)} ikon={IkonSukses} warna="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" />
            <KartuStat label="Rata-rata waktu selesai" nilai={r.rata_hari_selesai == null ? '-' : `${String(r.rata_hari_selesai).replace('.', ',')} hari`} ikon={IkonJam} warna="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Tabel judul="Menurut status" kolom="Status" baris={r.per_status.map((s) => [s.status, s.n])} />
            <Tabel judul="Menurut kategori" kolom="Kategori" baris={r.per_kategori.map((s) => [s.kategori, s.n])} />
            <Tabel judul="Menurut dusun" kolom="Dusun" baris={r.per_dusun.map((s) => [s.dusun, s.n])} />
            <Tabel judul="Diteruskan ke instansi" kolom="Instansi" baris={r.per_instansi.map((s) => [s.instansi, s.n])} />
          </div>
        </div>
      )}
    </>
  );
}
