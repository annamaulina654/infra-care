// Membuat notifikasi di dalam aplikasi, lalu (bila dikonfigurasi) mengirimnya sebagai push ke perangkat penerima.
// Dipakai semua route supaya tidak ada insert notifikasi yang lupa memicu push.
const { q } = require('../db');
const { kirimKeUser } = require('./push');

// Push ditunggu (await) karena di serverless proses bisa dihentikan setelah respons terkirim.
// Kegagalannya hanya dicatat; notifikasi di database sudah tersimpan.
const dorong = async (userIds, judul, isi) => {
  try { await kirimKeUser(userIds, { judul, isi }); } catch (e) { console.error('Push gagal:', e.message); }
};

async function notifikasiUser(userId, tipe, judul, isi) {
  if (!userId) return;
  await q('insert into notifications(user_id,tipe,judul,isi) values($1,$2,$3,$4)', [userId, tipe, judul, isi]);
  await dorong([userId], judul, isi);
}

// Ke semua pengguna aktif dengan peran tertentu (mis. semua sekretaris desa).
async function notifikasiRole(role, tipe, judul, isi) {
  const baris = await q(
    'insert into notifications(user_id,tipe,judul,isi) select id,$2,$3,$4 from users where role=$1 and aktif returning user_id',
    [role, tipe, judul, isi]);
  await dorong(baris.map((b) => b.user_id), judul, isi);
}

module.exports = { notifikasiUser, notifikasiRole };
