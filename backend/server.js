// Pintu masuk server. Seluruh logika ada di src/.
const app = require('./src/app');

app.listen(process.env.PORT || 4000, () => console.log('API pengaduan desa berjalan'));

// Diekspor agar bisa dipakai alat uji maupun platform serverless (Vercel).
module.exports = app;
