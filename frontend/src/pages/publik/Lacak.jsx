import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import { Kartu } from '../../components/ui/Kartu.jsx';
import { LencanaStatus, LencanaUrgensi } from '../../components/ui/Lencana.jsx';
import { Memuat, Kosong } from '../../components/ui/Status.jsx';
import AlurStatus from '../../components/complaints/AlurStatus.jsx';
import RiwayatLog from '../../components/complaints/RiwayatLog.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { IkonCari, IkonLacak, IkonLokasi, IkonTeruskan } from '../../lib/icons.js';
import { KATEGORI_INFO } from '../../lib/constants.js';
import { tgl } from '../../lib/format.js';

export default function Lacak() {
  const { kode } = useParams();
  useJudul(kode ? `Lacak ${kode}` : 'Lacak Pengaduan');
  const nav = useNavigate();
  const [isi, setIsi] = useState(kode || '');
  const { data, loading, error } = useFetch(
    () => (kode ? api(`/public/complaints/${encodeURIComponent(kode)}`, { tanpaToken: true }) : Promise.resolve(null)),
    [kode],
  );

  const cari = (e) => {
    e.preventDefault();
    const k = isi.trim().toUpperCase();
    if (k) nav(`/lacak/${encodeURIComponent(k)}`);
  };
  const Ikon = data && KATEGORI_INFO[data.kategori]?.ikon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-brand-deep sm:text-3xl"><IkonLacak className="size-7 text-brand" aria-hidden />Lacak Pengaduan</h1>
      <p className="mt-2 text-muted">Masukkan kode pengaduan untuk melihat tahap penanganannya. Tidak perlu masuk akun.</p>

      <form onSubmit={cari} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="kode" className="sr-only">Kode pengaduan</label>
        <input id="kode" value={isi} onChange={(e) => setIsi(e.target.value)} placeholder="Contoh: ADU-2026-00001" className="field uppercase sm:flex-1" autoComplete="off" />
        <Tombol type="submit" ikon={IkonCari}>Lacak</Tombol>
      </form>

      <div className="mt-8">
        {kode && loading && <Memuat />}
        {kode && error && (
          <Kartu><Kosong judul="Pengaduan tidak ditemukan" teks={`Kode "${kode}" tidak terdaftar. Periksa kembali penulisannya.`} /></Kartu>
        )}
        {data && (
          <div className="space-y-5">
            <Kartu>
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">{Ikon && <Ikon className="size-6" aria-hidden />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted">{data.kode}</p>
                  <h2 className="text-xl font-extrabold leading-snug">{data.judul}</h2>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2"><LencanaStatus status={data.status} /><LencanaUrgensi urgensi={data.urgensi} /></div>
                  <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-muted"><IkonLokasi className="size-4" aria-hidden /><dt className="sr-only">Dusun</dt><dd>{data.dusun}</dd></div>
                    <div className="text-muted"><dt className="inline">Dilaporkan: </dt><dd className="inline">{tgl(data.created_at)}</dd></div>
                    <div className="text-muted"><dt className="inline">Kategori: </dt><dd className="inline">{data.kategori}</dd></div>
                    <div className="text-muted"><dt className="inline">Diperbarui: </dt><dd className="inline">{tgl(data.updated_at)}</dd></div>
                    {data.instansi && <div className="flex items-center gap-2 font-semibold sm:col-span-2"><IkonTeruskan className="size-4 text-brand" aria-hidden /><dt className="font-normal text-muted">Diteruskan ke:</dt><dd>{data.instansi}</dd></div>}
                  </dl>
                </div>
              </div>
            </Kartu>
            <Kartu><h2 className="mb-5 text-base font-bold">Tahapan</h2><AlurStatus status={data.status} /></Kartu>
            <Kartu><h2 className="mb-5 text-base font-bold">Riwayat</h2><RiwayatLog logs={data.logs} /></Kartu>
          </div>
        )}
        {!kode && <p className="text-center text-sm text-muted">Belum punya kode? <Link to="/login?daftar=1" className="font-semibold text-brand hover:underline">Buat pengaduan</Link> dan kode akan muncul setelah terkirim.</p>}
      </div>
    </div>
  );
}
