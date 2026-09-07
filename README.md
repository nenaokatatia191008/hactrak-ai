# HACTRAK AI — Panduan Deploy (GitHub + Cloudflare Pages + Supabase)

Struktur folder proyek ini:

```
hactrak-deploy/
├── index.html              ← halaman utama (UI chat)
├── functions/
│   └── api/
│       └── chat.js         ← Cloudflare Pages Function (proxy aman ke Groq API)
├── supabase/
│   └── schema.sql           ← skrip SQL opsional untuk simpan riwayat chat
└── README.md
```

Cloudflare Pages otomatis mengenali folder `/functions` sebagai backend serverless —
jadi Anda tidak perlu server terpisah. `GROQ_API_KEY` disimpan aman di Cloudflare,
tidak pernah terlihat di browser.

---

## 1) Upload ke GitHub

1. Buat repo baru di https://github.com/new (misal nama: `hactrak-ai`), biarkan **Public** atau **Private**, jangan centang "Add README" (biar tidak konflik).
2. Di halaman repo kosong tersebut, klik **"uploading an existing file"**.
3. Drag & drop seluruh isi folder `hactrak-deploy/` (termasuk folder `functions` dan `supabase`) ke situ — pastikan struktur foldernya tetap sama persis seperti di atas.
4. Klik **Commit changes**.

> Tips: GitHub web upload kadang tidak bisa upload folder kosong/nested langsung.
> Kalau susah, Anda bisa juga pakai GitHub Desktop, atau upload file satu-satu sesuai path-nya (`functions/api/chat.js` dst).

---

## 2) Deploy ke Cloudflare Pages

1. Masuk ke https://dash.cloudflare.com → menu **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
2. Pilih repo `hactrak-ai` yang baru Anda buat.
3. Pada pengaturan build:
   - **Framework preset**: `None`
   - **Build command**: (kosongkan)
   - **Build output directory**: `/` (root)
4. Klik **Save and Deploy**. Cloudflare akan otomatis mendeteksi folder `functions/` sebagai Pages Functions.

Setelah deploy pertama selesai, Anda akan dapat URL seperti `https://hactrak-ai.pages.dev`.

---

## 3) Atur API Key Groq (WAJIB agar AI-nya jalan)

1. Ambil API key dari https://console.groq.com/keys (gratis, tinggal daftar).
2. Di project Cloudflare Pages Anda → **Settings** → **Environment variables**.
3. Tambahkan variable untuk environment **Production** (dan **Preview** juga kalau perlu):
   - `GROQ_API_KEY` = `gsk_xxxxxxxxxxxxxxxxx` (key dari Groq)
   - `GROQ_MODEL` = `openai/gpt-oss-20b` (opsional — ini nilai default kalau tidak diisi; cek model lain yang tersedia di https://console.groq.com/docs/models)
4. Klik **Save**, lalu buka tab **Deployments** → klik **Retry deployment** (atau push ulang ke GitHub) supaya environment variable terpakai.

Setelah ini, chat di situs Anda akan dijawab oleh model Groq lewat `/api/chat`, bukan lagi respons lokal.

---

## 4) (Opsional) Sambungkan Supabase untuk simpan riwayat chat

Kalau tidak butuh penyimpanan permanen, **lewati bagian ini** — aplikasi tetap berjalan normal.

1. Buat project baru di https://supabase.com/dashboard.
2. Buka **SQL Editor** → jalankan isi file `supabase/schema.sql` yang sudah disediakan di folder ini.
3. Buka **Project Settings → API**, salin:
   - **Project URL**
   - **anon public key**
4. Edit `index.html` di GitHub (klik file → ikon pensil ✏️), cari bagian ini di bagian atas `<script>`:
   ```js
   const CONFIG = {
       SUPABASE_URL: '',      // isi di sini
       SUPABASE_ANON_KEY: ''  // isi di sini
   };
   ```
   Isi dengan Project URL dan anon key dari Supabase, lalu **Commit changes**.
5. Cloudflare Pages akan otomatis re-deploy setiap kali Anda commit ke GitHub.

Setelah ini, setiap pesan (user & AI) otomatis tersimpan ke tabel `hactrak_messages`,
dan jumlah "tracked" di UI akan memuat data asli dari Supabase saat halaman dibuka ulang.

> Catatan: `anon key` Supabase memang aman ditaruh di frontend selama Row Level
> Security (RLS) aktif — dan skrip `schema.sql` sudah mengaktifkannya dengan
> policy dasar. Untuk kontrol lebih ketat (misal cegah spam insert), Anda bisa
> pindahkan proses simpan-data ke dalam `functions/api/chat.js` di sisi server.

---

## 5) Custom domain (opsional)

Di project Cloudflare Pages → **Custom domains** → **Set up a custom domain**,
lalu ikuti instruksi untuk arahkan domain Anda (bisa domain yang sudah ada di
Cloudflare DNS, atau domain eksternal).

---

## Alur update selanjutnya

Setiap kali Anda edit file di GitHub (langsung lewat web, atau git push),
Cloudflare Pages otomatis build & deploy ulang — tidak perlu langkah manual lain.
