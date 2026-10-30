import { lazy, Suspense } from 'react';
import { Memuat } from '../ui/Status.jsx';
import { IkonLokasiSaya, IkonTutup } from '../../lib/icons.js';

const PetaDasar = lazy(() => import('./PetaDasar.jsx'));

// Pilih titik di peta (opsional). Nilai: [lat, lng] atau null.
export default function PilihLokasi({ nilai, ubah }) {
  const pakaiGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => ubah([p.coords.latitude, p.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={pakaiGPS}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold hover:bg-surface2">
          <IkonLokasiSaya aria-hidden />Pakai lokasi saya
        </button>
        {nilai && (
          <button type="button" onClick={() => ubah(null)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-muted hover:bg-surface2">
            <IkonTutup aria-hidden />Hapus titik
          </button>
        )}
        <span className="text-xs text-muted">{nilai ? `${nilai[0].toFixed(5)}, ${nilai[1].toFixed(5)}` : 'Ketuk peta untuk menandai lokasi (boleh dilewati).'}</span>
      </div>
      <Suspense fallback={<Memuat className="h-72 rounded-xl border border-line" />}>
        <PetaDasar titikPilih={nilai} saatKlik={ubah} />
      </Suspense>
    </div>
  );
}
