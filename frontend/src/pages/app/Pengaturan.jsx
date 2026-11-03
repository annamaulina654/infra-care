import { useEffect, useRef, useState } from 'react';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import { Kartu, JudulHalaman } from '../../components/ui/Kartu.jsx';
import { Memuat, Galat, Pesan } from '../../components/ui/Status.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { kompresTtd } from '../../lib/image.js';
import { IkonPengaturan, IkonTambah, IkonHapus, IkonGambar, IkonTutup } from '../../lib/icons.js';

export default function Pengaturan() {
  useJudul('Pengaturan Desa');
  const { muat: muatDesa } = useDesa();
  const { data, loading, error, reload } = useFetch(() => api('/settings'), []);
  const [f, setF] = useState({ nama_desa: '', alamat: '', jam: '', telepon: '' });
  const [pesan, setPesan] = useState(null);
  const [proses, setProses] = useState(false);
  const [dusunBaru, setDusunBaru] = useState('');
  const [pesanDusun, setPesanDusun] = useState(null);

  const [ttd, setTtd] = useState({ nama_kades: '', nama_sekdes: '', ttd_kades: '', ttd_sekdes: '' });
  const [pesanTtd, setPesanTtd] = useState(null);
  const [prosesTtd, setProsesTtd] = useState(false);
  const [galatTtd, setGalatTtd] = useState({ kades: '', sekdes: '' });
  const berkasKades = useRef(null);
  const berkasSekdes = useRef(null);
  const refTtd = { kades: berkasKades, sekdes: berkasSekdes };

  useEffect(() => {
    if (data) {
      setF({ nama_desa: data.nama_desa || '', alamat: data.alamat || '', jam: data.jam || '', telepon: data.telepon || '' });
      setTtd({
        nama_kades: data.nama_kades || '',
        nama_sekdes: data.nama_sekdes || '',
        ttd_kades: data.ttd_kades || '',
        ttd_sekdes: data.ttd_sekdes || '',
      });
    }
  }, [data]);
  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const ubahTtd = (k) => (e) => setTtd((s) => ({ ...s, [k]: e.target.value }));

  const simpan = async (e) => {
    e.preventDefault();
    setPesan(null); setProses(true);
    try { await api('/settings', { method: 'PATCH', body: f }); setPesan({ j: 'sukses', t: 'Pengaturan disimpan.' }); muatDesa(); }
    catch (err) { setPesan({ j: 'galat', t: err.message }); } finally { setProses(false); }
  };

  const pilihTtd = (jenis) => async (e) => {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    if (!berkas) return;
    setGalatTtd((s) => ({ ...s, [jenis]: '' }));
    try {
      const hasil = await kompresTtd(berkas);
      setTtd((s) => ({ ...s, [`ttd_${jenis}`]: hasil }));
    } catch (err) {
      setGalatTtd((s) => ({ ...s, [jenis]: err.message }));
    }
  };

  const hapusTtd = (jenis) => setTtd((s) => ({ ...s, [`ttd_${jenis}`]: '' }));

  const simpanTtd = async (e) => {
    e.preventDefault();
    setPesanTtd(null); setProsesTtd(true);
    try {
      await api('/settings', { method: 'PATCH', body: ttd });
      setPesanTtd({ j: 'sukses', t: 'Nama dan tanda tangan disimpan.' });
      reload();
    } catch (err) {
      setPesanTtd({ j: 'galat', t: err.message });
    } finally {
      setProsesTtd(false);
    }
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

        <Kartu className="lg:col-span-2">
          <h2 className="mb-1 text-base font-bold">Penandatangan bukti pengaduan</h2>
          <p className="mb-4 text-sm text-muted">Nama dan tanda tangan ini tampil di bagian bawah bukti pengaduan yang dicetak atau disimpan sebagai PDF.</p>
          <form onSubmit={simpanTtd} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Bidang label="Nama Kepala Desa" id="nama_kades">
                <input id="nama_kades" maxLength={100} value={ttd.nama_kades} onChange={ubahTtd('nama_kades')} className="field" placeholder="Nama lengkap kepala desa" />
              </Bidang>
              <Bidang label="Nama Sekretaris Desa" id="nama_sekdes">
                <input id="nama_sekdes" maxLength={100} value={ttd.nama_sekdes} onChange={ubahTtd('nama_sekdes')} className="field" placeholder="Nama lengkap sekretaris desa" />
              </Bidang>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ['kades', 'Tanda tangan Kepala Desa'],
                ['sekdes', 'Tanda tangan Sekretaris Desa'],
              ].map(([jenis, label]) => {
                const nilai = ttd[`ttd_${jenis}`];
                return (
                  <div key={jenis}>
                    <p className="mb-1.5 text-sm font-semibold">{label}</p>
                    {nilai ? (
                      <div className="relative rounded-xl border border-line bg-surface2 p-3">
                        <img src={nilai} alt={`Pratinjau ${label.toLowerCase()}`} className="mx-auto max-h-28 w-auto object-contain" />
                        <button type="button" onClick={() => hapusTtd(jenis)} aria-label={`Hapus ${label.toLowerCase()}`}
                          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-slate-900/70 text-white">
                          <IkonTutup className="size-4" aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => refTtd[jenis].current?.click()}
                        className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-sm font-semibold text-muted hover:bg-surface2">
                        <IkonGambar className="size-6" aria-hidden />Unggah PNG tanda tangan
                      </button>
                    )}
                    <input ref={refTtd[jenis]} type="file" accept="image/png" onChange={pilihTtd(jenis)} className="sr-only" aria-label={`Pilih ${label.toLowerCase()}`} />
                    {galatTtd[jenis] && <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{galatTtd[jenis]}</p>}
                    <p className="mt-1.5 text-xs text-muted">PNG transparan, maksimal 5 MB. Gambar dikecilkan otomatis.</p>
                  </div>
                );
              })}
            </div>

            {pesanTtd && <Pesan jenis={pesanTtd.j}>{pesanTtd.t}</Pesan>}
            <Tombol type="submit" memuat={prosesTtd}>Simpan nama dan tanda tangan</Tombol>
          </form>
        </Kartu>
      </div>
    </>
  );
}
