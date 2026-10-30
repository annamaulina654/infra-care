import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Logo from './Logo.jsx';
import TombolTema from './TombolTema.jsx';
import Tombol from '../ui/Tombol.jsx';
import { IkonMenu, IkonTutup, IkonLokasi, IkonTelepon, IkonJam } from '../../lib/icons.js';
import { APP_NAME, APP_TAGLINE } from '../../config.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { cx } from '../../lib/format.js';

const TAUTAN = [
  { ke: '/', label: 'Beranda', akhir: true },
  { ke: '/pengaduan', label: 'Transparansi' },
  { ke: '/lacak', label: 'Lacak Pengaduan' },
];

const kelasTautan = ({ isActive }) =>
  cx('rounded-lg px-3 py-2 text-sm font-semibold transition-colors', isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-surface2 hover:text-ink');

// Kerangka halaman publik: navbar tetap di atas (menu lipat di HP) dan footer berisi kontak desa.
export default function LayoutPublik() {
  const { user } = useAuth();
  const { desa, kontak } = useDesa();
  const [buka, setBuka] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Utama" className="hidden items-center gap-1 md:flex">
            {TAUTAN.map((t) => <NavLink key={t.ke} to={t.ke} end={t.akhir} className={kelasTautan}>{t.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-2">
            <TombolTema />
            <div className="hidden items-center gap-2 sm:flex">
              {user
                ? <Tombol ke="/app" ukuran="sm">Buka Aplikasi</Tombol>
                : <>
                    <Tombol ke="/login" varian="garis" ukuran="sm">Masuk</Tombol>
                    <Tombol ke="/login?daftar=1" ukuran="sm">Daftar</Tombol>
                  </>}
            </div>
            <button type="button" aria-label={buka ? 'Tutup menu' : 'Buka menu'} aria-expanded={buka} onClick={() => setBuka((b) => !b)}
              className="grid size-10 place-items-center rounded-xl text-ink hover:bg-surface2 md:hidden">
              {buka ? <IkonTutup aria-hidden /> : <IkonMenu aria-hidden />}
            </button>
          </div>
        </div>
        {buka && (
          <div className="border-t border-line bg-surface px-4 pb-4 pt-2 md:hidden">
            <nav aria-label="Menu seluler" className="flex flex-col gap-1">
              {TAUTAN.map((t) => <NavLink key={t.ke} to={t.ke} end={t.akhir} onClick={() => setBuka(false)} className={kelasTautan}>{t.label}</NavLink>)}
            </nav>
            <div className="mt-3 flex gap-2">
              {user
                ? <Tombol ke="/app" penuh onClick={() => setBuka(false)}>Buka Aplikasi</Tombol>
                : <>
                    <Tombol ke="/login" varian="garis" penuh onClick={() => setBuka(false)}>Masuk</Tombol>
                    <Tombol ke="/login?daftar=1" penuh onClick={() => setBuka(false)}>Daftar</Tombol>
                  </>}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <Logo tampilDesa={false} />
            <p className="mt-3 max-w-xs text-sm text-muted">{APP_TAGLINE}, {desa}. Laporkan kerusakan, pantau penanganannya, dan lihat hasilnya secara terbuka.</p>
          </div>
          <div>
            <h2 className="text-sm font-bold">Tautan</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {TAUTAN.map((t) => <li key={t.ke}><Link to={t.ke} className="hover:text-brand">{t.label}</Link></li>)}
              <li><Link to="/login" className="hover:text-brand">Masuk / Daftar</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-bold">Kantor {desa}</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-muted">
              {kontak?.alamat && <li className="flex gap-2"><IkonLokasi className="mt-0.5 size-4 shrink-0" aria-hidden />{kontak.alamat}</li>}
              {kontak?.jam && <li className="flex gap-2"><IkonJam className="mt-0.5 size-4 shrink-0" aria-hidden />{kontak.jam}</li>}
              {kontak?.telepon && <li className="flex gap-2"><IkonTelepon className="mt-0.5 size-4 shrink-0" aria-hidden />{kontak.telepon}</li>}
              {!kontak?.alamat && !kontak?.jam && !kontak?.telepon && <li>Informasi kontak belum diisi.</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-muted">© {new Date().getFullYear()} {APP_NAME} · {desa}</div>
      </footer>
    </div>
  );
}
