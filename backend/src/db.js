// Koneksi PostgreSQL yang dipakai server dan seed.
const { Pool } = require('pg');
const { DATABASE_URL, IS_PRODUCTION } = require('./config');

const url = new URL(DATABASE_URL);

// Parameter sslmode di URL dibuang supaya tidak bentrok dengan pengaturan ssl di bawah.
url.searchParams.delete('sslmode');

const lokal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);

const pool = new Pool({
  connectionString: url.toString(),
  max: 5,                         // serverless: jaga jumlah koneksi tetap kecil
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  // Database cloud (Neon, Supabase, dll.) mewajibkan SSL; database di laptop tidak.
  ...(IS_PRODUCTION || !lokal ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Cegah proses serverless mati hanya karena koneksi terputus sesaat.
pool.on('error', (err) => console.error('Kesalahan pool PostgreSQL:', err.message));

// Jalankan query berparameter dan kembalikan baris-barisnya saja.
const q = (sql, params) => pool.query(sql, params).then((r) => r.rows);

module.exports = { pool, q };
