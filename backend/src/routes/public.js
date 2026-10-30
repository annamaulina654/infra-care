// /api/public — halaman yang boleh dibuka tanpa login.
// Prinsip: tidak ada nama pelapor, foto, deskripsi, alamat rinci, atau koordinat di sini.
const express = require('express');
const { q } = require('../db');
const { wrap } = require('../middleware/errors');
const { teks, halaman } = require('../utils/validate');
const { buatFilter, polaCari } = require('../utils/filter');
const { ambilPengaturan } = require('../services/pengaturan');

const router = express.Router();

const KOLOM_PUBLIK = 'c.kode, c.judul, c.kategori, c.dusun, c.status, c.urgensi, c.instansi, c.created_at, c.updated_at';

router.get('/info', wrap(async (req, res) => {
  const p = await ambilPengaturan();
  const dusun = await q('select nama from dusun order by nama');
  res.json({
    desa: p.nama_desa,
    kontak: { alamat: p.alamat, jam: p.jam, telepon: p.telepon },
    dusun: dusun.map((d) => d.nama),
  });
}));

router.get('/stats', wrap(async (req, res) => {
  const [r] = await q(`select
    count(*)::int total,
    count(*) filter(where status='Selesai')::int selesai,
    count(*) filter(where status not in('Selesai','Ditolak'))::int proses,
    count(*) filter(where status='Masuk Perencanaan')::int perencanaan
    from complaints`);
  res.json(r);
}));

router.get('/complaints', wrap(async (req, res) => {
  const { page, limit, offset } = halaman(req.query, { limitAwal: 12, limitMaks: 50 });
  const f = buatFilter();
  if (req.query.status) f.tambah('c.status = ?', teks(req.query.status, 40));
  if (req.query.kategori) f.tambah('c.kategori = ?', teks(req.query.kategori, 60));
  if (req.query.dusun) f.tambah('c.dusun = ?', teks(req.query.dusun, 60));
  if (req.query.q) {
    const p = polaCari(teks(req.query.q, 100));
    f.tambah('(c.judul ilike ? or c.kode ilike ? or c.kategori ilike ? or c.dusun ilike ?)', p, p, p, p);
  }

  const [{ total }] = await q(`select count(*)::int total from complaints c where ${f.where()}`, f.params);
  const data = await q(
    `select ${KOLOM_PUBLIK} from complaints c where ${f.where()}
     order by c.created_at desc, c.id desc limit ${limit} offset ${offset}`, f.params);
  res.json({ data, total, page, limit });
}));

router.get('/complaints/:kode', wrap(async (req, res) => {
  const [c] = await q(`select c.id, ${KOLOM_PUBLIK} from complaints c where c.kode=$1`, [req.params.kode]);
  if (!c) return res.status(404).json({ message: 'Pengaduan tidak ditemukan' });
  const logs = await q('select status, catatan, created_at from complaint_logs where complaint_id=$1 order by created_at, id', [c.id]);
  const { id, ...aman } = c;
  res.json({ ...aman, logs });
}));

module.exports = router;
