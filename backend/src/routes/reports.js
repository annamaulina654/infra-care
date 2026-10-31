// /api/reports — rekap dan ekspor untuk rapat evaluasi desa (admin & kades).
const express = require('express');
const { q } = require('../db');
const { auth } = require('../middleware/auth');
const { wrap } = require('../middleware/errors');
const { teks, tanggalValid } = require('../utils/validate');
const { buatFilter } = require('../utils/filter');
const { buatCsv } = require('../utils/csv');

const router = express.Router();
router.use(auth(['admin', 'kades']));

const MAKS_BARIS_CSV = 10000;

// Baca rentang tanggal opsional (?dari=YYYY-MM-DD&sampai=YYYY-MM-DD) dan ubah jadi filter SQL.
const bacaPeriode = (query) => {
  const dari = teks(query.dari, 10);
  const sampai = teks(query.sampai, 10);
  if ((dari && !tanggalValid(dari)) || (sampai && !tanggalValid(sampai))) {
    return { error: 'Format tanggal harus YYYY-MM-DD' };
  }
  if (dari && sampai && dari > sampai) return { error: 'Tanggal awal tidak boleh setelah tanggal akhir' };

  const filter = buatFilter();
  if (dari) filter.tambah("(c.created_at at time zone 'Asia/Jakarta')::date >= ?::date", dari);
  if (sampai) filter.tambah("(c.created_at at time zone 'Asia/Jakarta')::date <= ?::date", sampai);
  return { filter, periode: { dari: dari || null, sampai: sampai || null } };
};

router.get('/summary', wrap(async (req, res) => {
  const { filter: f, periode, error } = bacaPeriode(req.query);
  if (error) return res.status(400).json({ message: error });

  const kelompok = (kolom, tambahan = '') => q(
    `select c.${kolom}, count(*)::int n from complaints c where ${f.where()} ${tambahan} group by 1 order by 2 desc, 1`, f.params);

  const [{ total }] = await q(`select count(*)::int total from complaints c where ${f.where()}`, f.params);
  // Lama penanganan = selisih waktu laporan masuk dengan log "Selesai" yang pertama.
  const [{ rata }] = await q(
    `select round(avg(extract(epoch from (l.waktu - c.created_at)) / 86400)::numeric, 1)::float8 as rata
     from complaints c
     join (select complaint_id, min(created_at) as waktu from complaint_logs where status='Selesai' group by complaint_id) l
       on l.complaint_id = c.id
     where ${f.where()}`, f.params);

  res.json({
    periode,
    total,
    per_status: await kelompok('status'),
    per_kategori: await kelompok('kategori'),
    per_dusun: await kelompok('dusun'),
    per_instansi: await kelompok('instansi', 'and c.instansi is not null'),
    rata_hari_selesai: rata,
  });
}));

router.get('/export.csv', wrap(async (req, res) => {
  const { filter: f, error } = bacaPeriode(req.query);
  if (error) return res.status(400).json({ message: error });

  const rows = await q(
    `select c.kode, to_char(c.created_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') as tanggal,
       c.dusun, c.kategori, c.judul, c.lokasi, c.perkiraan, c.urgensi, c.status, c.instansi,
       c.anonim, c.pelapor_nama, u.nama as pengirim,
       to_char(c.updated_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') as diperbarui
     from complaints c join users u on u.id = c.user_id
     where ${f.where()} order by c.created_at desc, c.id desc limit ${MAKS_BARIS_CSV}`, f.params);

  // Di ekspor, nama pelapor anonim disamarkan untuk semua peran (file mudah tersebar).
  const csv = buatCsv(
    ['Kode', 'Tanggal', 'Dusun', 'Kategori', 'Judul', 'Lokasi', 'Perkiraan', 'Urgensi', 'Status', 'Instansi', 'Pelapor', 'Diperbarui'],
    rows.map((c) => [c.kode, c.tanggal, c.dusun, c.kategori, c.judul, c.lokasi, c.perkiraan, c.urgensi, c.status, c.instansi,
      c.anonim ? 'Anonim' : c.pelapor_nama || c.pengirim, c.diperbarui]));

  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="laporan-pengaduan.csv"');
  res.send(csv);
}));

module.exports = router;
