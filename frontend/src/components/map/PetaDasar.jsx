// Peta Leaflet dasar. Dimuat malas (React.lazy) supaya halaman lain tidak ikut membawa Leaflet.
// Penanda memakai L.divIcon (kelas .pin di index.css), jadi tidak perlu gambar ikon bawaan Leaflet.
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
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

// Titik posisi pengguna dari GPS: lingkaran biru. Denyut hanya tampil saat GPS aktif.
export const ikonTitikSaya = (aktif = false) =>
  L.divIcon({
    className: '',
    html: `<span class="titik-saya${aktif ? ' titik-saya-aktif' : ''}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

function Klik({ saatKlik }) {
  useMapEvents({ click: (e) => saatKlik?.([e.latlng.lat, e.latlng.lng]) });
  return null;
}

function Terbang({ ke, aktif = true }) {
  const map = useMap();
  const sebelumnya = useRef(null);
  useEffect(() => {
    if (!ke) return;
    const sama = sebelumnya.current?.[0] === ke[0] && sebelumnya.current?.[1] === ke[1];
    sebelumnya.current = ke;
    if (!aktif || sama) return;
    map.flyTo(ke, Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [ke, aktif, map]);
  return null;
}

// Saat GPS aktif, ikuti posisi terbaru tanpa animasi terbang yang mengganggu.
function IkutiLokasi({ ke, aktif }) {
  const map = useMap();
  const pertama = useRef(true);
  useEffect(() => {
    if (!aktif) { pertama.current = true; return; }
    if (!ke) return;
    if (pertama.current) {
      map.flyTo(ke, Math.max(map.getZoom(), 17), { duration: 0.6 });
      pertama.current = false;
    } else {
      map.panTo(ke, { animate: true, duration: 0.35 });
    }
  }, [ke, aktif, map]);
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

export default function PetaDasar({
  tinggi = 'h-72', titikPilih, saatKlik, tanda = [], pasKe,
  lokasiSaya, akurasi, ikuti = false, className = '', children,
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line ${tinggi} ${className}`}>
      <MapContainer center={titikPilih || PUSAT_PETA} zoom={ZOOM_AWAL} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {saatKlik && <Klik saatKlik={saatKlik} />}
        {lokasiSaya && akurasi != null && (
          <Circle center={lokasiSaya} radius={akurasi}
            pathOptions={{ color: '#1565d8', weight: 1, fillColor: '#1565d8', fillOpacity: 0.12 }} />
        )}
        {lokasiSaya && <Marker position={lokasiSaya} icon={ikonTitikSaya(ikuti)} interactive={false} />}
        {titikPilih && <><Marker position={titikPilih} icon={ikonPin('#1565d8')} /><Terbang ke={titikPilih} aktif={!ikuti} /></>}
        {ikuti && <IkutiLokasi ke={lokasiSaya} aktif={ikuti} />}
        {pasKe && <PasKeTitik titik={pasKe} />}
        {tanda}
        {children}
      </MapContainer>
    </div>
  );
}
