// /api/notifications — notifikasi milik pengguna yang login.
const express = require('express');
const { q } = require('../db');
const { auth } = require('../middleware/auth');
const { wrap } = require('../middleware/errors');

const router = express.Router();
router.use(auth());

router.get('/', wrap(async (req, res) => {
  res.json(await q(
    'select id, tipe, judul, isi, dibaca, created_at from notifications where user_id=$1 order by created_at desc, id desc',
    [req.user.id]));
}));

router.post('/read-all', wrap(async (req, res) => {
  await q('update notifications set dibaca=true where user_id=$1', [req.user.id]);
  res.json({ ok: true });
}));

module.exports = router;
