// Aturan hak akses data pengaduan per peran.

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

module.exports = { batasi, bolehLihat, rapikan };
