// Fungsi format tampilan (tanggal, angka, inisial).

const ZONA = 'Asia/Jakarta';

export const tgl = (d) => {
  if (!d) return '-';
  const x = new Date(d);
  const tanggal = x.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: ZONA });
  const jam = x.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: ZONA }).replace('.', ':');
  return `${tanggal}, ${jam} WIB`;
};

export const tglPendek = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: ZONA }) : '-';

export const angka = (n) => Number(n || 0).toLocaleString('id-ID');

export const inisial = (nama = '') =>
  nama.trim().split(/\s+/).slice(0, 2).map((k) => k[0]?.toUpperCase() || '').join('') || '?';

// Gabungkan nama kelas dan buang nilai yang salah/kosong.
export const cx = (...kelas) => kelas.filter(Boolean).join(' ');

// "2026-10-29" untuk <input type="date">.
export const hariIni = () => new Date().toISOString().slice(0, 10);
