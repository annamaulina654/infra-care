import { Link } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import { Kartu, JudulKartu, JudulHalaman, KartuStat } from '../../components/ui/Kartu.jsx';
import { LencanaStatus } from '../../components/ui/Lencana.jsx';
import { Memuat, Galat, Kosong } from '../../components/ui/Status.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { ROLE_LABEL, KATEGORI_INFO, PENGELOLA } from '../../lib/constants.js';
import { IkonBeranda, IkonDaftar, IkonJam, IkonPengerjaan, IkonSukses, IkonTambah, IkonFormulir, IkonTeruskan, IkonKosong, IkonPerencanaan } from '../../lib/icons.js';
import { angka, tglPendek, cx } from '../../lib/format.js';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function BatangHarian({ data }) {
  const maks = Math.max(1, ...data.map((d) => d.n));
  return (
    <div className="flex h-40 items-end gap-2 sm:gap-3" role="img" aria-label={`Pengaduan 7 hari terakhir: ${data.map((d) => `${d.hari}: ${d.n}`).join(', ')}`}>
      {data.map((d) => (
        <div key={d.hari} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-xs font-semibold">{d.n}</span>
          <div className={cx('w-full rounded-t-lg', d.n ? 'bg-brand' : 'bg-line')} style={{ height: `${Math.max(d.n ? 8 : 3, (d.n / maks) * 100)}%` }} />
          <span className="text-center text-[11px] leading-tight text-muted">{HARI[new Date(d.hari + 'T12:00:00').getDay()]}<br />{Number(d.hari.slice(8))}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  useJudul('Dashboard');
  const { user } = useAuth();
  const kelola = PENGELOLA.includes(user.role);
  const stat = useFetch(() => api('/stats'), []);
  const terbaru = useFetch(() => api('/complaints?limit=5'), []);

  const s = stat.data;
  const judulDaftar = user.role === 'masyarakat' ? 'Pengaduan terakhir Anda' : 'Pengaduan terbaru';

  return (
    <>
      <JudulHalaman ikon={IkonBeranda} judul={`Halo, ${user.nama.split(' ')[0]}`}
        ket={`${ROLE_LABEL[user.role]}${user.dusun ? ` · ${user.dusun}` : ''}`}
        aksi={user.role === 'masyarakat' ? <Tombol ke="/app/buat" ikon={IkonTambah}>Buat Pengaduan</Tombol>
          : user.role === 'perangkat' ? <Tombol ke="/app/buat" ikon={IkonFormulir}>Lapor atas nama warga</Tombol> : null} />

      {stat.loading && !s && <Memuat />}
      {stat.error && <Galat pesan={stat.error} ulangi={stat.reload} />}

      {s && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KartuStat label="Total pengaduan" nilai={angka(s.total)} ikon={IkonDaftar} ke="/app/pengaduan" />
            <KartuStat label="Masih berjalan" nilai={angka(s.aktif)} ikon={IkonJam} warna="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200" ke="/app/pengaduan?kelompok=aktif" />
            <KartuStat label={kelola ? 'Dalam perbaikan' : 'Dalam perencanaan'} nilai={angka(kelola ? s.perbaikan : s.perencanaan)} ikon={kelola ? IkonPengerjaan : IkonPerencanaan} warna="bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200" />
            <KartuStat label="Selesai" nilai={angka(s.selesai)} ikon={IkonSukses} warna="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" ke="/app/pengaduan?kelompok=selesai" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Kartu className="lg:col-span-3">
              <JudulKartu judul="Pengaduan 7 hari terakhir" />
              <BatangHarian data={s.harian} />
            </Kartu>
            <Kartu className="lg:col-span-2">
              <JudulKartu judul="Menurut kategori" />
              {s.kategori.length === 0
                ? <p className="text-sm text-muted">Belum ada data.</p>
                : <ul className="space-y-3">
                    {s.kategori.map((k) => {
                      const Ikon = KATEGORI_INFO[k.kategori]?.ikon;
                      return (
                        <li key={k.kategori}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2">{Ikon && <Ikon className="size-4 shrink-0 text-brand" aria-hidden />}<span className="truncate">{k.kategori}</span></span><b>{k.n}</b></div>
                          <div className="h-2 rounded-full bg-surface2"><div className="h-2 rounded-full bg-brand" style={{ width: `${(k.n / s.total) * 100}%` }} /></div>
                        </li>
                      );
                    })}
                  </ul>}
            </Kartu>
          </div>

          {kelola && s.diteruskan > 0 && (
            <p className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200">
              <IkonTeruskan aria-hidden />{s.diteruskan} pengaduan sedang diteruskan ke instansi terkait.
            </p>
          )}
        </>
      )}

      <Kartu className="mt-6 p-0">
        <div className="px-5 pt-5"><JudulKartu judul={judulDaftar} ke="/app/pengaduan" /></div>
        {terbaru.loading && !terbaru.data && <Memuat />}
        {terbaru.data && terbaru.data.data.length === 0 && (
          <Kosong ikon={IkonKosong} judul="Belum ada pengaduan" teks={user.role === 'masyarakat' ? 'Lihat sesuatu yang rusak di desa? Laporkan sekarang.' : undefined}
            aksi={user.role === 'masyarakat' ? <Tombol ke="/app/buat" ikon={IkonTambah}>Buat Pengaduan</Tombol> : null} />
        )}
        {terbaru.data && terbaru.data.data.length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {terbaru.data.data.map((c) => (
              <li key={c.kode}>
                <Link to={`/app/pengaduan/${c.kode}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-surface2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0"><span className="block truncate font-semibold">{c.judul}</span><span className="text-xs text-muted">{c.kode} · {c.dusun} · {tglPendek(c.created_at)}</span></span>
                  <LencanaStatus status={c.status} className="self-start" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </>
  );
}
