// Tes pengiriman push di dalam proses (tanpa jaringan): pustaka web-push diganti tiruan.
// Butuh DATABASE_URL yang sudah di-seed. Menambah/menghapus baris push_subscriptions milik akun contoh.
//   node --test test/push.test.js
process.env.VAPID_PUBLIC_KEY = 'PUB';
process.env.VAPID_PRIVATE_KEY = 'PRIV';
process.env.VAPID_SUBJECT = 'mailto:uji@desa.id';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { q, pool } = require('../src/db');
const push = require('../src/services/push');
const { notifikasiUser, notifikasiRole } = require('../src/services/notifikasi');

const terkirim = [];
const tiruan = {
  setVapidDetails() {},
  async sendNotification(sub, muatan, opsi) {
    if (/\/mati\//.test(sub.endpoint)) { const e = new Error('Gone'); e.statusCode = 410; throw e; }
    if (/\/galat\//.test(sub.endpoint)) { const e = new Error('Server error'); e.statusCode = 500; throw e; }
    terkirim.push({ endpoint: sub.endpoint, muatan: JSON.parse(muatan), opsi });
  },
};

describe('layanan push', () => {
  let warga; let admin;
  const tambah = (user, n) => q('insert into push_subscriptions(user_id,endpoint,p256dh,auth) values($1,$2,$3,$4)', [user, `https://p.test/${n}`, 'k', 'a']);
  const jumlah = async (pola) => (await q('select count(*)::int n from push_subscriptions where endpoint like $1', [pola]))[0].n;

  before(async () => {
    push._pakaiLib(tiruan);
    warga = (await q("select id from users where email='warga@desa.id'"))[0].id;
    admin = (await q("select id from users where role='admin' order by id limit 1"))[0].id;
    await q("delete from push_subscriptions where endpoint like 'https://p.test/%'");
  });
  after(async () => {
    await q("delete from push_subscriptions where endpoint like 'https://p.test/%'");
    await pool.end();
  });

  it('tujuan(): kode pengaduan → halaman pengaduan, selain itu → daftar notifikasi', () => {
    assert.equal(push.tujuan('Status pengaduan ADU-2026-00012 berubah'), '/app/pengaduan/ADU-2026-00012');
    assert.equal(push.tujuan('Tanpa kode'), '/app/notifikasi');
    assert.equal(push.tujuan(undefined), '/app/notifikasi');
  });

  it('mengirim muatan yang benar ke semua perangkat pengguna, tidak ke pengguna lain', async () => {
    await tambah(warga, 'w1/a'); await tambah(warga, 'w1/b'); await tambah(admin, 'a1/a');
    terkirim.length = 0;
    const h = await push.kirimKeUser([warga], { judul: 'Halo', isi: 'Ada ADU-2026-00003' });
    assert.deepEqual(h, { terkirim: 2, gagal: 0 });
    assert.deepEqual(terkirim.map((t) => t.endpoint).sort(), ['https://p.test/w1/a', 'https://p.test/w1/b']);
    assert.deepEqual(terkirim[0].muatan, { judul: 'Halo', isi: 'Ada ADU-2026-00003', url: '/app/pengaduan/ADU-2026-00003' });
    assert.equal(terkirim[0].opsi.TTL, 86400);
    assert.equal(terkirim[0].opsi.urgency, 'high');
  });

  it('langganan mati (410) dihapus; galat lain (500) dipertahankan; yang sehat tetap terkirim', async () => {
    await tambah(warga, 'w2/mati/x'); await tambah(warga, 'w2/galat/x');
    terkirim.length = 0;
    const errs = []; const asli = console.error; console.error = (...a) => errs.push(a.join(' '));
    let h; try { h = await push.kirimKeUser([warga], { judul: 'J', isi: 'I' }); } finally { console.error = asli; }
    assert.equal(h.terkirim, 2); assert.equal(h.gagal, 2);
    assert.equal(await jumlah('https://p.test/w2/mati/%'), 0, 'langganan 410 dihapus');
    assert.equal(await jumlah('https://p.test/w2/galat/%'), 1, 'langganan 500 dipertahankan');
    assert.equal(errs.length, 1);
  });

  it('notifikasiUser: tersimpan di database DAN terkirim sebagai push', async () => {
    terkirim.length = 0;
    const sebelum = (await q('select count(*)::int n from notifications where user_id=$1', [warga]))[0].n;
    await notifikasiUser(warga, 'Update', 'Judul Uji', 'Isi uji ADU-2026-00001');
    assert.equal((await q('select count(*)::int n from notifications where user_id=$1', [warga]))[0].n, sebelum + 1);
    assert.ok(terkirim.length >= 2);
    assert.equal(terkirim[0].muatan.judul, 'Judul Uji');
  });

  it('notifikasiRole: ke semua admin aktif saja', async () => {
    terkirim.length = 0;
    await notifikasiRole('admin', 'Pengaduan', 'Baru', 'Pengaduan baru');
    assert.ok(terkirim.some((t) => t.endpoint === 'https://p.test/a1/a'));
    assert.ok(!terkirim.some((t) => t.endpoint.startsWith('https://p.test/w1')));
  });

  it('galat tak terduga pada pengiriman tidak menggagalkan notifikasi', async () => {
    push._pakaiLib({ setVapidDetails() {}, sendNotification: async () => { throw new TypeError('rusak'); } });
    const asli = console.error; console.error = () => {};
    try { await notifikasiUser(warga, 'Update', 'Tetap Tersimpan', 'x'); } finally { console.error = asli; }
    assert.equal((await q("select count(*)::int n from notifications where judul='Tetap Tersimpan'"))[0].n, 1);
    push._pakaiLib(tiruan);
  });

  it('daftar pengguna kosong: tidak ada query/kiriman', async () => {
    terkirim.length = 0;
    assert.deepEqual(await push.kirimKeUser([], { judul: 'a', isi: 'b' }), { terkirim: 0, gagal: 0 });
    assert.equal(terkirim.length, 0);
  });
});
