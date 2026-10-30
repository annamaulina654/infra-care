// /api/settings dan /api/dusun — pengaturan desa (khusus admin).
const express = require('express');
const { q } = require('../db');
const { auth } = require('../middleware/auth');
const { wrap } = require('../middleware/errors');
const { teks } = require('../utils/validate');
const { ambilPengaturan, simpanPengaturan } = require('../services/pengaturan');

// Router ini dipasang di /api bersama router lain, jadi pembatasan admin dipasang per rute
// (bukan router.use) agar alamat /api yang tidak dikenal tetap menjawab 404, bukan 401.
const router = express.Router();
const soloAdmin = auth(['admin']);

// Panjang maksimum tiap isian.
const BATAS = { nama_desa: 100, alamat: 200, jam: 100, telepon: 50 };

const bacaSemua = async () => ({
  ...(await ambilPengaturan()),
  dusun: await q(`select d.id, d.nama,
    (select count(*)::int from complaints c where c.dusun = d.nama) as jumlah_pengaduan
    from dusun d order by d.nama`),
});

router.get('/settings', soloAdmin, wrap(async (req, res) => res.json(await bacaSemua())));

router.patch('/settings', soloAdmin, wrap(async (req, res) => {
  const body = req.body || {};
  for (const kunci of Object.keys(BATAS)) {
    if (body[kunci] === undefined) continue;
    const nilai = teks(body[kunci], BATAS[kunci]);
    if (kunci === 'nama_desa' && !nilai) return res.status(400).json({ message: 'Nama desa tidak boleh kosong' });
    await simpanPengaturan(kunci, nilai);
  }
  res.json(await bacaSemua());
}));

router.post('/dusun', soloAdmin, wrap(async (req, res) => {
  const nama = teks(req.body?.nama, 60);
  if (!nama) return res.status(400).json({ message: 'Nama dusun wajib diisi' });
  if ((await q('select 1 from dusun where lower(nama)=lower($1)', [nama])).length) {
    return res.status(400).json({ message: 'Dusun sudah ada' });
  }
  const [d] = await q('insert into dusun(nama) values($1) returning id, nama', [nama]);
  res.status(201).json(d);
}));

// Dusun yang masih dipakai pengaduan atau akun tidak boleh dihapus agar data tidak "yatim".
router.delete('/dusun/:id', soloAdmin, wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [d] = Number.isInteger(id) ? await q('select id, nama from dusun where id=$1', [id]) : [];
  if (!d) return res.status(404).json({ message: 'Dusun tidak ditemukan' });

  const [{ dipakai }] = await q(
    `select (select count(*) from complaints where dusun=$1) + (select count(*) from users where dusun=$1) as dipakai`, [d.nama]);
  if (Number(dipakai) > 0) {
    return res.status(409).json({ message: 'Dusun masih dipakai oleh pengaduan atau akun, jadi tidak bisa dihapus' });
  }
  await q('delete from dusun where id=$1', [id]);
  res.json({ ok: true });
}));

module.exports = router;
