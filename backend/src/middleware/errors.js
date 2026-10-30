// Penanganan error yang seragam: semua respons error berbentuk JSON { message }.

// Express 4 tidak menangkap error dari fungsi async, jadi dibungkus agar masuk ke errorHandler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Error tak terduga dicatat di log server; pengguna hanya melihat pesan umum
// supaya detail teknis (nama tabel, query) tidak bocor.
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Ukuran data terlalu besar. Gunakan foto yang lebih kecil.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format data tidak valid' });
  }
  console.error('ERROR:', err.stack || err.message);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
};

const apiTidakDitemukan = (req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' });

module.exports = { wrap, errorHandler, apiTidakDitemukan };
