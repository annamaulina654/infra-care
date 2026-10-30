import Tombol from '../components/ui/Tombol.jsx';
import { Kosong } from '../components/ui/Status.jsx';
import { useJudul } from '../hooks/useMisc.js';
import { IkonPeringatan, IkonBeranda } from '../lib/icons.js';

export default function TidakDitemukan() {
  useJudul('Halaman tidak ditemukan');
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <Kosong ikon={IkonPeringatan} judul="Halaman tidak ditemukan" teks="Alamat yang Anda buka tidak ada atau sudah dipindahkan."
        aksi={<Tombol ke="/" ikon={IkonBeranda}>Ke halaman depan</Tombol>} />
    </div>
  );
}
