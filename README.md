# Lapor Pak Klebun

Sistem pengaduan infrastruktur desa. Warga melaporkan kerusakan jalan, penerangan, air, listrik, sekolah, atau fasilitas kesehatan. Sekretaris desa dan kepala desa memverifikasi, merencanakan, atau meneruskan laporan ke instansi, dan siapa pun dapat memantau perkembangannya tanpa login.

Dirancang berdasarkan wawancara dengan kepala desa untuk tugas mata kuliah e-Government (lihat [docs/PENELUSURAN-WAWANCARA.md](docs/PENELUSURAN-WAWANCARA.md)). Nama "Klebun" adalah sebutan kepala desa dalam bahasa Madura, sesuai saran narasumber agar nama mudah diingat.

**Teknologi:** Node.js + Express, PostgreSQL, React 18 + Vite, Tailwind CSS v4, ikon Lucide (`react-icons`), peta Leaflet. Tanpa emoji; semua ikon berupa SVG.

## Isi repositori

```
backend/    API Express (src/routes, src/middleware, src/utils), schema.sql, seed.js, test/
frontend/   React + Vite + Tailwind (src/pages, src/components, src/lib, src/context)
docs/       API.md, ERD.md, PENELUSURAN-WAWANCARA.md, CATATAN-PERUBAHAN.md
vercel.json konfigurasi deploy Vercel (backend dan frontend sebagai dua layanan)
```

## Menjalankan di laptop

Prasyarat: Node.js 18+ dan PostgreSQL.

1. Buat database kosong:
   ```
   createdb pengaduan_desa
   ```
2. Backend:
   ```
   cd backend
   cp .env.example .env        # isi DATABASE_URL dan JWT_SECRET
   npm install
   npm run seed                # membuat tabel + data contoh (MENGHAPUS tabel lama)
   npm start                   # http://localhost:4000
   ```
3. Frontend, di terminal lain:
   ```
   cd frontend
   npm install
   npm run dev                 # http://localhost:5173 (permintaan /api diteruskan ke port 4000)
   ```

Gunakan `npm install`, bukan `npm ci`: berkas `package-lock.json` sengaja tidak disertakan dan akan dibuat otomatis pada `npm install` pertama. Setelah itu commit lock file tersebut.

### Akun contoh (kata sandi semua akun: `password123`)

| Peran | Email |
|---|---|
| Warga (Dusun Krajan) | warga@desa.id |
| Perangkat desa / kepala dusun (Dusun Tengah) | perangkat@desa.id |
| Sekretaris desa (admin) | sekdes@desa.id |
| Kepala desa | kades@desa.id |

Hapus atau ganti kata sandi akun contoh sebelum dipakai sungguhan.

### Pengujian backend

Jalankan server dengan database yang baru di-seed, lalu di terminal lain:

```
cd backend
npm test        # 86 uji; BASE_URL default http://localhost:4000
```

Uji ini mengubah data (membuat pengaduan dan pengguna). Jalankan `npm run seed` lagi untuk mengembalikan data awal.

## Mengganti nama desa dan nama aplikasi

- **Nama desa, alamat, jam layanan, telepon, daftar dusun:** login sebagai sekretaris desa, buka menu **Pengaturan Desa**. Tidak perlu mengubah kode.
- **Titik awal peta:** `frontend/src/config.js` (`PUSAT_PETA`), isi dengan koordinat kantor desa.
- **Nama aplikasi:** `frontend/src/config.js` (`APP_NAME`) dan `<title>` di `frontend/index.html`.
- Nama desa awal pada data contoh ("Desa Sumber Harapan") ada di `backend/seed.js`.

## Deploy ke Vercel

1. Buat database PostgreSQL cloud (Neon atau Supabase) dan salin connection string-nya.
2. Di Vercel, impor repositori ini. Tambahkan environment variable `DATABASE_URL` dan `JWT_SECRET` (teks acak minimal 32 karakter; wajib di production, server menolak start tanpa itu).
3. Jalankan seed sekali dari laptop ke database cloud: `DATABASE_URL="..." npm run seed` di folder `backend`.

Foto pengaduan disimpan sebagai data URL di database (dikompres di browser hingga sisi terpanjang 1280 px), karena penyimpanan berkas di Vercel tidak permanen. Untuk volume besar, pindahkan ke object storage.

## Peran dan hak akses

| Peran | Dapat melakukan |
|---|---|
| Warga | Membuat pengaduan (foto dan titik peta opsional; bisa dikirim anonim), melihat pengaduannya sendiri, menerima notifikasi |
| Perangkat desa | Melapor atas nama warga yang datang langsung, melihat pengaduan di dusunnya, melihat peta |
| Sekretaris desa (admin) | Semua pengaduan, mengubah status, memberi tanggapan, laporan dan ekspor CSV, kelola pengguna, pengaturan desa |
| Kepala desa | Semua pengaduan, mengubah status, memberi tanggapan, laporan dan ekspor CSV |
| Publik (tanpa login) | Daftar dan pelacakan pengaduan tanpa nama pelapor, foto, atau alamat lengkap |

Alur status: Diterima → Diverifikasi → Masuk Perencanaan → Dalam Perbaikan → Selesai. Pada tahap mana pun sebelum perbaikan, pengaduan dapat berstatus **Diteruskan ke Instansi** (wajib mencantumkan instansi) atau **Ditolak** (wajib mencantumkan alasan). Aturan lengkapnya ada di [docs/API.md](docs/API.md).

## Keterbatasan yang perlu diketahui

- Peta Leaflet memakai ubin OpenStreetMap dan perlu koneksi internet.
- Tidak ada pengiriman WhatsApp atau SMS. Pemberitahuan ke warga lewat notifikasi di dalam aplikasi.
- Warga yang tidak memiliki ponsel dilayani lewat fitur "Lapor atas nama warga" oleh perangkat desa.
- Pelatihan penggunaan untuk perangkat desa (kendala yang disebut narasumber) belum ada di aplikasi; perlu dilakukan di luar sistem.
- Belum ada fitur lupa kata sandi lewat email; admin dapat mereset kata sandi dari menu Data Pengguna.
