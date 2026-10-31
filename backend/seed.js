// Membuat ulang semua tabel dan mengisi data contoh.
// PERINGATAN: menghapus SEMUA data yang ada. Jangan dijalankan pada database yang sudah berisi data asli.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./src/db');

const tahun = new Date().getFullYear();
const PASSWORD_DEMO = 'password123';

// Nama desa dan dusun di bawah adalah data awal; ubah lewat menu Pengaturan setelah login sebagai admin.
const PENGATURAN = {
  nama_desa: 'Desa Banyoneng Laok',
  alamat: 'Kantor Desa Banyoneng Laok, Kecamatan Contoh, Kabupaten Contoh',
  jam: 'Senin–Jumat, 08.00–15.00',
  telepon: '',
};
const DUSUN = [
  'Dusun Sumber Gundang',
  'Dusun Langgali',
  'Dusun Langger',
  'Dusun Palanggeren',
  'Dusun Pakes',
  'Dusun Nungburung',
  'Dusun Gibugen',
];

// Urutan status normal. "Diteruskan ke Instansi" dan "Ditolak" punya jalur sendiri.
const ALUR = ['Diterima', 'Diverifikasi', 'Masuk Perencanaan', 'Dalam Perbaikan', 'Selesai'];
const jalur = (status) => {
  if (status === 'Diteruskan ke Instansi') return ['Diterima', 'Diverifikasi', status];
  if (status === 'Ditolak') return ['Diterima', status];
  return ALUR.slice(0, ALUR.indexOf(status) + 1);
};

async function buatPengguna(hash) {
  const tambah = async (nama, email, role, dusun) =>
    (await pool.query('insert into users(nama,email,password,role,dusun) values($1,$2,$3,$4,$5) returning id',
      [nama, email, hash, role, dusun])).rows[0].id;
  return {
    warga: await tambah('Siti Aminah', 'warga@desa.id', 'masyarakat', 'Dusun Sumber Gundang'),
    warga2: await tambah('Ahmad Fauzi', 'warga2@desa.id', 'masyarakat', 'Dusun Palanggeren'),
    perangkat: await tambah('Hasan (Kepala Dusun Langgali)', 'perangkat@desa.id', 'perangkat', 'Dusun Langgali'),
    sekdes: await tambah('Budi Santoso (Sekretaris Desa)', 'sekdes@desa.id', 'admin', null),
    kades: await tambah('Kepala Desa (Klebun)', 'kades@desa.id', 'kades', null),
  };
}

// Tiap baris: judul, kategori, dusun, lokasi, status, urgensi, perkiraan, pelapor, opsi, umur (hari), lat, lng.
// opsi: { anonim, atasNama, instansi, catatan } semuanya opsional.
const contohPengaduan = (u) => [
  ['Jalan desa berlubang di depan balai dusun', 'Jalan', 'Dusun Sumber Gundang', 'Jalan utama Dusun Sumber Gundang, depan balai dusun', 'Dalam Perbaikan', 'Tinggi', '± 30 meter, perlu pengaspalan', u.warga, {}, 12, -7.0292, 112.7461],
  ['Lampu penerangan jalan mati', 'Penerangan Jalan', 'Dusun Langgali', 'Jalan menuju musala Dusun Langgali', 'Masuk Perencanaan', 'Sedang', '5 titik lampu', u.warga, { catatan: 'Diusulkan ke rencana pembangunan desa, menunggu anggaran' }, 9, -7.0301, 112.7479],
  ['Sumur warga mengering', 'Air & Kekeringan', 'Dusun Langger', 'RT 02 Dusun Langger', 'Diverifikasi', 'Tinggi', '± 15 kepala keluarga terdampak', u.perangkat, { atasNama: 'Bu Marlina' }, 6, -7.0315, 112.7502],
  ['Tegangan listrik sering turun naik', 'Listrik (PLN)', 'Dusun Langgali', 'Permukiman RT 01 Dusun Langgali', 'Diteruskan ke Instansi', 'Sedang', null, u.warga, { anonim: true, instansi: 'PLN', catatan: 'Sudah dikoordinasikan dengan PLN, menunggu jadwal pengecekan' }, 5, -7.0288, 112.7455],
  ['Atap ruang kelas bocor', 'Fasilitas Pendidikan', 'Dusun Sumber Gundang', 'Sekolah dasar di Dusun Sumber Gundang', 'Diteruskan ke Instansi', 'Tinggi', '2 ruang kelas', u.perangkat, { atasNama: 'Pak Rahmat (guru)', instansi: 'Dinas Pendidikan', catatan: 'Dinas Pendidikan diundang untuk meninjau lokasi' }, 3, -7.0279, 112.7468],
  ['Jalan setapak ke sawah sudah diperbaiki', 'Jalan', 'Dusun Langger', 'Jalan setapak menuju area persawahan', 'Selesai', 'Rendah', '± 80 meter', u.warga, { catatan: 'Perbaikan selesai dikerjakan secara gotong royong' }, 20, -7.0322, 112.7511],
  ['Puskesmas pembantu kekurangan air bersih', 'Fasilitas Kesehatan', 'Dusun Palanggeren', 'Pustu Dusun Palanggeren', 'Diterima', 'Sedang', null, u.warga2, {}, 1, -7.0335, 112.7533],
  ['Saluran irigasi tersumbat sampah', 'Lainnya', 'Dusun Palanggeren', 'Saluran irigasi dekat lapangan', 'Diterima', 'Rendah', null, u.warga2, {}, 0, null, null],
  ['Lampu jalan pertigaan sudah menyala lagi', 'Penerangan Jalan', 'Dusun Sumber Gundang', 'Pertigaan Dusun Sumber Gundang', 'Selesai', 'Sedang', '2 titik lampu', u.warga2, { catatan: 'Lampu diganti oleh perangkat desa' }, 25, -7.0285, 112.7449],
  ['Jembatan bambu di lahan pribadi lapuk', 'Jalan', 'Dusun Langger', 'Tepi sungai kecil Dusun Langger', 'Ditolak', 'Rendah', null, u.warga2, { catatan: 'Berada di lahan pribadi, bukan kewenangan desa' }, 14, -7.0318, 112.7496],
  ['Air PDAM keruh sejak seminggu', 'Air & Kekeringan', 'Dusun Langgali', 'Jalur pipa Dusun Langgali', 'Diteruskan ke Instansi', 'Sedang', null, u.warga, { instansi: 'PDAM', catatan: 'Laporan sudah disampaikan ke PDAM' }, 7, -7.0296, 112.7484],
  ['Jalan lingkungan rusak parah', 'Jalan', 'Dusun Langgali', 'Gang 3 Dusun Langgali', 'Masuk Perencanaan', 'Tinggi', '± 120 meter', u.perangkat, { atasNama: 'Pak Samsul', catatan: 'Masuk usulan musyawarah desa' }, 4, -7.0306, 112.7490],
];

