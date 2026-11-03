// /api/complaints dan /api/stats — pengaduan untuk pengguna yang sudah login.
const express = require('express');
const { q } = require('../db');
const { auth } = require('../middleware/auth');
const { wrap } = require('../middleware/errors');
const { KATEGORI, URGENSI, STATUS, TRANSISI, MAKS_FOTO, JABATAN } = require('../config');
const { teks, angka, halaman, periksaFoto } = require('../utils/validate');
const { buatFilter, polaCari } = require('../utils/filter');
const { batasi, bolehLihat, rapikan, adminAtauPemilik } = require('../utils/access');
const limiter = require('../middleware/rateLimit');
const { notifikasiUser, notifikasiRole, notifikasiPerangkatDusun } = require('../services/notifikasi');
const { ambilPengaturan } = require('../services/pengaturan');

const router = express.Router();
const PENGELOLA = ['admin', 'kades'];

// Kolom untuk daftar: tanpa foto (data URL besar), cukup penanda ada_foto.
const KOLOM_DAFTAR = `c.id, c.kode, c.judul, c.kategori, c.deskripsi, c.lokasi, c.dusun, c.lat, c.lng, c.perkiraan,
  c.urgensi, c.status, c.anonim, c.pelapor_nama, c.instansi, c.user_id, c.created_at, c.updated_at,
  (c.foto is not null) as ada_foto, u.nama as pengirim`;

// ------------------------------------------------------------ statistik

router.get('/stats', auth(), wrap(async (req, res) => {
  const f = batasi(buatFilter(), req.user);
  const [s] = await q(`select
    count(*)::int total,
    count(*) filter(where c.status in('Diterima','Diverifikasi'))::int diproses,
    count(*) filter(where c.status='Masuk Perencanaan')::int perencanaan,
    count(*) filter(where c.status='Dalam Perbaikan')::int perbaikan,
    count(*) filter(where c.status='Selesai')::int selesai,
    count(*) filter(where c.status='Diteruskan ke Instansi')::int diteruskan,
    count(*) filter(where c.status='Ditolak')::int ditolak,
    count(*) filter(where c.status not in('Selesai','Ditolak'))::int aktif
    from complaints c where ${f.where()}`, f.params);
  const kategori = await q(
    `select c.kategori, count(*)::int n from complaints c where ${f.where()} group by 1 order by 2 desc, 1`, f.params);
  // Hari dihitung menurut waktu Jakarta (WIB), bukan zona waktu server database (Supabase memakai UTC).
  // `hari` dikirim sebagai tanggal ISO (YYYY-MM-DD) agar frontend dapat menentukan nama harinya dengan benar.
  const harian = await q(
    `select to_char(d, 'YYYY-MM-DD') hari,
       (select count(*)::int from complaints c where (c.created_at at time zone 'Asia/Jakarta')::date = d::date and ${f.where()}) n
     from generate_series((now() at time zone 'Asia/Jakarta')::date - 6, (now() at time zone 'Asia/Jakarta')::date, '1 day') d
     order by d`, f.params);
  res.json({ ...s, kategori, harian });
}));

// ------------------------------------------------------------ daftar

router.get('/complaints', auth(), wrap(async (req, res) => {
  const { page, limit, offset } = halaman(req.query, { limitAwal: 20, limitMaks: 100 });
  const f = batasi(buatFilter(), req.user);

  if (req.query.status) f.tambah('c.status = ?', teks(req.query.status, 40));
  if (req.query.kategori) f.tambah('c.kategori = ?', teks(req.query.kategori, 60));
  if (req.query.dusun) f.tambah('c.dusun = ?', teks(req.query.dusun, 60));
  // kelompok: pengelompokan status untuk tab di halaman riwayat
  const kelompok = { aktif: "c.status not in('Selesai','Ditolak')", selesai: "c.status = 'Selesai'", ditolak: "c.status = 'Ditolak'" }[req.query.kelompok];
  if (kelompok) f.tambah(kelompok);
  if (req.query.q) {
    const p = polaCari(teks(req.query.q, 100));
    f.tambah('(c.judul ilike ? or c.kode ilike ? or c.kategori ilike ? or c.dusun ilike ?)', p, p, p, p);
  }

  const [{ total }] = await q(`select count(*)::int total from complaints c where ${f.where()}`, f.params);
  const rows = await q(
    `select ${KOLOM_DAFTAR} from complaints c join users u on u.id = c.user_id
     where ${f.where()} order by c.created_at desc, c.id desc limit ${limit} offset ${offset}`, f.params);
  res.json({ data: rows.map((c) => rapikan(c, req.user)), total, page, limit });
}));

