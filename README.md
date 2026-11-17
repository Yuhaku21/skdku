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
- Bank soal TIU di `question.json` diacak untuk setiap sesi: sistem mengambil 10 soal secara acak dari level yang dipilih.
- Waktu tryout lima menit, navigasi soal, penanda jawaban, skor, dan pembahasan untuk jawaban salah atau yang belum dijawab.
- Semua soal disimpan di `question.json`. Tryout sepenuhnya menggunakan bank soal lokal dan tidak membutuhkan API key atau koneksi ke layanan AI.
- Akun demo dan riwayat tryout tersimpan lokal di browser, tidak disinkronkan antarperangkat.
