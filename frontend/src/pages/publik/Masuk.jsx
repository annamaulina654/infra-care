import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import { Pesan } from '../../components/ui/Status.jsx';
import Logo from '../../components/layout/Logo.jsx';
import TombolTema from '../../components/layout/TombolTema.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useJudul } from '../../hooks/useMisc.js';
import { IkonEmail, IkonKunci, IkonUser, IkonLokasi, IkonLihat, IkonSembunyi, IkonPanah, IkonAman } from '../../lib/icons.js';
import { APP_NAME } from '../../config.js';
import { cx } from '../../lib/format.js';

const AKUN_DEMO = [
  ['Warga', 'warga@desa.id'],
  ['Perangkat Desa', 'perangkat@desa.id'],
  ['Sekretaris Desa', 'sekdes@desa.id'],
  ['Kepala Desa', 'kades@desa.id'],
];

export default function Masuk() {
  const [params, setParams] = useSearchParams();
  const daftarMode = params.get('daftar') === '1';
  useJudul(daftarMode ? 'Daftar' : 'Masuk');
  const { user, siap, masuk, daftar } = useAuth();
  const { dusun, desa } = useDesa();
  const nav = useNavigate();
  const [f, setF] = useState({ nama: '', email: '', password: '', dusun: '' });
  const [lihat, setLihat] = useState(false);
  const [galat, setGalat] = useState('');
  const [proses, setProses] = useState(false);

  if (siap && user) return <Navigate to="/app" replace />;

  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const ganti = (mode) => { setGalat(''); setParams(mode ? { daftar: '1' } : {}, { replace: true }); };

  const kirim = async (e) => {
    e.preventDefault();
    setGalat('');
    if (daftarMode && f.password.length < 6) return setGalat('Kata sandi minimal 6 karakter.');
    setProses(true);
    try {
      if (daftarMode) await daftar({ nama: f.nama.trim(), email: f.email.trim(), password: f.password, dusun: f.dusun });
      else await masuk(f.email.trim(), f.password);
      nav('/app', { replace: true });
    } catch (err) {
      setGalat(err.message);
    } finally {
      setProses(false);
    }
  };

  const isiDemo = (email) => { setF((s) => ({ ...s, email, password: 'password123' })); ganti(false); };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-deep lg:block">
        <img src="/banner.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <p className="text-lg font-extrabold">{APP_NAME}</p>
          <div>
            <h2 className="text-3xl font-extrabold leading-tight">Satu pintu pengaduan infrastruktur untuk warga {desa}.</h2>
            <p className="mt-3 max-w-md text-white/80">Laporan tercatat, diverifikasi sekretaris desa, dan perkembangannya bisa dipantau siapa saja.</p>
          </div>
          <p className="flex items-center gap-2 text-sm text-white/70"><IkonAman className="size-4" aria-hidden />Data pelapor tidak ditampilkan di daftar publik.</p>
        </div>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between"><Logo /><TombolTema /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-2xl font-extrabold tracking-tight">{daftarMode ? 'Buat akun warga' : 'Masuk ke akun Anda'}</h1>
          <p className="mt-1.5 text-sm text-muted">{daftarMode ? 'Daftar sekali, lalu lapor dan pantau pengaduan kapan saja.' : 'Gunakan email dan kata sandi yang terdaftar.'}</p>

          {params.get('sesi') === 'berakhir' && <Pesan jenis="awas" className="mt-5">Sesi Anda berakhir. Silakan masuk kembali.</Pesan>}

          <form onSubmit={kirim} className="mt-6 space-y-4" noValidate={false}>
            {daftarMode && (
              <Bidang label="Nama lengkap" id="nama" wajib>
                <div className="relative"><IkonUser className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                  <input id="nama" required minLength={3} value={f.nama} onChange={ubah('nama')} autoComplete="name" className="field pl-10" /></div>
              </Bidang>
            )}
            <Bidang label="Email" id="email" wajib>
              <div className="relative"><IkonEmail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input id="email" type="email" required value={f.email} onChange={ubah('email')} autoComplete="email" className="field pl-10" /></div>
            </Bidang>
            <Bidang label="Kata sandi" id="password" wajib petunjuk={daftarMode ? 'Minimal 6 karakter.' : undefined}>
              <div className="relative"><IkonKunci className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input id="password" type={lihat ? 'text' : 'password'} required value={f.password} onChange={ubah('password')} autoComplete={daftarMode ? 'new-password' : 'current-password'} className="field px-10" />
                <button type="button" onClick={() => setLihat((v) => !v)} aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-ink">{lihat ? <IkonSembunyi aria-hidden /> : <IkonLihat aria-hidden />}</button></div>
            </Bidang>
            {daftarMode && (
              <Bidang label="Dusun tempat tinggal" id="dusun" wajib>
                <div className="relative"><IkonLokasi className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                  <select id="dusun" required value={f.dusun} onChange={ubah('dusun')} className="field pl-10">
                    <option value="">Pilih dusun</option>
                    {dusun.map((d) => <option key={d}>{d}</option>)}
                  </select></div>
              </Bidang>
            )}
            <Pesan jenis="galat">{galat}</Pesan>
            <Tombol type="submit" penuh ukuran="lg" memuat={proses}>{daftarMode ? 'Daftar' : 'Masuk'}</Tombol>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            {daftarMode ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button type="button" onClick={() => ganti(!daftarMode)} className="font-semibold text-brand hover:underline">{daftarMode ? 'Masuk' : 'Daftar sebagai warga'}</button>
          </p>

          {!daftarMode && (
            <details className="mt-8 rounded-xl border border-dashed border-line p-4 text-sm">
              <summary className="cursor-pointer font-semibold">Akun contoh untuk uji coba</summary>
              <p className="mt-2 text-muted">Kata sandi semua akun: <code className="rounded bg-surface2 px-1.5 py-0.5">password123</code>. Ketuk untuk mengisi otomatis.</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {AKUN_DEMO.map(([label, email]) => (
                  <li key={email}><button type="button" onClick={() => isiDemo(email)}
                    className={cx('flex min-h-11 w-full items-center justify-between rounded-lg border border-line px-3 text-left hover:bg-surface2')}>
                    <span><span className="block font-semibold">{label}</span><span className="block text-xs text-muted">{email}</span></span><IkonPanah className="size-4 text-muted" aria-hidden /></button></li>
                ))}
              </ul>
            </details>
          )}
          <Link to="/" className="mt-8 text-center text-sm text-muted hover:text-brand">Kembali ke halaman depan</Link>
        </div>
      </main>
    </div>
  );
}
