// /api/users — kelola akun (khusus admin).
const express = require('express');
const bcrypt = require('bcryptjs');
const { q } = require('../db');
const { auth } = require('../middleware/auth');
const { wrap } = require('../middleware/errors');
const { ROLES } = require('../config');
const { teks, emailValid } = require('../utils/validate');
const { buatFilter, polaCari } = require('../utils/filter');

const router = express.Router();
router.use(auth(['admin']));

router.get('/', wrap(async (req, res) => {
  const f = buatFilter();
  if (ROLES.includes(req.query.role)) f.tambah('u.role = ?', req.query.role);
  if (req.query.q) {
    const p = polaCari(teks(req.query.q, 100));
    f.tambah('(u.nama ilike ? or u.email ilike ?)', p, p);
  }
  res.json(await q(
    `select u.id, u.nama, u.email, u.role, u.dusun, u.aktif, u.created_at,
       (select count(*)::int from complaints c where c.user_id = u.id) as jumlah_pengaduan
     from users u where ${f.where()} order by u.created_at desc, u.id desc`, f.params));
}));

// Admin membuat akun untuk perangkat desa, kepala desa, atau admin lain.
router.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  const nama = teks(b.nama, 100);
  const email = teks(b.email, 200).toLowerCase();
  const role = String(b.role || '');
  const password = String(b.password || '');
  const butuhDusun = role === 'masyarakat' || role === 'perangkat';
  const dusun = butuhDusun ? teks(b.dusun, 60) : null;

  if (!nama || !emailValid(email) || password.length < 6 || !ROLES.includes(role)) {
    return res.status(400).json({ message: 'Nama, email yang valid, peran, dan password (min. 6 karakter) wajib diisi' });
  }
  if (butuhDusun && !dusun) return res.status(400).json({ message: 'Dusun wajib diisi untuk warga dan perangkat desa' });
  if (dusun && !(await q('select 1 from dusun where nama=$1', [dusun])).length) {
    return res.status(400).json({ message: 'Dusun tidak dikenal' });
  }
  if ((await q('select 1 from users where email=$1', [email])).length) {
    return res.status(400).json({ message: 'Email sudah terdaftar' });
  }

  const [u] = await q(
    'insert into users(nama,email,password,role,dusun) values($1,$2,$3,$4,$5) returning id, nama, email, role, dusun, aktif, created_at',
    [nama, email, bcrypt.hashSync(password, 10), role, dusun]);
  res.status(201).json({ ...u, jumlah_pengaduan: 0 });
}));

const bacaId = (req) => (/^\d+$/.test(req.params.id) ? Number(req.params.id) : null);

router.patch('/:id', wrap(async (req, res) => {
  const id = bacaId(req);
  const [lama] = id ? await q('select * from users where id=$1', [id]) : [];
  if (!lama) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });

  const b = req.body || {};
  const nama = b.nama === undefined ? lama.nama : teks(b.nama, 100);
  const role = b.role === undefined ? lama.role : String(b.role);
  const aktif = b.aktif === undefined ? lama.aktif : b.aktif === true;
  let dusun = b.dusun === undefined ? lama.dusun : teks(b.dusun, 60);

  if (!nama) return res.status(400).json({ message: 'Nama tidak boleh kosong' });
  if (!ROLES.includes(role)) return res.status(400).json({ message: 'Peran tidak valid' });
  if (b.aktif !== undefined && typeof b.aktif !== 'boolean') return res.status(400).json({ message: 'Status aktif tidak valid' });
  if (role === 'admin' || role === 'kades') dusun = null;
  if ((role === 'masyarakat' || role === 'perangkat') && !dusun) {
    return res.status(400).json({ message: 'Dusun wajib diisi untuk warga dan perangkat desa' });
  }
  if (dusun && !(await q('select 1 from dusun where nama=$1', [dusun])).length) {
    return res.status(400).json({ message: 'Dusun tidak dikenal' });
  }
  if (id === req.user.id && (role !== lama.role || aktif === false)) {
    return res.status(400).json({ message: 'Tidak bisa menurunkan atau menonaktifkan akun sendiri' });
  }
  if (lama.role === 'admin' && lama.aktif && (role !== 'admin' || !aktif)) {
    const [{ n }] = await q("select count(*)::int n from users where role='admin' and aktif and id<>$1", [id]);
    if (n < 1) return res.status(400).json({ message: 'Minimal harus ada satu admin aktif' });
  }

  const [u] = await q(
    `update users set nama=$1, role=$2, dusun=$3, aktif=$4 where id=$5
     returning id, nama, email, role, dusun, aktif, created_at,
       (select count(*)::int from complaints c where c.user_id = users.id) as jumlah_pengaduan`,
    [nama, role, dusun, aktif, id]);
  res.json(u);
}));

router.post('/:id/reset-password', wrap(async (req, res) => {
  const id = bacaId(req);
  const baru = String(req.body?.password_baru || '');
  if (baru.length < 6) return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
  const r = id ? await q('update users set password=$1 where id=$2 returning id', [bcrypt.hashSync(baru, 10), id]) : [];
  if (!r.length) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
  res.json({ ok: true });
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
  if (id === req.user.id) return res.status(400).json({ message: 'Tidak bisa menghapus akun sendiri' });

  const [u] = await q('select id from users where id=$1', [id]);
  if (!u) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });

  const [{ n }] = await q('select count(*)::int n from complaints where user_id=$1', [id]);
  if (n > 0) return res.status(409).json({ message: 'Akun ini memiliki pengaduan, jadi tidak bisa dihapus' });

  await q('delete from users where id=$1', [id]);
  res.json({ ok: true });
}));

module.exports = router;
