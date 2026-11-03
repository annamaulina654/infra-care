import { STATUS_GAYA, LABEL_FOTO } from '../../lib/constants.js';
import { LencanaStatus } from '../ui/Lencana.jsx';
import { tgl, cx } from '../../lib/format.js';

// Riwayat perubahan status dan tanggapan, terbaru di atas.
const PENGIRIM = {
  sistem: 'Sistem',
  masyarakat: 'Warga',
  warga: 'Warga',
  perangkat: 'Perangkat Desa',
  admin: 'Sekretaris Desa',
  kades: 'Kepala Desa',
};

export default function RiwayatLog({ logs = [] }) {
  if (!logs.length) return <p className="text-sm text-muted">Belum ada riwayat.</p>;
  const urut = [...logs].reverse();
  return (
    <ol className="relative space-y-5 border-l-2 border-line pl-6">
      {urut.map((l, i) => (
        <li key={i} className="relative">
          <span aria-hidden className={cx('absolute -left-[31px] top-1 size-3 rounded-full ring-4 ring-surface')} style={{ background: STATUS_GAYA[l.status]?.warna || '#64748b' }} />
          <div className="flex flex-wrap items-center gap-2">
            <LencanaStatus status={l.status} />
            {PENGIRIM[l.oleh] && <span className="text-xs font-semibold text-muted">oleh {PENGIRIM[l.oleh]}</span>}
            <time className="text-xs text-muted">{tgl(l.created_at)}</time>
          </div>
          {l.catatan && <p className="mt-1.5 whitespace-pre-line text-sm">{l.catatan}</p>}
          {l.foto && (
            <figure className="mt-2">
              <img src={l.foto} alt={LABEL_FOTO[l.status] || 'Bukti foto'} className="max-h-64 w-full rounded-xl object-cover border border-line" />
              <figcaption className="mt-1 text-xs font-semibold text-muted">{LABEL_FOTO[l.status] || 'Bukti foto'}</figcaption>
            </figure>
          )}
        </li>
      ))}
    </ol>
  );
}
