# Dokumentasi API: Lapor Pak Klebun

Semua respons JSON. Error selalu `{ "message": "..." }`. Header `Authorization: Bearer <token>` diperlukan untuk endpoint bertanda [login].
Peran: `masyarakat` (warga), `perangkat` (kepala dusun/perangkat desa), `admin` (sekretaris desa), `kades` (kepala desa).
Kode pengaduan: `ADU-<tahun>-<5 digit>`.

## Konstanta (sumber di `backend/src/config.js`, disalin ke `frontend/src/lib/constants.js`)
- KATEGORI: Jalan, Penerangan Jalan, Air & Kekeringan, Listrik (PLN), Fasilitas Pendidikan, Fasilitas Kesehatan, Lainnya
- URGENSI: Tinggi, Sedang, Rendah
- STATUS: Diterima, Diverifikasi, Masuk Perencanaan, Dalam Perbaikan, Selesai, Diteruskan ke Instansi, Ditolak
- TRANSISI (status → boleh menjadi):
  - Diterima → Diverifikasi, Diteruskan ke Instansi, Ditolak
  - Diverifikasi → Masuk Perencanaan, Diteruskan ke Instansi, Ditolak
  - Masuk Perencanaan → Dalam Perbaikan, Diteruskan ke Instansi, Ditolak
  - Dalam Perbaikan → Selesai
  - Diteruskan ke Instansi → Dalam Perbaikan, Selesai, Ditolak
  - Selesai, Ditolak → (final)
  Transisi tidak valid → 400 `Status "A" tidak bisa langsung menjadi "B"`.
  `Diteruskan ke Instansi` wajib `instansi`; `Ditolak` wajib `catatan` ≥ 3 karakter.

## Auth
- POST /api/auth/login `{email,password}` → `{token,user}`; 400 salah; 429 setelah 5 gagal / 15 menit (IP+email)
- POST /api/auth/register `{nama,email,password(min6),dusun}` → 201 `{token,user}`; selalu role masyarakat; dusun harus ada di tabel dusun
- [login] GET /api/auth/me → `user`
- [login] PATCH /api/auth/me `{nama?, dusun?}` → `user`
- [login] POST /api/auth/password `{password_lama,password_baru(min6)}` → `{ok:true}`; 400 bila lama salah
- `user` = `{id,nama,email,role,dusun}`

## Publik (tanpa login)
- GET /api/public/info → `{desa, kontak:{alamat,jam,telepon}, dusun:[nama,...]}`  (dari tabel settings + dusun)
- GET /api/public/stats → `{total,selesai,proses,perencanaan}` (proses = bukan Selesai/Ditolak)
- GET /api/public/complaints?status&kategori&dusun&q&page=1&limit=12 → `{data:[{kode,judul,kategori,dusun,status,urgensi,instansi,created_at,updated_at}],total,page,limit}`
  Tanpa nama pelapor, tanpa foto, tanpa deskripsi/lokasi/koordinat. limit maks 50. Urut terbaru.
- GET /api/public/complaints/:kode → `{kode,judul,kategori,dusun,status,urgensi,instansi,created_at,updated_at,logs:[{status,catatan,created_at}]}`; 404 bila tidak ada

## Pengaduan [login]
Lingkup data: masyarakat = miliknya; perangkat = dusunnya + yang ia input; admin & kades = semua.
- GET /api/stats → `{total,diproses,perencanaan,perbaikan,selesai,diteruskan,ditolak,aktif,kategori:[{kategori,n}],harian:[{hari,n}]}` (aktif = total−selesai−ditolak; harian = 7 hari terakhir menurut waktu Jakarta, `hari` berformat `YYYY-MM-DD`)
- GET /api/complaints?status&kategori&dusun&kelompok(aktif|selesai|ditolak)&q&page=1&limit=20 → `{data:[...],total,page,limit}` (limit maks 100)
  Item: `{id,kode,judul,kategori,deskripsi,lokasi,dusun,lat,lng,perkiraan,urgensi,status,anonim,instansi,user_id,created_at,updated_at,ada_foto,pelapor}` — TANPA `foto`, `pelapor_nama`, `pengirim`.
  `pelapor`: nama (atau `pelapor_nama` bila diinput perangkat); bila `anonim`: admin & pemilik melihat `"<nama> (anonim)"`, lainnya `"Anonim"`.
  `q` mencari di judul, kode, kategori, dusun (ilike).
- GET /api/complaints/map → `[{kode,judul,kategori,status,urgensi,dusun,lat,lng}]` hanya yang punya koordinat, sesuai lingkup, maks 1000. (Rute ini harus didaftarkan SEBELUM `/:kode`.)
- GET /api/complaints/:kode → item lengkap + `foto` (data URL atau null) + `logs:[{status,catatan,created_at}]` + `next_status:[...]` (hanya untuk admin/kades; array kosong untuk peran lain / status final). 403 di luar lingkup, 404 tidak ada.
- POST /api/complaints (masyarakat|perangkat) `{judul(≤120),kategori,deskripsi(≤500),lokasi(≤300),dusun,lat?,lng?,perkiraan?,urgensi,anonim?,foto?(data URL jpeg/png ≤ ~2MB),pelapor_nama?(wajib bila perangkat)}` → 201 `{id,kode}`
  Foto OPSIONAL. Dusun harus ada di tabel dusun. Notifikasi ke pembuat + semua admin.
