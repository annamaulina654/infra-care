import { Kartu, JudulHalaman } from '../../components/ui/Kartu.jsx';
import Tombol from '../../components/ui/Tombol.jsx';
import { Memuat, Galat, Kosong } from '../../components/ui/Status.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { IkonLonceng, IkonCentang, IkonPesan } from '../../lib/icons.js';
import { tgl, cx } from '../../lib/format.js';

export default function Notifikasi() {
  useJudul('Notifikasi');
  const { data, loading, error, reload } = useFetch(() => api('/notifications'), []);
  const belum = (data || []).filter((n) => !n.dibaca).length;
  const tandai = async () => { await api('/notifications/read-all', { method: 'POST' }).catch(() => {}); reload(); };

  return (
    <>
      <JudulHalaman ikon={IkonLonceng} judul="Notifikasi" ket={data ? (belum ? `${belum} belum dibaca` : 'Semua sudah dibaca') : undefined}
        aksi={belum > 0 ? <Tombol varian="garis" ikon={IkonCentang} onClick={tandai}>Tandai semua dibaca</Tombol> : null} />
      <Kartu className="p-0">
        {loading && !data && <Memuat />}
        {error && <Galat pesan={error} ulangi={reload} />}
        {data && data.length === 0 && <Kosong ikon={IkonLonceng} judul="Belum ada notifikasi" teks="Pemberitahuan tentang pengaduan Anda akan muncul di sini." />}
        {data && data.length > 0 && (
          <ul className="divide-y divide-line">
            {data.map((n) => (
              <li key={n.id} className={cx('flex gap-3.5 px-5 py-4', !n.dibaca && 'bg-brand-soft/60')}>
                <span className={cx('mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl', n.dibaca ? 'bg-surface2 text-muted' : 'bg-brand text-white')}><IkonPesan className="size-4" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.judul}</p>
                  <p className="mt-0.5 text-sm text-muted">{n.isi}</p>
                  <time className="mt-1 block text-xs text-muted">{tgl(n.created_at)}</time>
                </div>
                {!n.dibaca && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand" aria-label="Belum dibaca" />}
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </>
  );
}