// Titik untuk peta. Harus didaftarkan sebelum "/complaints/:kode" supaya "map" tidak dianggap kode.
router.get('/complaints/map', auth(), wrap(async (req, res) => {
  const f = batasi(buatFilter(), req.user).tambah('c.lat is not null and c.lng is not null');
  res.json(await q(
    `select c.kode, c.judul, c.kategori, c.status, c.urgensi, c.dusun, c.lat, c.lng
     from complaints c where ${f.where()} order by c.created_at desc limit 1000`, f.params));
}));

router.get('/complaints/:kode', auth(), wrap(async (req, res) => {
  const [c] = await q(
    `select c.*, u.nama as pengirim, u.role as pembuat_role
     from complaints c join users u on u.id = c.user_id where c.kode=$1`, [req.params.kode]);
  if (!c) return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
  if (!bolehLihat(req.user, c)) return res.status(403).json({ message: 'Tidak diizinkan' });

  const { foto, pembuat_role, ...kolom } = c;
  const out = rapikan({ ...kolom, ada_foto: foto !== null }, req.user);
  out.foto = foto;
  // Nama asli pelapor dan peran pembuat hanya diperlukan admin/pemilik untuk mengisi form edit.
  if (adminAtauPemilik(req.user, c)) {
    out.pelapor_nama = c.pelapor_nama || '';
    out.pembuat_role = pembuat_role;
  }
  // Nama dan tanda tangan penandatangan ikut agar bukti pengaduan bisa dicetak semua pihak.
  const p = await ambilPengaturan();
  out.ttd = {
    kades: { nama: p.nama_kades, gambar: p.ttd_kades },
    sekdes: { nama: p.nama_sekdes, gambar: p.ttd_sekdes },
  };
  out.logs = await q('select status, catatan, foto, oleh, created_at from complaint_logs where complaint_id=$1 order by created_at, id', [c.id]);
  out.next_status = PENGELOLA.includes(req.user.role) ? TRANSISI[c.status] : [];
  res.json(out);
}));

// ------------------------------------------------------------ buat pengaduan