async function isiPengaduan(u) {
  const data = contohPengaduan(u);
  for (const [i, d] of data.entries()) {
    const [judul, kategori, dusun, lokasi, status, urgensi, perkiraan, pelapor, opsi, umur, lat, lng] = d;
    const kode = `ADU-${tahun}-${String(i + 1).padStart(5, '0')}`;
    const { id } = (await pool.query(
      `insert into complaints(kode,judul,kategori,deskripsi,lokasi,dusun,lat,lng,perkiraan,urgensi,status,anonim,pelapor_nama,instansi,user_id,created_at,updated_at)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now()-($16||' days')::interval,now()) returning id`,
      [kode, judul, kategori, 'Kondisi ini mengganggu aktivitas warga dan perlu segera ditindaklanjuti.', lokasi, dusun, lat, lng,
        perkiraan, urgensi, status, Boolean(opsi.anonim), opsi.atasNama || null, opsi.instansi || null, pelapor, umur])).rows[0];

    const langkah = jalur(status);
    for (const [j, st] of langkah.entries()) {
      const terakhir = j === langkah.length - 1;
      const catatan = j === 0 ? 'Pengaduan diterima oleh sistem' : (terakhir && opsi.catatan) || 'Status diperbarui';
      await pool.query(
        "insert into complaint_logs(complaint_id,status,catatan,created_at) values($1,$2,$3,now()-($4||' days')::interval)",
        [id, st, catatan, Math.max(umur - j * 2, 0)]);
    }
  }
  await pool.query('select setval(\'complaint_seq\', $1)', [data.length]);
  return data.length;
}

async function isiNotifikasi(u) {
  await pool.query(
    `insert into notifications(user_id,tipe,judul,isi) values
     ($1,'Pengaduan','Pengaduan Diterima',$2),
     ($1,'Update','Update Status Pengaduan',$3),
     ($1,'Sistem','Selamat Datang','Terima kasih telah menggunakan layanan pengaduan desa.'),
     ($4,'Pengaduan','Pengaduan Baru',$5)`,
    [u.warga,
      `Pengaduan dengan nomor ADU-${tahun}-00001 telah diterima oleh sistem.`,
      `Status pengaduan ADU-${tahun}-00001 telah berubah menjadi "Dalam Perbaikan".`,
      u.sekdes,
      `Pengaduan baru ADU-${tahun}-00003: Sumur warga mengering (Dusun Langger).`]);
}

(async () => {
  await pool.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

  for (const [key, value] of Object.entries(PENGATURAN)) {
    await pool.query('insert into settings(key,value) values($1,$2)', [key, value]);
  }
  for (const nama of DUSUN) await pool.query('insert into dusun(nama) values($1)', [nama]);

  const pengguna = await buatPengguna(bcrypt.hashSync(PASSWORD_DEMO, 10));
  const jumlah = await isiPengaduan(pengguna);
  await isiNotifikasi(pengguna);

  console.log(`Seed selesai: ${DUSUN.length} dusun, 5 akun demo (password: ${PASSWORD_DEMO}), ${jumlah} pengaduan contoh.`);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
