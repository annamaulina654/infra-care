-- Skema database sistem pengaduan infrastruktur desa.
-- PERINGATAN: file ini menghapus semua tabel lama lalu membuatnya ulang (dipakai oleh `npm run seed`).
drop table if exists notifications, complaint_logs, complaints, dusun, settings, users cascade;
drop sequence if exists complaint_seq;
create sequence complaint_seq start 1;

-- Peran pengguna:
--   masyarakat : warga, membuat dan memantau pengaduannya sendiri
--   perangkat  : kepala dusun / perangkat desa, membuat pengaduan atas nama warga
--                dan melihat pengaduan di dusunnya
--   admin      : sekretaris desa, mengelola semua pengaduan, akun, dan pengaturan
--   kades      : kepala desa, melihat semua pengaduan dan ikut memutuskan tindak lanjut
create table users(
  id serial primary key,
  nama text not null,
  email text unique not null,
  password text not null,
  role text not null check(role in('masyarakat','perangkat','admin','kades')),
  dusun text,
  aktif boolean not null default true,
  foto text,
  created_at timestamptz default now()
);

-- Daftar dusun yang bisa dipilih pada pendaftaran dan form pengaduan.
create table dusun(
  id serial primary key,
  nama text unique not null,
  created_at timestamptz default now()
);

-- Pengaturan desa: nama_desa, alamat, jam, telepon.
create table settings(
  key text primary key,
  value text not null default ''
);

create table complaints(
  id serial primary key,
  kode text unique not null,
  judul text not null,
  kategori text not null,
  deskripsi text not null,
  foto text,                       -- opsional; berisi data URL gambar (JPEG/PNG)
  lokasi text not null,
  dusun text not null,
  lat double precision,
  lng double precision,
  perkiraan text,                  -- perkiraan panjang / volume pekerjaan (opsional)
  urgensi text not null check(urgensi in('Tinggi','Sedang','Rendah')),
  status text not null default 'Diterima' check(status in(
    'Diterima','Diverifikasi','Masuk Perencanaan','Dalam Perbaikan','Selesai','Diteruskan ke Instansi','Ditolak')),
  anonim boolean not null default false,
  pelapor_nama text,               -- diisi bila perangkat desa melapor atas nama warga
  instansi text,                   -- diisi bila status "Diteruskan ke Instansi"
  user_id int not null references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index complaints_dusun_idx on complaints(dusun);
create index complaints_status_idx on complaints(status);
create index complaints_user_idx on complaints(user_id);
create index complaints_created_idx on complaints(created_at desc);

-- Riwayat perubahan status dan tanggapan pemerintah desa.
create table complaint_logs(
  id serial primary key,
  complaint_id int references complaints(id) on delete cascade,
  status text,
  catatan text,
  created_at timestamptz default now()
);
create index complaint_logs_complaint_idx on complaint_logs(complaint_id);

create table notifications(
  id serial primary key,
  user_id int references users(id) on delete cascade,
  tipe text,
  judul text,
  isi text,
  dibaca boolean default false,
  created_at timestamptz default now()
);
create index notifications_user_idx on notifications(user_id);
