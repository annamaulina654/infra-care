import { lazy, Suspense } from 'react';
import { Kartu, JudulHalaman } from '../../components/ui/Kartu.jsx';
import { Memuat, Galat, Kosong } from '../../components/ui/Status.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { STATUS, STATUS_GAYA } from '../../lib/constants.js';
import { IkonPeta, IkonLokasi } from '../../lib/icons.js';

const PetaPengaduan = lazy(() => import('../../components/map/PetaPengaduan.jsx'));

export default function PetaHalaman() {
  useJudul('Peta Pengaduan');
  const { data, loading, error, reload } = useFetch(() => api('/complaints/map'), []);
  return (
    <>
      <JudulHalaman ikon={IkonPeta} judul="Peta Pengaduan" ket={data ? `${data.length} pengaduan memiliki titik lokasi` : undefined} />
      {loading && !data && <Memuat />}
      {error && <Galat pesan={error} ulangi={reload} />}
      {data && data.length === 0 && <Kartu><Kosong ikon={IkonLokasi} judul="Belum ada titik lokasi" teks="Pengaduan yang disertai titik peta akan muncul di sini." /></Kartu>}
      {data && data.length > 0 && (
        <>
          <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted" aria-label="Keterangan warna">
            {STATUS.map((s) => <li key={s} className="flex items-center gap-1.5"><span className="size-3 rounded-full" style={{ background: STATUS_GAYA[s].warna }} aria-hidden />{s}</li>)}
          </ul>
          <Suspense fallback={<Memuat className="h-80" />}><PetaPengaduan data={data} /></Suspense>
        </>
      )}
    </>
  );
}
