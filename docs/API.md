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
  `Diteruskan ke Instansi` wajib `instansi`; `Ditolak` wajib `catatan` ≥ 3 karakter; `Dalam Perbaikan` wajib `catatan` ≥ 3 karakter dan `foto` (data URL jpeg/png ≤ ~2MB, bukti pengerjaan); `Selesai` wajib `foto` (foto setelah perbaikan), `catatan` opsional. Foto disimpan di riwayat dan tampil di pelacakan publik. Tanpa foto → 400 ("Foto bukti pengerjaan wajib dilampirkan" / "Foto setelah perbaikan wajib dilampirkan").

## Auth
- POST /api/auth/login `{email,password}` → `{token,user}`; 400 salah; 429 setelah 5 gagal / 15 menit (IP+email)
- POST /api/auth/register `{nama,email,password(min6),dusun,setuju_privasi:true}` → 201 `{token,user}`; selalu role masyarakat; dusun harus ada di tabel dusun; persetujuan privasi wajib; dibatasi 10 percobaan / jam / IP (429 + `Retry-After`)
- [login] GET /api/auth/me → `user`
- [login] PATCH /api/auth/me `{nama?, dusun?}` → `user`
- [login] POST /api/auth/password `{password_lama,password_baru(min6)}` → `{ok:true}`; 400 bila lama salah
- `user` = `{id,nama,email,role,dusun}`

## Publik (tanpa login)
- GET /api/public/info → `{desa, kontak:{alamat,jam,telepon}, dusun:[nama,...]}`  (dari tabel settings + dusun)
- GET /api/public/stats → `{total,selesai,proses,perencanaan}` (proses = bukan Selesai/Ditolak)
- GET /api/public/complaints?status&kategori&dusun&q&page=1&limit=12 → `{data:[{kode,judul,kategori,dusun,status,urgensi,instansi,created_at,updated_at}],total,page,limit}`
  Tanpa nama pelapor, tanpa foto pengaduan, tanpa deskripsi/lokasi/koordinat. limit maks 50. Urut terbaru.
- GET /api/public/complaints/:kode → `{kode,judul,kategori,dusun,status,urgensi,instansi,created_at,updated_at,logs:[{status,catatan,foto,oleh,created_at}]}`; 404 bila tidak ada. `logs[].foto` hanya berisi foto bukti penanganan dari pemerintah desa (status Dalam Perbaikan dan Selesai); foto pengaduan dari warga tidak pernah dikirim

## Pengaduan [login]
Lingkup data: masyarakat = miliknya; perangkat = dusunnya + yang ia input; admin & kades = semua.
- GET /api/stats → `{total,diproses,perencanaan,perbaikan,selesai,diteruskan,ditolak,aktif,kategori:[{kategori,n}],harian:[{hari,n}]}` (aktif = total−selesai−ditolak; harian = 7 hari terakhir menurut waktu Jakarta, `hari` berformat `YYYY-MM-DD`)
- GET /api/complaints?status&kategori&dusun&kelompok(aktif|selesai|ditolak)&q&page=1&limit=20 → `{data:[...],total,page,limit}` (limit maks 100)
  Item: `{id,kode,judul,kategori,deskripsi,lokasi,dusun,lat,lng,perkiraan,urgensi,status,anonim,instansi,user_id,created_at,updated_at,ada_foto,pelapor}` — TANPA `foto`, `pelapor_nama`, `pengirim`.
  `pelapor`: nama (atau `pelapor_nama` bila diinput perangkat); bila `anonim`: admin & pemilik melihat `"<nama> (anonim)"`, lainnya `"Anonim"`.
  `q` mencari di judul, kode, kategori, dusun (ilike).
- GET /api/complaints/map → `[{kode,judul,kategori,status,urgensi,dusun,lat,lng}]` hanya yang punya koordinat, sesuai lingkup, maks 1000. (Rute ini harus didaftarkan SEBELUM `/:kode`.)
- GET /api/complaints/:kode → item lengkap + `foto` (data URL atau null) + `logs:[{status,catatan,foto,oleh,created_at}]` + `next_status:[...]` (hanya untuk admin/kades; array kosong untuk peran lain / status final) + `ttd:{kades:{nama,gambar},sekdes:{nama,gambar}}` untuk blok tanda tangan bukti. Admin dan pemilik juga menerima `pelapor_nama` dan `pembuat_role` untuk mengisi form edit. Semua peran menerima `bisa_edit` (boolean); admin dan pemilik yang tidak boleh mengedit juga menerima `alasan_edit`. 403 di luar lingkup, 404 tidak ada. `oleh` menandai pengirim log: `sistem`, `masyarakat`, `perangkat`, `admin`, atau `kades` (baris lama bisa `null`). `foto` pada log adalah bukti foto perubahan status (bila ada).
- POST /api/complaints (masyarakat|perangkat) `{judul(≤120),kategori,deskripsi(≤500),lokasi(≤300),dusun,lat?,lng?,perkiraan?,urgensi,anonim?,foto?(data URL jpeg/png ≤ ~2MB),pelapor_nama?(wajib bila perangkat),setuju_privasi:true}` → 201 `{id,kode}`
  Foto OPSIONAL. Dusun harus ada di tabel dusun. Notifikasi ke pembuat, semua admin, dan perangkat desa di dusun terkait. Dibatasi 20 pembuatan / jam / pengguna (429 + `Retry-After`). Persetujuan privasi wajib.
