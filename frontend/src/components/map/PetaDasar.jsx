// Peta Leaflet dasar. Dimuat malas (React.lazy) supaya halaman lain tidak ikut membawa Leaflet.
// Penanda memakai L.divIcon (kelas .pin di index.css), jadi tidak perlu gambar ikon bawaan Leaflet.
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PUSAT_PETA, ZOOM_AWAL } from '../../config.js';

export const ikonPin = (warna) =>
  L.divIcon({
    className: '',
    html: `<span class="pin" style="background:${warna}"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });

function Klik({ saatKlik }) {
  useMapEvents({ click: (e) => saatKlik?.([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Terbang({ ke }) {
  const map = useMap();
  useEffect(() => { if (ke) map.flyTo(ke, Math.max(map.getZoom(), 16), { duration: 0.6 }); }, [ke, map]);
  return null;
}

// Pas ke semua titik bila ada, selain itu tetap di pusat desa.
function PasKeTitik({ titik }) {
  const map = useMap();
  useEffect(() => {
    if (titik?.length) map.fitBounds(L.latLngBounds(titik), { padding: [40, 40], maxZoom: 17 });
  }, [titik, map]);
  return null;
}

export default function PetaDasar({ tinggi = 'h-72', titikPilih, saatKlik, tanda = [], pasKe, className = '', children }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line ${tinggi} ${className}`}>
      <MapContainer center={titikPilih || PUSAT_PETA} zoom={ZOOM_AWAL} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {saatKlik && <Klik saatKlik={saatKlik} />}
        {titikPilih && <><Marker position={titikPilih} icon={ikonPin('#1565d8')} /><Terbang ke={titikPilih} /></>}
        {pasKe && <PasKeTitik titik={pasKe} />}
        {tanda}
        {children}
      </MapContainer>
    </div>
  );
}
