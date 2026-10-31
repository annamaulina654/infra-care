// Tes API end-to-end. Menguji server yang SEDANG BERJALAN lewat HTTP (fetch bawaan Node 18+).
//
// Cara pakai (database harus baru saja di-seed, karena tes memakai data contoh dari seed.js):
//   1. npm run seed
//   2. npm start            (terminal lain)
//   3. npm test             (atau: BASE_URL=http://localhost:4000 npm test)
//
// PERINGATAN: tes ini menambah dan mengubah data. Jalankan hanya pada database latihan,
// lalu `npm run seed` lagi bila ingin mengulang.
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE = (process.env.BASE_URL || 'http://localhost:4000').replace(/\/$/, '');
const YEAR = new Date().getFullYear();
const kode = (n) => `ADU-${YEAR}-${String(n).padStart(5, '0')}`;
const PASSWORD = 'password123';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// ------------------------------------------------------------------ pembantu

async function api(method, path, { token, body, headers = {}, rawBody } = {}) {
  const h = { ...headers };
  if (token) h.authorization = `Bearer ${token}`;
  if (body !== undefined || rawBody !== undefined) h['content-type'] = 'application/json';
  const res = await fetch(`${BASE}/api${path}`, {
    method, headers: h, body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
  });
  // Dibaca sebagai byte agar BOM CSV tidak dibuang oleh res.text().
  const teks = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await res.arrayBuffer());
  let data = teks;
  if ((res.headers.get('content-type') || '').includes('json')) data = JSON.parse(teks);
  return { status: res.status, data, headers: res.headers, teks };
}
const get = (path, token) => api('GET', path, { token });
const post = (path, body, token) => api('POST', path, { token, body });
const patch = (path, body, token) => api('PATCH', path, { token, body });
const del = (path, token) => api('DELETE', path, { token });

const masuk = async (email, password = PASSWORD) => {
  const r = await post('/auth/login', { email, password });
  assert.equal(r.status, 200, `login ${email} gagal: ${r.teks}`);
  return r.data.token;
};

// Parser CSV sederhana (RFC 4180) untuk memeriksa ekspor tanpa dependensi.
function parseCsv(teks) {
  const t = teks.replace(/^﻿/, '');
  const baris = []; let sel = ''; let b = []; let kutip = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (kutip) {
      if (c === '"' && t[i + 1] === '"') { sel += '"'; i++; } else if (c === '"') kutip = false; else sel += c;
    } else if (c === '"') kutip = true;
    else if (c === ',') { b.push(sel); sel = ''; }
    else if (c === '\r' && t[i + 1] === '\n') { b.push(sel); baris.push(b); b = []; sel = ''; i++; }
    else sel += c;
  }
  if (sel || b.length) { b.push(sel); baris.push(b); }
  return baris;
}

const hariLalu = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const dasar = { judul: 'Jembatan kecil retak', kategori: 'Jalan', deskripsi: 'Retak di bagian tengah', lokasi: 'Dekat musala', dusun: 'Dusun Sumber Gundang', urgensi: 'Sedang' };

// Token tiap peran, diisi di before().
const T = {};

