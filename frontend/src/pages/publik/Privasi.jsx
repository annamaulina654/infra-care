import { Link } from 'react-router-dom';
import Tombol from '../../components/ui/Tombol.jsx';
import { Kartu } from '../../components/ui/Kartu.jsx';
import { useDesa } from '../../context/DesaContext.jsx';
import { useJudul } from '../../hooks/useMisc.js';
import { IkonAman, IkonKiri, IkonLokasi, IkonUser } from '../../lib/icons.js';

// Ringkasan kebijakan privasi yang ditautkan dari formulir pendaftaran dan pengaduan.
// Isinya sengaja memakai bahasa sederhana agar mudah dipahami warga.
const BAGIAN = [
  {
    judul: 'Data apa yang kami simpan',
    isi: 'Nama, email, dusun, dan kata sandi (tersimpan dalam bentuk terenkripsi) saat Anda mendaftar. Untuk setiap pengaduan, kami menyimpan judul, kategori, uraian, lokasi, foto (bila diunggah), serta riwayat penanganannya.',
  },
  {
    judul: 'Untuk apa data digunakan',
    isi: 'Data dipakai untuk memverifikasi laporan, menghubungi Anda bila perlu keterangan tambahan, menampilkan perkembangan pengaduan, dan menyusun laporan pembangunan desa. Data tidak dijual atau dipakai untuk iklan.',
  },
  {
    judul: 'Siapa yang dapat melihat',
    isi: 'Perangkat desa di dusun Anda, sekretaris desa, dan kepala desa dapat melihat data lengkap untuk keperluan verifikasi. Halaman publik hanya menampilkan judul, kategori, dusun, status, dan riwayat penanganan, termasuk foto bukti pengerjaan dan foto setelah perbaikan yang diunggah pemerintah desa. Nama pelapor, foto yang diunggah pelapor, alamat rinci, dan titik koordinat tidak ditampilkan.',
  },
  {
    judul: 'Pilihan anonim',
    isi: 'Saat membuat pengaduan, Anda dapat mencentang "Sembunyikan nama saya". Nama Anda tidak akan ditampilkan kepada perangkat desa. Sekretaris desa tetap dapat melihatnya untuk memastikan laporan dapat dipertanggungjawabkan.',
  },
  {
    judul: 'Berapa lama data disimpan',
    isi: 'Data pengaduan disimpan sebagai arsip penanganan infrastruktur desa. Anda dapat meminta penghapusan akun atau data pribadi dengan menghubungi kantor desa; data pengaduan yang sudah menjadi bagian laporan publik akan disimpan tanpa identitas pelapor.',
  },
  {
    judul: 'Hak Anda',
    isi: 'Anda berhak melihat data yang tersimpan di halaman Profil, memperbarui data yang tidak akurat, meminta penghapusan akun, serta menanyakan bagaimana data Anda digunakan melalui kontak kantor desa yang tertera di halaman ini.',
  },
];

export default function Privasi() {
  useJudul('Kebijakan Privasi');
  const { desa, kontak } = useDesa();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-brand"><IkonKiri className="size-4" aria-hidden />Kembali ke halaman depan</Link>
      <h1 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-brand-deep sm:text-3xl"><IkonAman className="size-7 text-brand" aria-hidden />Kebijakan Privasi</h1>
      <p className="mt-2 text-muted">Bagaimana {desa} mengumpulkan, memakai, dan melindungi data yang Anda berikan saat melapor.</p>

      <Kartu className="mt-6">
        <p className="text-sm leading-relaxed">
          Dengan mencentang persetujuan pada formulir pendaftaran atau pengaduan, Anda menyatakan telah membaca dan menyetujui ringkasan kebijakan ini.
          Persetujuan dicatat beserta waktu pengiriman sebagai bukti bahwa data diberikan secara sadar dan sukarela.
        </p>
      </Kartu>

      <div className="mt-6 space-y-4">
        {BAGIAN.map((b, i) => (
          <Kartu key={b.judul}>
            <h2 className="text-base font-bold">{i + 1}. {b.judul}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{b.isi}</p>
          </Kartu>
        ))}
      </div>

      <Kartu className="mt-6">
        <h2 className="flex items-center gap-2 text-base font-bold"><IkonLokasi className="size-4 text-brand" aria-hidden />Hubungi kami</h2>
        <p className="mt-1.5 text-sm text-muted">Pertanyaan atau permintaan terkait data pribadi dapat disampaikan ke kantor desa:</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {kontak?.alamat && <li>{kontak.alamat}</li>}
          {kontak?.jam && <li>{kontak.jam}</li>}
          {kontak?.telepon && <li>{kontak.telepon}</li>}
          {!kontak?.alamat && !kontak?.jam && !kontak?.telepon && <li className="text-muted">Informasi kontak belum diisi.</li>}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Tombol ke="/login?daftar=1" ukuran="sm" ikon={IkonUser}>Daftar akun warga</Tombol>
          <Tombol ke="/" ukuran="sm" varian="garis">Ke halaman depan</Tombol>
        </div>
      </Kartu>
    </div>
  );
}
