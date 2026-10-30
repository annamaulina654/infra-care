import { IkonMatahari, IkonBulan } from '../../lib/icons.js';
import { useTheme } from '../../hooks/useTheme.js';
import { cx } from '../../lib/format.js';

export default function TombolTema({ className }) {
  const { gelap, ganti } = useTheme();
  return (
    <button type="button" onClick={ganti} aria-label={gelap ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      className={cx('grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-surface2 hover:text-ink', className)}>
      {gelap ? <IkonMatahari aria-hidden /> : <IkonBulan aria-hidden />}
    </button>
  );
}
