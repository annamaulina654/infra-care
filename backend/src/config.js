// Konfigurasi dan konstanta bersama.
// Daftar KATEGORI, URGENSI, STATUS, dan TRANSISI harus sama dengan frontend/src/lib/constants.js.

// File .env hanya dibaca saat development. Di Vercel, variabel diambil dari dasbor proyek.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL (atau POSTGRES_URL) belum diatur di file .env / Environment Variables.');
}

// JWT_SECRET wajib di production. Nilai cadangan hanya untuk development lokal,
// supaya token tidak bisa dipalsukan kalau variabel lingkungan lupa diatur.
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'rahasia-dev-lokal');
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET wajib diisi (file .env / Environment Variables di Vercel).');
}

const ROLES = ['masyarakat', 'perangkat', 'admin', 'kades'];

const KATEGORI = [
  'Jalan',
  'Penerangan Jalan',
  'Air & Kekeringan',
  'Listrik (PLN)',
  'Fasilitas Pendidikan',
  'Fasilitas Kesehatan',
  'Lainnya',
];

const URGENSI = ['Tinggi', 'Sedang', 'Rendah'];

const STATUS = ['Diterima', 'Diverifikasi', 'Masuk Perencanaan', 'Dalam Perbaikan', 'Selesai', 'Diteruskan ke Instansi', 'Ditolak'];

// Status → status yang boleh dituju berikutnya. Status final tidak punya tujuan lagi.
// Alur desa: pengaduan bisa menunggu anggaran (Masuk Perencanaan) atau diteruskan ke instansi lain.
const TRANSISI = {
  'Diterima': ['Diverifikasi', 'Diteruskan ke Instansi', 'Ditolak'],
  'Diverifikasi': ['Masuk Perencanaan', 'Diteruskan ke Instansi', 'Ditolak'],
  'Masuk Perencanaan': ['Dalam Perbaikan', 'Diteruskan ke Instansi', 'Ditolak'],
  'Dalam Perbaikan': ['Selesai'],
  'Diteruskan ke Instansi': ['Dalam Perbaikan', 'Selesai', 'Ditolak'],
  'Selesai': [],
  'Ditolak': [],
};

// Panjang maksimum data URL foto (± 2 MB). Foto sudah dikompres di browser sebelum dikirim.
const MAKS_FOTO = 2_800_000;
const MAKS_FOTO_PROFIL = 400_000;

// Jabatan yang ditampilkan di riwayat publik (nama pegawai tidak dimunculkan).
const JABATAN = { admin: 'Sekretaris Desa', kades: 'Kepala Desa', perangkat: 'Perangkat Desa', masyarakat: 'Warga' };

module.exports = {
  JABATAN, DATABASE_URL, JWT_SECRET, ROLES, KATEGORI, URGENSI, STATUS, TRANSISI, MAKS_FOTO, MAKS_FOTO_PROFIL,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
