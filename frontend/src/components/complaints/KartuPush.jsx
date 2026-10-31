import Tombol from '../ui/Tombol.jsx';
import { Kartu } from '../ui/Kartu.jsx';
import { usePush } from '../../hooks/usePush.js';
import { IkonLonceng, IkonCentang, IkonInfo, IkonKirim } from '../../lib/icons.js';

// Kartu di halaman Notifikasi untuk mengaktifkan push di perangkat ini.
// Tidak pernah meminta izin otomatis: izin baru diminta saat tombol ditekan.
export default function KartuPush() {
  const p = usePush();
  if (!p.siap || !p.serverAktif) return null;

  let isi;
  if (p.perluPasang && !p.didukung) {
    isi = {
      judul: 'Pasang aplikasi untuk menerima notifikasi',
      teks: 'Di iPhone/iPad, buka menu Bagikan di Safari, pilih "Tambah ke Layar Utama", lalu buka aplikasi dari layar utama dan aktifkan notifikasi di sini.',
    };
  } else if (!p.didukung) {
    return null;
  } else if (p.izin === 'denied') {
    isi = { judul: 'Notifikasi diblokir', teks: 'Browser memblokir notifikasi untuk situs ini. Izinkan lewat pengaturan situs (ikon gembok di kolom alamat), lalu muat ulang halaman.' };
  } else if (p.aktif) {
    isi = {
      judul: 'Notifikasi aktif di perangkat ini',
      teks: 'Anda akan diberi tahu saat ada kabar baru tentang pengaduan, meski aplikasi sedang tertutup.',
      aksi: (
        <>
          <Tombol varian="garis" ukuran="sm" ikon={IkonKirim} memuat={p.sibuk} onClick={p.uji}>Kirim percobaan</Tombol>
          <Tombol varian="hantu" ukuran="sm" disabled={p.sibuk} onClick={p.nonaktifkan}>Matikan</Tombol>
        </>
      ),
    };
  } else {
    isi = {
      judul: 'Aktifkan notifikasi di perangkat ini',
      teks: 'Dapatkan pemberitahuan langsung saat status pengaduan berubah, tanpa perlu membuka aplikasi.',
      aksi: <Tombol ukuran="sm" ikon={IkonLonceng} memuat={p.sibuk} onClick={p.aktifkan}>Aktifkan</Tombol>,
    };
  }

  return (
    <Kartu className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center" data-testid="kartu-push">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        {p.aktif ? <IkonCentang aria-hidden /> : <IkonInfo aria-hidden />}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold">{isi.judul}</h2>
        <p className="mt-0.5 text-sm text-muted">{isi.teks}</p>
        {p.galat && <p role="alert" className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{p.galat}</p>}
        {p.info && <p role="status" className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">{p.info}</p>}
      </div>
      {isi.aksi && <div className="flex shrink-0 flex-wrap items-center gap-2">{isi.aksi}</div>}
    </Kartu>
  );
}
