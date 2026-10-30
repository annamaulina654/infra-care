# Penelusuran: hasil wawancara → fitur sistem

Sumber: *Draft Transkrip Wawancara, Analisis Kebutuhan Website Pengaduan Infrastruktur Desa* (narasumber: kepala desa). Nomor bagian mengikuti transkrip.

Kolom **Dasar** menunjukkan seberapa langsung fitur berasal dari wawancara:
- **Langsung**: narasumber menyebutkannya.
- **Turunan**: kesimpulan perancang dari yang disebutkan narasumber; perlu dikonfirmasi saat evaluasi dengan desa.

## 1. Temuan wawancara dan penerapannya

| Bagian | Yang disampaikan narasumber (ringkas) | Fitur di sistem | Dasar |
|---|---|---|---|
| 1 | Keluhan paling sering: jalan rusak dan jalan yang belum tersentuh pembangunan | Kategori **Jalan** | Langsung |
| 1 | Penerangan jalan bermasalah tetapi jarang dikeluhkan karena warga sudah terbiasa | Kategori **Penerangan Jalan**; formulir mempermudah warga melapor tanpa harus datang | Langsung |
| 1, 2 | Tegangan listrik tidak normal, ditangani lewat koordinasi dengan PLN | Kategori **Listrik (PLN)**; status **Diteruskan ke Instansi** dengan isian instansi | Langsung |
| 1, 2 | Kekeringan; desa pernah mengebor, sebagian belum berhasil | Kategori **Air & Kekeringan** | Langsung |
| 4 | Bangunan sekolah rusak, wewenang Dinas Pendidikan; desa menjadi mediator | Kategori **Fasilitas Pendidikan**; **Diteruskan ke Instansi** (instansi tujuan tampil di pelacakan publik) | Langsung |
| 3 | Pengaduan kesehatan ditangani bagian pelayanan dan kesejahteraan | Kategori **Fasilitas Kesehatan** | Turunan |
| 2, 5 | Belum ada SOP tertulis; alur dilakukan lewat janji temu, diskusi, lalu dicatat | Alur status baku dan terbatas: Diterima → Diverifikasi → Masuk Perencanaan → Dalam Perbaikan → Selesai (aturan di `TRANSISI`, dokumen `docs/API.md`). Sistem menggantikan SOP tak tertulis dengan alur yang bisa diikuti semua pihak | Turunan |
| 3 | Pencatatan masih manual di buku catatan, lalu rapat evaluasi | Pengaduan tercatat otomatis dengan kode `ADU-tahun-nomor`; menu **Laporan** (ringkasan per status, kategori, dusun, instansi, rata-rata hari selesai), **ekspor CSV**, dan tombol **Cetak / PDF** untuk bahan rapat evaluasi | Turunan |
| 3 | Publikasi lewat TikTok; belum punya website; tindak lanjut diumumkan agar warga tahu | Halaman publik **Pengaduan Warga** dan **Lacak Pengaduan** (tanpa login), berisi status dan riwayat tindak lanjut | Langsung |
| 3 | Yang mengoordinasikan: sekretaris desa dengan kepala desa; urusan perencanaan dan anggaran di bagian perencanaan | Peran **Sekretaris Desa (admin)** dan **Kepala Desa** yang sama-sama dapat mengubah status; status **Masuk Perencanaan** | Langsung |
| 2 | Tindak lanjut disampaikan kembali ke pelapor lewat kepala dusun atau langsung | Peran **Perangkat desa** (kepala dusun) melihat pengaduan di dusunnya; **notifikasi** untuk pelapor setiap status berubah; fitur **tanggapan** dari pemerintah desa | Langsung |
| 5 | Sebagian warga tidak punya ponsel; informasi lewat perantara atau pihak kedua | **Lapor atas nama warga** oleh perangkat desa (nama warga dicatat sebagai pelapor) | Langsung |
| 5 | Sebagian warga malu menyampaikan keluhan langsung | Opsi **anonim** (nama disembunyikan dari perangkat desa dan publik) dan pelaporan lewat formulir daring | Turunan |
| 5, 7 | Proses penyampaian perlu dipercepat; website diharapkan mempermudah | Formulir pengaduan ringkas yang dapat diisi dari ponsel, tata letak responsif | Langsung |
| 6 | Laporan perlu lokasi jelas (nama dusun), perkiraan panjang kerusakan, kebutuhan/volume pekerjaan | Isian **Dusun**, **Lokasi (patokan alamat)**, **Perkiraan biaya/kebutuhan** (teks bebas), serta titik peta opsional | Langsung |
| 6 | Dokumentasi disertakan jika memungkinkan | **Foto opsional** (dikompres otomatis di browser) | Langsung |
| 5, 6 | Anggaran terbatas dan harus menunggu tahapan perencanaan desa | Status **Masuk Perencanaan** dan **Ditolak** (dengan alasan wajib) agar warga memahami keterbatasan; tanggapan dapat menjelaskan jadwal | Langsung |
| 7 | Belum ada petugas yang mampu mengoperasikan website; perlu pelatihan | Antarmuka disederhanakan (menu per peran, label bahasa Indonesia, akun contoh di halaman masuk). **Pelatihan sendiri tidak dapat dibuat oleh sistem** dan perlu direncanakan terpisah | Langsung (sebagian) |
| 7 | Umpan balik dari desa agar laporan tidak terkesan dibiarkan | Riwayat status dan **tanggapan** yang tampil di pelacakan | Langsung |
| 8 | Nama sederhana, mudah diingat, pertimbangkan bahasa Madura; contoh "Lapor Pak Des", "Lapor Pak Klebun", "Lapor Pak Bun"; "Infracare" dinilai kurang mudah diingat | Nama aplikasi **Lapor Pak Klebun** (konstanta `APP_NAME`, mudah diganti) | Langsung |

