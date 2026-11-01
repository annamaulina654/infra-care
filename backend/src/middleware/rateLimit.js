// Pembatasan percobaan login: maksimal 5 kali gagal per 15 menit untuk kombinasi IP + email.
// Disimpan di memori. Di serverless hanya membantu sebagian (tiap instance punya memori sendiri),
// tapi cukup untuk menahan tebakan password beruntun.
const BATAS_GAGAL = 5;
const JENDELA_MS = 15 * 60 * 1000;

const gagal = new Map();
const aksi = new Map();

const alamatIp = (req) => String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim() || 'tanpa-ip';
const kunci = (req, email) => `${alamatIp(req)}|${email}`;

const terkunci = (k) => {
  const g = gagal.get(k);
  if (!g) return false;
  if (Date.now() > g.sampai) { gagal.delete(k); return false; }
  return g.n >= BATAS_GAGAL;
};

const catatGagal = (k) => {
  const g = gagal.get(k);
  if (!g || Date.now() > g.sampai) gagal.set(k, { n: 1, sampai: Date.now() + JENDELA_MS });
  else g.n += 1;
};

const reset = (k) => gagal.delete(k);

// Pembatas umum untuk aksi yang rawan disalahgunakan (pendaftaran dan pembuatan pengaduan).
// `kunci(req)` menentukan siapa yang dihitung; bawaan: alamat IP.
const batasi = ({ nama, maks, jendelaMs, kunci: ambilKunci = alamatIp }) => (req, res, next) => {
  // Bersihkan entri kedaluwarsa sesekali agar memori tidak tumbuh tanpa batas.
  if (aksi.size > 5000) {
    const sekarang = Date.now();
    for (const [k, v] of aksi) if (sekarang > v.sampai) aksi.delete(k);
  }

  const k = `${nama}|${ambilKunci(req)}`;
  const sekarang = Date.now();
  const g = aksi.get(k);

  if (!g || sekarang > g.sampai) {
    aksi.set(k, { n: 1, sampai: sekarang + jendelaMs });
    return next();
  }
  if (g.n >= maks) {
    const sisaDetik = Math.max(1, Math.ceil((g.sampai - sekarang) / 1000));
    res.setHeader('Retry-After', String(sisaDetik));
    const menit = Math.max(1, Math.ceil(sisaDetik / 60));
    return res.status(429).json({ message: `Terlalu banyak permintaan. Coba lagi dalam ${menit} menit.` });
  }

  g.n += 1;
  return next();
};

module.exports = { kunci, terkunci, catatGagal, reset, batasi };
