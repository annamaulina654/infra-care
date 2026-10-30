import { useState } from 'react';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import { Kartu, JudulHalaman, Avatar } from '../../components/ui/Kartu.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { Memuat, Galat, Kosong, Pesan } from '../../components/ui/Status.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce, useJudul } from '../../hooks/useMisc.js';
import { api, qs } from '../../lib/api.js';
import { ROLE_LABEL } from '../../lib/constants.js';
import { IkonUsers, IkonUserTambah, IkonCari, IkonUbah, IkonKunci, IkonHapus } from '../../lib/icons.js';
import { cx } from '../../lib/format.js';

const KOSONG = { nama: '', email: '', password: '', role: 'masyarakat', dusun: '' };

export default function Pengguna() {
  useJudul('Data Pengguna');
  const { user: saya } = useAuth();
  const { dusun } = useDesa();
  const [role, setRole] = useState('');
  const [teks, setTeks] = useState('');
  const q = useDebounce(teks);
  const { data, loading, error, reload } = useFetch(() => api(`/users${qs({ role, q })}`), [role, q]);

  const [dlg, setDlg] = useState(null); // 'baru' | 'ubah' | 'sandi'
  const [pilih, setPilih] = useState(null);
  const [f, setF] = useState(KOSONG);
  const [galat, setGalat] = useState('');
  const [info, setInfo] = useState(null);
  const [proses, setProses] = useState(false);

  const buka = (jenis, u) => {
    setGalat(''); setPilih(u || null); setDlg(jenis);
    setF(u ? { nama: u.nama, email: u.email, password: '', role: u.role, dusun: u.dusun || '', aktif: u.aktif } : KOSONG);
  };
  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const perluDusun = f.role === 'masyarakat' || f.role === 'perangkat';

  const kirim = async (e) => {
    e.preventDefault();
    setGalat(''); setProses(true);
    try {
      if (dlg === 'baru') await api('/users', { method: 'POST', body: { nama: f.nama.trim(), email: f.email.trim(), password: f.password, role: f.role, dusun: perluDusun ? f.dusun : undefined } });
      if (dlg === 'ubah') await api(`/users/${pilih.id}`, { method: 'PATCH', body: { nama: f.nama.trim(), role: f.role, dusun: perluDusun ? f.dusun : null } });
      if (dlg === 'sandi') await api(`/users/${pilih.id}/reset-password`, { method: 'POST', body: { password_baru: f.password } });
      setInfo({ j: 'sukses', t: dlg === 'baru' ? 'Pengguna ditambahkan.' : dlg === 'sandi' ? 'Kata sandi direset.' : 'Perubahan disimpan.' });
      setDlg(null); reload();
    } catch (err) { setGalat(err.message); } finally { setProses(false); }
  };

  const aksi = async (u, fn, sukses) => {
    setInfo(null);
    try { await fn(); setInfo({ j: 'sukses', t: sukses }); reload(); } catch (err) { setInfo({ j: 'galat', t: err.message }); }
  };
  const ganti = (u) => aksi(u, () => api(`/users/${u.id}`, { method: 'PATCH', body: { aktif: !u.aktif } }), u.aktif ? `${u.nama} dinonaktifkan.` : `${u.nama} diaktifkan.`);
  const hapus = (u) => window.confirm(`Hapus akun ${u.nama}?`) && aksi(u, () => api(`/users/${u.id}`, { method: 'DELETE' }), 'Pengguna dihapus.');

  return (
    <>
      <JudulHalaman ikon={IkonUsers} judul="Data Pengguna" ket={data ? `${data.length} pengguna` : undefined}
        aksi={<Tombol ikon={IkonUserTambah} onClick={() => buka('baru')}>Tambah pengguna</Tombol>} />
      {info && <Pesan jenis={info.j} className="mb-4">{info.t}</Pesan>}

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_14rem]">
        <div className="relative"><IkonCari className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" aria-label="Cari pengguna" placeholder="Cari nama atau email..." value={teks} onChange={(e) => setTeks(e.target.value)} className="field pl-10" /></div>
        <select aria-label="Saring peran" value={role} onChange={(e) => setRole(e.target.value)} className="field">
          <option value="">Semua peran</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <Kartu className="p-0">
        {loading && !data && <Memuat />}
        {error && <Galat pesan={error} ulangi={reload} />}
        {data && data.length === 0 && <Kosong ikon={IkonUsers} judul="Pengguna tidak ditemukan" />}
        {data && data.length > 0 && (
          <ul className="divide-y divide-line">
            {data.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <Avatar user={u} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold"><span className="truncate">{u.nama}</span>
                      <Lencana>{ROLE_LABEL[u.role]}</Lencana>
                      {!u.aktif && <Lencana className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200">Nonaktif</Lencana>}</p>
                    <p className="truncate text-sm text-muted">{u.email}{u.dusun ? ` · ${u.dusun}` : ''} · {u.jumlah_pengaduan} pengaduan</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Tombol ukuran="sm" varian="garis" ikon={IkonUbah} onClick={() => buka('ubah', u)}>Ubah</Tombol>
                  <Tombol ukuran="sm" varian="garis" ikon={IkonKunci} onClick={() => buka('sandi', u)}>Reset sandi</Tombol>
                  {u.id !== saya.id && <Tombol ukuran="sm" varian="hantu" onClick={() => ganti(u)}>{u.aktif ? 'Nonaktifkan' : 'Aktifkan'}</Tombol>}
                  {u.id !== saya.id && <Tombol ukuran="sm" varian="hantu" className={cx('text-red-600')} ikon={IkonHapus} onClick={() => hapus(u)} aria-label={`Hapus ${u.nama}`} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Kartu>

      <Dialog buka={!!dlg} tutup={() => setDlg(null)} judul={dlg === 'baru' ? 'Tambah pengguna' : dlg === 'sandi' ? `Reset sandi ${pilih?.nama}` : `Ubah ${pilih?.nama}`}>
        <form onSubmit={kirim} className="space-y-4">
          {dlg !== 'sandi' && <Bidang label="Nama" id="u-nama" wajib><input id="u-nama" required minLength={3} value={f.nama} onChange={ubah('nama')} className="field" /></Bidang>}
          {dlg === 'baru' && <Bidang label="Email" id="u-email" wajib><input id="u-email" type="email" required value={f.email} onChange={ubah('email')} className="field" /></Bidang>}
          {dlg !== 'ubah' && <Bidang label={dlg === 'sandi' ? 'Kata sandi baru' : 'Kata sandi'} id="u-sandi" wajib petunjuk="Minimal 6 karakter."><input id="u-sandi" type="text" required minLength={6} value={f.password} onChange={ubah('password')} autoComplete="off" className="field" /></Bidang>}
          {dlg !== 'sandi' && (
            <>
              <Bidang label="Peran" id="u-role" wajib><select id="u-role" value={f.role} onChange={ubah('role')} className="field">{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Bidang>
              {perluDusun && <Bidang label="Dusun" id="u-dusun" wajib><select id="u-dusun" required value={f.dusun} onChange={ubah('dusun')} className="field"><option value="">Pilih dusun</option>{dusun.map((d) => <option key={d}>{d}</option>)}</select></Bidang>}
            </>
          )}
          <Pesan jenis="galat">{galat}</Pesan>
          <div className="flex justify-end gap-2"><Tombol varian="garis" onClick={() => setDlg(null)}>Batal</Tombol><Tombol type="submit" memuat={proses}>Simpan</Tombol></div>
        </form>
      </Dialog>
    </>
  );
}
