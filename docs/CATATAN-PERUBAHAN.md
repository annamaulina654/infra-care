# Catatan perubahan dari versi awal (Infra-Care)

Ringkasan untuk laporan: apa yang diganti dan mengapa.

## Struktur kode

- **Backend** yang semula satu berkas `server.js` dipecah: `src/app.js`, `src/config.js`, `src/db.js`, `src/middleware/` (auth, errors, rateLimit), `src/routes/` (auth, public, complaints, notifications, reports, users, settings), `src/services/`, `src/utils/` (access, csv, filter, validate). `server.js` hanya menyalakan aplikasi.
- **Frontend** dipecah menjadi `pages/` (publik dan app), `components/` (ui, layout, complaints, map), `context/` (auth, desa), `hooks/`, dan `lib/`.
- Folder `frontend/dist`, `kredn` (berisi kredensial contoh dalam teks biasa), dan `package-lock.json` di akar tidak dibawa. Lock file backend dan frontend perlu dibuat ulang dengan `npm install` karena dependensi berubah.

## Tampilan

- Seluruh gaya memakai **Tailwind CSS v4** dengan warna semantik (terang dan gelap) yang didefinisikan sekali di `frontend/src/index.css`.
- **Semua emoji diganti ikon SVG** (Lucide lewat `react-icons/lu`), diatur dari satu berkas `src/lib/icons.js`.
- Tata letak responsif: sidebar tetap di layar lebar dan laci geser di bawah 1024 px; daftar pengaduan berupa tabel di layar lebar dan kartu di HP; tinggi isian dan tombol utama minimal 44 px agar mudah disentuh.
- Teks yang panjang tanpa spasi dipatahkan supaya tidak melebarkan halaman.
- Mode gelap mengikuti pilihan pengguna dan tersimpan di browser.

## Keamanan dan ketahanan

- Token JWT hanya memuat `id`. Peran, dusun, dan status aktif dibaca dari database pada setiap permintaan, sehingga perubahan peran atau penonaktifan akun berlaku langsung.
- `JWT_SECRET` wajib di production (tidak ada nilai cadangan).
- Pembatasan percobaan masuk: 5 kali gagal per 15 menit per kombinasi IP dan email.
- Ekspor CSV menetralkan sel yang diawali `=`, `+`, `-`, `@` (pencegahan CSV injection) dan menulis pelapor anonim sebagai "Anonim".
- Data publik tidak memuat nama pelapor, foto, deskripsi, maupun lokasi; riwayat publik hanya menyebut jabatan (bukan nama pegawai) pada catatan perubahan status.
- Pesan galat 500 tidak membocorkan detail teknis.

## Perbaikan galat yang ditemukan pada versi awal

- Pemilihan lokasi di peta tidak mengisi kolom lokasi karena dua pembaruan state berurutan saling menimpa.
- Tinggi peta memakai satuan yang salah sehingga peta nyaris tak terlihat.
- Kelas tata letak layar penuh pada halaman depan merusak tampilannya.
- Kartu "Aksi Cepat" meluap ke samping di HP lebar 390 px.

## Pengujian yang sudah dilakukan

- Backend: 86 uji otomatis (`backend/test/api.test.js`) terhadap PostgreSQL asli, lulus semua.
- Frontend: seluruh halaman dibuka pada lebar 1440, 820, dan 390 px tanpa halaman melebar ke samping dan tanpa galat JavaScript; 22 skenario alur (masuk salah/benar, hak akses per peran, membuat pengaduan, mengubah status dan batas alurnya, tanggapan, filter dan pencarian, ekspor CSV, tambah pengguna, pelacakan publik, laci menu di HP, mode gelap) lulus terhadap backend asli.

## Yang belum teruji

- Peta Leaflet dan pengambilan lokasi GPS tidak dapat diuji di lingkungan pembuatan; kode peta mengikuti pola `react-leaflet` 4 yang sama dengan versi awal. Periksa di browser setelah `npm install`.
- Deploy ke Vercel belum dicoba.
- Library `express`, `bcryptjs`, dan `jsonwebtoken` pada pengujian backend digantikan stub kompatibel di lingkungan pembuatan (paket asli tidak bisa dipasang di sana). Jalankan `npm test` di laptop Anda dengan paket asli untuk memastikan.
