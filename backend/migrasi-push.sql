-- Untuk database yang SUDAH berisi data (mis. Supabase): tambah tabel push tanpa menghapus apa pun.
-- Jalankan sekali di SQL Editor. Aman diulang.
create table if not exists push_subscriptions(
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);
