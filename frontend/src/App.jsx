import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import LayoutPublik from './components/layout/LayoutPublik.jsx';
import LayoutApp from './components/layout/LayoutApp.jsx';
import { Memuat } from './components/ui/Status.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { PENGELOLA } from './lib/constants.js';

import Beranda from './pages/publik/Beranda.jsx';
import Masuk from './pages/publik/Masuk.jsx';
import Lacak from './pages/publik/Lacak.jsx';
import Transparansi from './pages/publik/Transparansi.jsx';
import Dashboard from './pages/app/Dashboard.jsx';
import BuatPengaduan from './pages/app/BuatPengaduan.jsx';
import DaftarPengaduanApp from './pages/app/DaftarPengaduanApp.jsx';
import DetailPengaduan from './pages/app/DetailPengaduan.jsx';
import PetaHalaman from './pages/app/PetaHalaman.jsx';
import Notifikasi from './pages/app/Notifikasi.jsx';
import Profil from './pages/app/Profil.jsx';
import Pengguna from './pages/app/Pengguna.jsx';
import Laporan from './pages/app/Laporan.jsx';
import Pengaturan from './pages/app/Pengaturan.jsx';
import TidakDitemukan from './pages/TidakDitemukan.jsx';

// Pelindung rute: harus login, dan (opsional) harus berperan tertentu.
function Pelindung({ peran }) {
  const { user, siap } = useAuth();
  const { pathname } = useLocation();
  if (!siap) return <Memuat className="min-h-dvh" />;
  if (!user) return <Navigate to="/login" replace state={{ dari: pathname }} />;
  if (peran && !peran.includes(user.role)) return <Navigate to="/app" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<LayoutPublik />}>
        <Route index element={<Beranda />} />
        <Route path="pengaduan" element={<Transparansi />} />
        <Route path="lacak" element={<Lacak />} />
        <Route path="lacak/:kode" element={<Lacak />} />
      </Route>
      <Route path="login" element={<Masuk />} />

      <Route path="app" element={<Pelindung />}>
        <Route element={<LayoutApp />}>
          <Route index element={<Dashboard />} />
          <Route path="pengaduan" element={<DaftarPengaduanApp />} />
          <Route path="pengaduan/:kode" element={<DetailPengaduan />} />
          <Route path="notifikasi" element={<Notifikasi />} />
          <Route path="profil" element={<Profil />} />
          <Route element={<Pelindung peran={['masyarakat', 'perangkat']} />}>
            <Route path="buat" element={<BuatPengaduan />} />
          </Route>
          <Route element={<Pelindung peran={['perangkat', ...PENGELOLA]} />}>
            <Route path="peta" element={<PetaHalaman />} />
          </Route>
          <Route element={<Pelindung peran={PENGELOLA} />}>
            <Route path="laporan" element={<Laporan />} />
          </Route>
          <Route element={<Pelindung peran={['admin']} />}>
            <Route path="pengguna" element={<Pengguna />} />
            <Route path="pengaturan" element={<Pengaturan />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<TidakDitemukan />} />
    </Routes>
  );
}
