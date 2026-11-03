-- Migrasi Sprint 1 untuk database yang sudah berisi data (tanpa seed ulang).
-- Aman dijalankan berulang kali.

-- Menyimpan bukti persetujuan privasi saat pendaftaran akun warga.
alter table users add column if not exists setuju_privasi boolean not null default false;

-- Menyimpan bukti persetujuan privasi saat pengaduan dikirim.
alter table complaints add column if not exists setuju_privasi boolean not null default false;

-- Menandai pengirim riwayat: sistem, warga, perangkat, admin, atau kades.
-- Baris lama bernilai null dan tetap ditampilkan tanpa label pengirim.
alter table complaint_logs add column if not exists oleh text;

-- Menyimpan bukti foto perubahan status (mis. tahap Dalam Perbaikan).
alter table complaint_logs add column if not exists foto text;