router.post('/complaints', auth(['masyarakat', 'perangkat']),
  limiter.batasi({ nama: 'complaint', maks: 20, jendelaMs: 60 * 60 * 1000, kunci: (req) => req.user.id }),
  wrap(async (req, res) => {
  const b = req.body || {};
  const perangkat = req.user.role === 'perangkat';

  const judul = teks(b.judul, 120);
  const kategori = teks(b.kategori, 60);
  const deskripsi = teks(b.deskripsi, 500);
  const lokasi = teks(b.lokasi, 300);
  const dusun = teks(b.dusun || req.user.dusun, 60);
  const perkiraan = teks(b.perkiraan, 200) || null;
  const urgensi = teks(b.urgensi, 10);
  // Perangkat desa melapor atas nama warga yang datang langsung / tidak punya HP.
  const pelaporNama = perangkat ? teks(b.pelapor_nama, 100) : null;
  const anonim = b.anonim === true || b.anonim === 'true';
  const setujuPrivasi = b.setuju_privasi === true || b.setuju_privasi === 'true';

  if (!judul || !deskripsi || !lokasi || !dusun || !KATEGORI.includes(kategori) || !URGENSI.includes(urgensi)) {
    return res.status(400).json({ message: 'Lengkapi judul, kategori, deskripsi, dusun, lokasi, dan urgensi' });
  }
  if (!setujuPrivasi) {
    return res.status(400).json({ message: 'Persetujuan kebijakan privasi wajib dicentang sebelum mengirim laporan' });
  }
  if (perangkat && !pelaporNama) return res.status(400).json({ message: 'Nama warga yang melapor wajib diisi' });
  if (!(await q('select 1 from dusun where nama=$1', [dusun])).length) {
    return res.status(400).json({ message: 'Dusun tidak dikenal' });
  }
  const { foto, error } = periksaFoto(b.foto, MAKS_FOTO);
  if (error) return res.status(400).json({ message: error });

  const [{ n }] = await q("select nextval('complaint_seq')::int n");
  const kode = `ADU-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`;

  const [c] = await q(
    `insert into complaints(kode,judul,kategori,deskripsi,foto,lokasi,dusun,lat,lng,perkiraan,urgensi,anonim,pelapor_nama,setuju_privasi,user_id)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,$14) returning id, kode`,
    [kode, judul, kategori, deskripsi, foto, lokasi, dusun, angka(b.lat, -90, 90), angka(b.lng, -180, 180),
      perkiraan, urgensi, anonim, pelaporNama, req.user.id]);

  await q("insert into complaint_logs(complaint_id,status,catatan,oleh) values($1,'Diterima','Pengaduan diterima oleh sistem','sistem')", [c.id]);
  await notifikasiUser(req.user.id, 'Pengaduan', 'Pengaduan Diterima', `Pengaduan dengan nomor ${kode} telah diterima oleh sistem.`);
  // Sekretaris desa perlu tahu ada pengaduan baru untuk diverifikasi.
  await notifikasiRole('admin', 'Pengaduan', 'Pengaduan Baru', `Pengaduan baru ${kode}: ${judul} (${dusun}).`);
  // Kepala dusun terkait juga perlu tahu, kecuali ia sendiri yang menginput laporan.
  await notifikasiPerangkatDusun(dusun, 'Pengaduan', 'Pengaduan Baru di Dusun Anda',
    `Pengaduan baru ${kode}: ${judul} (${dusun}).`, perangkat ? req.user.id : null);

  res.status(201).json({ id: c.id, kode: c.kode });
}));

// ------------------------------------------------------------ edit pengaduan (admin atau pemilik)

