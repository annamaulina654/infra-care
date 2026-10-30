// Pembuat CSV yang aman dibuka di Excel / Google Sheets.

// Sel yang diawali = + - @ (atau tab / CR) bisa dibaca Excel sebagai rumus, sehingga
// teks buatan pengguna bisa menjalankan rumus berbahaya ("CSV injection"). Diberi tanda ' di depan.
const netralkan = (s) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);

const sel = (nilai) => {
  const s = netralkan(String(nilai ?? ''));
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// BOM di depan supaya Excel membaca file sebagai UTF-8 (huruf seperti "±" tidak rusak).
const buatCsv = (judulKolom, baris) =>
  '﻿' + [judulKolom, ...baris].map((b) => b.map(sel).join(',')).join('\r\n') + '\r\n';

module.exports = { buatCsv };
