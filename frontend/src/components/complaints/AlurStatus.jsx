import { ALUR, STATUS_GAYA } from '../../lib/constants.js';
import { IkonCentang, IkonTeruskan, IkonTolak } from '../../lib/icons.js';
import { cx } from '../../lib/format.js';

// Garis kemajuan: Diterima → Diverifikasi → Masuk Perencanaan → Dalam Perbaikan → Selesai.
// Status khusus (diteruskan / ditolak) ditampilkan sebagai kotak tersendiri di bawahnya.
export default function AlurStatus({ status }) {
  const khusus = status === 'Diteruskan ke Instansi' || status === 'Ditolak';
  const idx = ALUR.indexOf(status);
  return (
    <div>
      <ol className="grid grid-cols-5 gap-1" aria-label="Tahapan pengaduan">
        {ALUR.map((s, i) => {
          const sudah = idx >= 0 && i < idx;
          const kini = i === idx;
          return (
            <li key={s} className="relative flex flex-col items-center text-center" aria-current={kini ? 'step' : undefined}>
              {i > 0 && <span aria-hidden className={cx('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2', (sudah || kini) ? 'bg-brand' : 'bg-line')} />}
              <span className={cx('relative z-10 grid size-8 place-items-center rounded-full border-2 text-xs font-bold',
                sudah ? 'border-brand bg-brand text-white' : kini ? 'border-brand bg-surface text-brand ring-4 ring-brand/20' : 'border-line bg-surface text-muted')}>
                {sudah ? <IkonCentang aria-hidden /> : i + 1}
              </span>
              <span className={cx('mt-2 text-[11px] font-semibold leading-tight sm:text-xs', kini ? 'text-brand' : 'text-muted')}>{s}</span>
            </li>
          );
        })}
      </ol>
      {khusus && (
        <p className={cx('mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold', STATUS_GAYA[status].badge)}>
          {status === 'Ditolak' ? <IkonTolak aria-hidden /> : <IkonTeruskan aria-hidden />}
          {status === 'Ditolak' ? 'Pengaduan ini ditolak.' : 'Pengaduan ini diteruskan ke instansi terkait.'}
        </p>
      )}
    </div>
  );
}
