# Ruang SKD — Tryout TIU

Aplikasi latihan tryout TIU berbasis HTML, CSS, dan JavaScript tanpa proses build.

## Menjalankan aplikasi

Pastikan Node.js dan npm sudah terpasang, lalu jalankan dari folder proyek:

```powershell
npm start
```

Buka `http://localhost:3030` di browser. Hentikan server dengan `Ctrl+C`. Bank soal dimuat melalui `fetch`, jadi jangan buka `index.html` langsung sebagai file.

## Fitur

- Daftar dan masuk dengan akun yang disimpan di `localStorage`. Kata sandi disimpan sebagai hash PBKDF2; ini tetap aplikasi demo tanpa server autentikasi dan tidak cocok untuk akun penting.
- Bank soal TIU di `question.json` diputar acak untuk setiap sesi: 10 soal dari level yang dipilih tidak diulang sampai seluruh bank soal level itu terpakai.
- Waktu tryout 12 menit, navigasi soal, penanda jawaban, skor, dan pembahasan untuk jawaban salah atau yang belum dijawab.
- Halaman ulasan dengan rating 1–5 bintang dan komentar yang dibagikan ke semua pengguna melalui API server, lalu diperbarui otomatis setiap 15 detik. Nama diambil dari akun demo di browser dan belum diverifikasi server. Saat dijalankan lokal, data disimpan di `data/reviews.json`; saat di Vercel, API menggunakan Upstash Redis.
- Semua soal disimpan di `question.json`. Tryout sepenuhnya menggunakan bank soal lokal dan tidak membutuhkan API key atau koneksi ke layanan AI.
- Akun demo dan riwayat tryout tersimpan lokal di browser, tidak disinkronkan antarperangkat.

## Deploy ke Vercel

Vercel menjalankan `api/reviews.js` sebagai endpoint `/api/reviews`. Agar ulasan tersimpan permanen dan dibagikan antar-pengguna:

1. Buat database Redis di [Upstash](https://console.upstash.com/redis).
2. Di Vercel, buka **Project Settings → Environment Variables** dan tambahkan `UPSTASH_REDIS_REST_URL` serta `UPSTASH_REDIS_REST_TOKEN` dari database Upstash. Jangan commit nilai token ke repositori.
3. Pilih environment yang digunakan (Production/Preview), lalu redeploy proyek.

Tanpa kedua environment variable tersebut, API Vercel mengembalikan error konfigurasi JSON dan tidak menyimpan ulasan.
