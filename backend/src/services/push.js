// Pengiriman Web Push. Sifatnya "best effort": kegagalan push tidak boleh menggagalkan permintaan utama.
const { q } = require('../db');
const { VAPID } = require('../config');

let lib = null;        // pustaka web-push, dimuat malas
let diatur = false;

const aktif = () => Boolean(VAPID.publik && VAPID.privat);

// Dimuat saat pertama dipakai; bila paket belum ter-install push dianggap mati, server tetap jalan.
const ambilLib = () => {
  if (!aktif()) return null;
  if (!lib) {
    try { lib = require('web-push'); } catch (e) { console.error('Paket web-push tidak tersedia:', e.message); return null; }
  }
  if (!diatur) { lib.setVapidDetails(VAPID.subjek, VAPID.publik, VAPID.privat); diatur = true; }
  return lib;
};

// Hanya untuk pengujian: ganti pustaka dengan tiruan.
const _pakaiLib = (tiruan) => { lib = tiruan; diatur = false; };

// Alamat tujuan saat notifikasi diketuk: halaman pengaduan bila isi memuat kode, selain itu daftar notifikasi.
const tujuan = (isi) => {
  const kode = String(isi || '').match(/ADU-\d{4}-\d{5}/);
  return kode ? `/app/pengaduan/${kode[0]}` : '/app/notifikasi';
};

// Kirim ke semua perangkat milik daftar pengguna. Langganan yang sudah mati (404/410) dihapus.
async function kirimKeUser(userIds, { judul, isi, url, tag }) {
  const wp = ambilLib();
  if (!wp || !userIds.length) return { terkirim: 0, gagal: 0 };
  const langganan = await q(
    'select id, endpoint, p256dh, auth from push_subscriptions where user_id = any($1::int[])', [userIds]);
  const muatan = JSON.stringify({ judul, isi, url: url || tujuan(isi), tag: tag || undefined });
  let terkirim = 0; let gagal = 0;
  await Promise.all(langganan.map(async (l) => {
    try {
      await wp.sendNotification({ endpoint: l.endpoint, keys: { p256dh: l.p256dh, auth: l.auth } }, muatan, { TTL: 86400, urgency: 'high', timeout: 4000 });
      terkirim++;
    } catch (e) {
      gagal++;
      if (e && (e.statusCode === 404 || e.statusCode === 410)) {
        await q('delete from push_subscriptions where id=$1', [l.id]).catch(() => {});
      } else {
        console.error('Gagal kirim push:', e && (e.statusCode || e.message));
      }
    }
  }));
  return { terkirim, gagal };
}

module.exports = { aktif, kirimKeUser, tujuan, _pakaiLib };
