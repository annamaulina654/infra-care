import { STATUS_GAYA, URGENSI_GAYA } from '../../lib/constants.js';
import { cx } from '../../lib/format.js';

const DASAR = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold';

export function LencanaStatus({ status, className }) {
  const g = STATUS_GAYA[status] || STATUS_GAYA.Diterima;
  const Ikon = g.ikon;
  return (
    <span className={cx(DASAR, g.badge, className)}>
      <Ikon aria-hidden className="size-3.5" />
      {status}
    </span>
  );
}

export function LencanaUrgensi({ urgensi, className }) {
  const g = URGENSI_GAYA[urgensi];
  return <span className={cx(DASAR, g?.badge, className)}>{urgensi}</span>;
}

// Lencana netral (peran, kategori, dst.).
export function Lencana({ children, className }) {
  return <span className={cx(DASAR, 'bg-brand-soft text-brand', className)}>{children}</span>;
}
