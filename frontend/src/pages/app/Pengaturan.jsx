import { useEffect, useState } from 'react';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import { Kartu, JudulHalaman } from '../../components/ui/Kartu.jsx';
import { Memuat, Galat, Pesan } from '../../components/ui/Status.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { IkonPengaturan, IkonTambah, IkonHapus } from '../../lib/icons.js';

export default function Pengaturan() {
  useJudul('Pengaturan Desa');
  const { muat: muatDesa } = useDesa();
  const { data, loading, error, reload } = useFetch(() => api('/settings'), []);
  const [f, setF] = useState({ nama_desa: '', alamat: '', jam: '', telepon: '' });
  const [pesan, setPesan] = useState(null);
  const [proses, setProses] = useState(false);
  const [dusunBaru, setDusunBaru] = useState('');
  const [pesanDusun, setPesanDusun] = useState(null);

  useEffect(() => { if (data) setF({ nama_desa: data.nama_desa || '', alamat: data.alamat || '', jam: data.jam || '', telepon: data.telepon || '' }); }, [data]);
  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const simpan = async (e) => {
    e.preventDefault();
    setPesan(null); setProses(true);
    try { await api('/settings', { method: 'PATCH', body: f }); setPesan({ j: 'sukses', t: 'Pengaturan disimpan.' }); muatDesa(); }
    catch (err) { setPesan({ j: 'galat', t: err.message }); } finally { setProses(false); }
  };

  const tambahDusun = async (e) => {
    e.preventDefault();
    setPesanDusun(null);
    try { await api('/dusun', { method: 'POST', body: { nama: dusunBaru.trim() } }); setDusunBaru(''); reload(); muatDesa(); }
    catch (err) { setPesanDusun({ j: 'galat', t: err.message }); }
  };
  const hapusDusun = async (d) => {
    if (!window.confirm(`Hapus ${d.nama}?`)) return;
    setPesanDusun(null);
    try { await api(`/dusun/${d.id}`, { method: 'DELETE' }); reload(); muatDesa(); }
    catch (err) { setPesanDusun({ j: 'galat', t: err.message }); }
  };

  if (loading && !data) return <Memuat />;
  if (error) return <Galat pesan={error} ulangi={reload} />;

  return (
    <>
      <JudulHalaman ikon={IkonPengaturan} judul="Pengaturan Desa" ket="Data ini tampil di halaman depan dan formulir." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Kartu>
          <h2 className="mb-4 text-base font-bold">Identitas dan kontak</h2>
          <form onSubmit={simpan} className="space-y-4">
            <Bidang label="Nama desa" id="nama_desa" wajib><input id="nama_desa" required value={f.nama_desa} onChange={ubah('nama_desa')} className="field" /></Bidang>
            <Bidang label="Alamat kantor desa" id="alamat"><input id="alamat" value={f.alamat} onChange={ubah('alamat')} className="field" /></Bidang>
            <Bidang label="Jam pelayanan" id="jam"><input id="jam" value={f.jam} onChange={ubah('jam')} placeholder="Senin–Jumat, 08.00–15.00" className="field" /></Bidang>
            <Bidang label="Telepon" id="telepon"><input id="telepon" type="tel" value={f.telepon} onChange={ubah('telepon')} className="field" /></Bidang>
            {pesan && <Pesan jenis={pesan.j}>{pesan.t}</Pesan>}
            <Tombol type="submit" memuat={proses}>Simpan</Tombol>
          </form>
        </Kartu>

        <Kartu>
          <h2 className="mb-4 text-base font-bold">Daftar dusun</h2>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {data.dusun.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span><span className="font-semibold">{d.nama}</span><span className="ml-2 text-xs text-muted">{d.jumlah_pengaduan} pengaduan</span></span>
                <button type="button" onClick={() => hapusDusun(d)} aria-label={`Hapus ${d.nama}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><IkonHapus aria-hidden /></button>
              </li>
            ))}
            {data.dusun.length === 0 && <li className="px-4 py-4 text-sm text-muted">Belum ada dusun.</li>}
          </ul>
          <form onSubmit={tambahDusun} className="mt-4 flex gap-2">
            <label htmlFor="dusun-baru" className="sr-only">Nama dusun baru</label>
            <input id="dusun-baru" required value={dusunBaru} onChange={(e) => setDusunBaru(e.target.value)} placeholder="Dusun Baru" className="field flex-1" />
            <Tombol type="submit" ikon={IkonTambah}>Tambah</Tombol>
          </form>
          {pesanDusun && <Pesan jenis={pesanDusun.j} className="mt-3">{pesanDusun.t}</Pesan>}
          <p className="mt-3 text-xs text-muted">Dusun yang sudah dipakai pengaduan atau pengguna tidak dapat dihapus.</p>
        </Kartu>
      </div>
    </>
  );
}
