// Merakit aplikasi Express: middleware umum, router per fitur, lalu penanganan error.
const express = require('express');
const cors = require('cors');
const { errorHandler, apiTidakDitemukan } = require('./middleware/errors');

const app = express();

app.set('trust proxy', 1);          // di belakang proxy Vercel: req.ip memakai alamat klien asli
app.set('x-powered-by', false);

// Header keamanan dasar. API tidak boleh di-cache karena isinya bergantung pada pengguna.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(cors());
app.use(express.json({ limit: '4mb' })); // cukup untuk satu foto yang sudah dikompres

app.use('/api/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/complaints'));   // /stats dan /complaints...
app.use('/api', require('./routes/settings'));     // /settings dan /dusun...

app.use('/api', apiTidakDitemukan);
app.use(errorHandler);

module.exports = app;
