# ERD (Entity Relationship Diagram)

Sumber: `backend/schema.sql`. Diagram memakai sintaks Mermaid, tampil otomatis di GitHub. Untuk laporan, salin kode di bawah ke [mermaid.live](https://mermaid.live) lalu ekspor sebagai PNG atau SVG.

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : "membuat"
    USERS ||--o{ NOTIFICATIONS : "menerima"
    COMPLAINTS ||--o{ COMPLAINT_LOGS : "memiliki riwayat"
    DUSUN ||..o{ USERS : "tempat tinggal (nama)"
    DUSUN ||..o{ COMPLAINTS : "lokasi (nama)"

    USERS {
        int id PK
        text nama
        text email UK
        text password "hash bcrypt"
        text role "masyarakat | perangkat | admin | kades"
        text dusun "nama dusun, boleh kosong"
        boolean aktif
        text foto "data URL, opsional"
        timestamptz created_at
    }
    DUSUN {
        int id PK
        text nama UK
        timestamptz created_at
    }
    SETTINGS {
        text key PK "nama_desa, alamat, jam, telepon"
        text value
    }
    COMPLAINTS {
        int id PK
        text kode UK "ADU-tahun-5 digit"
        text judul
        text kategori
        text deskripsi
        text foto "opsional"
        text lokasi
        text dusun
        float lat "opsional"
        float lng "opsional"
        text perkiraan "panjang/volume, opsional"
        text urgensi "Tinggi | Sedang | Rendah"
        text status
        boolean anonim
        text pelapor_nama "bila perangkat melapor atas nama warga"
        text instansi "bila diteruskan"
        int user_id FK
        timestamptz created_at
        timestamptz updated_at
    }
    COMPLAINT_LOGS {
        int id PK
        int complaint_id FK
        text status
        text catatan
        timestamptz created_at
    }
    NOTIFICATIONS {
        int id PK
        int user_id FK
        text tipe
        text judul
        text isi
        boolean dibaca
        timestamptz created_at
    }
```

## Catatan rancangan

- **Dusun dan pengguna/pengaduan** dihubungkan lewat nama (teks), bukan kunci asing. Ini sengaja disederhanakan; API memastikan nama dusun yang dipilih ada di tabel `dusun`, dan dusun yang sudah dipakai tidak dapat dihapus (HTTP 409). Jika ingin lebih ketat, ubah menjadi `dusun_id` dengan kunci asing.
- **settings** adalah tabel kunci-nilai tanpa relasi (nama desa, alamat, jam layanan, telepon).
- **complaint_logs** mencatat setiap perubahan status dan setiap tanggapan. Halaman pelacakan publik menampilkan tabel ini tanpa data pribadi.
- Status yang diizinkan: Diterima, Diverifikasi, Masuk Perencanaan, Dalam Perbaikan, Selesai, Diteruskan ke Instansi, Ditolak. Perpindahan antarstatus dibatasi (tabel `TRANSISI` di `backend/src/config.js`).
- Kode pengaduan dibuat dari sequence `complaint_seq`, jadi tidak ada dua pengaduan dengan kode yang sama walau dikirim bersamaan.
