import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import TombolTema from './TombolTema.jsx';
import { Avatar } from '../ui/Kartu.jsx';
import Dialog from '../ui/Dialog.jsx';
import Tombol from '../ui/Tombol.jsx';
import { IkonMenu, IkonTutup, IkonLonceng, IkonKeluar, IkonBeranda } from '../../lib/icons.js';
import { MENU, ROLE_LABEL } from '../../lib/constants.js';
import { api } from '../../lib/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { APP_NAME } from '../../config.js';
import { cx } from '../../lib/format.js';

const kelasMenu = ({ isActive }) =>
  cx('flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors',
    isActive ? 'bg-brand text-white shadow-sm' : 'text-muted hover:bg-surface2 hover:text-ink');

function Menu({ peran, tutup }) {
  return (
    <nav aria-label="Menu aplikasi" className="flex flex-col gap-1">
      {(MENU[peran] || []).map(([ke, label, Ikon, akhir]) => (
        <NavLink key={ke} to={ke} end={!!akhir} onClick={tutup} className={kelasMenu}>
          <Ikon className="size-5 shrink-0" aria-hidden />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// Kerangka area setelah masuk: sidebar tetap di layar lebar (lg ke atas), laci geser di bawahnya.
export default function LayoutApp() {
  const { user, keluar } = useAuth();
  const { pathname } = useLocation();
  const [laci, setLaci] = useState(false);
  const [tanyaKeluar, setTanyaKeluar] = useState(false);

  // Jumlah notifikasi belum dibaca; dimuat ulang tiap pindah halaman.
  const { data: notif, reload: muatNotif } = useFetch(() => api('/notifications').catch(() => []), [pathname]);
  useEffect(() => {
    window.addEventListener('notif-berubah', muatNotif);
    return () => window.removeEventListener('notif-berubah', muatNotif);
  }, [muatNotif]);
  const belumDibaca = (notif || []).filter((n) => !n.dibaca).length;

  useEffect(() => { setLaci(false); }, [pathname]);
  useEffect(() => {
    if (!laci) return undefined;
    const tekan = (e) => { if (e.key === 'Escape') setLaci(false); };
    window.addEventListener('keydown', tekan);
    return () => window.removeEventListener('keydown', tekan);
  }, [laci]);

  const panel = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
        <Logo ke="/app" />
        <button type="button" aria-label="Tutup menu" onClick={() => setLaci(false)}
          className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface2 lg:hidden"><IkonTutup aria-hidden /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3"><Menu peran={user.role} tutup={() => setLaci(false)} /></div>
      <div className="shrink-0 space-y-1 border-t border-line p-3">
        <Link to="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-muted hover:bg-surface2 hover:text-ink">
          <IkonBeranda className="size-5" aria-hidden />Halaman Depan
        </Link>
        <button type="button" onClick={() => { setLaci(false); setTanyaKeluar(true); }}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
          <IkonKeluar className="size-5" aria-hidden />Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">{panel}</aside>

      {laci && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/55" onClick={() => setLaci(false)} aria-hidden />
          <aside role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-2xl">{panel}</aside>
        </div>
      )}

      <Dialog buka={tanyaKeluar} tutup={() => setTanyaKeluar(false)} judul="Keluar dari akun?" lebar="max-w-sm">
        <p className="text-sm text-muted">Anda akan keluar dari {APP_NAME}. Untuk masuk lagi, Anda perlu memasukkan email dan kata sandi.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Tombol varian="garis" onClick={() => setTanyaKeluar(false)}>Batal</Tombol>
          <Tombol varian="bahaya" ikon={IkonKeluar} onClick={() => { setTanyaKeluar(false); keluar(); }}>Ya, keluar</Tombol>
        </div>
      </Dialog>

      <div className="lg:pl-64">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button type="button" aria-label="Buka menu" aria-expanded={laci} onClick={() => setLaci(true)}
              className="grid size-10 place-items-center rounded-xl text-ink hover:bg-surface2 lg:hidden"><IkonMenu aria-hidden /></button>
            <Link to="/app" className="min-w-0 truncate text-base font-extrabold text-brand-deep lg:hidden">{APP_NAME}</Link>
          </div>
          <div className="flex items-center gap-1.5">
            <TombolTema />
            <Link to="/app/notifikasi" aria-label={belumDibaca ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi'}
              className="relative grid size-10 place-items-center rounded-xl text-muted hover:bg-surface2 hover:text-ink">
              <IkonLonceng aria-hidden />
              {belumDibaca > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4.5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4.5 text-white">
                  {belumDibaca > 9 ? '9+' : belumDibaca}
                </span>
              )}
            </Link>
            <Link to="/app/profil" className="ml-1 flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 hover:bg-surface2">
              <Avatar user={user} ukuran="size-9" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-40 truncate text-sm font-bold">{user.nama}</span>
                <span className="block text-xs text-muted">{ROLE_LABEL[user.role]}</span>
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
