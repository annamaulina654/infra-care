import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import { Kartu, JudulHalaman } from '../../components/ui/Kartu.jsx';
import { Pesan } from '../../components/ui/Status.jsx';
import PilihLokasi from '../../components/map/PilihLokasi.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { kompresFoto } from '../../lib/image.js';
import { KATEGORI, KATEGORI_INFO, URGENSI, URGENSI_GAYA } from '../../lib/constants.js';
import { IkonFormulir, IkonKirim, IkonKamera, IkonTutup, IkonAman } from '../../lib/icons.js';
import { cx } from '../../lib/format.js';

const AWAL = { judul: '', kategori: '', deskripsi: '', lokasi: '', dusun: '', perkiraan: '', urgensi: 'Sedang', anonim: false, pelapor_nama: '' };

export default function BuatPengaduan() {
  const { user } = useAuth();
  const perangkat = user.role === 'perangkat';
  useJudul(perangkat ? 'Lapor atas nama warga' : 'Buat Pengaduan');
  const { dusun } = useDesa();
  const nav = useNavigate();
  const berkasRef = useRef(null);
  const [f, setF] = useState({ ...AWAL, dusun: user.dusun || '' });
  const [titik, setTitik] = useState(null);
  const [foto, setFoto] = useState(null);
  const [galat, setGalat] = useState('');
  const [galatFoto, setGalatFoto] = useState('');
  const [proses, setProses] = useState(false);
  const [sukses, setSukses] = useState(null);

  const ubah = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const pilihFoto = async (e) => {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    if (!berkas) return;
    setGalatFoto('');
    try { setFoto(await kompresFoto(berkas)); } catch (err) { setGalatFoto(err.message); }
  };

  const kirim = async (e) => {
    e.preventDefault();
    setGalat('');
    if (!f.kategori) return setGalat('Pilih kategori kerusakan.');
    setProses(true);
    try {
      const body = {
        judul: f.judul.trim(), kategori: f.kategori, deskripsi: f.deskripsi.trim(), lokasi: f.lokasi.trim(), dusun: f.dusun,
        perkiraan: f.perkiraan.trim() || undefined, urgensi: f.urgensi,
        lat: titik?.[0], lng: titik?.[1], foto: foto || undefined,
      };
      if (perangkat) body.pelapor_nama = f.pelapor_nama.trim();
      else body.anonim = f.anonim;
      setSukses(await api('/complaints', { method: 'POST', body }));
    } catch (err) {
      setGalat(err.message);
    } finally {
      setProses(false);
    }
  };

  if (sukses) {
    return (
      <div className="mx-auto max-w-lg py-8 text-center">
        <Kartu className="p-8 sm:p-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"><IkonKirim className="size-8" aria-hidden /></span>
          <h1 className="mt-5 text-2xl font-extrabold">Pengaduan terkirim</h1>
          <p className="mt-2 text-sm text-muted">Simpan kode ini untuk melacak perkembangannya.</p>
          <p className="mt-5 select-all rounded-xl bg-surface2 px-4 py-3 text-2xl font-extrabold tracking-wide text-brand">{sukses.kode}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Tombol ke={`/app/pengaduan/${sukses.kode}`}>Lihat pengaduan</Tombol>
            <Tombol varian="garis" onClick={() => { setSukses(null); setF({ ...AWAL, dusun: user.dusun || '' }); setTitik(null); setFoto(null); }}>Buat lagi</Tombol>
          </div>
        </Kartu>
      </div>
    );
  }

  return (
    <>
      <JudulHalaman ikon={IkonFormulir} judul={perangkat ? 'Lapor atas nama warga' : 'Buat Pengaduan'}
        ket={perangkat ? 'Untuk warga yang melapor langsung kepada Anda.' : 'Isi seperlunya. Foto dan titik peta boleh dilewati.'} />
      <form onSubmit={kirim} className="grid gap-6 lg:grid-cols-5">
        <Kartu className="space-y-5 lg:col-span-3">
          {perangkat && (
            <Bidang label="Nama warga pelapor" id="pelapor" wajib>
              <input id="pelapor" required minLength={3} value={f.pelapor_nama} onChange={ubah('pelapor_nama')} className="field" />
            </Bidang>
          )}
          <Bidang label="Judul pengaduan" id="judul" wajib petunjuk="Singkat dan jelas, mis. Jalan berlubang di depan balai dusun.">
            <input id="judul" required maxLength={120} value={f.judul} onChange={ubah('judul')} className="field" />
          </Bidang>

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Kategori <span className="text-red-500" aria-hidden>*</span></legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {KATEGORI.map((k) => {
                const Ikon = KATEGORI_INFO[k].ikon;
                const aktif = f.kategori === k;
                return (
                  <label key={k} className={cx('flex min-h-14 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                    aktif ? 'border-brand bg-brand-soft text-brand' : 'border-line hover:bg-surface2')}>
                    <input type="radio" name="kategori" value={k} checked={aktif} onChange={ubah('kategori')} className="sr-only" />
                    <Ikon className="size-5 shrink-0" aria-hidden /><span className="leading-tight">{k}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Bidang label="Uraian kerusakan" id="deskripsi" wajib petunjuk={`${f.deskripsi.length}/500 karakter`}>
            <textarea id="deskripsi" required maxLength={500} rows={4} value={f.deskripsi} onChange={ubah('deskripsi')} className="field resize-y" />
          </Bidang>

          <div className="grid gap-5 sm:grid-cols-2">
            <Bidang label="Dusun" id="dusun" wajib>
              <select id="dusun" required value={f.dusun} onChange={ubah('dusun')} className="field">
                <option value="">Pilih dusun</option>
                {dusun.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Bidang>
            <Bidang label="Perkiraan biaya/kebutuhan" id="perkiraan" petunjuk="Boleh dikosongkan, mis. 3 truk batu.">
              <input id="perkiraan" maxLength={100} value={f.perkiraan} onChange={ubah('perkiraan')} className="field" />
            </Bidang>
          </div>

          <Bidang label="Lokasi (patokan alamat)" id="lokasi" wajib>
            <input id="lokasi" required maxLength={300} value={f.lokasi} onChange={ubah('lokasi')} placeholder="Mis. depan masjid, RT 02" className="field" />
          </Bidang>

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Seberapa mendesak?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {URGENSI.map(({ nilai, ket }) => (
                <label key={nilai} className={cx('cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-colors', f.urgensi === nilai ? URGENSI_GAYA[nilai].pilih : 'border-line hover:bg-surface2')}>
                  <input type="radio" name="urgensi" value={nilai} checked={f.urgensi === nilai} onChange={ubah('urgensi')} className="sr-only" />
                  <span className="block font-bold">{nilai}</span><span className="block text-xs opacity-80">{ket}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Kartu>

        <div className="space-y-6 lg:col-span-2">
          <Kartu>
            <h2 className="mb-1 text-sm font-semibold">Foto (opsional)</h2>
            <p className="mb-3 text-xs text-muted">JPG atau PNG. Foto dikecilkan otomatis sebelum dikirim.</p>
            {foto
              ? <div className="relative"><img src={foto} alt="Pratinjau foto" className="max-h-64 w-full rounded-xl object-cover" />
                  <button type="button" onClick={() => setFoto(null)} aria-label="Hapus foto" className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-slate-900/70 text-white"><IkonTutup aria-hidden /></button></div>
              : <button type="button" onClick={() => berkasRef.current?.click()}
                  className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-sm font-semibold text-muted hover:bg-surface2"><IkonKamera className="size-6" aria-hidden />Ambil atau pilih foto</button>}
            <input ref={berkasRef} type="file" accept="image/jpeg,image/png" onChange={pilihFoto} className="sr-only" aria-label="Pilih foto" />
            {galatFoto && <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{galatFoto}</p>}
          </Kartu>

          <Kartu>
            <h2 className="mb-3 text-sm font-semibold">Titik di peta (opsional)</h2>
            <PilihLokasi nilai={titik} ubah={setTitik} />
          </Kartu>

          {!perangkat && (
            <label className="card flex cursor-pointer items-start gap-3 p-4">
              <input type="checkbox" checked={f.anonim} onChange={ubah('anonim')} className="mt-1 size-4 accent-[var(--brand)]" />
              <span className="text-sm"><span className="flex items-center gap-1.5 font-semibold"><IkonAman className="size-4 text-brand" aria-hidden />Sembunyikan nama saya</span>
                <span className="mt-0.5 block text-muted">Nama Anda tidak terlihat oleh perangkat desa. Sekretaris desa tetap dapat melihatnya untuk keperluan verifikasi.</span></span>
            </label>
          )}

          <Pesan jenis="galat">{galat}</Pesan>
          <Tombol type="submit" penuh ukuran="lg" ikon={IkonKirim} memuat={proses}>Kirim Pengaduan</Tombol>
        </div>
      </form>
    </>
  );
}
