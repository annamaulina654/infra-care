import { STATUS_GAYA } from '../../lib/constants.js';
import { LencanaStatus } from '../ui/Lencana.jsx';
import { tgl, cx } from '../../lib/format.js';

// Riwayat perubahan status dan tanggapan, terbaru di atas.
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
            <time className="text-xs text-muted">{tgl(l.created_at)}</time>
          </div>
          {l.catatan && <p className="mt-1.5 whitespace-pre-line text-sm">{l.catatan}</p>}
        </li>
      ))}
    </ol>
  );
}
