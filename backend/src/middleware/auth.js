// Autentikasi JWT dan pembatasan peran.
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { q } = require('../db');
const { wrap } = require('./errors');

const MASA_BERLAKU = '7d';

// Data pengguna yang boleh dikirim ke browser.
const publik = (u) => ({ id: u.id, nama: u.nama, email: u.email, role: u.role, dusun: u.dusun, foto: u.foto ?? null, aktif: u.aktif });

// Token hanya memuat id. Nama, peran, dan dusun selalu dibaca ulang dari database,
// jadi akun yang dihapus atau diubah perannya langsung berlaku tanpa menunggu token kedaluwarsa.
const buatSesi = (u) => ({ token: jwt.sign({ id: u.id }, JWT_SECRET, { expiresIn: MASA_BERLAKU }), user: publik(u) });

const ambilToken = (req) => String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');

// auth()            : harus login
// auth(['admin'])   : harus login dengan salah satu peran tersebut
const auth = (roles) => wrap(async (req, res, next) => {
  let id;
  try {
    id = jwt.verify(ambilToken(req), JWT_SECRET).id;
  } catch {
    return res.status(401).json({ message: 'Belum login' });
  }
  const [user] = await q('select id, nama, email, role, dusun, foto, aktif from users where id=$1', [id]);
  if (!user || !user.aktif) return res.status(401).json({ message: 'Akun tidak aktif atau tidak ditemukan' });
  if (roles && !roles.includes(user.role)) return res.status(403).json({ message: 'Tidak diizinkan' });
  req.user = user;
  next();
});

module.exports = { auth, buatSesi, publik };
