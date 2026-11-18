# Ruang SKD — Tryout SKD

Aplikasi latihan tryout TIU, TKP, dan TWK berbasis HTML, CSS, dan JavaScript tanpa proses build.

## Menjalankan aplikasi

Pastikan Node.js dan npm sudah terpasang, lalu jalankan dari folder proyek:

```powershell
npm start
```

Buka `http://localhost:3030` di browser. Hentikan server dengan `Ctrl+C`. Bank soal dimuat melalui `fetch`, jadi jangan buka `index.html` langsung sebagai file.

Untuk memakai login, pembuatan akun, leaderboard, dan ulasan lokal, server juga memerlukan `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ADMIN_USERNAME`, dan `ADMIN_PASSWORD` di environment proses. E-book menggunakan tautan default yang telah dikonfigurasi; atur `EBOOK_URL` jika ingin menggantinya dengan tautan HTTPS lain.

## Fitur

- Login pengguna dan admin memakai sesi aman dari API server. Pengunjung dapat mendaftar sendiri untuk paket Starter gratis yang berlaku 1 hari; akun lainnya dibuat oleh admin dengan masa berlaku 1 hari, 7 hari, atau selamanya. Akun kedaluwarsa tidak dapat login dan sesi aktif dihentikan saat masa berlaku habis. Admin dapat melihat username, email, dan masa berlaku akun di tabel pengelolaan. Password pengguna disimpan sebagai hash PBKDF2.
- Landing page publik menampilkan hero dengan tombol login, informasi aplikasi, lima skor akumulasi global (TIU, TKP, TWK, dan total), dan ulasan terbaru dari pengguna. Skor tiap sesi dijumlahkan berdasarkan jenis tes dan disimpan di Upstash.
- Landing page menampilkan paket Starter gratis (1 hari, 10 soal), Tempur (7 hari, 15 soal, diskon dari Rp50.000 menjadi Rp30.000), dan Victory (selamanya, diskon dari Rp70.000 menjadi Rp50.000). Tombol “Mulai tes sekarang” menuju bagian paket; Starter membuka card daftar/masuk, sedangkan Tempur dan Victory menggunakan alur pemesanan WhatsApp.
- Pengunjung baru yang belum login melihat popup Starter beranimasi satu kali per browser; CTA “Mulai coba sekarang” membuka card pendaftaran Starter.
- Landing page menyediakan section manfaat SKDKU dan panduan order: Starter dapat langsung mendaftar, sedangkan pengguna Tempur/Victory menghubungi admin via WhatsApp untuk aktivasi.
- SEO landing page mencakup canonical URL, metadata Open Graph/Twitter dengan gambar pratinjau SKDKU, favicon, data terstruktur, `robots.txt`, dan `sitemap.xml`.
- Dashboard pengguna menampilkan progres akumulasi TIU, TKP, dan TWK terhadap target masing-masing 80, 156, dan 65. Skor tiap sesi tryout (maksimal 100) ditambahkan ke akumulasi jenis tes terkait.
- Pengguna dapat mengunggah foto profil dari dashboard. Foto otomatis dipotong persegi dan diperkecil sebelum disimpan di Upstash; foto ditampilkan di ulasan dan leaderboard, sehingga dapat dilihat oleh semua pengunjung.
- Akun Victory dapat mencetak atau menyimpan sertifikat pencapaian setelah skor akumulasi mencapai seluruh target TIU, TKP, dan TWK. Sertifikat merupakan apresiasi latihan SKDKU, bukan sertifikat resmi instansi pemerintah.
- Akumulasi baru disimpan terpisah dari format skor leaderboard lama karena data lama tidak mencatat jenis tesnya dan tidak dapat dibagi secara akurat.
- Pengguna memilih tingkat mudah (10 soal, 12 menit), menengah (30 soal, 32 menit), atau sulit (50 soal, 52 menit) setelah memilih jenis tes. Bank soal TIU, TKP, dan TWK diputar acak tanpa pengulangan sampai seluruh bank kategori itu terpakai.
- Batas sesi mengikuti masa berlaku akun: akun 1 hari mendapat 10 soal/12 menit, akun 7 hari mendapat 15 soal/16 menit, dan akun selamanya dapat memilih tingkat kesulitan. Hanya akun selamanya yang masuk leaderboard.
- E-book hanya dapat diakses akun Tempur (7 hari) dan Victory (selamanya), melalui endpoint yang memeriksa sesi pengguna. Endpoint menggunakan tautan default e-book dan dapat dioverride melalui `EBOOK_URL` HTTPS; pastikan izin berbagi di penyedia file mengizinkan pengguna membukanya.
- Tryout menyediakan navigasi soal, penanda jawaban, skor persentase, dan pembahasan untuk jawaban salah atau yang belum dijawab.
- Halaman ulasan dengan rating 1–5 bintang dan komentar yang dibagikan ke semua pengguna melalui API server, lalu diperbarui otomatis setiap 15 detik. Nama pengulas diambil dari sesi login server. Saat dijalankan lokal, data ulasan disimpan di `data/reviews.json`; saat di Vercel, API menggunakan Upstash Redis.
- Semua soal disimpan dalam file JSON lokal sesuai kategori. Tryout tidak membutuhkan API key atau koneksi ke layanan AI.
- Riwayat tryout tetap tersimpan lokal di browser, tidak disinkronkan antarperangkat.

## Deploy ke Vercel

Vercel menjalankan `api/reviews.js`, `api/auth.js`, `api/leaderboard.js`, `api/profile.js`, dan `api/ebook.js` sebagai API. Upstash menyimpan ulasan, akun pengguna, sesi login, skor leaderboard, dan foto profil:

1. Buat database Redis di [Upstash](https://console.upstash.com/redis).
2. Di Vercel, buka **Project Settings → Environment Variables** dan tambahkan:
   - `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` dari database Upstash.
   - `ADMIN_USERNAME` dan `ADMIN_PASSWORD` untuk akun admin pertama. Gunakan password unik minimal 12 karakter; jangan commit nilainya atau menambahkan awalan `NEXT_PUBLIC_`.
   - Opsional: `EBOOK_URL` dengan tautan HTTPS lain untuk mengganti tautan default e-book.
3. Pilih environment yang digunakan (Production/Preview), lalu redeploy proyek.
4. Buka `/admin-register` untuk login admin dan membuat akun pengguna. Pendaftaran publik dinonaktifkan.

Jangan gunakan kembali password admin yang pernah dibagikan di chat; buat password baru dan simpan hanya sebagai environment variable. Akun lama yang sebelumnya tersimpan di browser tidak otomatis dipindahkan; admin perlu membuat ulang akun tersebut. Tanpa environment variable Upstash, login, pembuatan akun, dan ulasan tidak dapat memakai database bersama.