// Admin dan pemilik boleh memperbaiki seluruh isian pengaduan. Status tidak ikut diubah
// karena punya alur sendiri lewat PATCH /complaints/:id/status.
router.patch('/complaints/:id', auth(), wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });

  const [lama] = await q(
    `select c.*, u.role as pembuat_role
     from complaints c join users u on u.id = c.user_id where c.id=$1`, [id]);
  if (!lama) return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
  if (!adminAtauPemilik(req.user, lama)) {
    return res.status(403).json({ message: 'Tidak diizinkan mengedit pengaduan ini' });
  }

  const b = req.body || {};
  const perangkat = lama.pembuat_role === 'perangkat';

  const judul = teks(b.judul, 120);
  const kategori = teks(b.kategori, 60);
  const deskripsi = teks(b.deskripsi, 500);
  const lokasi = teks(b.lokasi, 300);
  const dusun = teks(b.dusun ?? lama.dusun, 60);
  const perkiraan = 'perkiraan' in b ? (teks(b.perkiraan, 200) || null) : lama.perkiraan;
  const urgensi = teks(b.urgensi, 10);
  // Laporan perangkat dibuat atas nama warga, jadi nama warga tetap wajib diisi.
  const pelaporNama = perangkat ? teks(b.pelapor_nama ?? lama.pelapor_nama, 100) : null;
  const anonim = perangkat ? false : (b.anonim === undefined ? lama.anonim : b.anonim === true || b.anonim === 'true');

  if (!judul || !deskripsi || !lokasi || !dusun || !KATEGORI.includes(kategori) || !URGENSI.includes(urgensi)) {
    return res.status(400).json({ message: 'Lengkapi judul, kategori, deskripsi, dusun, lokasi, dan urgensi' });
  }
  if (perangkat && !pelaporNama) return res.status(400).json({ message: 'Nama warga yang melapor wajib diisi' });
  if (!(await q('select 1 from dusun where nama=$1', [dusun])).length) {
    return res.status(400).json({ message: 'Dusun tidak dikenal' });
  }

  // Foto: tidak dikirim = tetap; null/"" = hapus; data URL = ganti.
  let foto = lama.foto;
  if ('foto' in b) {
    if (b.foto == null || b.foto === '') {
      foto = null;
    } else {
      const hasil = periksaFoto(b.foto, MAKS_FOTO);
      if (hasil.error) return res.status(400).json({ message: hasil.error });
      foto = hasil.foto;
    }
  }

  const lat = 'lat' in b ? angka(b.lat, -90, 90) : lama.lat;
  const lng = 'lng' in b ? angka(b.lng, -180, 180) : lama.lng;

  await q(
    `update complaints set judul=$1, kategori=$2, deskripsi=$3, foto=$4, lokasi=$5, dusun=$6,
       lat=$7, lng=$8, perkiraan=$9, urgensi=$10, anonim=$11, pelapor_nama=$12, updated_at=now()
     where id=$13`,
    [judul, kategori, deskripsi, foto, lokasi, dusun, lat, lng, perkiraan, urgensi, anonim, pelaporNama, lama.id]);
  await q(
    "insert into complaint_logs(complaint_id,status,catatan,oleh) values($1,$2,'Data pengaduan diubah',$3)",
    [lama.id, lama.status, req.user.role]);

  // Pemilik diberi tahu bila yang mengedit adalah admin, supaya perubahan tidak mengejutkan.
  if (req.user.id !== lama.user_id) {
    await notifikasiUser(lama.user_id, 'Update', 'Pengaduan Diperbarui',
      `Data pengaduan ${lama.kode} telah diperbarui oleh ${JABATAN[req.user.role]}.`);
  }
  res.json({ id: lama.id, kode: lama.kode });
}));

// ------------------------------------------------------------ tindak lanjut (admin & kades)

const ambilPengaduan = async (idMentah) => {
  const id = Number(idMentah);
  if (!Number.isInteger(id)) return null;
  const [c] = await q('select id, kode, status, user_id, dusun from complaints where id=$1', [id]);
  return c || null;
};

