import { useState, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import { Kartu } from '../../components/ui/Kartu.jsx';
import { LencanaStatus, LencanaUrgensi } from '../../components/ui/Lencana.jsx';
import { Memuat, Galat, Pesan } from '../../components/ui/Status.jsx';
import AlurStatus from '../../components/complaints/AlurStatus.jsx';
import RiwayatLog from '../../components/complaints/RiwayatLog.jsx';
import BuktiPengaduan from '../../components/complaints/BuktiPengaduan.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { kompresFoto } from '../../lib/image.js';
import { KATEGORI_INFO, PENGELOLA, STATUS_GAYA, PERLU_FOTO } from '../../lib/constants.js';
import { bagikanPengaduan, salinTeks, cetakBukti } from '../../lib/bagikan.js';
import { IkonKiri, IkonLokasi, IkonUser, IkonPesan, IkonUbah, IkonKirim, IkonPeta, IkonSalin, IkonBagikan, IkonCetak, IkonKamera, IkonTutup } from '../../lib/icons.js';
import { tgl } from '../../lib/format.js';

const INSTANSI = ['PLN', 'Dinas PU / Bina Marga', 'Dinas Pendidikan', 'Dinas Kesehatan', 'PDAM', 'Kecamatan'];

export default function DetailPengaduan() {
  const { kode } = useParams();
  useJudul(kode);
  const { user } = useAuth();
  const lokasiHalaman = useLocation();
  const kelola = PENGELOLA.includes(user.role);
  const { data: c, loading, error, reload } = useFetch(() => api(`/complaints/${encodeURIComponent(kode)}`), [kode]);

  const [dlgStatus, setDlgStatus] = useState(false);
  const [baru, setBaru] = useState('');
  const [catatan, setCatatan] = useState('');
  const [instansi, setInstansi] = useState('');
  const [fotoBukti, setFotoBukti] = useState(null);
  const [galatFotoBukti, setGalatFotoBukti] = useState('');
  const berkasBuktiRef = useRef(null);
  const [tanggapan, setTanggapan] = useState('');
  const [pesan, setPesan] = useState('');
  const [galat, setGalat] = useState('');
  const [galatPesan, setGalatPesan] = useState('');
  const [info, setInfo] = useState(lokasiHalaman.state?.info || '');
  const [proses, setProses] = useState(false);

  const bukaStatus = () => { setBaru(c.next_status[0] || ''); setCatatan(''); setInstansi(''); setFotoBukti(null); setGalatFotoBukti(''); setGalat(''); setDlgStatus(true); };

  const salinKode = async () => {
    const ok = await salinTeks(c.kode);
    setInfo(ok ? `Kode ${c.kode} disalin. Tempel di catatan atau kirim ke keluarga Anda.` : 'Kode gagal disalin otomatis. Silakan salin secara manual.');
  };

  const bagikan = async () => {
    const hasil = await bagikanPengaduan(c.kode);
    if (hasil === 'disalin') setInfo('Tautan pelacakan disalin karena perangkat ini belum mendukung menu berbagi.');
    else if (hasil === 'gagal') setInfo('Tautan gagal dibagikan. Gunakan tombol "Salin kode" sebagai gantinya.');
  };

  const pilihFotoBukti = async (e) => {
    const berkas = e.target.files?.[0];
    e.target.value = '';
    if (!berkas) return;
    setGalatFotoBukti('');
    try { setFotoBukti(await kompresFoto(berkas)); } catch (err) { setGalatFotoBukti(err.message); }
  };

  const simpanStatus = async (e) => {
    e.preventDefault();
    setGalat('');
    setGalatFotoBukti('');
    if (PERLU_FOTO.includes(baru) && !fotoBukti) {
      setGalatFotoBukti(baru === 'Selesai' ? 'Foto setelah perbaikan wajib dilampirkan.' : 'Foto bukti pengerjaan wajib dilampirkan.');
      return;
    }
    setProses(true);
    try {
      await api(`/complaints/${c.id}/status`, { method: 'PATCH', body: { status: baru, catatan: catatan.trim() || undefined, instansi: baru === 'Diteruskan ke Instansi' ? instansi.trim() : undefined, foto: PERLU_FOTO.includes(baru) ? fotoBukti : undefined } });
      setDlgStatus(false);
      setInfo(`Status diubah menjadi "${baru}".`);
      reload();
    } catch (err) { setGalat(err.message); } finally { setProses(false); }
  };

  const kirimTanggapan = async (e) => {
    e.preventDefault();
    setGalat('');
    setProses(true);
    try {
      await api(`/complaints/${c.id}/tanggapan`, { method: 'POST', body: { catatan: tanggapan.trim() } });
      setTanggapan('');
      setInfo('Tanggapan terkirim dan pelapor sudah diberi tahu.');
      reload();
    } catch (err) { setGalat(err.message); } finally { setProses(false); }
  };

  // Pelapor boleh menambah informasi/balasan tanpa mengubah status pengaduan.
  const kirimPesan = async (e) => {
    e.preventDefault();
    setGalatPesan('');
    setProses(true);
    try {
      await api(`/complaints/${c.id}/pesan`, { method: 'POST', body: { catatan: pesan.trim() } });
      setPesan('');
      setInfo('Informasi tambahan terkirim. Pemerintah desa sudah diberi tahu.');
      reload();
    } catch (err) { setGalatPesan(err.message); } finally { setProses(false); }
  };

  if (loading && !c) return <Memuat />;
  if (error) return <Galat pesan={error} ulangi={reload} />;
  if (!c) return null;

  const Ikon = KATEGORI_INFO[c.kategori]?.ikon;
  const petaUrl = c.lat != null && c.lng != null ? `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=18/${c.lat}/${c.lng}` : null;
  const pemilik = c.user_id === user.id;

  return (
    <>
      {/* Hanya tampil saat dicetak: bukti pengaduan lengkap dengan foto dan tanda tangan. */}
      <div className="print-only">
        <BuktiPengaduan c={c} />
      </div>

      <div className="no-print">
        <Link to="/app/pengaduan" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand"><IkonKiri className="size-4" aria-hidden />Kembali ke daftar</Link>
        {info && <Pesan jenis="sukses" className="mb-4">{info}</Pesan>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Kartu>
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">{Ikon && <Ikon className="size-6" aria-hidden />}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-muted">{c.kode}</p>
                  <h1 className="text-xl font-extrabold leading-snug sm:text-2xl">{c.judul}</h1>
                  <div className="mt-2.5 flex flex-wrap gap-2"><LencanaStatus status={c.status} /><LencanaUrgensi urgensi={c.urgensi} /></div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Tombol varian="garis" ukuran="sm" ikon={IkonSalin} onClick={salinKode}>Salin kode</Tombol>
                    <Tombol varian="garis" ukuran="sm" ikon={IkonBagikan} onClick={bagikan}>Bagikan</Tombol>
                    <Tombol varian="garis" ukuran="sm" ikon={IkonCetak} onClick={cetakBukti}>Cetak bukti</Tombol>
                    {c.bisa_edit && (
                      <Tombol varian="garis" ukuran="sm" ikon={IkonUbah} ke={`/app/pengaduan/${c.kode}/edit`}>Edit</Tombol>
                    )}
                  </div>
                  {!c.bisa_edit && c.alasan_edit && <p className="mt-2 text-xs text-muted">{c.alasan_edit}.</p>}
                </div>
              </div>
              <p className="mt-5 whitespace-pre-line text-sm leading-relaxed">{c.deskripsi}</p>
              {c.foto && <img src={c.foto} alt={`Foto ${c.judul}`} className="mt-5 max-h-96 w-full rounded-xl object-cover" />}
              <dl className="mt-5 grid gap-3 border-t border-line pt-5 text-sm sm:grid-cols-2">
                <div className="flex gap-2"><IkonLokasi className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /><div><dt className="text-xs text-muted">Lokasi</dt><dd className="font-semibold">{c.lokasi}, {c.dusun}</dd></div></div>
                <div className="flex gap-2"><IkonUser className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden /><div><dt className="text-xs text-muted">Pelapor</dt><dd className="font-semibold">{c.pelapor}</dd></div></div>
                <div><dt className="text-xs text-muted">Kategori</dt><dd className="font-semibold">{c.kategori}</dd></div>
                <div><dt className="text-xs text-muted">Perkiraan</dt><dd className="font-semibold">{c.perkiraan || '-'}</dd></div>
                <div><dt className="text-xs text-muted">Dilaporkan</dt><dd className="font-semibold">{tgl(c.created_at)}</dd></div>
                {c.instansi && <div><dt className="text-xs text-muted">Diteruskan ke</dt><dd className="font-semibold">{c.instansi}</dd></div>}
              </dl>
              {petaUrl && <a href={petaUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"><IkonPeta className="size-4" aria-hidden />Buka titik di peta</a>}
            </Kartu>

            <Kartu><h2 className="mb-5 text-base font-bold">Tahapan</h2><AlurStatus status={c.status} /></Kartu>
            <Kartu><h2 className="mb-5 text-base font-bold">Riwayat</h2><RiwayatLog logs={c.logs} /></Kartu>
          </div>

          {(pemilik || kelola) && (
            <aside className="space-y-6">
              {pemilik && (
                <Kartu>
                  <h2 className="flex items-center gap-2 text-base font-bold"><IkonPesan className="size-4 text-brand" aria-hidden />Tambah informasi</h2>
                  <p className="mt-1 text-sm text-muted">Sampaikan perkembangan terbaru atau jawaban untuk petugas. Status pengaduan tidak berubah.</p>
                  <form onSubmit={kirimPesan} className="mt-3 space-y-3">
                    <label htmlFor="pesan" className="sr-only">Informasi tambahan</label>
                    <textarea id="pesan" required minLength={3} maxLength={500} rows={4} value={pesan} onChange={(e) => setPesan(e.target.value)} placeholder="Mis. kerusakan bertambah parah setelah hujan." className="field resize-y" />
                    <Tombol type="submit" penuh ikon={IkonKirim} memuat={proses && !dlgStatus}>Kirim informasi</Tombol>
                  </form>
                  {galatPesan && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{galatPesan}</p>}
                </Kartu>
              )}

              {kelola && (
                <>
                  <Kartu>
                    <h2 className="text-base font-bold">Ubah status</h2>
                    {c.next_status.length
                      ? <><p className="mt-1 text-sm text-muted">Status sekarang <b>{c.status}</b>. Pelapor akan mendapat notifikasi.</p>
                          <Tombol penuh className="mt-4" ikon={IkonUbah} onClick={bukaStatus}>Ubah status</Tombol></>
                      : <p className="mt-1 text-sm text-muted">Pengaduan ini sudah berstatus akhir ({c.status}).</p>}
                  </Kartu>
                  <Kartu>
                    <h2 className="flex items-center gap-2 text-base font-bold"><IkonPesan className="size-4 text-brand" aria-hidden />Beri tanggapan</h2>
                    <form onSubmit={kirimTanggapan} className="mt-3 space-y-3">
                      <label htmlFor="tanggapan" className="sr-only">Tanggapan</label>
                      <textarea id="tanggapan" required minLength={3} maxLength={500} rows={4} value={tanggapan} onChange={(e) => setTanggapan(e.target.value)} placeholder="Mis. Tim akan survei hari Kamis." className="field resize-y" />
                      <Tombol type="submit" penuh varian="garis" ikon={IkonKirim} memuat={proses && !dlgStatus}>Kirim tanggapan</Tombol>
                    </form>
                    {galat && !dlgStatus && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{galat}</p>}
                  </Kartu>
                </>
              )}
            </aside>
          )}
        </div>
      </div>

      <Dialog buka={dlgStatus} tutup={() => setDlgStatus(false)} judul="Ubah status pengaduan">
        <form onSubmit={simpanStatus} className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Status baru</legend>
            <div className="grid gap-2">
              {c.next_status.map((s) => {
                const G = STATUS_GAYA[s];
                return (
                  <label key={s} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-sm font-semibold ${baru === s ? 'border-brand bg-brand-soft text-brand' : 'border-line hover:bg-surface2'}`}>
                    <input type="radio" name="status" value={s} checked={baru === s} onChange={() => { setBaru(s); setFotoBukti(null); setGalatFotoBukti(''); }} className="sr-only" />
                    <G.ikon className="size-4" aria-hidden />{s}
                  </label>
                );
              })}
            </div>
          </fieldset>
          {baru === 'Diteruskan ke Instansi' && (
            <Bidang label="Instansi tujuan" id="instansi" wajib>
              <input id="instansi" list="daftar-instansi" required value={instansi} onChange={(e) => setInstansi(e.target.value)} className="field" />
              <datalist id="daftar-instansi">{INSTANSI.map((i) => <option key={i} value={i} />)}</datalist>
            </Bidang>
          )}
          {PERLU_FOTO.includes(baru) ? (
            <>
              <Bidang label={baru === 'Dalam Perbaikan' ? 'Catatan untuk pelapor (wajib)' : 'Catatan untuk pelapor (opsional)'} id="catatan" wajib={baru === 'Dalam Perbaikan'}>
                <textarea id="catatan" rows={3} required={baru === 'Dalam Perbaikan'} minLength={baru === 'Dalam Perbaikan' ? 3 : undefined} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="field resize-y" />
              </Bidang>
              <Bidang label={baru === 'Selesai' ? 'Foto setelah perbaikan (wajib)' : 'Foto bukti pengerjaan (wajib)'} id="foto-bukti" wajib petunjuk="JPG atau PNG, dikompresi otomatis. Foto ini ikut tampil di halaman pelacakan publik, jadi hindari memotret wajah orang atau plat kendaraan.">
                {fotoBukti
                  ? <div className="relative"><img src={fotoBukti} alt="Pratinjau foto bukti" className="max-h-64 w-full rounded-xl object-cover" /><button type="button" onClick={() => setFotoBukti(null)} aria-label="Hapus foto" className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-slate-900/70 text-white"><IkonTutup aria-hidden /></button></div>
                  : <button type="button" onClick={() => berkasBuktiRef.current?.click()} className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line text-sm font-semibold text-muted hover:bg-surface2"><IkonKamera className="size-6" aria-hidden />{baru === 'Selesai' ? 'Ambil atau pilih foto setelah perbaikan' : 'Ambil atau pilih foto pengerjaan'}</button>}
                <input ref={berkasBuktiRef} type="file" accept="image/jpeg,image/png" onChange={pilihFotoBukti} className="sr-only" aria-label="Pilih foto bukti" />
                {galatFotoBukti && <p role="alert" className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">{galatFotoBukti}</p>}
              </Bidang>
            </>
          ) : (
            <Bidang label={baru === 'Ditolak' ? 'Alasan penolakan' : 'Catatan untuk pelapor (opsional)'} id="catatan" wajib={baru === 'Ditolak'}>
              <textarea id="catatan" rows={3} required={baru === 'Ditolak'} minLength={baru === 'Ditolak' ? 3 : undefined} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="field resize-y" />
            </Bidang>
          )}
          <Pesan jenis="galat">{galat}</Pesan>
          <div className="flex justify-end gap-2">
            <Tombol varian="garis" onClick={() => setDlgStatus(false)}>Batal</Tombol>
            <Tombol type="submit" memuat={proses} varian={baru === 'Ditolak' ? 'bahaya' : 'utama'}>Simpan</Tombol>
          </div>
        </form>
      </Dialog>
    </>
  );
}