describe('API pengaduan desa', () => {
  before(async () => {
    T.warga = await masuk('warga@desa.id');
    T.warga2 = await masuk('warga2@desa.id');
    T.perangkat = await masuk('perangkat@desa.id');
    T.admin = await masuk('sekdes@desa.id');
    T.kades = await masuk('kades@desa.id');
  });

  // ================================================================== umum
  describe('umum', () => {
    it('alamat /api yang tidak dikenal → 404 JSON (bukan 401)', async () => {
      const r = await get('/tidak-ada');
      assert.equal(r.status, 404);
      assert.equal(r.data.message, 'Endpoint tidak ditemukan');
    });

    it('header keamanan terpasang dan x-powered-by tidak bocor', async () => {
      const r = await get('/public/stats');
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(r.headers.get('x-frame-options'), 'DENY');
      assert.equal(r.headers.get('cache-control'), 'no-store');
      assert.equal(r.headers.get('x-powered-by'), null);
    });

    it('JSON rusak → 400 berbentuk JSON', async () => {
      const r = await api('POST', '/auth/login', { rawBody: '{rusak' });
      assert.equal(r.status, 400);
      assert.equal(r.data.message, 'Format data tidak valid');
    });

    it('body terlalu besar → 413', async () => {
      const r = await post('/auth/login', { email: 'a@b.id', password: 'x'.repeat(4.5 * 1024 * 1024) });
      assert.equal(r.status, 413);
    });
  });

  // ================================================================== auth
  describe('auth', () => {
    it('login 5 peran dan bentuk user', async () => {
      const r = await post('/auth/login', { email: 'SEKDES@desa.id', password: PASSWORD });
      assert.equal(r.status, 200);
      assert.deepEqual(Object.keys(r.data.user).sort(), ['aktif', 'dusun', 'email', 'foto', 'id', 'nama', 'role']);
      assert.equal(r.data.user.role, 'admin');
      assert.ok(!('password' in r.data.user));
    });

    it('password salah / email tidak ada / injeksi di email → 400', async () => {
      assert.equal((await post('/auth/login', { email: 'warga@desa.id', password: 'salah' })).status, 400);
      assert.equal((await post('/auth/login', { email: 'tidakada@desa.id', password: PASSWORD })).status, 400);
      assert.equal((await post('/auth/login', { email: "' or 1=1 --", password: 'x' })).status, 400);
      assert.equal((await post('/auth/login', {})).status, 400);
    });

    it('login dikunci setelah 5 gagal, email lain tidak terpengaruh', async () => {
      const kodeStatus = [];
      for (let i = 0; i < 6; i++) kodeStatus.push((await post('/auth/login', { email: 'kunci@desa.id', password: 'salah' })).status);
      assert.deepEqual(kodeStatus, [400, 400, 400, 400, 400, 429]);
      assert.equal((await post('/auth/login', { email: 'kunci@desa.id', password: 'salah' })).status, 429);
      assert.equal((await post('/auth/login', { email: 'warga@desa.id', password: PASSWORD })).status, 200);
    });

    it('token palsu / tanpa token → 401', async () => {
      assert.equal((await get('/auth/me')).status, 401);
      assert.equal((await get('/auth/me', 'bukan-token')).status, 401);
      assert.equal((await api('GET', '/auth/me', { headers: { authorization: 'Bearer ' } })).status, 401);
    });

    it('register: validasi', async () => {
      const ok = { nama: 'Warga Baru', email: 'baru@desa.id', password: 'abcdef', dusun: 'Dusun Langger' };
      assert.equal((await post('/auth/register', { ...ok, dusun: '' })).status, 400);
      assert.equal((await post('/auth/register', { ...ok, email: 'bukan-email' })).status, 400);
      assert.equal((await post('/auth/register', { ...ok, password: '123' })).status, 400);
      assert.equal((await post('/auth/register', { ...ok, nama: '  ' })).status, 400);
      const r = await post('/auth/register', { ...ok, dusun: 'Dusun Antah Berantah' });
      assert.equal(r.status, 400);
      assert.equal(r.data.message, 'Dusun tidak dikenal');
    });

    it('register: berhasil, email huruf kecil, peran selalu masyarakat, email ganda ditolak', async () => {
      const r = await post('/auth/register', { nama: 'Warga Baru', email: 'BARU@Desa.ID', password: 'abcdef', dusun: 'Dusun Langger', role: 'admin' });
      assert.equal(r.status, 201);
      assert.equal(r.data.user.role, 'masyarakat');
      assert.equal(r.data.user.email, 'baru@desa.id');
      assert.equal(r.data.user.dusun, 'Dusun Langger');
      assert.ok(r.data.token);
      assert.equal((await post('/auth/register', { nama: 'X', email: 'baru@desa.id', password: 'abcdef', dusun: 'Dusun Langger' })).status, 400);
      T.baru = r.data.token;
    });

    it('GET /auth/me mengembalikan user terbaru', async () => {
      const r = await get('/auth/me', T.baru);
      assert.equal(r.status, 200);
      assert.equal(r.data.email, 'baru@desa.id');
    });

    it('PATCH /auth/me: ganti nama dan dusun (warga), validasi', async () => {
      const r = await patch('/auth/me', { nama: 'Warga Ganti', dusun: 'Dusun Palanggeren' }, T.baru);
      assert.equal(r.status, 200);
      assert.equal(r.data.nama, 'Warga Ganti');
      assert.equal(r.data.dusun, 'Dusun Palanggeren');
      assert.equal((await patch('/auth/me', { dusun: 'Tidak Ada' }, T.baru)).status, 400);
      assert.equal((await patch('/auth/me', { nama: '   ' }, T.baru)).status, 400);
      assert.equal((await get('/auth/me', T.baru)).data.nama, 'Warga Ganti');
    });

    it('PATCH /auth/me: perangkat tidak bisa pindah dusun sendiri', async () => {
      const r = await patch('/auth/me', { dusun: 'Dusun Langger' }, T.perangkat);
      assert.equal(r.status, 200);
      assert.equal(r.data.dusun, 'Dusun Langgali');
    });

    it('ganti password: validasi, berhasil, password lama tidak berlaku', async () => {
      assert.equal((await post('/auth/password', { password_lama: 'salah', password_baru: 'passbaru1' }, T.baru)).status, 400);
      assert.equal((await post('/auth/password', { password_lama: 'abcdef', password_baru: '123' }, T.baru)).status, 400);
      assert.equal((await post('/auth/password', { password_lama: 'abcdef', password_baru: 'passbaru1' })).status, 401);
      const r = await post('/auth/password', { password_lama: 'abcdef', password_baru: 'passbaru1' }, T.baru);
      assert.equal(r.status, 200);
      assert.equal(r.data.ok, true);
      assert.equal((await post('/auth/login', { email: 'baru@desa.id', password: 'abcdef' })).status, 400);
      assert.equal((await post('/auth/login', { email: 'baru@desa.id', password: 'passbaru1' })).status, 200);
    });
  });

  // ================================================================== publik
  describe('publik (tanpa login)', () => {
    it('info desa', async () => {
      const r = await get('/public/info');
      assert.equal(r.status, 200);
      assert.equal(r.data.desa, 'Desa Banyoneng Laok');
      assert.deepEqual(Object.keys(r.data.kontak).sort(), ['alamat', 'jam', 'telepon']);
      for (const d of ['Dusun Sumber Gundang', 'Dusun Langgali', 'Dusun Langger', 'Dusun Palanggeren', 'Dusun Pakes', 'Dusun Nungburung', 'Dusun Gibugen']) assert.ok(r.data.dusun.includes(d), d);
    });

    it('statistik publik', async () => {
      const r = await get('/public/stats');
      assert.deepEqual(r.data, { total: 12, selesai: 2, proses: 9, perencanaan: 2 });
    });

    it('daftar: bentuk, jumlah, urutan terbaru, pagination', async () => {
      const r = await get('/public/complaints');
      assert.equal(r.status, 200);
      assert.equal(r.data.total, 12);
      assert.equal(r.data.limit, 12);
      assert.equal(r.data.page, 1);
      assert.equal(r.data.data.length, 12);
      const waktu = r.data.data.map((c) => Date.parse(c.created_at));
      assert.deepEqual(waktu, [...waktu].sort((a, b) => b - a));

      const h2 = await get('/public/complaints?limit=5&page=3');
      assert.equal(h2.data.data.length, 2);
      assert.equal(h2.data.page, 3);
      assert.equal((await get('/public/complaints?page=99')).data.data.length, 0);
      assert.equal((await get('/public/complaints?limit=1000')).data.limit, 50);
    });

    it('daftar: tidak membocorkan data pribadi', async () => {
      const r = await get('/public/complaints');
      const kolom = ['created_at', 'dusun', 'instansi', 'judul', 'kategori', 'kode', 'status', 'updated_at', 'urgensi'];
      for (const c of r.data.data) assert.deepEqual(Object.keys(c).sort(), kolom);
      for (const kata of ['Siti', 'Ahmad', 'Hasan', 'Marlina', 'foto', 'lat', 'deskripsi', 'lokasi', 'user_id', 'pelapor', '@desa.id']) {
        assert.ok(!r.teks.includes(kata), `bocor: ${kata}`);
      }
    });

    it('daftar: filter status, kategori, dusun, pencarian', async () => {
      assert.equal((await get('/public/complaints?status=Selesai')).data.total, 2);
      assert.equal((await get('/public/complaints?kategori=Jalan')).data.total, 4);
      assert.equal((await get('/public/complaints?dusun=Dusun%20Palanggeren')).data.total, 2);
      assert.equal((await get('/public/complaints?q=sumur')).data.total, 1);
      assert.equal((await get(`/public/complaints?q=${kode(3)}`)).data.total, 1);
      assert.equal((await get('/public/complaints?q=%25')).data.total, 0, '% harus dianggap teks biasa');
      assert.equal((await get('/public/complaints?q=_')).data.total, 0, '_ harus dianggap teks biasa');
      const inj = await get(`/public/complaints?q=${encodeURIComponent("'; drop table users; --")}`);
      assert.equal(inj.status, 200);
      assert.equal(inj.data.total, 0);
    });

    it('detail pelacakan: logs, tanpa data pribadi', async () => {
      const r = await get(`/public/complaints/${kode(4)}`);
      assert.equal(r.status, 200);
      assert.equal(r.data.status, 'Diteruskan ke Instansi');
      assert.equal(r.data.instansi, 'PLN');
      assert.equal(r.data.logs.length, 3);
      assert.deepEqual(Object.keys(r.data.logs[0]).sort(), ['catatan', 'created_at', 'status']);
      for (const kata of ['Siti', 'pelapor', 'user_id', 'foto', 'lokasi', 'deskripsi', '"id"']) assert.ok(!r.teks.includes(kata), `bocor: ${kata}`);
      assert.equal((await get('/public/complaints/NOPE')).status, 404);
    });
  });

  // ================================================================== lingkup data & anonim
  describe('daftar pengaduan: lingkup per peran', () => {
    const daftar = async (token, qs = '') => (await get(`/complaints${qs}`, token)).data;

    it('tanpa token → 401', async () => assert.equal((await get('/complaints')).status, 401));

    it('admin dan kades melihat semua (12)', async () => {
      assert.equal((await daftar(T.admin)).total, 12);
      assert.equal((await daftar(T.kades)).total, 12);
    });

    it('warga hanya miliknya; warga lain tidak melihat milik orang', async () => {
      const w = await daftar(T.warga);
      assert.deepEqual(w.data.map((c) => c.kode).sort(), [1, 2, 4, 6, 11].map(kode));
      const w2 = await daftar(T.warga2);
      assert.deepEqual(w2.data.map((c) => c.kode).sort(), [7, 8, 9, 10].map(kode));
    });

    it('perangkat: pengaduan dusunnya + yang ia input', async () => {
      const p = await daftar(T.perangkat);
      assert.deepEqual(p.data.map((c) => c.kode).sort(), [2, 3, 4, 5, 11, 12].map(kode));
    });

    it('item daftar: tanpa foto/pelapor_nama/pengirim, ada ada_foto & pelapor', async () => {
      const r = await get('/complaints', T.admin);
      const c = r.data.data[0];
      for (const k of ['id', 'kode', 'judul', 'kategori', 'deskripsi', 'lokasi', 'dusun', 'lat', 'lng', 'perkiraan', 'urgensi',
        'status', 'anonim', 'instansi', 'user_id', 'created_at', 'updated_at', 'ada_foto', 'pelapor']) assert.ok(k in c, k);
      for (const k of ['foto', 'pelapor_nama', 'pengirim']) assert.ok(!(k in c), `tidak boleh ada: ${k}`);
      assert.equal(c.ada_foto, false);
    });

    it('atas nama warga: pelapor = nama yang diinput perangkat', async () => {
      const item = (await daftar(T.admin)).data.find((c) => c.kode === kode(3));
      assert.equal(item.pelapor, 'Bu Marlina');
      const itemP = (await daftar(T.perangkat)).data.find((c) => c.kode === kode(3));
      assert.equal(itemP.pelapor, 'Bu Marlina');
    });

    it('anonim: admin & pemilik melihat nama, kades/perangkat hanya "Anonim"', async () => {
      const cari = (d) => d.data.find((c) => c.kode === kode(4));
      const admin = cari(await daftar(T.admin));
      assert.equal(admin.pelapor, 'Siti Aminah (anonim)');
      assert.equal(admin.user_id, 1);
      const pemilik = cari(await daftar(T.warga));
      assert.equal(pemilik.pelapor, 'Siti Aminah (anonim)');
      for (const token of [T.kades, T.perangkat]) {
        const c = cari(await daftar(token));
        assert.equal(c.pelapor, 'Anonim');
        assert.equal(c.user_id, null, 'id pemilik anonim tidak boleh terlihat');
        assert.ok(!JSON.stringify(c).includes('Siti'));
      }
    });

    it('anonim: detail untuk kades tidak membocorkan nama', async () => {
      const r = await get(`/complaints/${kode(4)}`, T.kades);
      assert.equal(r.status, 200);
      assert.equal(r.data.pelapor, 'Anonim');
      for (const kata of ['Siti', 'pelapor_nama', 'pengirim', 'warga@desa.id']) assert.ok(!r.teks.includes(kata), `bocor: ${kata}`);
    });
  });

  describe('daftar pengaduan: filter dan pagination', () => {
    const jumlah = async (qs, token = T.admin) => (await get(`/complaints${qs}`, token)).data.total;

    it('filter status, kategori, dusun, kelompok, kombinasi', async () => {
      assert.equal(await jumlah('?status=Selesai'), 2);
      assert.equal(await jumlah('?kategori=Jalan'), 4);
      assert.equal(await jumlah('?dusun=Dusun%20Palanggeren'), 2);
      assert.equal(await jumlah('?kelompok=aktif'), 9);
      assert.equal(await jumlah('?kelompok=selesai'), 2);
      assert.equal(await jumlah('?kelompok=ditolak'), 1);
      assert.equal(await jumlah('?kelompok=ngawur'), 12, 'kelompok tak dikenal diabaikan');
      assert.equal(await jumlah('?status=Diterima&dusun=Dusun%20Palanggeren'), 2);
      assert.equal(await jumlah('?status=Selesai', T.warga), 1, 'filter tetap dibatasi lingkup peran');
    });

    it('pencarian: judul, kode, kategori, dusun; karakter khusus aman', async () => {
      assert.equal(await jumlah('?q=dusun%20langgali'), 4);
      assert.equal(await jumlah(`?q=${kode(3)}`), 1);
      assert.equal(await jumlah('?q=air'), 3, '"air": 2 kategori Air & Kekeringan + 1 judul Puskesmas');
      assert.equal(await jumlah('?q=%25'), 0);
      assert.equal(await jumlah('?q=_'), 0);
      const inj = await get(`/complaints?q=${encodeURIComponent("'; drop table users; --")}`, T.admin);
      assert.equal(inj.status, 200);
      assert.equal(inj.data.total, 0);
      assert.equal((await post('/auth/login', { email: 'sekdes@desa.id', password: PASSWORD })).status, 200, 'tabel users masih ada');
    });

    it('pagination: halaman, batas, urutan terbaru, nilai ngawur dirapikan', async () => {
      const h3 = (await get('/complaints?limit=5&page=3', T.admin)).data;
      assert.equal(h3.data.length, 2);
      assert.equal(h3.total, 12);
      const semua = (await get('/complaints?limit=100', T.admin)).data.data;
      const waktu = semua.map((c) => Date.parse(c.created_at));
      assert.deepEqual(waktu, [...waktu].sort((a, b) => b - a));
      assert.equal((await get('/complaints?limit=1000', T.admin)).data.limit, 100);
      assert.equal((await get('/complaints?limit=0', T.admin)).data.limit, 20);
      assert.equal((await get('/complaints?page=-5', T.admin)).data.page, 1);
      assert.equal((await get('/complaints?page=abc&limit=xyz', T.admin)).status, 200);
    });
  });

  describe('peta dan statistik', () => {
    it('/complaints/map: hanya yang punya koordinat, sesuai lingkup, bukan dianggap kode', async () => {
      const a = await get('/complaints/map', T.admin);
      assert.equal(a.status, 200);
      assert.equal(a.data.length, 11);
      for (const t of a.data) {
        assert.deepEqual(Object.keys(t).sort(), ['dusun', 'judul', 'kategori', 'kode', 'lat', 'lng', 'status', 'urgensi']);
        assert.equal(typeof t.lat, 'number');
        assert.equal(typeof t.lng, 'number');
      }
      assert.equal((await get('/complaints/map', T.warga2)).data.length, 3);
      assert.equal((await get('/complaints/map')).status, 401);
    });

    it('/stats admin', async () => {
      const s = (await get('/stats', T.admin)).data;
      for (const [k, v] of Object.entries({ total: 12, diproses: 3, perencanaan: 2, perbaikan: 1, selesai: 2, diteruskan: 3, ditolak: 1, aktif: 9 })) {
        assert.equal(s[k], v, k);
      }
      assert.equal(s.harian.length, 7);
      // tanggal ISO berurutan, dan yang terakhir adalah hari ini menurut waktu Jakarta
      const hariIniWIB = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
      assert.match(s.harian[0].hari, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(s.harian[6].hari, hariIniWIB);
      assert.equal(s.kategori.reduce((n, k) => n + k.n, 0), 12);
      assert.deepEqual(s.kategori[0], { kategori: 'Jalan', n: 4 });
    });

    it('/stats mengikuti lingkup peran', async () => {
      assert.equal((await get('/stats', T.warga)).data.total, 5);
      assert.equal((await get('/stats', T.warga2)).data.total, 4);
      assert.equal((await get('/stats', T.perangkat)).data.total, 6);
      assert.equal((await get('/stats', T.warga)).data.harian.length, 7);
      assert.equal((await get('/stats')).status, 401);
    });
  });

  describe('detail pengaduan', () => {
    it('milik sendiri: lengkap + logs + foto null + next_status kosong untuk warga', async () => {
      const r = await get(`/complaints/${kode(1)}`, T.warga);
      assert.equal(r.status, 200);
      assert.equal(r.data.logs.length, 4);
      assert.equal(r.data.foto, null);
      assert.equal(r.data.ada_foto, false);
      assert.deepEqual(r.data.next_status, []);
      assert.equal(r.data.pelapor, 'Siti Aminah');
      assert.equal(typeof r.data.lat, 'number');
    });

    it('next_status untuk admin/kades mengikuti aturan transisi', async () => {
      assert.deepEqual((await get(`/complaints/${kode(1)}`, T.admin)).data.next_status, ['Selesai']);
      assert.deepEqual((await get(`/complaints/${kode(7)}`, T.kades)).data.next_status, ['Diverifikasi', 'Diteruskan ke Instansi', 'Ditolak']);
      assert.deepEqual((await get(`/complaints/${kode(6)}`, T.admin)).data.next_status, []);
      assert.deepEqual((await get(`/complaints/${kode(2)}`, T.perangkat)).data.next_status, [], 'perangkat tidak mengubah status');
    });

    it('izin: pemilik lain 403, dusun lain 403, perangkat boleh dusunnya & inputnya', async () => {
      assert.equal((await get(`/complaints/${kode(3)}`, T.warga)).status, 403);
      assert.equal((await get(`/complaints/${kode(1)}`, T.warga2)).status, 403);
      assert.equal((await get(`/complaints/${kode(1)}`, T.perangkat)).status, 403);
      assert.equal((await get(`/complaints/${kode(2)}`, T.perangkat)).status, 200, 'dusun Langgali');
      assert.equal((await get(`/complaints/${kode(3)}`, T.perangkat)).status, 200, 'input sendiri di Dusun Langger');
      assert.equal((await get(`/complaints/${kode(1)}`)).status, 401);
      assert.equal((await get('/complaints/NOPE', T.admin)).status, 404);
    });
  });

  // ================================================================== laporan (sebelum data diubah)
  describe('laporan', () => {
    it('hanya admin dan kades', async () => {
      for (const path of ['/reports/summary', '/reports/export.csv']) {
        assert.equal((await get(path)).status, 401);
        assert.equal((await get(path, T.warga)).status, 403);
        assert.equal((await get(path, T.perangkat)).status, 403);
        assert.equal((await get(path, T.kades)).status, 200);
        assert.equal((await get(path, T.admin)).status, 200);
      }
    });

    it('ringkasan semua waktu', async () => {
      const s = (await get('/reports/summary', T.admin)).data;
      assert.deepEqual(s.periode, { dari: null, sampai: null });
      assert.equal(s.total, 12);
      assert.equal(s.per_status.reduce((n, x) => n + x.n, 0), 12);
      assert.deepEqual(s.per_status.find((x) => x.status === 'Diteruskan ke Instansi'), { status: 'Diteruskan ke Instansi', n: 3 });
      const dusun = Object.fromEntries(s.per_dusun.map((x) => [x.dusun, x.n]));
      assert.deepEqual(dusun, { 'Dusun Langgali': 4, 'Dusun Langger': 3, 'Dusun Sumber Gundang': 3, 'Dusun Palanggeren': 2 });
      const inst = Object.fromEntries(s.per_instansi.map((x) => [x.instansi, x.n]));
      assert.deepEqual(inst, { PLN: 1, PDAM: 1, 'Dinas Pendidikan': 1 });
      assert.equal(s.per_kategori.length, 7);
      assert.ok(Math.abs(s.rata_hari_selesai - 8) < 0.2, `rata ${s.rata_hari_selesai}`);
    });

    it('rentang tanggal: dari/sampai', async () => {
      const total = async (qs) => (await get(`/reports/summary?${qs}`, T.admin)).data.total;
      assert.equal(await total(`dari=${hariLalu(40)}`), 12);
      assert.equal(await total(`dari=${hariLalu(22)}`), 11, 'pengaduan berumur 25 hari tidak ikut');
      assert.equal(await total(`sampai=${hariLalu(22)}`), 1);
      assert.equal(await total(`dari=${hariLalu(-5)}`), 0);
      const kosong = (await get(`/reports/summary?dari=${hariLalu(-5)}`, T.admin)).data;
      assert.equal(kosong.rata_hari_selesai, null);
      assert.deepEqual(kosong.per_status, []);
      assert.deepEqual((await get('/reports/summary?dari=2026-01-05&sampai=2026-02-01', T.admin)).data.periode, { dari: '2026-01-05', sampai: '2026-02-01' });
    });

    it('tanggal salah → 400', async () => {
      for (const qs of ['dari=kemarin', 'sampai=2026-02-31', 'dari=2026-03-10&sampai=2026-03-01', 'dari=2026-1-1']) {
        const r = await get(`/reports/summary?${qs}`, T.admin);
        assert.equal(r.status, 400, qs);
        assert.ok(r.data.message);
        assert.equal((await get(`/reports/export.csv?${qs}`, T.admin)).status, 400, `csv ${qs}`);
      }
    });

    it('ekspor CSV: header HTTP, BOM, kolom, anonim disamarkan untuk semua peran', async () => {
      const r = await get('/reports/export.csv', T.admin);
      assert.match(r.headers.get('content-type'), /^text\/csv; charset=utf-8/);
      assert.match(r.headers.get('content-disposition'), /^attachment; filename="laporan-pengaduan.*\.csv"$/);
      assert.ok(r.teks.startsWith('﻿'), 'harus diawali BOM');
      const baris = parseCsv(r.teks);
      assert.deepEqual(baris[0], ['Kode', 'Tanggal', 'Dusun', 'Kategori', 'Judul', 'Lokasi', 'Perkiraan', 'Urgensi', 'Status', 'Instansi', 'Pelapor', 'Diperbarui']);
      assert.equal(baris.length, 13);
      for (const b of baris) assert.equal(b.length, 12);
      const per = Object.fromEntries(baris.slice(1).map((b) => [b[0], b]));
      assert.equal(per[kode(4)][10], 'Anonim', 'admin pun tidak melihat nama di ekspor');
      assert.equal(per[kode(3)][10], 'Bu Marlina');
      assert.equal(per[kode(1)][10], 'Siti Aminah');
      assert.equal(per[kode(1)][6], '± 30 meter, perlu pengaspalan', 'koma di dalam sel dan karakter ± utuh');
      assert.ok(!r.teks.includes('Siti Aminah (anonim)'));
      assert.match(per[kode(1)][1], /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('ekspor CSV mengikuti rentang tanggal', async () => {
      const r = await get(`/reports/export.csv?dari=${hariLalu(22)}`, T.kades);
      assert.equal(parseCsv(r.teks).length, 12);
    });
  });

  // ================================================================== buat pengaduan
  describe('buat pengaduan', () => {
    it('warga tanpa foto → 201, kode berurutan, foto opsional', async () => {
      const r = await post('/complaints', dasar, T.warga);
      assert.equal(r.status, 201);
      assert.equal(r.data.kode, kode(13));
      assert.equal(typeof r.data.id, 'number');
      const d = (await get(`/complaints/${r.data.kode}`, T.warga)).data;
      assert.equal(d.status, 'Diterima');
      assert.equal(d.logs.length, 1);
      assert.equal(d.foto, null);
      assert.equal(d.pelapor, 'Siti Aminah');
    });

    it('validasi wajib: judul, kategori, urgensi, dusun, lokasi', async () => {
      const kasus = [
        { judul: '' }, { deskripsi: '   ' }, { lokasi: '' }, { kategori: 'Jembatan' }, { kategori: '' },
        { urgensi: 'Gawat' }, { dusun: 'Dusun Antah Berantah' },
      ];
      for (const k of kasus) {
        const r = await post('/complaints', { ...dasar, ...k }, T.warga);
        assert.equal(r.status, 400, JSON.stringify(k));
      }
      assert.equal((await post('/complaints', { ...dasar, dusun: undefined }, T.warga)).status, 201, 'dusun default dari akun');
    });

    it('foto PNG tersimpan; lat/lng di luar rentang dibuang; anonim; perkiraan', async () => {
      const r = await post('/complaints', { ...dasar, foto: PNG, lat: '-7.03', lng: 'abc', perkiraan: '3 m', anonim: true }, T.warga);
      assert.equal(r.status, 201);
      const d = (await get(`/complaints/${r.data.kode}`, T.warga)).data;
      assert.equal(d.foto, PNG);
      assert.equal(d.ada_foto, true);
      assert.equal(d.anonim, true);
      assert.equal(d.lat, -7.03);
      assert.equal(d.lng, null);
      assert.equal(d.perkiraan, '3 m');
      const r2 = await post('/complaints', { ...dasar, lat: 95, lng: 200 }, T.warga);
      const d2 = (await get(`/complaints/${r2.data.kode}`, T.warga)).data;
      assert.equal(d2.lat, null);
      assert.equal(d2.lng, null);
      const daftar = (await get('/complaints?limit=100', T.warga)).data.data.find((c) => c.kode === r.data.kode);
      assert.ok(!('foto' in daftar));
      assert.equal(daftar.ada_foto, true);
    });

    it('foto bukan gambar / terlalu besar → 400', async () => {
      assert.equal((await post('/complaints', { ...dasar, foto: 'data:text/html;base64,PHNjcmlwdD4=' }, T.warga)).status, 400);
      assert.equal((await post('/complaints', { ...dasar, foto: 'bukan data url' }, T.warga)).status, 400);
      assert.equal((await post('/complaints', { ...dasar, foto: 'data:image/jpeg;base64,' + 'A'.repeat(2_900_000) }, T.warga)).status, 400);
      assert.equal((await post('/complaints', { ...dasar, foto: 'data:image/svg+xml;base64,PHN2Zz4=' }, T.warga)).status, 400);
    });

    it('teks panjang dipotong sesuai batas', async () => {
      const r = await post('/complaints', { ...dasar, judul: 'J'.repeat(300), deskripsi: 'D'.repeat(900) }, T.warga);
      const d = (await get(`/complaints/${r.data.kode}`, T.warga)).data;
      assert.equal(d.judul.length, 120);
      assert.equal(d.deskripsi.length, 500);
    });

    it('perangkat melapor atas nama warga; nama wajib', async () => {
      assert.equal((await post('/complaints', dasar, T.perangkat)).status, 400);
      const r = await post('/complaints', { ...dasar, dusun: 'Dusun Langgali', pelapor_nama: 'Pak Samsul' }, T.perangkat);
      assert.equal(r.status, 201);
      assert.equal((await get(`/complaints/${r.data.kode}`, T.perangkat)).data.pelapor, 'Pak Samsul');
    });

    it('warga tidak bisa menyamar sebagai pelapor lain (pelapor_nama diabaikan)', async () => {
      const r = await post('/complaints', { ...dasar, pelapor_nama: 'Orang Lain' }, T.warga);
      assert.equal((await get(`/complaints/${r.data.kode}`, T.warga)).data.pelapor, 'Siti Aminah');
    });

    it('admin/kades/tanpa login tidak boleh membuat', async () => {
      assert.equal((await post('/complaints', dasar, T.admin)).status, 403);
      assert.equal((await post('/complaints', dasar, T.kades)).status, 403);
      assert.equal((await post('/complaints', dasar)).status, 401);
    });

    it('admin mendapat notifikasi pengaduan baru', async () => {
      const n = (await get('/notifications', T.admin)).data.filter((x) => x.judul === 'Pengaduan Baru');
      assert.ok(n.length >= 7, `hanya ${n.length}`);
    });
  });

  // ================================================================== ubah status
  describe('ubah status', () => {
    const ubah = (id, body, token = T.admin) => patch(`/complaints/${id}/status`, body, token);

    it('izin: warga/perangkat 403, tanpa login 401', async () => {
      assert.equal((await ubah(1, { status: 'Selesai' }, T.warga)).status, 403);
      assert.equal((await ubah(1, { status: 'Selesai' }, T.perangkat)).status, 403);
      assert.equal((await ubah(1, { status: 'Selesai' }, null)).status, 401);
    });

    it('validasi: status ngawur, id tidak valid / tidak ada', async () => {
      const r = await ubah(1, { status: 'Terbang' });
      assert.equal(r.status, 400);
      assert.equal(r.data.message, 'Status tidak valid');
      assert.equal((await ubah('abc', { status: 'Selesai' })).status, 404);
      assert.equal((await ubah(9999, { status: 'Selesai' })).status, 404);
    });

    it('transisi tidak valid ditolak dengan pesan jelas', async () => {
      const r = await ubah(7, { status: 'Selesai' });
      assert.equal(r.status, 400);
      assert.equal(r.data.message, 'Status "Diterima" tidak bisa langsung menjadi "Selesai"');
      assert.equal((await ubah(7, { status: 'Masuk Perencanaan' })).status, 400);
      assert.equal((await ubah(7, { status: 'Diterima' })).status, 400);
      assert.equal((await ubah(1, { status: 'Dalam Perbaikan' })).status, 400, 'status sama');
      assert.equal((await ubah(1, { status: 'Diverifikasi' })).status, 400, 'tidak boleh mundur');
    });

    it('Diterima → Diverifikasi: log + notifikasi ke pemilik', async () => {
      const r = await ubah(7, { status: 'Diverifikasi', catatan: 'Sudah dicek di lokasi' });
      assert.equal(r.status, 200);
      assert.deepEqual(r.data, { id: 7, kode: kode(7), status: 'Diverifikasi' });
      const d = (await get(`/complaints/${kode(7)}`, T.admin)).data;
      assert.equal(d.status, 'Diverifikasi');
      assert.equal(d.logs.at(-1).catatan, 'Sudah dicek di lokasi');
      const n = (await get('/notifications', T.warga2)).data;
      assert.ok(n.some((x) => x.isi.includes(kode(7)) && x.isi.includes('Diverifikasi')));
    });

    it('teruskan ke instansi: wajib instansi; kades boleh; lalu Selesai', async () => {
      const tanpa = await ubah(7, { status: 'Diteruskan ke Instansi' });
      assert.equal(tanpa.status, 400);
      assert.equal(tanpa.data.message, 'Nama instansi tujuan wajib diisi');
      assert.equal((await ubah(7, { status: 'Diteruskan ke Instansi', instansi: 'Dinas Kesehatan' }, T.kades)).status, 200);
      const d = (await get(`/complaints/${kode(7)}`, T.admin)).data;
      assert.equal(d.instansi, 'Dinas Kesehatan');
      assert.equal(d.logs.at(-1).catatan, 'Diteruskan ke Dinas Kesehatan');
      assert.deepEqual(d.next_status, ['Dalam Perbaikan', 'Selesai', 'Ditolak']);
      assert.equal((await ubah(7, { status: 'Selesai', catatan: 'Sudah ditangani dinas' })).status, 200);
      assert.equal((await get(`/complaints/${kode(7)}`, T.admin)).data.instansi, 'Dinas Kesehatan', 'instansi tetap tercatat');
    });

    it('tolak: alasan wajib (min. 3 karakter)', async () => {
      assert.equal((await ubah(8, { status: 'Ditolak' })).status, 400);
      assert.equal((await ubah(8, { status: 'Ditolak', catatan: 'ab' })).status, 400);
      assert.equal((await ubah(8, { status: 'Ditolak', catatan: 'Di luar kewenangan desa' })).status, 200);
    });

    it('status final tidak bisa diubah lagi', async () => {
      for (const id of [8, 6, 7, 10]) {
        const r = await ubah(id, { status: 'Dalam Perbaikan' });
        assert.equal(r.status, 400, `id ${id}`);
        assert.match(r.data.message, /tidak bisa diubah lagi/);
      }
      assert.deepEqual((await get(`/complaints/${kode(8)}`, T.admin)).data.next_status, []);
    });

    it('alur penuh: Diverifikasi → Masuk Perencanaan → Dalam Perbaikan → Selesai', async () => {
      assert.equal((await ubah(3, { status: 'Masuk Perencanaan', catatan: 'Masuk usulan APBDes' })).status, 200);
      assert.deepEqual((await get(`/complaints/${kode(3)}`, T.admin)).data.next_status, ['Dalam Perbaikan', 'Diteruskan ke Instansi', 'Ditolak']);
      assert.equal((await ubah(3, { status: 'Dalam Perbaikan' })).status, 200);
      const sebelum = (await get(`/complaints/${kode(3)}`, T.admin)).data.logs.length;
      const r = await ubah(3, { status: 'Selesai' });
      assert.equal(r.status, 200);
      const d = (await get(`/complaints/${kode(3)}`, T.admin)).data;
      assert.equal(d.logs.length, sebelum + 1);
      assert.equal(d.logs.at(-1).catatan, 'Status diubah oleh Sekretaris Desa');
    });

    it('statistik ikut berubah', async () => {
      const s = (await get('/stats', T.admin)).data;
      assert.equal(s.selesai, 4);
      assert.equal(s.ditolak, 2);
    });
  });

  // ================================================================== tanggapan
  describe('tanggapan', () => {
    const tanggapi = (id, catatan, token = T.admin) => post(`/complaints/${id}/tanggapan`, { catatan }, token);

    it('izin: warga/perangkat 403, tanpa login 401', async () => {
      assert.equal((await tanggapi(1, 'Terima kasih laporannya', T.warga)).status, 403);
      assert.equal((await tanggapi(1, 'Terima kasih laporannya', T.perangkat)).status, 403);
      assert.equal((await tanggapi(1, 'Terima kasih laporannya', null)).status, 401);
    });

    it('validasi: terlalu pendek, id tidak valid', async () => {
      assert.equal((await tanggapi(1, 'ok')).status, 400);
      assert.equal((await tanggapi(1, '   ')).status, 400);
      assert.equal((await tanggapi('abc', 'Terima kasih laporannya')).status, 404);
      assert.equal((await tanggapi(9999, 'Terima kasih laporannya')).status, 404);
    });

    it('menambah log dengan status saat ini tanpa mengubah status, lalu mengirim notifikasi', async () => {
      const r = await tanggapi(1, 'Tim akan survei hari Jumat', T.kades);
      assert.equal(r.status, 201);
      assert.deepEqual(r.data, { ok: true });
      const d = (await get(`/complaints/${kode(1)}`, T.warga)).data;
      assert.equal(d.status, 'Dalam Perbaikan');
      assert.deepEqual({ status: d.logs.at(-1).status, catatan: d.logs.at(-1).catatan }, { status: 'Dalam Perbaikan', catatan: 'Tim akan survei hari Jumat' });
      const n = (await get('/notifications', T.warga)).data;
      assert.ok(n.some((x) => x.judul === 'Tanggapan Baru' && x.isi.includes(kode(1))));
    });

    it('boleh pada pengaduan berstatus final', async () => {
      assert.equal((await tanggapi(6, 'Terima kasih sudah dikerjakan bersama')).status, 201);
    });
  });

  // ================================================================== notifikasi
  describe('notifikasi', () => {
    it('hanya milik sendiri; tanpa login 401; urut terbaru', async () => {
      assert.equal((await get('/notifications')).status, 401);
      const n = (await get('/notifications', T.warga)).data;
      assert.ok(n.length >= 5);
      for (const x of n) assert.deepEqual(Object.keys(x).sort(), ['created_at', 'dibaca', 'id', 'isi', 'judul', 'tipe']);
      const waktu = n.map((x) => Date.parse(x.created_at));
      assert.deepEqual(waktu, [...waktu].sort((a, b) => b - a));
    });

    it('tandai satu notifikasi: hanya miliknya, yang lain tetap belum dibaca', async () => {
      const awal = (await get('/notifications', T.warga2)).data.filter((x) => !x.dibaca);
      assert.ok(awal.length >= 1);
      const sasaran = awal[0];
      assert.equal((await post(`/notifications/${sasaran.id}/read`, {})).status, 401);
      assert.equal((await post(`/notifications/${sasaran.id}/read`, {}, T.warga)).status, 404, 'milik orang lain');
      assert.equal((await post('/notifications/abc/read', {}, T.warga2)).status, 404);
      assert.equal((await post('/notifications/999999999/read', {}, T.warga2)).status, 404);
      assert.deepEqual((await post(`/notifications/${sasaran.id}/read`, {}, T.warga2)).data, { ok: true });
      const akhir = (await get('/notifications', T.warga2)).data;
      assert.equal(akhir.find((x) => x.id === sasaran.id).dibaca, true);
      assert.equal(akhir.filter((x) => !x.dibaca).length, awal.length - 1);
    });

    it('read-all hanya memengaruhi pengguna itu', async () => {
      assert.ok((await get('/notifications', T.warga)).data.some((x) => !x.dibaca));
      assert.ok((await get('/notifications', T.warga2)).data.some((x) => !x.dibaca));
      assert.deepEqual((await post('/notifications/read-all', {}, T.warga)).data, { ok: true });
      assert.ok((await get('/notifications', T.warga)).data.every((x) => x.dibaca));
      assert.ok((await get('/notifications', T.warga2)).data.some((x) => !x.dibaca), 'warga2 tidak boleh ikut terbaca');
      assert.equal((await post('/notifications/read-all', {})).status, 401);
    });
  });

  // ================================================================== ekspor CSV: karakter khusus
  describe('ekspor CSV: escape dan netralisasi rumus', () => {
    it('sel berbahaya dinetralkan, koma/kutip/baris baru di-escape dan bisa dibaca balik', async () => {
      const judulRumus = '=HYPERLINK("http://jahat.example","klik")';
      const judulRumit = 'Jalan, "rusak"\nbaris dua';
      const a = await post('/complaints', { ...dasar, judul: judulRumus, perkiraan: '-5 meter', lokasi: '@SUM(1+1)' }, T.warga2);
      const b = await post('/complaints', { ...dasar, judul: judulRumit, lokasi: '+1 gang' }, T.warga2);
      assert.equal(a.status, 201);
      assert.equal(b.status, 201);

      const r = await get('/reports/export.csv', T.admin);
      const per = Object.fromEntries(parseCsv(r.teks).slice(1).map((x) => [x[0], x]));
      const A = per[a.data.kode];
      const B = per[b.data.kode];
      assert.equal(A[4], `'${judulRumus}`, 'diawali = harus diberi tanda petik');
      assert.equal(A[6], "'-5 meter");
      assert.equal(A[5], "'@SUM(1+1)");
      assert.equal(B[4], judulRumit, 'koma, kutip, dan baris baru kembali utuh');
      assert.equal(B[5], "'+1 gang");
      for (const baris of parseCsv(r.teks)) assert.equal(baris.length, 12, 'jumlah kolom tidak bergeser');
    });
  });

  // ================================================================== pengguna
  describe('pengguna (admin)', () => {
    it('izin: hanya admin', async () => {
      assert.equal((await get('/users')).status, 401);
      for (const t of [T.warga, T.perangkat, T.kades]) {
        assert.equal((await get('/users', t)).status, 403);
        assert.equal((await post('/users', {}, t)).status, 403);
        assert.equal((await del('/users/1', t)).status, 403);
      }
    });

    it('daftar: bentuk, jumlah pengaduan, tanpa password, filter peran dan pencarian', async () => {
      const r = await get('/users', T.admin);
      assert.equal(r.status, 200);
      assert.ok(r.data.length >= 6);
      assert.deepEqual(Object.keys(r.data[0]).sort(), ['aktif', 'created_at', 'dusun', 'email', 'id', 'jumlah_pengaduan', 'nama', 'role']);
      assert.ok(!r.teks.includes('password'));
      const siti = r.data.find((u) => u.email === 'warga@desa.id');
      assert.ok(siti.jumlah_pengaduan >= 5);
      assert.equal((await get('/users?role=perangkat', T.admin)).data.length, 1);
      assert.equal((await get('/users?role=kades', T.admin)).data.length, 1);
      assert.equal((await get('/users?q=hasan', T.admin)).data.length, 1);
      assert.equal((await get('/users?q=%25', T.admin)).data.length, 0);
      assert.ok((await get('/users?role=ngawur', T.admin)).data.length >= 6, 'peran tak dikenal diabaikan');
    });

    it('buat akun: validasi', async () => {
      const ok = { nama: 'Kadus Langger', email: 'kadus.langger@desa.id', password: 'abcdef', role: 'perangkat', dusun: 'Dusun Langger' };
      assert.equal((await post('/users', { ...ok, nama: '' }, T.admin)).status, 400);
      assert.equal((await post('/users', { ...ok, email: 'salah' }, T.admin)).status, 400);
      assert.equal((await post('/users', { ...ok, password: '123' }, T.admin)).status, 400);
      assert.equal((await post('/users', { ...ok, role: 'superadmin' }, T.admin)).status, 400);
      assert.equal((await post('/users', { ...ok, dusun: '' }, T.admin)).status, 400, 'perangkat wajib dusun');
      assert.equal((await post('/users', { ...ok, dusun: 'Tidak Ada' }, T.admin)).status, 400);
      assert.equal((await post('/users', { ...ok, email: 'warga@desa.id' }, T.admin)).status, 400, 'email ganda');
    });

    it('buat akun perangkat, kades/admin (dusun diabaikan), lalu bisa login', async () => {
      const p = await post('/users', { nama: 'Kadus Langger', email: 'Kadus.Langger@desa.id', password: 'abcdef', role: 'perangkat', dusun: 'Dusun Langger' }, T.admin);
      assert.equal(p.status, 201);
      assert.equal(p.data.role, 'perangkat');
      assert.equal(p.data.email, 'kadus.langger@desa.id');
      assert.equal(p.data.jumlah_pengaduan, 0);
      assert.ok(!('password' in p.data));
      const a = await post('/users', { nama: 'Admin Dua', email: 'admin2@desa.id', password: 'abcdef', role: 'admin', dusun: 'Dusun Langger' }, T.admin);
      assert.equal(a.status, 201);
      assert.equal(a.data.dusun, null);
      const tokenP = await masuk('kadus.langger@desa.id', 'abcdef');
      const langger = (await get('/complaints', tokenP)).data;
      assert.ok(langger.total >= 3 && langger.data.every((c) => c.dusun === 'Dusun Langger'));
      T.hapus = p.data.id;
    });

    it('hapus: diri sendiri 400, punya pengaduan 409, tidak ada 404, berhasil', async () => {
      const saya = (await get('/auth/me', T.admin)).data.id;
      assert.equal((await del(`/users/${saya}`, T.admin)).status, 400);
      assert.equal((await del('/users/1', T.admin)).status, 409);
      assert.equal((await del('/users/9999', T.admin)).status, 404);
      assert.equal((await del('/users/abc', T.admin)).status, 404);
      const tokenLama = await masuk('kadus.langger@desa.id', 'abcdef');
      assert.deepEqual((await del(`/users/${T.hapus}`, T.admin)).data, { ok: true });
      assert.equal((await post('/auth/login', { email: 'kadus.langger@desa.id', password: 'abcdef' })).status, 400);
      assert.equal((await get('/auth/me', tokenLama)).status, 401, 'token akun yang dihapus langsung tidak berlaku');
    });
  });

  // ================================================================== kontrak v2: akun
  describe('akun v2: nonaktif, ubah, reset password, foto profil', () => {
    let uid; let tok;
    before(async () => {
      const r = await post('/users', { nama: 'Warga Uji', email: 'uji.v2@desa.id', password: 'abcdef', role: 'masyarakat', dusun: 'Dusun Palanggeren' }, T.admin);
      assert.equal(r.status, 201);
      assert.equal(r.data.aktif, true);
      uid = r.data.id;
      tok = await masuk('uji.v2@desa.id', 'abcdef');
    });

    it('bentuk user: id,nama,email,role,dusun,foto,aktif', async () => {
      const me = (await get('/auth/me', tok)).data;
      assert.deepEqual(Object.keys(me).sort(), ['aktif', 'dusun', 'email', 'foto', 'id', 'nama', 'role']);
      assert.equal(me.foto, null);
    });

    it('PATCH /users/:id: izin, validasi, 404, ubah peran dan dusun', async () => {
      assert.equal((await patch(`/users/${uid}`, { nama: 'X' }, T.warga)).status, 403);
      assert.equal((await patch('/users/9999', { nama: 'X' }, T.admin)).status, 404);
      assert.equal((await patch('/users/abc', { nama: 'X' }, T.admin)).status, 404);
      assert.equal((await patch(`/users/${uid}`, { nama: '' }, T.admin)).status, 400);
      assert.equal((await patch(`/users/${uid}`, { role: 'raja' }, T.admin)).status, 400);
      assert.equal((await patch(`/users/${uid}`, { dusun: 'Tidak Ada' }, T.admin)).status, 400);
      assert.equal((await patch(`/users/${uid}`, { aktif: 'ya' }, T.admin)).status, 400);
      const r = await patch(`/users/${uid}`, { nama: 'Warga Uji 2', role: 'perangkat', dusun: 'Dusun Langger' }, T.admin);
      assert.equal(r.status, 200);
      assert.deepEqual([r.data.nama, r.data.role, r.data.dusun, r.data.aktif], ['Warga Uji 2', 'perangkat', 'Dusun Langger', true]);
      // peran langsung berlaku di token lama
      assert.equal((await get('/users', tok)).status, 403);
      assert.equal((await get('/auth/me', tok)).data.role, 'perangkat');
      const k = await patch(`/users/${uid}`, { role: 'kades' }, T.admin);
      assert.equal(k.data.dusun, null);
    });

    it('nonaktif: token lama 401, login 403, aktif lagi bisa masuk', async () => {
      assert.equal((await patch(`/users/${uid}`, { aktif: false }, T.admin)).data.aktif, false);
      const lama = await get('/auth/me', tok);
      assert.equal(lama.status, 401);
      assert.equal(lama.data.message, 'Akun tidak aktif atau tidak ditemukan');
      const l = await post('/auth/login', { email: 'uji.v2@desa.id', password: 'abcdef' });
      assert.equal(l.status, 403);
      assert.equal(l.data.message, 'Akun Anda dinonaktifkan. Hubungi sekretaris desa.');
      await patch(`/users/${uid}`, { aktif: true }, T.admin);
      assert.equal((await get('/auth/me', tok)).status, 200);
    });

    it('tidak boleh mengubah diri sendiri; admin lain bisa dinonaktifkan', async () => {
      const saya = (await get('/auth/me', T.admin)).data.id;
      assert.equal((await patch(`/users/${saya}`, { aktif: false }, T.admin)).status, 400);
      assert.equal((await patch(`/users/${saya}`, { role: 'kades' }, T.admin)).status, 400);
      assert.equal((await patch(`/users/${saya}`, { nama: 'Sekdes Baru' }, T.admin)).status, 200);
      const admin2 = (await get('/users?q=admin2', T.admin)).data[0];
      assert.equal(admin2.role, 'admin');
      // admin lain boleh dinonaktifkan lalu diaktifkan lagi; pemanggil selalu tetap admin aktif
      assert.equal((await patch(`/users/${admin2.id}`, { aktif: false }, T.admin)).status, 200);
      assert.equal((await post('/auth/login', { email: 'admin2@desa.id', password: 'abcdef' })).status, 403);
      assert.equal((await patch(`/users/${admin2.id}`, { aktif: true }, T.admin)).status, 200);
      const t2 = await masuk('admin2@desa.id', 'abcdef');
      assert.equal((await patch(`/users/${admin2.id}`, { role: 'kades' }, t2)).status, 400, 'diri sendiri');
    });

    it('reset password', async () => {
      assert.equal((await post(`/users/${uid}/reset-password`, { password_baru: 'baru123' }, T.warga)).status, 403);
      assert.equal((await post(`/users/${uid}/reset-password`, { password_baru: '123' }, T.admin)).status, 400);
      assert.equal((await post('/users/9999/reset-password', { password_baru: 'baru123' }, T.admin)).status, 404);
      assert.deepEqual((await post(`/users/${uid}/reset-password`, { password_baru: 'baru123' }, T.admin)).data, { ok: true });
      assert.equal((await post('/auth/login', { email: 'uji.v2@desa.id', password: 'abcdef' })).status, 400);
      assert.equal((await post('/auth/login', { email: 'uji.v2@desa.id', password: 'baru123' })).status, 200);
    });

    it('foto profil: simpan, tidak ikut di daftar pengguna, hapus, validasi', async () => {
      const t = await masuk('uji.v2@desa.id', 'baru123');
      const r = await patch('/auth/me', { foto: PNG }, t);
      assert.equal(r.status, 200);
      assert.equal(r.data.foto, PNG);
      assert.equal((await get('/auth/me', t)).data.foto, PNG);
      assert.ok(!('foto' in (await get('/users', T.admin)).data[0]));
      assert.equal((await patch('/auth/me', { foto: 'http://x/y.png' }, t)).status, 400);
      assert.equal((await patch('/auth/me', { foto: 'data:image/png;base64,' + 'A'.repeat(400001) }, t)).status, 400);
      assert.equal((await patch('/auth/me', { nama: 'Ganti' }, t)).data.foto, PNG, 'foto tak berubah bila tak dikirim');
      assert.equal((await patch('/auth/me', { foto: null }, t)).data.foto, null);
    });

    it('error 500 tidak membocorkan detail teknis; tanggal laporan salah → 400', async () => {
      for (const p of ['dari=2026-13-45', 'sampai=abc', 'dari=2026-02-31']) {
        assert.equal((await get(`/reports/summary?${p}`, T.kades)).status, 400);
        assert.equal((await get(`/reports/export.csv?${p}`, T.kades)).status, 400);
      }
      const r = await api('POST', '/complaints', { token: T.warga, rawBody: '{rusak' });
      assert.equal(r.status, 400);
      assert.ok(!/column|relation|syntax|select/i.test(r.teks));
    });
  });

  // ================================================================== pengaturan desa
  describe('pengaturan desa dan dusun (admin)', () => {
    it('izin: hanya admin', async () => {
      assert.equal((await get('/settings')).status, 401);
      for (const t of [T.warga, T.perangkat, T.kades]) {
        assert.equal((await get('/settings', t)).status, 403);
        assert.equal((await patch('/settings', { nama_desa: 'X' }, t)).status, 403);
        assert.equal((await post('/dusun', { nama: 'X' }, t)).status, 403);
        assert.equal((await del('/dusun/1', t)).status, 403);
      }
    });

    it('GET: pengaturan + dusun dengan jumlah pengaduan', async () => {
      const s = (await get('/settings', T.admin)).data;
      assert.equal(s.nama_desa, 'Desa Banyoneng Laok');
      assert.deepEqual(['alamat', 'dusun', 'jam', 'nama_desa', 'telepon'], Object.keys(s).sort());
      assert.equal(s.dusun.length, 7);
      assert.deepEqual(Object.keys(s.dusun[0]).sort(), ['id', 'jumlah_pengaduan', 'nama']);
      const langgali = s.dusun.find((d) => d.nama === 'Dusun Langgali');
      assert.ok(langgali.jumlah_pengaduan >= 4);
    });

    it('PATCH: sebagian isian, publik ikut berubah, nama desa tak boleh kosong, panjang dibatasi', async () => {
      const r = await patch('/settings', { nama_desa: 'Desa Makmur Jaya', telepon: '0812-3456-7890' }, T.admin);
      assert.equal(r.status, 200);
      assert.equal(r.data.nama_desa, 'Desa Makmur Jaya');
      assert.equal(r.data.telepon, '0812-3456-7890');
      assert.equal(r.data.jam, 'Senin–Jumat, 08.00–15.00', 'isian yang tidak dikirim tetap');
      const info = (await get('/public/info')).data;
      assert.equal(info.desa, 'Desa Makmur Jaya');
      assert.equal(info.kontak.telepon, '0812-3456-7890');

      const kosong = await patch('/settings', { nama_desa: '   ' }, T.admin);
      assert.equal(kosong.status, 400);
      assert.equal((await get('/public/info')).data.desa, 'Desa Makmur Jaya');

      const panjang = await patch('/settings', { nama_desa: 'D'.repeat(300) }, T.admin);
      assert.equal(panjang.data.nama_desa.length, 100);
      await patch('/settings', { nama_desa: 'Desa Banyoneng Laok' }, T.admin);
    });

    it('tambah dusun: validasi dan duplikat (tak peka huruf besar/kecil)', async () => {
      assert.equal((await post('/dusun', { nama: '  ' }, T.admin)).status, 400);
      assert.equal((await post('/dusun', { nama: 'dusun sumber gundang' }, T.admin)).status, 400);
      const r = await post('/dusun', { nama: 'Dusun Selatan' }, T.admin);
      assert.equal(r.status, 201);
      assert.deepEqual(Object.keys(r.data).sort(), ['id', 'nama']);
      assert.equal((await post('/dusun', { nama: 'DUSUN SELATAN' }, T.admin)).status, 400);
      assert.ok((await get('/public/info')).data.dusun.includes('Dusun Selatan'));
      T.dusunBaru = r.data.id;
    });

    it('dusun baru langsung bisa dipakai untuk daftar akun dan pengaduan', async () => {
      const reg = await post('/auth/register', { nama: 'Warga Selatan', email: 'selatan@desa.id', password: 'abcdef', dusun: 'Dusun Selatan' });
      assert.equal(reg.status, 201);
      const r = await post('/complaints', { ...dasar, dusun: 'Dusun Selatan' }, reg.data.token);
      assert.equal(r.status, 201);
    });

    it('hapus dusun: dipakai → 409, tidak ada → 404, tidak dipakai → berhasil', async () => {
      const dusun = (await get('/settings', T.admin)).data.dusun;
      const sumberGundang = dusun.find((d) => d.nama === 'Dusun Sumber Gundang');
      assert.equal((await del(`/dusun/${sumberGundang.id}`, T.admin)).status, 409);
      assert.equal((await del(`/dusun/${T.dusunBaru}`, T.admin)).status, 409, 'dipakai pengaduan + akun baru');
      assert.equal((await del('/dusun/9999', T.admin)).status, 404);
      assert.equal((await del('/dusun/abc', T.admin)).status, 404);
      const r = await post('/dusun', { nama: 'Dusun Sementara' }, T.admin);
      assert.deepEqual((await del(`/dusun/${r.data.id}`, T.admin)).data, { ok: true });
      assert.ok(!(await get('/public/info')).data.dusun.includes('Dusun Sementara'));
    });
  });
});