router.patch('/complaints/:id/status', auth(PENGELOLA), wrap(async (req, res) => {
  const status = String(req.body?.status || '');
  const catatan = teks(req.body?.catatan, 300);
  const instansi = teks(req.body?.instansi, 100);

  if (!STATUS.includes(status)) return res.status(400).json({ message: 'Status tidak valid' });
  const lama = await ambilPengaduan(req.params.id);
  if (!lama) return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });

  const tujuan = TRANSISI[lama.status];
  if (!tujuan.length) {
    return res.status(400).json({ message: `Pengaduan sudah berstatus "${lama.status}" dan tidak bisa diubah lagi` });
  }
  if (!tujuan.includes(status)) {
    return res.status(400).json({ message: `Status "${lama.status}" tidak bisa langsung menjadi "${status}"` });
  }
  if (status === 'Diteruskan ke Instansi' && !instansi) {
    return res.status(400).json({ message: 'Nama instansi tujuan wajib diisi' });
  }
  if (status === 'Ditolak' && catatan.length < 3) {
    return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });
  }
  let fotoSimpan = null;
  if (status === 'Dalam Perbaikan') {
    if (catatan.length < 3) {
      return res.status(400).json({ message: 'Catatan untuk pelapor wajib diisi' });
    }
    const cekFoto = periksaFoto(req.body?.foto, MAKS_FOTO);
    if (cekFoto.error) return res.status(400).json({ message: cekFoto.error });
    fotoSimpan = cekFoto.foto;
  }

  await q('update complaints set status=$1, instansi=coalesce($2,instansi), updated_at=now() where id=$3',
    [status, instansi || null, lama.id]);
  const catatanLog = catatan || (instansi ? `Diteruskan ke ${instansi}` : `Status diubah oleh ${JABATAN[req.user.role]}`);
  await q('insert into complaint_logs(complaint_id,status,catatan,foto,oleh) values($1,$2,$3,$4,$5)',
    [lama.id, status, catatanLog, fotoSimpan, req.user.role]);
  // Sertakan alasan/instansi di notifikasi supaya pelapor tidak perlu membuka detail
  // hanya untuk mengetahui mengapa laporannya ditolak atau diteruskan.
  const rincian = [instansi ? `Diteruskan ke ${instansi}.` : '', catatan, status === 'Dalam Perbaikan' ? '(dilengkapi bukti foto)' : ''].filter(Boolean).join(' ');
  await notifikasiUser(lama.user_id, 'Update', 'Update Status Pengaduan',
    `Status pengaduan ${lama.kode} menjadi "${status}".${rincian ? ` ${rincian}` : ''}`);
  res.json({ id: lama.id, kode: lama.kode, status });
}));

// Tanggapan tanpa mengubah status: pemerintah desa memberi kabar supaya laporan tidak terkesan dibiarkan.
router.post('/complaints/:id/tanggapan', auth(PENGELOLA), wrap(async (req, res) => {
  const catatan = teks(req.body?.catatan, 300);
  if (catatan.length < 3) return res.status(400).json({ message: 'Tanggapan minimal 3 karakter' });

  const c = await ambilPengaduan(req.params.id);
  if (!c) return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });

  await q('insert into complaint_logs(complaint_id,status,catatan,oleh) values($1,$2,$3,$4)',
    [c.id, c.status, catatan, req.user.role]);
  await q('update complaints set updated_at=now() where id=$1', [c.id]);
  await notifikasiUser(c.user_id, 'Update', 'Tanggapan Baru',
    `Ada tanggapan baru untuk pengaduan ${c.kode}: "${catatan}"`);
  res.status(201).json({ ok: true });
}));

// Warga (atau perangkat yang menginput laporan) dapat menambah informasi/balasan
// tanpa mengubah status. Pesan masuk ke riwayat dan memberi tahu pemerintah desa.
router.post('/complaints/:id/pesan', auth(),
  limiter.batasi({ nama: 'pesan', maks: 20, jendelaMs: 60 * 60 * 1000, kunci: (req) => req.user.id }),
  wrap(async (req, res) => {
    const catatan = teks(req.body?.catatan, 500);
    if (catatan.length < 3) return res.status(400).json({ message: 'Pesan minimal 3 karakter' });

    const c = await ambilPengaduan(req.params.id);
    if (!c) return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
    if (c.user_id !== req.user.id) return res.status(403).json({ message: 'Hanya pelapor yang dapat mengirim pesan' });

    await q('insert into complaint_logs(complaint_id,status,catatan,oleh) values($1,$2,$3,$4)',
      [c.id, c.status, catatan, req.user.role]);
    await q('update complaints set updated_at=now() where id=$1', [c.id]);

    const isi = `Pelapor pengaduan ${c.kode} mengirim pesan baru: "${catatan}"`;
    await notifikasiRole('admin', 'Pesan', 'Pesan dari Pelapor', isi);
    await notifikasiPerangkatDusun(c.dusun, 'Pesan', 'Pesan dari Pelapor', isi, req.user.id);

    res.status(201).json({ ok: true });
  }));

module.exports = router;
