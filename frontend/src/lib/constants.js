// Konstanta bersama. KATEGORI, URGENSI, STATUS, dan ALUR harus sama dengan backend/src/config.js.
import {
  IkonBeranda, IkonTambah, IkonDaftar, IkonPeta, IkonLonceng, IkonUser, IkonUsers, IkonPengaturan, IkonLaporan,
  IkonFormulir, IkonJalan, IkonLampu, IkonAir, IkonListrik, IkonSekolah, IkonKesehatan, IkonKonstruksi,
  IkonJam, IkonPerencanaan, IkonPengerjaan, IkonSukses, IkonTeruskan, IkonTolak, IkonMenunggu,
} from './icons.js';

export const KATEGORI = [
  'Jalan', 'Penerangan Jalan', 'Air & Kekeringan', 'Listrik (PLN)', 'Fasilitas Pendidikan', 'Fasilitas Kesehatan', 'Lainnya',
];

// Ikon dan keterangan singkat tiap kategori (dipakai di landing dan form).
export const KATEGORI_INFO = {
  'Jalan': { ikon: IkonJalan, ket: 'Jalan berlubang, jembatan atau gorong-gorong rusak' },
  'Penerangan Jalan': { ikon: IkonLampu, ket: 'Lampu jalan mati atau area gelap' },
  'Air & Kekeringan': { ikon: IkonAir, ket: 'Sumur kering, saluran air bermasalah' },
  'Listrik (PLN)': { ikon: IkonListrik, ket: 'Tegangan tidak normal, tiang atau kabel rusak' },
  'Fasilitas Pendidikan': { ikon: IkonSekolah, ket: 'Bangunan atau sarana sekolah rusak' },
  'Fasilitas Kesehatan': { ikon: IkonKesehatan, ket: 'Posyandu, polindes, atau pustu bermasalah' },
  'Lainnya': { ikon: IkonKonstruksi, ket: 'Kerusakan infrastruktur lain di desa' },
};

export const URGENSI = [
  { nilai: 'Tinggi', ket: 'Butuh penanganan segera' },
  { nilai: 'Sedang', ket: 'Mengganggu aktivitas warga' },
  { nilai: 'Rendah', ket: 'Kerusakan ringan' },
];

export const STATUS = [
  'Diterima', 'Diverifikasi', 'Masuk Perencanaan', 'Dalam Perbaikan', 'Selesai', 'Diteruskan ke Instansi', 'Ditolak',
];

// Tahapan normal yang ditampilkan sebagai garis kemajuan.
export const ALUR = ['Diterima', 'Diverifikasi', 'Masuk Perencanaan', 'Dalam Perbaikan', 'Selesai'];

export const STATUS_AKHIR = ['Selesai', 'Ditolak'];

// Tampilan tiap status: ikon, kelas badge (terang + gelap), dan warna penanda di peta.
export const STATUS_GAYA = {
  'Diterima': { ikon: IkonMenunggu, badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200', warna: '#64748b' },
  'Diverifikasi': { ikon: IkonJam, badge: 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200', warna: '#7c3aed' },
  'Masuk Perencanaan': { ikon: IkonPerencanaan, badge: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200', warna: '#0284c7' },
  'Dalam Perbaikan': { ikon: IkonPengerjaan, badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200', warna: '#d97706' },
  'Selesai': { ikon: IkonSukses, badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200', warna: '#059669' },
  'Diteruskan ke Instansi': { ikon: IkonTeruskan, badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200', warna: '#4f46e5' },
  'Ditolak': { ikon: IkonTolak, badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200', warna: '#dc2626' },
};

export const URGENSI_GAYA = {
  Tinggi: { badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200', pilih: 'border-red-500 bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-200' },
  Sedang: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200', pilih: 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
  Rendah: { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200', pilih: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
};

export const ROLE_LABEL = {
  masyarakat: 'Warga',
  perangkat: 'Perangkat Desa',
  admin: 'Sekretaris Desa',
  kades: 'Kepala Desa',
};

// Menu samping per peran: [alamat, label, ikon].
export const MENU = {
  masyarakat: [
    ['/app', 'Dashboard', IkonBeranda, true],
    ['/app/buat', 'Buat Pengaduan', IkonTambah],
    ['/app/pengaduan', 'Pengaduan Saya', IkonDaftar],
    ['/app/notifikasi', 'Notifikasi', IkonLonceng],
    ['/app/profil', 'Profil', IkonUser],
  ],
  perangkat: [
    ['/app', 'Dashboard', IkonBeranda, true],
    ['/app/buat', 'Lapor Atas Nama Warga', IkonFormulir],
    ['/app/pengaduan', 'Pengaduan Dusun', IkonDaftar],
    ['/app/peta', 'Peta Pengaduan', IkonPeta],
    ['/app/notifikasi', 'Notifikasi', IkonLonceng],
    ['/app/profil', 'Profil', IkonUser],
  ],
  admin: [
    ['/app', 'Dashboard', IkonBeranda, true],
    ['/app/pengaduan', 'Kelola Pengaduan', IkonDaftar],
    ['/app/peta', 'Peta Pengaduan', IkonPeta],
    ['/app/laporan', 'Laporan', IkonLaporan],
    ['/app/pengguna', 'Data Pengguna', IkonUsers],
    ['/app/pengaturan', 'Pengaturan Desa', IkonPengaturan],
    ['/app/notifikasi', 'Notifikasi', IkonLonceng],
    ['/app/profil', 'Profil', IkonUser],
  ],
  kades: [
    ['/app', 'Dashboard', IkonBeranda, true],
    ['/app/pengaduan', 'Pengaduan Desa', IkonDaftar],
    ['/app/peta', 'Peta Pengaduan', IkonPeta],
    ['/app/laporan', 'Laporan', IkonLaporan],
    ['/app/notifikasi', 'Notifikasi', IkonLonceng],
    ['/app/profil', 'Profil', IkonUser],
  ],
};

// Peran yang boleh mengelola (mengubah status, melihat laporan).
export const PENGELOLA = ['admin', 'kades'];
