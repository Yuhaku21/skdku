# Ruang SKD — Tryout SKD

Aplikasi latihan tryout TIU berbasis HTML, CSS, dan JavaScript tanpa proses build.

## Menjalankan aplikasi

Pastikan Node.js dan npm sudah terpasang, lalu jalankan dari folder proyek:

```powershell
npm start
```

Buka `http://localhost:3030` di browser. Hentikan server dengan `Ctrl+C`. Bank soal dimuat melalui `fetch`, jadi jangan buka `index.html` langsung sebagai file.

Untuk memakai login, pembuatan akun, leaderboard, dan ulasan lokal, server juga memerlukan `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_USERNAME`, dan `ADMIN_PASSWORD` di environment proses.

## Fitur

- Login pengguna dan admin memakai sesi aman dari API server. Akun pengguna hanya dapat dibuat oleh admin dengan masa berlaku 1 hari, 7 hari, atau selamanya; akun kedaluwarsa tidak dapat login dan sesi aktif dihentikan saat masa berlaku habis. Admin dapat melihat username, email, dan masa berlaku akun di tabel pengelolaan. Password pengguna disimpan sebagai hash PBKDF2.
- Landing page publik menampilkan hero dengan tombol login, informasi aplikasi, lima skor terbaik global, dan ulasan terbaru dari pengguna. Skor leaderboard diambil dari skor terbaik setiap pengguna dan disimpan di Upstash.
- Bank soal TIU di `question.json`, TKP di `tkp.json`, dan TWK di `twk.json` diputar acak untuk setiap sesi; 10 soal dari kategori yang dipilih tidak diulang sampai seluruh bank soal itu terpakai.
- Waktu tryout 12 menit, navigasi soal, penanda jawaban, skor, dan pembahasan untuk jawaban salah atau yang belum dijawab.
- Halaman ulasan dengan rating 1–5 bintang dan komentar yang dibagikan ke semua pengguna melalui API server, lalu diperbarui otomatis setiap 15 detik. Nama pengulas diambil dari sesi login server. Saat dijalankan lokal, data ulasan disimpan di `data/reviews.json`; saat di Vercel, API menggunakan Upstash Redis.
- Semua soal disimpan dalam file JSON lokal sesuai kategori. Tryout tidak membutuhkan API key atau koneksi ke layanan AI.
- Riwayat tryout tetap tersimpan lokal di browser, tidak disinkronkan antarperangkat.

## Deploy ke Vercel

Vercel menjalankan `api/reviews.js`, `api/auth.js`, dan `api/leaderboard.js` sebagai API. Upstash menyimpan ulasan, akun pengguna, sesi login, dan skor leaderboard:

1. Buat database Redis di [Upstash](https://console.upstash.com/redis).
2. Di Vercel, buka **Project Settings → Environment Variables** dan tambahkan:
   - `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` dari database Upstash.
   - `ADMIN_USERNAME` dan `ADMIN_PASSWORD` untuk akun admin pertama. Gunakan password unik minimal 12 karakter; jangan commit nilainya atau menambahkan awalan `NEXT_PUBLIC_`.
3. Pilih environment yang digunakan (Production/Preview), lalu redeploy proyek.
4. Buka `/admin-register` untuk login admin dan membuat akun pengguna. Pendaftaran publik dinonaktifkan.

Jangan gunakan kembali password admin yang pernah dibagikan di chat; buat password baru dan simpan hanya sebagai environment variable. Akun lama yang sebelumnya tersimpan di browser tidak otomatis dipindahkan; admin perlu membuat ulang akun tersebut. Tanpa environment variable Upstash, login, pembuatan akun, dan ulasan tidak dapat memakai database bersama.
