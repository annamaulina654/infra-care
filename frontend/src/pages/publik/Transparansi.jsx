import Saringan from '../../components/complaints/Saringan.jsx';
import DaftarPengaduan from '../../components/complaints/DaftarPengaduan.jsx';
import Halaman from '../../components/ui/Halaman.jsx';
import { Kartu } from '../../components/ui/Kartu.jsx';
import { Memuat, Galat, Kosong } from '../../components/ui/Status.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useParamUrl } from '../../hooks/useParamUrl.js';
import { useJudul } from '../../hooks/useMisc.js';
import { useDesa } from '../../context/DesaContext.jsx';
import { api, qs } from '../../lib/api.js';
import { IkonAman, IkonCari } from '../../lib/icons.js';

const BATAS = 12;

// Daftar pengaduan yang boleh dilihat siapa saja (tanpa data pribadi) sebagai bentuk keterbukaan.
export default function Transparansi() {
  useJudul('Pengaduan Warga');
  const { dusun } = useDesa();
  const [p, ubah] = useParamUrl(['q', 'status', 'kategori', 'dusun']);
  const { data, loading, error, reload } = useFetch(
    () => api(`/public/complaints${qs({ q: p.q, status: p.status, kategori: p.kategori, dusun: p.dusun, page: p.page, limit: BATAS })}`, { tanpaToken: true }),
    [p.q, p.status, p.kategori, p.dusun, p.page],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-extrabold tracking-tight text-brand-deep sm:text-3xl">Pengaduan Warga</h1>
      <p className="mt-2 flex items-start gap-2 text-muted"><IkonAman className="mt-1 size-4 shrink-0" aria-hidden />Semua pengaduan ditampilkan terbuka. Nama pelapor, foto, dan alamat lengkap tidak dimuat di daftar ini.</p>

      <div className="mt-6"><Saringan nilai={p} ubah={ubah} dusun={dusun} /></div>

      <Kartu className="mt-6 p-0">
        {loading && !data && <Memuat />}
        {error && <Galat pesan={error} ulangi={reload} />}
        {data && data.data.length === 0 && <Kosong ikon={IkonCari} judul="Tidak ada pengaduan" teks="Coba ubah kata kunci atau saringan Anda." />}
        {data && data.data.length > 0 && <DaftarPengaduan data={data.data} buatLink={(c) => `/lacak/${c.kode}`} />}
      </Kartu>
      {data && <Halaman className="mt-5" halaman={data.page} total={data.total} batas={BATAS} ubah={(n) => ubah({ page: String(n) })} />}
    </div>
  );
}
