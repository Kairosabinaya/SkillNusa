# SkillBot AI Setup Instructions

## 🤖 SkillBot AI Assistant

SkillBot adalah asisten AI yang terintegrasi dengan platform SkillNusa untuk membantu klien menemukan freelancer dan layanan yang tepat.

## 🔧 Setup Requirements

### 1. Mendapatkan Gemini API Key

1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Login dengan akun Google Anda
3. Klik "Create API Key"
4. Copy API key yang dihasilkan

### 2. Konfigurasi Environment Variables

1. Buat file `.env` di root project (jika belum ada)
2. Tambahkan konfigurasi berikut:

```env
# Gemini AI Configuration
REACT_APP_GEMINI_API_KEY=your-actual-api-key-here

# Firebase Configuration (jika belum ada)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 3. Restart Development Server

Setelah menambahkan API key, restart server:

```bash
npm start
```

## 🚀 Features

### ✅ Implemented Features:

1. **Auto Welcome Messages**: Menyambut user baru secara otomatis
2. **Project Analysis**: Menganalisis kebutuhan project dan memberikan saran
3. **Gig Recommendations**: Merekomendasikan freelancer/gigs yang sesuai
4. **Real-time Chat**: Chat real-time dengan AI assistant
5. **Notification System**: Counter notifikasi untuk pesan SkillBot baru
6. **Gig Analysis**: Analisis detail layanan di halaman GigDetail
7. **Context-aware Responses**: Jawaban yang kontekstual berdasarkan percakapan

### 🎯 SkillBot Capabilities:

- **Analisis Project Requirements**
- **Pencarian Freelancer yang Sesuai**
- **Rekomendasi Package/Layanan**
- **Tips Persiapan Project**
- **Q&A tentang Platform**

## 🔍 Debugging

Jika SkillBot tidak bekerja dengan baik:

1. **Check Console Logs**: Buka Developer Tools > Console untuk melihat error
2. **Verify API Key**: Pastikan API key valid dan tidak expired
3. **Network Issues**: Check koneksi internet
4. **Quota Issues**: Pastikan quota Gemini API belum habis

### Common Error Messages:

- "Maaf, saya sedang mengalami gangguan teknis" = API Key issue
- "Model not available" = Gemini service initialization failed

## 📝 Usage Examples

### 1. Basic Chat
```
User: "Hai"
SkillBot: "Hai! Saya SkillBot, asisten AI SkillNusa. Ada project yang bisa saya bantu carikan freelancernya?"
```

### 2. Project Analysis
```
User: "Saya butuh website e-commerce"
SkillBot: [Analisis kebutuhan dan memberikan pertanyaan follow-up]
```

### 3. Gig Analysis
```
[Di halaman detail gig]
User: "Apakah package basic sudah cukup?"
SkillBot: [Analisis package dan memberikan rekomendasi]
```

## 🔧 Technical Details

### Database Collections:
- `skillbotConversations`: Menyimpan detail percakapan AI
- `chats`: Entry untuk sistem notifikasi (dual-collection sync)

### Services Used:
- `geminiService.js`: Interface ke Google Gemini AI
- `skillBotService.js`: Logic dan manajemen percakapan
- `chatService.js`: Sistem notifikasi dan unread counter

### Components:
- `Messages.js`: Chat interface utama
- `GigAnalysisChat.js`: Chat di halaman detail gig
- `Header.js`: Notification counter

## 🆘 Support

Jika masih mengalami masalah:

1. Check log di console browser
2. Pastikan semua dependencies ter-install
3. Verify Firebase configuration
4. Test dengan API key yang fresh

## 🔐 Security Notes

- API key harus di-keep secret
- Jangan commit .env file ke Git
- Use environment variables untuk production
- Monitor API usage quota

## 📊 Performance

- Response time: ~1-3 detik (tergantung network)
- Fallback responses: Instant jika API error
- Smart caching: Context-aware conversation history
- Real-time notifications: Instant via Firebase 