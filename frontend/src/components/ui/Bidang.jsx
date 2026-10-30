import { cx } from '../../lib/format.js';

// Pembungkus isian formulir: label, petunjuk, dan pesan kesalahan yang terhubung ke isiannya.
// Pakai class "field" pada <input>/<select>/<textarea> di dalamnya.
export default function Bidang({ label, id, wajib, petunjuk, galat, className, children }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
          {label}
          {wajib && <span className="text-red-500" aria-hidden> *</span>}
        </label>
      )}
      {children}
      {petunjuk && !galat && <p className="mt-1.5 text-xs text-muted">{petunjuk}</p>}
      {galat && <p role="alert" className={cx('mt-1.5 text-xs font-medium text-red-600 dark:text-red-400')}>{galat}</p>}
    </div>
  );
}
