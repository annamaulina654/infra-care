// Pengaturan tampilan yang jarang berubah. Data desa (nama, kontak, dusun) diambil dari server
// dan diubah admin lewat menu Pengaturan, jadi bukan di sini.

// Nama aplikasi. "Klebun" adalah sebutan kepala desa dalam bahasa Madura (saran narasumber:
// nama sederhana dan mudah diingat). Untuk mengganti nama, ubah nilai di bawah dan <title> di index.html.
export const APP_NAME = 'Lapor Pak Klebun';
export const APP_TAGLINE = 'Layanan Pengaduan Infrastruktur Desa';

// Dipakai bila data desa dari server belum termuat (mis. server mati).
export const DESA_CADANGAN = {
  desa: 'Desa',
  kontak: { alamat: '', jam: '', telepon: '' },
  dusun: [],
};

// Titik awal peta [latitude, longitude]. Ganti dengan koordinat kantor desa.
export const PUSAT_PETA = [-6.982046710749073, 112.96781073235321];
export const ZOOM_AWAL = 15;

// Batas ukuran foto setelah dikompres di browser (karakter data URL, ± 2 MB).
export const FOTO_MAKS_SISI = 1280;
export const FOTO_KUALITAS = 0.75;
