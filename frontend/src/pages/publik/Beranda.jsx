import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import { LencanaStatus } from '../../components/ui/Lencana.jsx';
import { Kartu } from '../../components/ui/Kartu.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { KATEGORI, KATEGORI_INFO } from '../../lib/constants.js';
import { IkonFormulir, IkonCari, IkonLacak, IkonPanah, IkonTahapan, IkonSukses, IkonDaftar, IkonTren, IkonAman, IkonPesan } from '../../lib/icons.js';
import { APP_NAME } from '../../config.js';
import { angka, tglPendek } from '../../lib/format.js';

const LANGKAH = [
  { ikon: IkonFormulir, judul: 'Laporkan', teks: 'Isi formulir singkat: apa yang rusak, di mana, dan seberapa mendesak. Foto boleh ditambahkan, tidak wajib.' },
  { ikon: IkonTahapan, judul: 'Diverifikasi & direncanakan', teks: 'Sekretaris desa memeriksa laporan, lalu memasukkannya ke perencanaan atau meneruskannya ke instansi terkait.' },
  { ikon: IkonSukses, judul: 'Pantau sampai selesai', teks: 'Setiap perubahan status tercatat dan Anda mendapat notifikasi. Siapa pun bisa melacak dengan kode pengaduan.' },
];

export default function Beranda() {
  useJudul('');
  const { user } = useAuth();
  const { desa } = useDesa();
  const nav = useNavigate();
  const [kode, setKode] = useState('');
  const { data: stat } = useFetch(() => api('/public/stats', { tanpaToken: true }).catch(() => null), []);
  const { data: terbaru } = useFetch(() => api('/public/complaints?limit=5', { tanpaToken: true }).catch(() => null), []);

  const lacak = (e) => {
    e.preventDefault();
    const k = kode.trim().toUpperCase();
    if (k) nav(`/lacak/${encodeURIComponent(k)}`);
  };

  const angkaStat = [
    { label: 'Pengaduan masuk', nilai: stat?.total, ikon: IkonDaftar },
    { label: 'Sedang diproses', nilai: stat?.proses, ikon: IkonTren },
    { label: 'Sudah selesai', nilai: stat?.selesai, ikon: IkonSukses },
  ];

  return (
    <>
      <section>
        <div className="relative h-52 overflow-hidden bg-brand-deep sm:h-72 lg:h-80">
          <img src="/hero.jpg" alt="" className="size-full object-cover object-[50%_30%]" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-deep/40" aria-hidden />
        </div>
        <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 sm:-mt-24 sm:px-6">
          <div className="card grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand"><IkonAman className="size-3.5" aria-hidden />Layanan resmi {desa}</p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-brand-deep sm:text-4xl">Jalan rusak, lampu mati, air macet? Lapor, dan pantau sampai beres.</h1>
              <p className="mt-4 max-w-xl text-base text-muted">{APP_NAME} menghubungkan warga dengan pemerintah desa. Laporan Anda tercatat, ada kodenya, dan perkembangannya bisa dilihat siapa saja.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Tombol ke={user ? '/app/buat' : '/login?daftar=1'} ukuran="lg" ikon={IkonFormulir}>Buat Pengaduan</Tombol>
                <Tombol ke="/pengaduan" ukuran="lg" varian="garis" ikon={IkonCari}>Lihat Pengaduan Warga</Tombol>
              </div>
            </div>
            <form onSubmit={lacak} className="rounded-2xl bg-surface2 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-bold"><IkonLacak className="size-5 text-brand" aria-hidden />Lacak pengaduan</h2>
              <p className="mt-1 text-sm text-muted">Masukkan kode yang Anda terima setelah melapor.</p>
              <label htmlFor="kode" className="sr-only">Kode pengaduan</label>
              <input id="kode" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="ADU-2026-00001" className="field mt-4 uppercase" autoComplete="off" />
              <Tombol type="submit" penuh className="mt-3" ikon={IkonCari}>Lacak</Tombol>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          {angkaStat.map(({ label, nilai, ikon: Ikon }) => (
            <div key={label} className="card flex items-center gap-4 p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Ikon className="size-6" aria-hidden /></span>
              <div><dd className="text-3xl font-extrabold leading-none">{nilai == null ? '-' : angka(nilai)}</dd><dt className="mt-1 text-sm text-muted">{label}</dt></div>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-brand-deep">Bagaimana cara kerjanya</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {LANGKAH.map(({ ikon: Ikon, judul, teks }, i) => (
            <li key={judul} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-brand text-white"><Ikon className="size-5" aria-hidden /></span>
                <span className="text-sm font-bold text-muted">Langkah {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{judul}</h3>
              <p className="mt-1.5 text-sm text-muted">{teks}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-brand-deep">Yang bisa dilaporkan</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {KATEGORI.map((k) => {
            const { ikon: Ikon, ket } = KATEGORI_INFO[k];
            return (
              <li key={k} className="card flex gap-3.5 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Ikon className="size-5" aria-hidden /></span>
                <div><h3 className="text-sm font-bold">{k}</h3><p className="mt-0.5 text-xs text-muted">{ket}</p></div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight text-brand-deep">Pengaduan terbaru</h2>
          <Link to="/pengaduan" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">Lihat semua<IkonPanah className="size-4" aria-hidden /></Link>
        </div>
        <Kartu className="p-0">
          {terbaru?.data?.length
            ? (
              <ul className="divide-y divide-line">
                {terbaru.data.map((c) => (
                  <li key={c.kode}>
                    <Link to={`/lacak/${c.kode}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-surface2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="min-w-0"><span className="block truncate font-semibold">{c.judul}</span><span className="text-xs text-muted">{c.kode} · {c.dusun} · {tglPendek(c.created_at)}</span></span>
                      <LencanaStatus status={c.status} className="self-start" />
                    </Link>
                  </li>
                ))}
              </ul>
            )
            : <p className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted"><IkonPesan aria-hidden />Belum ada pengaduan yang ditampilkan.</p>}
        </Kartu>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><IkonAman className="size-3.5" aria-hidden />Daftar publik tidak menampilkan nama pelapor, foto, maupun alamat lengkap.</p>
      </section>
    </>
  );
}