## 2. Hal yang sengaja tidak dibawa dari versi awal

Versi awal (repositori Infra-Care) dibuat sebelum wawancara dan memuat fitur yang tidak muncul dalam wawancara. Fitur berikut tidak dibawa karena tidak ada dasarnya di wawancara dan alur desa tidak mengenalnya:

| Fitur versi awal | Alasan tidak dibawa |
|---|---|
| Penugasan petugas lapangan dan peran petugas | Narasumber tidak menyebut petugas lapangan; desa memeriksa lokasi langsung setelah menerima informasi dan menyelesaikannya lewat musyawarah |
| Batas waktu layanan (SLA) dan penugasan otomatis | Narasumber menyebut kendala pendanaan dan prosedur, sehingga target waktu otomatis tidak realistis dan dapat tampak sebagai janji yang tidak ditepati |
| Hapus pengaduan oleh admin | Riwayat laporan penting untuk akuntabilitas; pengaduan yang tidak layak memakai status **Ditolak** dengan alasan |
| Ekspor data seluruh masyarakat | Tidak diperlukan; ekspor laporan pengaduan (CSV) menyamarkan pelapor anonim |

Bila desa ternyata membutuhkan salah satunya setelah evaluasi, tambahkan sebagai fitur baru, jangan dihidupkan ulang begitu saja.

## 3. Hal yang belum diverifikasi

- Wawancara hanya dengan satu narasumber; kebutuhan warga dan perangkat desa lain belum diuji. Rencana evaluasi dan pengujian yang disebut di penutup wawancara masih perlu dilakukan (uji coba dengan beberapa warga dan perangkat desa).
- Transkrip memuat bagian yang kurang jelas (tahun perbaikan listrik, nama kantor PLN, angka anggaran). Bagian tersebut tidak dipakai sebagai dasar fitur.
- Daftar dusun, nama desa, dan kontak pada data contoh adalah data fiktif. Isi dengan data desa sebenarnya lewat menu **Pengaturan Desa**.
