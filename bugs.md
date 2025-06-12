# ✅ Platform Feedback & Revision Checklist

## 🎨 UI/UX

- [x] Cart pada header terlalu kecil dibanding elemen lain → perlu diperbesar. ✅ **FIXED: Ukuran cart diperbesar dari h-5 w-5 menjadi h-6 w-6 (mobile) dan h-7 w-7 (desktop)**
- [ ] Tambahkan tombol khusus yang jelas untuk "Add Gigs" sebagai Freelancer (saat role ada Freelancer).
- [x] Masukkan email di footer tidak ada respon → seharusnya ada feedback/redirect yang jelas. ✅ **FIXED: Newsletter form sekarang redirect ke email client**
- [x] Pada /contact, buat agar "Kirim Pesan" benar-benar mengirim email pada support@skillnusa.com ✅ **FIXED: Form contact sekarang membuka email client dengan data form**
- [x]  Informasi kontak pada /contact dan /footer, hapus detail lokasi dan alamat kantor ✅ **FIXED: Alamat kantor dihapus dari contact page**
- [x] Informasi kontak pada /contact, hapus email business@skillnusa.com, ganti nomor telepon menjadi +6281294169196 ✅ **FIXED: Business email dihapus, nomor telepon diupdate**
- [x] Informasi kontak pada /contact atau /footer, kalau diklik akan direct ke tersebut (misal email akan otomatis send email) ✅ **FIXED: Email dan telepon sekarang clickable dengan mailto: dan tel:**
- [x] Ketika menambahkan gigs ke Wishlist atau Favorites tidak memberikan notifikasi visual (berbeda dengan cart) → perlu konsistensi. ✅ **FIXED: Notifikasi visual ditambahkan untuk favorites di Browse dan Home pages**
- [ ] Memindahkan tombol "Chat" ke bawah "Aksi Cepat" untuk mengisi ruang kosong pada detail order. Pada kolom "Freelancer" atau "Client"nya tetap menampilkan nama dan foto dan emailnya
- [x] Pada semua gigs card yang ada terlihat seperti tautan (ada underline ketika di hover di judul) padahal tidak bisa diklik → bikin kalau diklik jadi open gig detail. ✅ **FIXED: Gig title di /transactions sekarang clickable ke detail page**
- [ ] Navbar berpindah-pindah posisi saat window dikecilkan → perlu perbaikan responsivitas.
- [ ] Di ukuran layar kecil, navbar hanya tampilkan “Search Shop” dan “Message” → pastikan elemen penting tetap terlihat.

## 💬 Chat System

- [ ] Tambahkan label seperti `[chat sent by system]` untuk pesan otomatis dari sistem agar lebih jelas.

## 📝 Register & Login

- [ ] [ENHANCEMENT] Di halaman registrasi, atau update foto (pokoknya yang bisa upload foto profile), kita bisa menggeser-geser atau customize foto kita agar bisa pas di wajah.

## 🤖 SkillBot

- [x] Saat skillbot memberikan rekomendasi gigs, Bintang rating di AI Recommendations belum sinkron, coba periksa bagaimana gigs card menampilkan rating, lalu juga pastikan emoticon bintangnya diganti dengan svg seperti yang ada di gigs card. ✅ **FIXED: Rating format diperbaiki dan fallback ke field rating alternatif (averageRating, gigRating) ditambahkan**
- [ ] Gigs yang muncul kadang tidak relevan → perbaiki filtering & relevansi AI.

## 👤 As Client

- [ ] Tombol “Chat Penjual” tidak langsung redirect ke chat penjual → harus otomatis redirect.

## 🧑‍💻 As Freelancer

- [ ] Tidak ada deadline untuk terima/tolak pesanan → tambahkan batas waktu agar tidak disalahgunakan.