- PATCH /api/complaints/:id/status (admin|kades) `{status,catatan?,instansi?}` → `{id,kode,status}`; aturan TRANSISI di atas; log + notifikasi ke pemilik.
- POST /api/complaints/:id/tanggapan (admin|kades) `{catatan(≥3)}` → 201 `{ok:true}`; menambah baris log dengan status saat ini + notifikasi tipe "Update" ke pemilik ("Ada tanggapan baru untuk pengaduan <kode>"). Tanggapan boleh diberikan pada status apa pun.

## Notifikasi [login]
- GET /api/notifications → `[{id,tipe,judul,isi,dibaca,created_at}]` (terbaru dulu)
- POST /api/notifications/:id/read → `{ok:true}`; 404 bila tidak ada atau bukan milik pengguna
- POST /api/notifications/read-all → `{ok:true}`

## Laporan [login] (admin|kades)
- GET /api/reports/summary?dari=YYYY-MM-DD&sampai=YYYY-MM-DD → `{periode:{dari,sampai},total,per_status:[{status,n}],per_kategori:[{kategori,n}],per_dusun:[{dusun,n}],per_instansi:[{instansi,n}],rata_hari_selesai:number|null}`
  dari/sampai opsional (default: semua waktu); format salah → 400. `rata_hari_selesai` = rata-rata hari dari created_at ke log "Selesai" (1 desimal).
- GET /api/reports/export.csv?dari&sampai → `text/csv; charset=utf-8` diawali BOM (agar Excel membaca UTF-8), `Content-Disposition: attachment; filename="laporan-pengaduan.csv"`.
  Kolom: Kode,Tanggal,Dusun,Kategori,Judul,Lokasi,Perkiraan,Urgensi,Status,Instansi,Pelapor,Diperbarui. Pelapor anonim ditulis "Anonim" (SEMUA peran, termasuk admin, di ekspor). Escape CSV benar (koma, kutip, baris baru) dan netralkan sel yang diawali `= + - @` (tambahkan `'` di depan).

## Pengguna [login] (admin)
- GET /api/users?role&q → `[{id,nama,email,role,dusun,created_at,jumlah_pengaduan}]`
- POST /api/users `{nama,email,password,role(masyarakat|perangkat|admin|kades),dusun?}` → 201 user. perangkat & masyarakat wajib dusun.
- DELETE /api/users/:id → `{ok:true}`; 400 menghapus diri sendiri; 409 bila punya pengaduan.

## Pengaturan desa [login] (admin)
- GET /api/settings → `{nama_desa,alamat,jam,telepon,dusun:[{id,nama,jumlah_pengaduan}]}`
- PATCH /api/settings `{nama_desa?,alamat?,jam?,telepon?}` → seperti GET (nama_desa tidak boleh kosong)
- POST /api/dusun `{nama}` → 201 `{id,nama}`; 400 kosong/duplikat
- DELETE /api/dusun/:id → `{ok:true}`; 409 bila dipakai pengaduan atau pengguna

## Skema tabel dan data contoh
Lihat [ERD.md](ERD.md). Data contoh dibuat oleh `npm run seed`: 7 dusun (Dusun Sumber Gundang, Langgali, Langger, Palanggeren, Pakes, Nungburung, Gibugen), 5 akun demo (kata sandi `password123`), dan 12 pengaduan di semua kategori dan status.

## Ketentuan tambahan
- users: kolom baru `aktif boolean default true` dan `foto text null` (foto profil data URL jpeg/png, maks ~400.000 karakter).
- KEAMANAN: middleware `auth` WAJIB memuat pengguna dari database di setiap permintaan (id dari token) dan memakai `role`, `dusun`, `aktif` TERKINI dari DB. Pengguna tidak ada / `aktif=false` → 401 `Akun tidak aktif atau tidak ditemukan`. Login oleh akun nonaktif → 403 `Akun Anda dinonaktifkan. Hubungi sekretaris desa.` JWT hanya berisi `{id}`; masa berlaku 7 hari.
- `user` (respons login/me) = `{id,nama,email,role,dusun,foto,aktif}`. PATCH /api/auth/me menerima `{nama?,dusun?,foto?}` (foto `null`/"" = hapus; terlalu besar → 400) — email tidak bisa diubah sendiri.
- PATCH /api/users/:id (admin) `{nama?,role?,dusun?,aktif?}` → user. Aturan: tidak boleh menurunkan/menonaktifkan diri sendiri; minimal satu admin aktif tersisa (400). 404 bila tidak ada.
- POST /api/users/:id/reset-password (admin) `{password_baru(min6)}` → `{ok:true}`.
- GET /api/users item juga memuat `aktif`, `foto` TIDAK dikirim di daftar.
- Tidak ada penugasan petugas lapangan dan tidak ada penghapusan pengaduan (alasan: tidak ada di hasil wawancara; penolakan memakai status Ditolak + alasan).
- Parameter tanggal laporan tidak valid → 400 (bukan 500). Pesan error 500 tidak pernah memuat detail teknis.
