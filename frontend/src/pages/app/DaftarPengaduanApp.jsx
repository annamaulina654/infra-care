import Saringan from '../../components/complaints/Saringan.jsx';
import DaftarPengaduan from '../../components/complaints/DaftarPengaduan.jsx';
import Halaman from '../../components/ui/Halaman.jsx';
import Tombol from '../../components/ui/Tombol.jsx';
import { Kartu, JudulHalaman } from '../../components/ui/Kartu.jsx';
import { Memuat, Galat, Kosong } from '../../components/ui/Status.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useParamUrl } from '../../hooks/useParamUrl.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api, qs } from '../../lib/api.js';
import { MENU } from '../../lib/constants.js';
import { IkonDaftar, IkonCari, IkonTambah } from '../../lib/icons.js';
import { cx } from '../../lib/format.js';

const BATAS = 15;
const KELOMPOK = [['', 'Semua'], ['aktif', 'Berjalan'], ['selesai', 'Selesai'], ['ditolak', 'Ditolak']];

export default function DaftarPengaduanApp() {
  const { user } = useAuth();
  const { dusun } = useDesa();
  const judul = MENU[user.role].find(([ke]) => ke === '/app/pengaduan')[1];
  useJudul(judul);
  const [p, ubah] = useParamUrl(['q', 'status', 'kategori', 'dusun', 'kelompok']);
  const { data, loading, error, reload } = useFetch(
    () => api(`/complaints${qs({ q: p.q, status: p.status, kategori: p.kategori, dusun: p.dusun, kelompok: p.kelompok, page: p.page, limit: BATAS })}`),
    [p.q, p.status, p.kategori, p.dusun, p.kelompok, p.page],
  );
  const lihatDusun = user.role === 'admin' || user.role === 'kades';
  const adaSaringan = p.q || p.status || p.kategori || p.dusun || p.kelompok;

  return (
    <>
      <JudulHalaman ikon={IkonDaftar} judul={judul}
        ket={data ? `${data.total} pengaduan` : undefined}
        aksi={user.role === 'masyarakat' ? <Tombol ke="/app/buat" ikon={IkonTambah}>Buat Pengaduan</Tombol> : null} />

      <div role="tablist" aria-label="Kelompok" className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {KELOMPOK.map(([nilai, label]) => (
          <button key={nilai} type="button" role="tab" aria-selected={p.kelompok === nilai} onClick={() => ubah({ kelompok: nilai })}
            className={cx('min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors', p.kelompok === nilai ? 'bg-brand text-white' : 'bg-surface text-muted ring-1 ring-line hover:text-ink')}>{label}</button>
        ))}
      </div>

      <Saringan nilai={p} ubah={ubah} dusun={dusun} tampilDusun={lihatDusun} />

      <Kartu className="mt-5 p-0">
        {loading && !data && <Memuat />}
        {error && <Galat pesan={error} ulangi={reload} />}
        {data && data.data.length === 0 && (
          <Kosong ikon={IkonCari} judul={adaSaringan ? 'Tidak ada yang cocok' : 'Belum ada pengaduan'}
            teks={adaSaringan ? 'Coba ubah atau reset saringan.' : undefined}
            aksi={!adaSaringan && user.role === 'masyarakat' ? <Tombol ke="/app/buat" ikon={IkonTambah}>Buat Pengaduan</Tombol> : null} />
        )}
        {data && data.data.length > 0 && <DaftarPengaduan data={data.data} tampilPelapor={user.role !== 'masyarakat'} buatLink={(c) => `/app/pengaduan/${c.kode}`} />}
      </Kartu>
      {data && <Halaman className="mt-5" halaman={data.page} total={data.total} batas={BATAS} ubah={(n) => ubah({ page: String(n) })} />}
    </>
  );
}
