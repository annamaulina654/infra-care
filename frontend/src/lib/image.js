// Kompres foto di browser sebelum dikirim, supaya muat di batas permintaan server (Vercel ± 4,5 MB)
// dan tidak membebani database. Hasilnya data URL JPEG.
import { FOTO_MAKS_SISI, FOTO_KUALITAS, TTD_MAKS_SISI, TTD_MAKS_DATA } from '../config.js';

const TIPE_BOLEH = ['image/jpeg', 'image/png'];
const MAKS_BERKAS = 8 * 1024 * 1024; // foto asli dari kamera HP bisa beberapa MB
const MAKS_BERKAS_TTD = 5 * 1024 * 1024;

export function kompresFoto(berkas, { maksSisi = FOTO_MAKS_SISI, kualitas = FOTO_KUALITAS } = {}) {
  return new Promise((selesai, gagal) => {
    if (!berkas) return gagal(new Error('Pilih foto terlebih dahulu'));
    if (!TIPE_BOLEH.includes(berkas.type)) return gagal(new Error('Foto harus berformat JPG atau PNG'));
    if (berkas.size > MAKS_BERKAS) return gagal(new Error('Ukuran foto maksimal 8 MB'));

    const url = URL.createObjectURL(berkas);
    const img = new Image();
    img.onload = () => {
      const skala = Math.min(1, maksSisi / Math.max(img.width, img.height));
      const kanvas = document.createElement('canvas');
      kanvas.width = Math.round(img.width * skala);
      kanvas.height = Math.round(img.height * skala);
      const ctx = kanvas.getContext('2d');
      ctx.fillStyle = '#fff'; // PNG transparan menjadi latar putih saat jadi JPEG
      ctx.fillRect(0, 0, kanvas.width, kanvas.height);
      ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
      URL.revokeObjectURL(url);
      selesai(kanvas.toDataURL('image/jpeg', kualitas));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      gagal(new Error('Gambar tidak dapat dibaca. Coba foto lain.'));
    };
    img.src = url;
  });
}

// Tanda tangan admin: hanya PNG, transparansi dipertahankan (tanpa latar putih).
export function kompresTtd(berkas, { maksSisi = TTD_MAKS_SISI, maksData = TTD_MAKS_DATA } = {}) {
  return new Promise((selesai, gagal) => {
    if (!berkas) return gagal(new Error('Pilih gambar tanda tangan terlebih dahulu'));
    if (berkas.type !== 'image/png') return gagal(new Error('Tanda tangan harus berupa gambar PNG'));
    if (berkas.size > MAKS_BERKAS_TTD) return gagal(new Error('Ukuran gambar maksimal 5 MB'));

    const url = URL.createObjectURL(berkas);
    const img = new Image();
    img.onload = () => {
      const skala = Math.min(1, maksSisi / Math.max(img.width, img.height));
      const kanvas = document.createElement('canvas');
      kanvas.width = Math.max(1, Math.round(img.width * skala));
      kanvas.height = Math.max(1, Math.round(img.height * skala));
      const ctx = kanvas.getContext('2d');
      ctx.drawImage(img, 0, 0, kanvas.width, kanvas.height);
      URL.revokeObjectURL(url);
      const hasil = kanvas.toDataURL('image/png');
      if (hasil.length > maksData) {
        return gagal(new Error('Tanda tangan terlalu besar. Gunakan gambar PNG yang lebih sederhana.'));
      }
      selesai(hasil);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      gagal(new Error('Gambar tidak dapat dibaca. Coba file lain.'));
    };
    img.src = url;
  });
}
