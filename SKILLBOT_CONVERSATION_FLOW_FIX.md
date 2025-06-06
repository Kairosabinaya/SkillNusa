# SkillBot Conversation Flow Fix 

## 🚨 Masalah yang Diidentifikasi

Berdasarkan percakapan yang ditunjukkan, ditemukan **masalah kritis** dalam alur conversation SkillBot:

### Percakapan Bermasalah:
```
User: "Gig apa yang cocok untuk project saya di SkillNusa?"
SkillBot: "Kira-kira timeline dan budget seperti apa yang kamu harapkan?"
User: "kamu ga nanya dulu projectnya apa?"
SkillBot: [Langsung kasih rekomendasi gig tanpa konteks]
```

### Root Cause Issues:
1. **Logic Flow Prematur** - SkillBot langsung tanya detail teknis sebelum tahu projectnya apa
2. **System Prompt Tidak Konsisten** - Instructions tidak sesuai dengan behavior yang diharapkan  
3. **Context Handling Lemah** - SkillBot tidak memproses konteks conversation dengan baik

## ✅ Perbaikan yang Dilakukan

### 1. **System Prompt Enhancement** 
**File:** `src/services/geminiService.js`

**Sebelum:** Instruction umum tanpa alur conversation yang jelas
```javascript
RESPONS GUIDELINES:
- JANGAN tanya terlalu banyak detail - cukup info dasar untuk cari gigs
- Kalau user udah kasih info project, langsung carikan gigs yang cocok dari SkillNusa
```

**Sesudah:** Instruction dengan alur conversation yang jelas
```javascript
ALUR CONVERSATION YANG BENAR:
1. WAJIB tanya PROJECT/LAYANAN APA yang dibutuhkan user terlebih dahulu
2. BARU setelah tau projectnya, tanya detail seperti budget/timeline jika perlu
3. JANGAN langsung tanya budget/timeline kalau belum tau projectnya apa

RESPONS GUIDELINES:
- WAJIB tanya PROJECT DULU sebelum detail lain
- Kalau user udah kasih info project, baru boleh tanya detail atau carikan gigs
- PENTING: Jika user tanya "gig apa yang cocok" tapi belum bilang projectnya apa, WAJIB tanya projectnya dulu!
```

### 2. **Logic Flow Optimization**
**File:** `src/services/skillBotService.js`

#### a) **shouldShowGigRecommendations() Refactor**
**Sebelum:** Terlalu agresif - show gigs berdasarkan keyword saja
```javascript
// Trigger gigs terlalu cepat berdasarkan keyword mentioning
const hasProjectKeywords = ['testing', 'aplikasi', 'app', 'website'...]
return hasSpecificRequirements || (hasAskedQuestions && hasProvidedDetails) || (messageCount >= 2 && hasProjectKeywords);
```

**Sesudah:** Lebih konservatif - hanya show gigs saat project jelas
```javascript
// Special case: if user has explicit project description, allow it
if (hasExplicitProjectDescription || hasSpecificRequirements) {
  return true;
}

// For other cases, need more conversation context
if (messageCount <= 2) return false;

// Show recommendations if user has responded to project question  
return hasRespondedToProjectQuestion;
```

#### b) **generateClarifyingQuestions() Enhancement**
**Sebelum:** Random questions yang bisa langsung ke budget/timeline
```javascript
const questions = {
  'general': [
    "Kira-kira timeline dan budget seperti apa yang kamu harapkan?"
  ]
};
```

**Sesudah:** Prioritas tanya project type dulu
```javascript
// If user asks about "gig apa yang cocok" but hasn't mentioned specific project
if ((lowerMessage.includes('gig apa') || lowerMessage.includes('cocok untuk project')) && 
    !this.hasProjectTypeInMessage(userMessage)) {
  return "Project apa yang lagi kamu butuhkan? Website, aplikasi mobile, design, atau yang lain?";
}
```

#### c) **New Helper Functions**
- `hasProjectTypeInMessage()` - Detect apakah user sudah mention project type
- `hasExplicitProjectDescription()` - Detect apakah user sudah describe project dengan jelas

### 3. **Conversation Context Improvement**
**File:** `src/services/skillBotService.js`

```javascript
// Check if SkillBot has asked about project type and user has responded
const hasAskedAboutProject = conversationHistory.some(msg => 
  msg.senderId === SKILLBOT_ID && 
  (msg.content.toLowerCase().includes('project apa') || 
   msg.content.toLowerCase().includes('layanan apa') ||
   msg.content.toLowerCase().includes('butuh apa') ||
   msg.content.toLowerCase().includes('butuhkan apa'))
);
```

## 🎯 Expected Conversation Flow (Setelah Fix)

### ✅ Scenario 1: Correct Flow
```
User: "Gig apa yang cocok untuk project saya di SkillNusa?"
SkillBot: "Project apa yang lagi kamu butuhkan? Website, aplikasi mobile, design, atau yang lain?"
User: "Website e-commerce"
SkillBot: [Shows relevant gig recommendations for e-commerce websites]
```

### ✅ Scenario 2: Explicit Project Description  
```
User: "Saya mau bikin website e-commerce untuk toko online saya"
SkillBot: [Directly shows gig recommendations since project is clear]
```

### ✅ Scenario 3: Natural Follow-up
```
User: "Butuh freelancer untuk project"
SkillBot: "Project seperti apa yang kamu rencanakan? Bisa kasih tau lebih detail?"
User: "aplikasi mobile untuk bisnis saya"
SkillBot: [Shows mobile app development gigs]
```

## 🔍 Key Improvements

1. **Question Hierarchy:** Project type → Details → Gig recommendations
2. **Context Awareness:** SkillBot remembers what was asked and responds accordingly
3. **Natural Flow:** No more abrupt jumps to budget/timeline questions
4. **Explicit Detection:** Better pattern matching for project descriptions
5. **Conservative Gig Display:** Only show gigs when project context is clear

## 🚀 Testing Guidelines

### Manual Test Cases:
1. **Test "gig apa yang cocok"** - Should ask project type first
2. **Test explicit project mention** - Should show gigs directly
3. **Test vague project mention** - Should ask for clarification
4. **Test conversation flow** - Should follow logical progression

### Expected Behaviors:
- ❌ **DON'T:** Ask budget/timeline before knowing project type
- ✅ **DO:** Ask project type first, then details
- ❌ **DON'T:** Show gigs for vague mentions like "butuh project"
- ✅ **DO:** Show gigs for clear descriptions like "mau bikin website e-commerce"

## 📁 Files Modified

1. `src/services/geminiService.js` - System prompts and response generation
2. `src/services/skillBotService.js` - Conversation logic and gig recommendation triggers

## 🔄 Rollback Instructions

Jika ada masalah dengan perbaikan ini:

1. Revert changes di `geminiService.js` system prompts
2. Revert `shouldShowGigRecommendations()` logic 
3. Revert `generateClarifyingQuestions()` logic
4. Test dengan conversation flow lama

## 📝 Summary

Perbaikan ini mengatasi masalah utama SkillBot yang **tidak mengikuti alur conversation natural**. Sekarang SkillBot akan:

- **WAJIB tanya project type dulu** sebelum detail lain
- **Tidak langsung tanya budget/timeline** tanpa konteks project
- **Lebih smart** dalam mendeteksi kapan harus show gig recommendations
- **Mengikuti flow conversation yang logis** dan natural

Conversation sekarang akan terasa lebih seperti ngobrol dengan customer service yang cerdas, bukan bot yang melompat-lompat topik. 