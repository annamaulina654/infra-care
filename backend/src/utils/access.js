// Aturan hak akses data pengaduan per peran.
const { TRANSISI } = require('../config');

// Batasi pengaduan (alias tabel "c") sesuai peran. Dipasang ke buatFilter().
//   masyarakat      : hanya pengaduan miliknya
//   perangkat       : pengaduan di dusunnya + yang ia input sendiri
//   admin dan kades : semua pengaduan
const batasi = (filter, user) => {
  if (user.role === 'masyarakat') return filter.tambah('c.user_id = ?', user.id);
  if (user.role === 'perangkat') return filter.tambah('(c.dusun = ? or c.user_id = ?)', user.dusun, user.id);
  return filter;
};

const bolehLihat = (user, c) =>
  user.role === 'admin' || user.role === 'kades' || c.user_id === user.id ||
  (user.role === 'perangkat' && c.dusun === user.dusun);

const adminAtauPemilik = (user, c) => user.role === 'admin' || c.user_id === user.id;

// Aturan mengedit ISI pengaduan (status punya alur sendiri):
//   - pemilik laporan (warga, atau perangkat yang menginput) : hanya saat status masih "Diterima"
//   - sekretaris desa (admin)                                 : semua status kecuali final
//   - kepala desa dan peran lain                              : tidak boleh
//   - status final (Selesai/Ditolak)                          : terkunci untuk semua, supaya bukti cetak dan riwayat tetap cocok
// Mengembalikan teks alasan bila TIDAK boleh, atau null bila boleh.
const alasanTolakEdit = (user, c) => {
  const admin = user.role === 'admin';
  if (!admin && c.user_id !== user.id) return 'Anda tidak diizinkan mengedit pengaduan ini';
  if (TRANSISI[c.status]?.length === 0) return `Pengaduan yang sudah berstatus "${c.status}" tidak dapat diedit lagi`;
  if (!admin && c.status !== 'Diterima') {
    return 'Pengaduan sudah diproses pemerintah desa sehingga isinya tidak dapat diubah. Tambahkan informasi lewat kolom pesan';
  }
  return null;
};

// Pengaduan anonim: nama pelapor hanya terlihat oleh sekretaris desa (untuk tindak lanjut)
// dan oleh pemilik laporan. Peran lain hanya melihat "Anonim".
const namaPelapor = (c, user) => {
  const asli = c.pelapor_nama || c.pengirim;
  if (!c.anonim) return asli;
  return adminAtauPemilik(user, c) ? `${asli} (anonim)` : 'Anonim';
};

// Siapkan baris pengaduan untuk dikirim: buang kolom mentah (nama asli) dan isi `pelapor`.
// Pada laporan anonim, id pemilik juga disembunyikan dari peran yang tidak berhak.
const rapikan = (c, user) => {
  const { pelapor_nama, pengirim, ...aman } = c;
  if (c.anonim && !adminAtauPemilik(user, c)) aman.user_id = null;
  return { ...aman, pelapor: namaPelapor(c, user) };
};

module.exports = { batasi, bolehLihat, rapikan, adminAtauPemilik, alasanTolakEdit };
