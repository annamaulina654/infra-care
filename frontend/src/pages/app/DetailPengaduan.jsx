import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import Bidang from '../../components/ui/Bidang.jsx';
import Dialog from '../../components/ui/Dialog.jsx';
import { Kartu } from '../../components/ui/Kartu.jsx';
import { LencanaStatus, LencanaUrgensi } from '../../components/ui/Lencana.jsx';
import { Memuat, Galat, Pesan } from '../../components/ui/Status.jsx';
import AlurStatus from '../../components/complaints/AlurStatus.jsx';
import RiwayatLog from '../../components/complaints/RiwayatLog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useFetch.js';
import { useJudul } from '../../hooks/useMisc.js';
import { api } from '../../lib/api.js';
import { KATEGORI_INFO, PENGELOLA, STATUS_GAYA } from '../../lib/constants.js';
import { IkonKiri, IkonLokasi, IkonUser, IkonPesan, IkonUbah, IkonKirim, IkonPeta } from '../../lib/icons.js';
import { tgl } from '../../lib/format.js';

const INSTANSI = ['PLN', 'Dinas PU / Bina Marga', 'Dinas Pendidikan', 'Dinas Kesehatan', 'PDAM', 'Kecamatan'];

export default function DetailPengaduan() {
  const { kode } = useParams();
  useJudul(kode);
  const { user } = useAuth();
  const kelola = PENGELOLA.includes(user.role);
  const { data: c, loading, error, reload } = useFetch(() => api(`/complaints/${encodeURIComponent(kode)}`), [kode]);

  const [dlgStatus, setDlgStatus] = useState(false);
  const [baru, setBaru] = useState('');
  const [catatan, setCatatan] = useState('');
  const [instansi, setInstansi] = useState('');
  const [tanggapan, setTanggapan] = useState('');
  const [galat, setGalat] = useState('');
  const [info, setInfo] = useState('');
  const [proses, setProses] = useState(false);

  const bukaStatus = () => { setBaru(c.next_status[0] || ''); setCatatan(''); setInstansi(''); setGalat(''); setDlgStatus(true); };

  const simpanStatus = async (e) => {
    e.preventDefault();
    setGalat('');
    setProses(true);
    try {
      await api(`/complaints/${c.id}/status`, { method: 'PATCH', body: { status: baru, catatan: catatan.trim() || undefined, instansi: baru === 'Diteruskan ke Instansi' ? instansi.trim() : undefined } });
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

  if (loading && !c) return <Memuat />;
  if (error) return <Galat pesan={error} ulangi={reload} />;
  if (!c) return null;

  const Ikon = KATEGORI_INFO[c.kategori]?.ikon;
  const petaUrl = c.lat != null && c.lng != null ? `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=18/${c.lat}/${c.lng}` : null;

  return (
    <>
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

        {kelola && (
          <aside className="space-y-6">
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
          </aside>
        )}
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
                    <input type="radio" name="status" value={s} checked={baru === s} onChange={() => setBaru(s)} className="sr-only" />
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
          <Bidang label={baru === 'Ditolak' ? 'Alasan penolakan' : 'Catatan untuk pelapor (opsional)'} id="catatan" wajib={baru === 'Ditolak'}>
            <textarea id="catatan" rows={3} required={baru === 'Ditolak'} minLength={baru === 'Ditolak' ? 3 : undefined} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="field resize-y" />
          </Bidang>
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
