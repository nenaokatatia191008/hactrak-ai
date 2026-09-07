-- ==========================================================
-- Skema Supabase untuk HACTRAK AI (opsional)
-- Jalankan di: Supabase Dashboard > SQL Editor > New query
-- ==========================================================

-- 1. Tabel penyimpanan riwayat chat
create table if not exists hactrak_messages (
  id bigint generated always as identity primary key,
  type text not null check (type in ('user', 'ai', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 2. Aktifkan Row Level Security (WAJIB, karena anon key dipakai di frontend)
alter table hactrak_messages enable row level security;

-- 3. Izinkan siapa saja (anon) untuk INSERT pesan baru
create policy "Izinkan insert publik"
on hactrak_messages
for insert
to anon
with check (true);

-- 4. Izinkan siapa saja (anon) untuk membaca jumlah/riwayat pesan
--    Jika tidak ingin riwayat chat orang lain bisa dibaca publik, HAPUS policy ini
--    dan cukup gunakan "count" saja lewat function terpisah di server.
create policy "Izinkan select publik"
on hactrak_messages
for select
to anon
using (true);

-- Catatan keamanan:
-- - anon key Supabase memang didesain untuk dipakai di sisi client/browser,
--   TAPI aksesnya sepenuhnya dikendalikan oleh policy RLS di atas.
-- - Policy di atas bersifat demo/sederhana: semua orang bisa insert & baca.
--   Untuk produksi nyata, pertimbangkan menambah rate limiting atau
--   memindahkan proses simpan-data ke Cloudflare Function (server-side)
--   agar tidak bisa dispam langsung dari browser pengguna.
