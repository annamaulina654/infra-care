// /api/auth — login, daftar, profil sendiri, ganti password.
const express = require('express');
const bcrypt = require('bcryptjs');
const { q } = require('../db');
const { auth, buatSesi, publik } = require('../middleware/auth');
const { wrap } = require('../middleware/errors');
const limiter = require('../middleware/rateLimit');
const { teks, emailValid } = require('../utils/validate');
const { MAKS_FOTO_PROFIL } = require('../config');

const router = express.Router();

const dusunAda = async (nama) => (await q('select 1 from dusun where nama=$1', [nama])).length > 0;

router.post('/login', wrap(async (req, res) => {
  const email = teks(req.body?.email, 200).toLowerCase();
  const kunci = limiter.kunci(req, email);
  if (limiter.terkunci(kunci)) {
    return res.status(429).json({ message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' });
  }

  const [u] = await q('select * from users where email=$1', [email]);
  if (!u || !bcrypt.compareSync(String(req.body?.password || ''), u.password)) {
    limiter.catatGagal(kunci);
    return res.status(400).json({ message: 'Email atau password salah' });
  }
  limiter.reset(kunci);
  if (!u.aktif) return res.status(403).json({ message: 'Akun Anda dinonaktifkan. Hubungi sekretaris desa.' });
  res.json(buatSesi(u));
}));

// Pendaftaran publik selalu menghasilkan akun warga. Akun perangkat/admin/kades dibuat oleh admin.
router.post('/register', wrap(async (req, res) => {
  const nama = teks(req.body?.nama, 100);
  const email = teks(req.body?.email, 200).toLowerCase();
  const dusun = teks(req.body?.dusun, 60);
  const password = String(req.body?.password || '');

  if (!nama || !emailValid(email) || password.length < 6 || !dusun) {
    return res.status(400).json({ message: 'Nama, email yang valid, dusun, dan password (min. 6 karakter) wajib diisi' });
  }
  if (!(await dusunAda(dusun))) return res.status(400).json({ message: 'Dusun tidak dikenal' });
  if ((await q('select 1 from users where email=$1', [email])).length) {
    return res.status(400).json({ message: 'Email sudah terdaftar' });
  }

  const [u] = await q(
    "insert into users(nama,email,password,role,dusun) values($1,$2,$3,'masyarakat',$4) returning *",
    [nama, email, bcrypt.hashSync(password, 10), dusun]
  );
  res.status(201).json(buatSesi(u));
}));

router.get('/me', auth(), (req, res) => res.json(publik(req.user)));

// Hanya warga yang boleh pindah dusun sendiri; dusun perangkat desa ditetapkan admin.
router.patch('/me', auth(), wrap(async (req, res) => {
  const nama = req.body?.nama === undefined ? req.user.nama : teks(req.body.nama, 100);
  let dusun = req.user.dusun;
  if (req.user.role === 'masyarakat' && req.body?.dusun !== undefined) dusun = teks(req.body.dusun, 60);

  if (!nama) return res.status(400).json({ message: 'Nama tidak boleh kosong' });
  if (dusun !== req.user.dusun && !(await dusunAda(dusun))) return res.status(400).json({ message: 'Dusun tidak dikenal' });

  let foto = req.user.foto;
  if (req.body?.foto !== undefined) {
    const f = req.body.foto;
    if (!f) foto = null;
    else if (!/^data:image\/(jpeg|png);base64,/.test(String(f)) || String(f).length > MAKS_FOTO_PROFIL) {
      return res.status(400).json({ message: 'Foto profil harus JPG/PNG dan berukuran kecil' });
    } else foto = String(f);
  }

  const [u] = await q('update users set nama=$1, dusun=$2, foto=$3 where id=$4 returning id, nama, email, role, dusun, foto, aktif',
    [nama, dusun, foto, req.user.id]);
  res.json(publik(u));
}));

router.post('/password', auth(), wrap(async (req, res) => {
  const lama = String(req.body?.password_lama || '');
  const baru = String(req.body?.password_baru || '');
  if (baru.length < 6) return res.status(400).json({ message: 'Password baru minimal 6 karakter' });

  const [u] = await q('select password from users where id=$1', [req.user.id]);
  if (!bcrypt.compareSync(lama, u.password)) return res.status(400).json({ message: 'Password lama salah' });

  await q('update users set password=$1 where id=$2', [bcrypt.hashSync(baru, 10), req.user.id]);
  res.json({ ok: true });
}));

module.exports = router;
