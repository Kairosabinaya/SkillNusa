# Customize Firebase Email Verifikasi

## 1. Pengaturan di Firebase Console

### Langkah 1: Masuk ke Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project SkillNusa Anda
3. Pergi ke **Authentication** > **Templates**

### Langkah 2: Customize Email Templates
1. Klik pada **Email address verification**
2. Edit **Subject** sesuai keinginan Anda:
   ```
   Verifikasi Email Akun SkillNusa Anda
   ```
3. Edit **Email body** dengan template yang lebih menarik:
   ```html
   <p>Halo %DISPLAY_NAME%,</p>
   
   <p>Terima kasih telah mendaftar di SkillNusa! Untuk melengkapi proses pendaftaran, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
   
   <p style="text-align: center;">
     <a href="%LINK%" style="background-color: #010042; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verifikasi Email Saya</a>
   </p>
   
   <p>Atau salin dan tempel link ini di browser Anda:</p>
   <p>%LINK%</p>
   
   <p>Jika Anda tidak membuat akun ini, abaikan email ini.</p>
   
   <p>Salam,<br>Tim SkillNusa</p>
   ```

### Langkah 3: Customize Action URL
1. Scroll ke bawah ke bagian **Customize action URL**
2. Centang **Customize action URL**
3. Masukkan URL custom Anda: `https://skillnusa.vercel.app/auth-action`

## 2. Implementasi Custom Action Handler

Saya telah membuat halaman custom `AuthAction.js` yang akan menangani semua Firebase Auth actions:

### Fitur yang sudah diimplementasikan:
- ✅ Email verification handling
- ✅ Password reset handling  
- ✅ Email recovery handling
- ✅ Custom UI yang seragam dengan brand SkillNusa
- ✅ Error handling yang user-friendly
- ✅ Auto redirect setelah sukses
- ✅ Loading states yang baik

### Cara Kerja:
1. User klik link di email → Diarahkan ke `/auth-action`
2. Halaman membaca parameter `mode` dan `oobCode` dari URL
3. Sesuai dengan mode:
   - `verifyEmail`: Verifikasi email otomatis
   - `resetPassword`: Form reset password
   - `recoverEmail`: Recovery email
4. Setelah sukses, user diarahkan ke halaman login

## 3. Update kode untuk menggunakan Custom Action Settings

Saya telah update semua tempat yang menggunakan `sendEmailVerification` untuk menggunakan custom action URL:

### File yang diupdate:
- `src/services/AuthService.js`
- `src/context/AuthContext.js` 
- `src/pages/Auth/VerifyEmail.js`
- `src/App.js` (menambahkan route)
- `src/routes/index.js` (menambahkan konstanta route)

## 4. Hasil Akhir

Sekarang email verifikasi akan:
1. ✅ Menggunakan subject yang custom di Firebase Console 
2. ✅ Menggunakan template HTML yang menarik dengan branding SkillNusa
3. ✅ Link mengarah ke halaman custom `/auth-action` di domain Anda
4. ✅ Halaman verifikasi dengan UI yang konsisten dan user-friendly
5. ✅ Auto redirect ke login setelah berhasil verifikasi

## 5. Testing

Untuk testing:
1. Daftar akun baru
2. Cek email yang diterima - seharusnya sudah menggunakan template custom
3. Klik link verifikasi - akan diarahkan ke halaman custom
4. Setelah berhasil, otomatis redirect ke login

## 6. Kustomisasi Lebih Lanjut

Jika ingin customize lebih lanjut:

### A. Mengubah template email di Firebase Console:
- Masuk ke Firebase Console → Authentication → Templates
- Edit "Email address verification"
- Customize subject dan body sesuai keinginan

### B. Mengubah halaman AuthAction:
- Edit file `src/pages/Auth/AuthAction.js`
- Sesuaikan styling, warna, atau behavior

### C. Menambahkan analytics:
- Tambahkan tracking di halaman AuthAction
- Monitor conversion rate email verification 