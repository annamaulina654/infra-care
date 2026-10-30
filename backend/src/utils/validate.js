// Pembersih dan pemeriksa input. Semua nilai dari pengguna lewat sini sebelum masuk query.

// Ubah nilai apa pun menjadi teks rapi dengan panjang maksimum.
const teks = (v, maks) => String(v ?? '').trim().slice(0, maks);

// Angka dalam rentang tertentu; di luar rentang / bukan angka → null.
const angka = (v, min, maks) => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= maks ? n : null;
};

const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Tanggal "YYYY-MM-DD" yang benar-benar ada di kalender (menolak mis. 2026-02-31).
const tanggalValid = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

// Halaman dan batas untuk daftar berhalaman.
const halaman = (query, { limitAwal, limitMaks }) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(limitMaks, Math.max(1, parseInt(query.limit, 10) || limitAwal));
  return { page, limit, offset: (page - 1) * limit };
};

// Foto opsional: harus data URL JPEG/PNG dengan ukuran wajar. Mengembalikan { foto } atau { error }.
const periksaFoto = (nilai, maks) => {
  if (!nilai) return { foto: null };
  const f = String(nilai);
  if (!/^data:image\/(jpeg|png);base64,/.test(f) || f.length > maks) {
    return { error: 'Foto harus berformat JPG/PNG dan berukuran maksimal sekitar 2 MB' };
  }
  return { foto: f };
};

module.exports = { teks, angka, emailValid, tanggalValid, halaman, periksaFoto };
