// Pembatasan percobaan login: maksimal 5 kali gagal per 15 menit untuk kombinasi IP + email.
// Disimpan di memori. Di serverless hanya membantu sebagian (tiap instance punya memori sendiri),
// tapi cukup untuk menahan tebakan password beruntun.
const BATAS_GAGAL = 5;
const JENDELA_MS = 15 * 60 * 1000;

const gagal = new Map();

const kunci = (req, email) => `${String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim()}|${email}`;

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

module.exports = { kunci, terkunci, catatGagal, reset };