- PATCH /api/complaints/:id (pemilik atau admin; lihat aturan di bawah) `{judul,kategori,deskripsi,lokasi,dusun,urgensi,lat?,lng?,perkiraan?,anonim?,pelapor_nama?,foto?}` → `{id,kode}`. Seluruh isian divalidasi seperti saat membuat. `foto:null` menghapus foto, sedangkan foto tidak dikirim berarti tetap. Status tidak berubah (gunakan endpoint status). Aturan edit: pemilik (warga, atau perangkat yang menginput laporan) hanya boleh saat status **Diterima**; admin (sekdes) boleh selama status belum final; kades tidak boleh; **Selesai** dan **Ditolak** terkunci untuk semua (403 dengan pesan alasan). `anonim` hanya dapat diubah pemilik, admin tidak bisa membuka identitas pelapor. Edit yang benar-benar mengubah data menambah log `Data pengaduan diubah: <nama bagian>` (hanya nama bagian, bukan isinya, karena riwayat tampil di pelacakan publik); bila tidak ada yang berubah, tidak ada log maupun notifikasi. Bila admin mengedit laporan orang lain, pemilik mendapat notifikasi.
- PATCH /api/complaints/:id/status (admin|kades) `{status,catatan?,instansi?,foto?}` → `{id,kode,status}`; aturan TRANSISI di atas; log + notifikasi ke pemilik. Untuk `Dalam Perbaikan`, `catatan` (≥ 3 karakter) dan `foto` (bukti foto) wajib disertakan. Notifikasi memuat alasan penolakan dan/atau instansi tujuan bila ada.
- POST /api/complaints/:id/tanggapan (admin|kades) `{catatan(≥3)}` → 201 `{ok:true}`; menambah baris log dengan status saat ini + notifikasi tipe "Update" ke pemilik ("Ada tanggapan baru untuk pengaduan <kode>: \"<catatan>\""). Tanggapan boleh diberikan pada status apa pun.
- POST /api/complaints/:id/pesan (pelapor) `{catatan(≥3,≤500)}` → 201 `{ok:true}`; pelapor menambah informasi/balasan tanpa mengubah status. Log memakai status saat ini dan `oleh` sesuai peran pelapor; notifikasi dikirim ke admin dan perangkat desa di dusun terkait. Hanya pemilik pengaduan yang boleh (403 untuk peran lain), dibatasi 20 pesan / jam / pengguna.

## Notifikasi [login]
- GET /api/notifications → `[{id,tipe,judul,isi,dibaca,created_at}]` (terbaru dulu)
- POST /api/notifications/:id/read → `{ok:true}`; 404 bila tidak ada atau bukan milik pengguna
- POST /api/notifications/read-all → `{ok:true}`


### Notifikasi push (`/api/push`, wajib login)

- GET /api/push/key → `{aktif, key}`; `aktif:false` dan `key:null` bila server belum diberi kunci VAPID
- POST /api/push/subscribe `{endpoint, keys:{p256dh, auth}}` → 201 `{ok:true}`; 400 bila tidak valid (endpoint harus `https://`); 503 bila push belum diaktifkan. Satu endpoint = satu perangkat; bila perangkat dipakai akun lain, langganan pindah ke akun itu
- POST /api/push/unsubscribe `{endpoint}` → `{ok:true}` (hanya menghapus langganan milik pengguna itu)
- POST /api/push/test → `{terkirim, gagal}`; mengirim notifikasi percobaan ke semua perangkat pengguna. 503 bila push belum diaktifkan

Push dikirim otomatis bersamaan dengan notifikasi di dalam aplikasi (pengaduan diterima, pengaduan baru untuk sekdes dan perangkat dusun, status berubah, tanggapan baru, pesan dari pelapor). Langganan yang ditolak layanan push dengan 404/410 dihapus otomatis.

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
- GET /api/settings → `{nama_desa,alamat,jam,telepon,nama_kades,nama_sekdes,ttd_kades,ttd_sekdes,dusun:[{id,nama,jumlah_pengaduan}]}`
- PATCH /api/settings `{nama_desa?,alamat?,jam?,telepon?,nama_kades?,nama_sekdes?,ttd_kades?,ttd_sekdes?}` → seperti GET (nama_desa tidak boleh kosong)
  `ttd_kades`/`ttd_sekdes` berupa data URL PNG (maks ~1,5 MB); string kosong atau `null` menghapus tanda tangan. Nama dan tanda tangan ini dipakai di bagian bawah bukti pengaduan yang dicetak.
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
