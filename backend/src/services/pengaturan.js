// Pengaturan desa (nama, alamat kantor, jam layanan, telepon) disimpan di tabel settings
// supaya admin bisa mengubahnya dari halaman Pengaturan tanpa mengubah kode.
const { q } = require('../db');

const KUNCI = ['nama_desa', 'alamat', 'jam', 'telepon'];

const ambilPengaturan = async () => {
  const hasil = Object.fromEntries(KUNCI.map((k) => [k, '']));
  for (const r of await q('select key, value from settings')) {
    if (KUNCI.includes(r.key)) hasil[r.key] = r.value;
  }
  return hasil;
};

const simpanPengaturan = (kunci, nilai) =>
  q('insert into settings(key,value) values($1,$2) on conflict(key) do update set value=excluded.value', [kunci, nilai]);

module.exports = { KUNCI, ambilPengaturan, simpanPengaturan };
