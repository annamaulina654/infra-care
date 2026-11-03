import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Memuat, Pesan } from '../ui/Status.jsx';
import { IkonLokasiSaya, IkonTutup, IkonMemuat, IkonPeringatan } from '../../lib/icons.js';

const PetaDasar = lazy(() => import('./PetaDasar.jsx'));

// Minta akurasi terbaik dan jangan memakai posisi lama, supaya titik benar-benar
// mengikuti posisi pelapor saat ini.
const OPSI_GPS = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 };

function pesanGalat(err) {
  if (window.isSecureContext === false) {
    return 'GPS hanya bisa dipakai lewat HTTPS. Buka situs ini dengan alamat https://, lalu coba lagi.';
  }
  if (!navigator.geolocation) {
    return 'Browser atau perangkat ini tidak mendukung GPS.';
  }
  switch (err?.code) {
    case 1: return 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser, lalu coba lagi.';
    case 2: return 'Lokasi tidak tersedia. Pastikan GPS perangkat menyala dan Anda berada di area terbuka.';
    case 3: return 'GPS terlalu lama merespons. Coba lagi di area terbuka.';
    default: return 'Lokasi tidak dapat diambil. Coba lagi.';
  }
}

// Pilih titik di peta (opsional). Nilai: [lat, lng] atau null.
// Tombol GPS memakai watchPosition agar titik terus diperbarui selama pelapor bergerak.
export default function PilihLokasi({ nilai, ubah }) {
  const [mengikuti, setMengikuti] = useState(false);
  const [mencari, setMencari] = useState(false);
  const [akurasi, setAkurasi] = useState(null);
  const [lokasiSaya, setLokasiSaya] = useState(null);
  const [galat, setGalat] = useState('');
  const watchRef = useRef(null);

  const hentikan = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation?.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setMengikuti(false);
    setMencari(false);
  }, []);

  // Jangan tinggalkan watchPosition berjalan setelah halaman ditinggalkan.
  useEffect(() => () => {
    if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current);
  }, []);

  const mulaiGPS = () => {
    setGalat('');
    if (window.isSecureContext === false || !navigator.geolocation?.watchPosition) {
      setGalat(pesanGalat());
      return;
    }
    hentikan();
    setMencari(true);
    setMengikuti(true);
    try {
      const id = navigator.geolocation.watchPosition(
        (p) => {
          if (watchRef.current !== id) return;
          const pos = [p.coords.latitude, p.coords.longitude];
          setLokasiSaya(pos);
          setAkurasi(Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null);
          setMencari(false);
          setGalat('');
          ubah(pos);
        },
        (err) => {
          if (watchRef.current !== id) return;
          setGalat(pesanGalat(err));
          hentikan();
        },
        OPSI_GPS,
      );
      watchRef.current = id;
    } catch {
      setGalat('Lokasi tidak dapat diakses. Periksa izin lokasi browser, lalu coba lagi.');
      hentikan();
    }
  };

  // Mengetuk peta berarti pelapor ingin mengunci/menyesuaikan titik secara manual.
  const pilihManual = (pos) => {
    if (mengikuti) hentikan();
    setGalat('');
    ubah(pos);
  };

  const hapus = () => {
    hentikan();
    setLokasiSaya(null);
    setAkurasi(null);
    setGalat('');
    ubah(null);
  };

  const akurasiBulat = akurasi != null ? Math.max(1, Math.round(akurasi)) : null;
  const akurasiRendah = mengikuti && akurasi != null && akurasi > 50;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {mencari ? (
          <>
            <button type="button" disabled
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white opacity-70">
              <IkonMemuat className="size-4 animate-spin" aria-hidden />Mencari sinyal GPS...
            </button>
            <button type="button" onClick={hentikan}
              className="inline-flex min-h-9 items-center rounded-lg px-3 text-xs font-semibold text-muted hover:bg-surface2">
              Batal
            </button>
          </>
        ) : mengikuti ? (
          <>
            <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              GPS aktif{akurasiBulat != null ? ` · ±${akurasiBulat} m` : ''}
            </span>
            <button type="button" onClick={hentikan}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold hover:bg-surface2">
              Kunci titik
            </button>
          </>
        ) : (
          <button type="button" onClick={mulaiGPS}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white shadow-sm hover:bg-brand-hover">
            <IkonLokasiSaya className="size-4" aria-hidden />Gunakan lokasi GPS saya
          </button>
        )}
        {nilai && (
          <button type="button" onClick={hapus}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted hover:bg-surface2">
            <IkonTutup className="size-4" aria-hidden />Hapus titik
          </button>
        )}
      </div>

      {galat && <Pesan jenis="galat" className="mb-2">{galat}</Pesan>}
      {akurasiRendah && !galat && (
        <p className="mb-2 flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <IkonPeringatan className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Akurasi GPS masih rendah (±{akurasiBulat} m). Tunggu beberapa detik atau pindah ke area terbuka.
        </p>
      )}

      <p className="mb-2 text-xs text-muted" aria-live="polite">
        {mengikuti
          ? 'Titik mengikuti posisi Anda secara real-time. Ketuk peta untuk mengunci dan menyesuaikan titik.'
          : nilai
            ? <>Titik terpilih: <span className="font-semibold text-ink">{nilai[0].toFixed(5)}, {nilai[1].toFixed(5)}</span>. Ketuk peta untuk memindahkan.</>
            : 'Ketuk peta untuk menandai lokasi, atau gunakan GPS agar titik sesuai posisi Anda saat ini.'}
      </p>

      <Suspense fallback={<Memuat className="h-72 rounded-xl border border-line" />}>
        <PetaDasar
          titikPilih={nilai}
          saatKlik={pilihManual}
          lokasiSaya={lokasiSaya}
          akurasi={mengikuti ? akurasi : null}
          ikuti={mengikuti}
        />
      </Suspense>
    </div>
  );
}
