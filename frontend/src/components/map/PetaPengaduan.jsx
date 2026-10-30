import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import PetaDasar, { ikonPin } from './PetaDasar.jsx';
import { STATUS_GAYA } from '../../lib/constants.js';

// Semua pengaduan yang punya koordinat; warna penanda mengikuti status.
export default function PetaPengaduan({ data }) {
  const titik = useMemo(() => data.map((d) => [d.lat, d.lng]), [data]);
  return (
    <PetaDasar tinggi="h-[65dvh] min-h-80" pasKe={titik}>
      {data.map((d) => (
        <Marker key={d.kode} position={[d.lat, d.lng]} icon={ikonPin(STATUS_GAYA[d.status]?.warna || '#64748b')}>
          <Popup>
            <div className="min-w-40 text-sm">
              <p className="font-bold">{d.judul}</p>
              <p className="text-xs text-slate-500">{d.kode} · {d.dusun}</p>
              <p className="mt-1 text-xs font-semibold">{d.status}</p>
              <Link to={`/app/pengaduan/${d.kode}`} className="mt-1.5 inline-block text-xs font-semibold text-blue-600 underline">Buka detail</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </PetaDasar>
  );
}
