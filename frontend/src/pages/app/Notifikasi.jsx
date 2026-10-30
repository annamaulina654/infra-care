import { Link } from 'react-router-dom';
import { Kartu, JudulHalaman } from '../../components/ui/Kartu.jsx';
import Tombol from '../../components/ui/Tombol.jsx';
import { Memuat, Galat, Kosong } from '../../components/ui/Status.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { IkonLonceng, IkonCentang, IkonPesan, IkonPanah } from '../../lib/icons.js';
import { tgl, cx } from '../../lib/format.js';

const POLA_KODE = /ADU-\d{4}-\d{5}/;

// Beri tahu lonceng di topbar agar menghitung ulang jumlah yang belum dibaca.
const kabari = () => window.dispatchEvent(new Event('notif-berubah'));

export default function Notifikasi() {
  useJudul('Notifikasi');
  const { data, loading, error, reload } = useFetch(() => api('/notifications'), []);
  const belum = (data || []).filter((n) => !n.dibaca).length;

  const tandaiSatu = async (n) => {
    if (n.dibaca) return;
    await api(`/notifications/${n.id}/read`, { method: 'POST' }).catch(() => {});
    kabari();
    reload();
  };
  const tandaiSemua = async () => {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
    kabari();
    reload();
  };

  return (
    <>
      <JudulHalaman ikon={IkonLonceng} judul="Notifikasi" ket={data ? (belum ? `${belum} belum dibaca` : 'Semua sudah dibaca') : undefined}
        aksi={belum > 0 ? <Tombol varian="garis" ikon={IkonCentang} onClick={tandaiSemua}>Tandai semua dibaca</Tombol> : null} />
      <Kartu className="p-0">
        {loading && !data && <Memuat />}
        {error && <Galat pesan={error} ulangi={reload} />}
        {data && data.length === 0 && <Kosong ikon={IkonLonceng} judul="Belum ada notifikasi" teks="Pemberitahuan tentang pengaduan Anda akan muncul di sini." />}
        {data && data.length > 0 && (
          <ul className="divide-y divide-line">
            {data.map((n) => {
              const kode = (n.isi || '').match(POLA_KODE)?.[0];
              const isi = (
                <>
                  <span className={cx('mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl', n.dibaca ? 'bg-surface2 text-muted' : 'bg-brand text-white')}><IkonPesan className="size-4" aria-hidden /></span>
                  <span className="min-w-0 flex-1">
                    <span className={cx('block', n.dibaca ? 'font-medium' : 'font-bold')}>{n.judul}</span>
                    <span className="mt-0.5 block text-sm text-muted">{n.isi}</span>
                    <time className="mt-1 block text-xs text-muted">{tgl(n.created_at)}</time>
                    {kode && <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand">Buka pengaduan<IkonPanah className="size-3.5" aria-hidden /></span>}
                  </span>
                </>
              );
              return (
                <li key={n.id} className={cx('flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-3.5', !n.dibaca && 'bg-brand-soft/60')}>
                  {kode
                    ? <Link to={`/app/pengaduan/${kode}`} onClick={() => tandaiSatu(n)} className="flex min-w-0 flex-1 gap-3.5">{isi}</Link>
                    : <div className="flex min-w-0 flex-1 gap-3.5">{isi}</div>}
                  {!n.dibaca && (
                    <button type="button" onClick={() => tandaiSatu(n)} aria-label={`Tandai dibaca: ${n.judul}`}
                      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-muted hover:bg-surface2 hover:text-ink">
                      <IkonCentang aria-hidden />Tandai dibaca
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Kartu>
    </>
  );
}
