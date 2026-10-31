// /api/push — pendaftaran perangkat untuk notifikasi push.
const express = require('express');
const { q } = require('../db');
const { auth } = require('../middleware/auth');
const { wrap } = require('../middleware/errors');
const { VAPID } = require('../config');
const push = require('../services/push');

const router = express.Router();
router.use(auth());

// Kunci publik untuk browser. aktif=false bila server belum diberi kunci VAPID.
router.get('/key', (req, res) => {
  res.json(push.aktif() ? { aktif: true, key: VAPID.publik } : { aktif: false, key: null });
});

const teksValid = (v, maks) => typeof v === 'string' && v.length > 0 && v.length <= maks;

router.post('/subscribe', wrap(async (req, res) => {
  if (!push.aktif()) return res.status(503).json({ message: 'Notifikasi push belum diaktifkan di server' });
  const { endpoint, keys } = req.body || {};
  if (!teksValid(endpoint, 2000) || !/^https:\/\//.test(endpoint) || !keys || !teksValid(keys.p256dh, 200) || !teksValid(keys.auth, 100)) {
    return res.status(400).json({ message: 'Data langganan tidak valid' });
  }
  // Satu perangkat = satu endpoint. Bila perangkat dipakai akun lain, langganan pindah ke akun yang sedang login.
  await q(`insert into push_subscriptions(user_id,endpoint,p256dh,auth) values($1,$2,$3,$4)
    on conflict (endpoint) do update set user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth`,
  [req.user.id, endpoint, keys.p256dh, keys.auth]);
  res.status(201).json({ ok: true });
}));

router.post('/unsubscribe', wrap(async (req, res) => {
  const { endpoint } = req.body || {};
  if (!teksValid(endpoint, 2000)) return res.status(400).json({ message: 'Endpoint wajib diisi' });
  await q('delete from push_subscriptions where endpoint=$1 and user_id=$2', [endpoint, req.user.id]);
  res.json({ ok: true });
}));

// Kirim satu notifikasi percobaan ke semua perangkat milik pengguna ini.
router.post('/test', wrap(async (req, res) => {
  if (!push.aktif()) return res.status(503).json({ message: 'Notifikasi push belum diaktifkan di server' });
  const hasil = await push.kirimKeUser([req.user.id], {
    judul: 'Notifikasi percobaan', isi: 'Jika Anda membaca ini, notifikasi di perangkat ini sudah berfungsi.', url: '/app/notifikasi', tag: 'uji',
  });
  res.json(hasil);
}));

module.exports = router;
