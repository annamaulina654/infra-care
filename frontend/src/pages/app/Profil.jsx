import { useRef, useState } from 'react';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import { Kartu, JudulHalaman, Avatar } from '../../components/ui/Kartu.jsx';
import { Lencana } from '../../components/ui/Lencana.jsx';
import { Pesan } from '../../components/ui/Status.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { kompresFoto } from '../../lib/image.js';
import { ROLE_LABEL } from '../../lib/constants.js';
import { IkonUser, IkonKamera, IkonHapus, IkonKunci } from '../../lib/icons.js';

export default function Profil() {
  useJudul('Profil');
  const { user, perbarui } = useAuth();
  const { dusun } = useDesa();
  const berkas = useRef(null);
  const [nama, setNama] = useState(user.nama);
  const [dus, setDus] = useState(user.dusun || '');
  const [pesan, setPesan] = useState(null);
  const [proses, setProses] = useState(false);
  const [sandi, setSandi] = useState({ lama: '', baru: '' });
  const [pesanSandi, setPesanSandi] = useState(null);
  const [prosesSandi, setProsesSandi] = useState(false);

  const simpan = async (patch, sukses = 'Perubahan disimpan.') => {
    setPesan(null);
    try { perbarui(await api('/auth/me', { method: 'PATCH', body: patch })); setPesan({ j: 'sukses', t: sukses }); return true; }
    catch (e) { setPesan({ j: 'galat', t: e.message }); return false; }
  };

  const kirimProfil = async (e) => {
    e.preventDefault();
    setProses(true);
    await simpan({ nama: nama.trim(), ...(user.role === 'masyarakat' || user.role === 'perangkat' ? { dusun: dus } : {}) });
    setProses(false);
  };

  const gantiFoto = async (e) => {
    const b = e.target.files?.[0];
    e.target.value = '';
    if (!b) return;
    try { await simpan({ foto: await kompresFoto(b, { maksSisi: 256, kualitas: 0.8 }) }, 'Foto profil diperbarui.'); }
    catch (err) { setPesan({ j: 'galat', t: err.message }); }
  };

  const kirimSandi = async (e) => {
    e.preventDefault();
    setPesanSandi(null);
    setProsesSandi(true);
    try {
      await api('/auth/password', { method: 'POST', body: { password_lama: sandi.lama, password_baru: sandi.baru } });
      setSandi({ lama: '', baru: '' });
      setPesanSandi({ j: 'sukses', t: 'Kata sandi diganti.' });
    } catch (err) { setPesanSandi({ j: 'galat', t: err.message }); } finally { setProsesSandi(false); }
  };

  return (
    <>
      <JudulHalaman ikon={IkonUser} judul="Profil" ket={user.email} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Kartu>
          <div className="flex items-center gap-4">
            <Avatar user={user} ukuran="size-20" teks="text-2xl" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{user.nama}</p>
              <Lencana className="mt-1">{ROLE_LABEL[user.role]}</Lencana>
              <div className="mt-3 flex flex-wrap gap-2">
                <Tombol ukuran="sm" varian="garis" ikon={IkonKamera} onClick={() => berkas.current?.click()}>Ganti foto</Tombol>
                {user.foto && <Tombol ukuran="sm" varian="hantu" ikon={IkonHapus} onClick={() => simpan({ foto: null }, 'Foto profil dihapus.')}>Hapus</Tombol>}
              </div>
              <input ref={berkas} type="file" accept="image/jpeg,image/png" onChange={gantiFoto} className="sr-only" aria-label="Pilih foto profil" />
            </div>
          </div>
          <form onSubmit={kirimProfil} className="mt-6 space-y-4 border-t border-line pt-6">
            <Bidang label="Nama lengkap" id="nama" wajib><input id="nama" required minLength={3} value={nama} onChange={(e) => setNama(e.target.value)} className="field" /></Bidang>
            <Bidang label="Email" id="email" petunjuk="Email tidak dapat diubah sendiri."><input id="email" value={user.email} disabled className="field" /></Bidang>
            {(user.role === 'masyarakat' || user.role === 'perangkat') && (
              <Bidang label="Dusun" id="dusun" wajib>
                <select id="dusun" required value={dus} onChange={(e) => setDus(e.target.value)} className="field">{dusun.map((d) => <option key={d}>{d}</option>)}</select>
              </Bidang>
            )}
            {pesan && <Pesan jenis={pesan.j}>{pesan.t}</Pesan>}
            <Tombol type="submit" memuat={proses}>Simpan perubahan</Tombol>
          </form>
        </Kartu>

        <Kartu className="self-start">
          <h2 className="flex items-center gap-2 text-base font-bold"><IkonKunci className="size-4 text-brand" aria-hidden />Ganti kata sandi</h2>
          <form onSubmit={kirimSandi} className="mt-4 space-y-4">
            <Bidang label="Kata sandi lama" id="lama" wajib><input id="lama" type="password" required autoComplete="current-password" value={sandi.lama} onChange={(e) => setSandi((s) => ({ ...s, lama: e.target.value }))} className="field" /></Bidang>
            <Bidang label="Kata sandi baru" id="baru" wajib petunjuk="Minimal 6 karakter."><input id="baru" type="password" required minLength={6} autoComplete="new-password" value={sandi.baru} onChange={(e) => setSandi((s) => ({ ...s, baru: e.target.value }))} className="field" /></Bidang>
            {pesanSandi && <Pesan jenis={pesanSandi.j}>{pesanSandi.t}</Pesan>}
            <Tombol type="submit" varian="garis" memuat={prosesSandi}>Ganti kata sandi</Tombol>
          </form>
        </Kartu>
      </div>
    </>
  );
}
