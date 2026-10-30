import { Link } from 'react-router-dom';
import { IkonKantor } from '../../lib/icons.js';
import { APP_NAME } from '../../config.js';
import { useDesa } from '../../context/DesaContext.jsx';
import { cx } from '../../lib/format.js';

// Lambang + nama aplikasi, dengan nama desa di bawahnya.
export default function Logo({ ke = '/', className, tampilDesa = true }) {
  const { desa } = useDesa();
  return (
    <Link to={ke} className={cx('flex min-w-0 items-center gap-2.5', className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <IkonKantor className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-base font-extrabold text-brand-deep">{APP_NAME}</span>
        {tampilDesa && <span className="block truncate text-xs text-muted">{desa}</span>}
      </span>
    </Link>
  );
}
