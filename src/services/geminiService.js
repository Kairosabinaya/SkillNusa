import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    console.log('🤖 GeminiService: Initializing...');
    console.log('🤖 GeminiService: API Key exists:', !!this.apiKey);
    console.log('🤖 GeminiService: API Key length:', this.apiKey ? this.apiKey.length : 0);
    
    if (!this.apiKey) {
      console.warn('❌ Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
      console.warn('📝 To get a Gemini API key:');
      console.warn('   1. Go to https://makersuite.google.com/app/apikey');
      console.warn('   2. Create a new API key');
      console.warn('   3. Add REACT_APP_GEMINI_API_KEY=your-key-here to your .env file');
      console.warn('   4. Restart the development server');
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('✅ GeminiService: Successfully initialized with gemini-1.5-flash model');
    } catch (error) {
      console.error('❌ GeminiService: Failed to initialize:', error);
    }
    
    // System prompts for different contexts
    this.systemPrompts = {
      welcome: `Kamu adalah SkillBot, asisten AI yang membantu klien mencari freelancer dan layanan gigs yang tepat di platform SkillNusa. 

Personality: Ramah, profesional, helpful, dan antusias membantu.

Tugas utama:
1. Menyambut user baru dengan hangat
2. Menjelaskan kemampuan SkillBot
3. Membantu user menemukan freelancer/gigs yang sesuai kebutuhan
4. Memberikan rekomendasi berdasarkan project requirements

Gunakan bahasa Indonesia yang natural dan profesional.`,

      projectAnalysis: `Kamu adalah SkillBot, AI assistant yang expert dalam menganalisis kebutuhan project dan merekomendasikan freelancer/gigs yang tepat.

Tugas:
1. Menganalisis requirement project dari user
2. Bertanya follow-up questions yang relevan
3. Membuat daftar kebutuhan yang comprehensive
4. Mencari dan merekomendasikan gigs yang sesuai
5. Memberikan saran implementasi project

Context yang perlu dipertimbangkan:
- Jenis project (web development, mobile app, design, marketing, dll)
- Budget range
- Timeline
- Complexity level
- Technical requirements
- Target audience

Selalu berikan jawaban dalam bahasa Indonesia yang jelas dan terstruktur.`,

      gigAnalysis: `Kamu adalah SkillBot, AI assistant yang expert dalam menganalisis gigs dan memberikan insight kepada user.

Tugas:
1. Menganalisis detail gig yang diberikan
2. Memberikan rangkuman capabilities gig
3. Menilai kesesuaian dengan kebutuhan user
4. Merekomendasikan package yang tepat (basic/standard/premium)
5. Memberikan pertanyaan yang bisa ditanyakan ke freelancer

Gunakan bahasa Indonesia yang profesional dan informatif.`
    };
  }

  // Generate welcome message for new users
  async generateWelcomeMessage(userName) {
    console.log('🤖 GeminiService: generateWelcomeMessage called for user:', userName);
    
    if (!this.model) {
      console.log('🤖 GeminiService: Model not available, using fallback');
      return this.getFallbackWelcomeMessage(userName);
    }

    try {
      console.log('🤖 GeminiService: Sending request to Gemini API...');
      const prompt = `${this.systemPrompts.welcome}

User baru bernama ${userName} baru saja bergabung di platform SkillNusa. Buatkan pesan sambutan yang:
1. Menyapa dengan nama
2. Memperkenalkan diri sebagai SkillBot
3. Menjelaskan apa yang bisa dibantu SkillBot
4. Mengajak user untuk menceritakan project yang dibutuhkan

Buat dalam 2-3 paragraf yang engaging dan tidak terlalu panjang.`;

      console.log('🤖 GeminiService: Prompt length:', prompt.length);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ GeminiService: Successfully generated welcome message');
      console.log('🤖 GeminiService: Response length:', text.length);
      return text;
    } catch (error) {
      console.error('❌ GeminiService: Error generating welcome message:', error);
      console.error('❌ GeminiService: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's an API key issue
      if (error.message && error.message.includes('API_KEY')) {
        console.error('❌ GeminiService: API Key issue detected');
      }
      
      return this.getFallbackWelcomeMessage(userName);
    }
  }

  // Analyze project requirements and ask follow-up questions
  async analyzeProjectRequirements(userMessage, conversationHistory = []) {
    if (!this.model) return this.getFallbackProjectAnalysis();

    try {
      const conversationContext = conversationHistory.length > 0 
        ? `\n\nKontext percakapan sebelumnya:\n${conversationHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n')}`
        : '';

      const prompt = `${this.systemPrompts.projectAnalysis}

User mengirim pesan: "${userMessage}"${conversationContext}

Tugasmu:
1. Analisis kebutuhan project dari pesan user
2. Identifikasi informasi yang masih kurang
3. Buat 2-3 follow-up questions yang spesifik dan helpful
4. Berikan estimasi jenis layanan/gigs yang mungkin dibutuhkan

Format response:
- Berikan understanding terhadap kebutuhan user
- Ajukan pertanyaan follow-up yang tepat
- Jika sudah cukup info, berikan rekomendasi awal

Gunakan tone yang conversational dan helpful.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analyzing project requirements:', error);
      return this.getFallbackProjectAnalysis();
    }
  }

  // Recommend gigs based on project requirements
  async recommendGigs(projectRequirements, availableGigs = []) {
    if (!this.model) return this.getFallbackGigRecommendation();

    try {
      const gigsContext = availableGigs.length > 0 
        ? `\n\nGigs yang tersedia:\n${availableGigs.map(gig => 
            `- ${gig.title} (${gig.category}) - Rp ${gig.packages?.basic?.price?.toLocaleString('id-ID')} - ${gig.packages?.basic?.deliveryTime} hari`
          ).join('\n')}`
        : '\n\nBelum ada gigs yang tersedia untuk dianalisis.';

      const prompt = `${this.systemPrompts.projectAnalysis}

Kebutuhan project user: ${projectRequirements}${gigsContext}

Tugasmu:
1. Analisis kesesuaian antara kebutuhan user dengan gigs yang tersedia
2. Ranking gigs berdasarkan relevansi
3. Berikan rekomendasi 3-5 gigs terbaik (jika ada)
4. Jelaskan mengapa gigs tersebut cocok
5. Berikan saran package (basic/standard/premium) untuk masing-masing
6. Jika tidak ada gigs yang sesuai, jelaskan kenapa dan beri saran alternatif

Format response dengan struktur yang jelas dan actionable.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error recommending gigs:', error);
      return this.getFallbackGigRecommendation();
    }
  }

  // Analyze specific gig for user
  async analyzeGig(gigData, userQuery = '') {
    if (!this.model) return this.getFallbackGigAnalysis(gigData);

    try {
      const gigInfo = `
Judul: ${gigData.title}
Kategori: ${gigData.category}
Deskripsi: ${gigData.description}
Tags: ${gigData.tags?.join(', ') || 'Tidak ada'}
Packages:
- Basic: Rp ${gigData.packages?.basic?.price?.toLocaleString('id-ID')} - ${gigData.packages?.basic?.deliveryTime} hari
  Features: ${gigData.packages?.basic?.features?.join(', ') || 'Tidak disebutkan'}
- Standard: Rp ${gigData.packages?.standard?.price?.toLocaleString('id-ID')} - ${gigData.packages?.standard?.deliveryTime} hari
  Features: ${gigData.packages?.standard?.features?.join(', ') || 'Tidak disebutkan'}
- Premium: Rp ${gigData.packages?.premium?.price?.toLocaleString('id-ID')} - ${gigData.packages?.premium?.deliveryTime} hari
  Features: ${gigData.packages?.premium?.features?.join(', ') || 'Tidak disebutkan'}
Rating: ${gigData.rating || 'Belum ada rating'}
`;

      const userContext = userQuery ? `\n\nPertanyaan spesifik user: "${userQuery}"` : '';

      const prompt = `${this.systemPrompts.gigAnalysis}

Analisis gig berikut:${gigInfo}${userContext}

Tugasmu:
1. Berikan rangkuman singkat tentang layanan ini
2. Analisis value proposition dari masing-masing package
3. Rekomendasikan package yang tepat berdasarkan kebutuhan umum
4. ${userQuery ? 'Jawab pertanyaan spesifik user' : 'Berikan insights tentang kualitas dan kesesuaian gig'}
5. Saran pertanyaan yang bisa ditanyakan ke freelancer

Berikan response yang informatif dan actionable.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analyzing gig:', error);
      return this.getFallbackGigAnalysis(gigData);
    }
  }

  // Generate conversation response
  async generateResponse(userMessage, context = {}) {
    console.log('🤖 GeminiService: generateResponse called');
    console.log('🤖 GeminiService: User message:', userMessage);
    console.log('🤖 GeminiService: Context keys:', Object.keys(context));
    
    if (!this.model) {
      console.log('🤖 GeminiService: Model not available, using fallback');
      return this.getFallbackResponse();
    }

    try {
      const { conversationHistory = [], currentGig = null, availableGigs = [] } = context;
      
      let systemPrompt = this.systemPrompts.projectAnalysis;
      let contextInfo = '';

      if (currentGig) {
        systemPrompt = this.systemPrompts.gigAnalysis;
        contextInfo = `\n\nKontext: User sedang melihat gig "${currentGig.title}" di kategori ${currentGig.category}`;
      }

      if (conversationHistory.length > 0) {
        contextInfo += `\n\nRiwayat percakapan:\n${conversationHistory.slice(-5).map(msg => 
          `${msg.senderId === 'skillbot' ? 'SkillBot' : 'User'}: ${msg.content}`
        ).join('\n')}`;
      }

      const prompt = `${systemPrompt}

User mengirim pesan: "${userMessage}"${contextInfo}

Berikan response yang helpful, natural, dan sesuai konteks percakapan. Jika user bertanya tentang gig tertentu, fokus pada analisis gig. Jika user menjelaskan project requirements, bantu analisis dan beri rekomendasi.`;

      console.log('🤖 GeminiService: Sending request to Gemini API...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ GeminiService: Successfully generated response');
      return text;
    } catch (error) {
      console.error('❌ GeminiService: Error generating response:', error);
      return this.getFallbackResponse();
    }
  }

  // Fallback messages when API is not available
  getFallbackWelcomeMessage(userName) {
    return `Hai ${userName}! 👋 

Selamat datang di SkillNusa! Saya SkillBot, asisten AI yang akan membantu Anda menemukan freelancer dan layanan yang tepat untuk project Anda.

Saya bisa membantu Anda:
🎯 Menganalisis kebutuhan project
🔍 Mencari freelancer terbaik yang sesuai
💡 Memberikan rekomendasi layanan
📋 Menyusun requirement yang detail

Ceritakan tentang project yang Anda butuhkan, dan saya akan membantu menemukan solusi terbaik!`;
  }

  getFallbackProjectAnalysis() {
    return `Terima kasih sudah menceritakan tentang project Anda! Saya sedang menganalisis kebutuhan Anda dan akan segera memberikan rekomendasi freelancer terbaik.

Untuk memberikan rekomendasi yang lebih akurat, bisa tolong jelaskan lebih detail tentang:
- Timeline project yang diharapkan
- Budget range yang tersedia  
- Fitur-fitur spesifik yang dibutuhkan

Saya akan membantu menemukan freelancer yang paling sesuai dengan kebutuhan Anda! 🚀`;
  }

  getFallbackGigRecommendation() {
    return `Berdasarkan kebutuhan project Anda, saya sedang menganalisis gigs yang tersedia di platform. Mohon tunggu sebentar sementara saya menyiapkan rekomendasi terbaik untuk Anda.

Saya akan mempertimbangkan faktor-faktor seperti:
✅ Kesesuaian dengan requirement
✅ Rating dan review freelancer
✅ Timeline dan budget
✅ Portfolio dan pengalaman

Rekomendasi akan segera ditampilkan!`;
  }

  getFallbackGigAnalysis(gigData) {
    return `Layanan "${gigData?.title || 'ini'}" terlihat menarik! 

Berdasarkan analisis awal:
📋 Kategori: ${gigData?.category || 'Tidak disebutkan'}
💰 Harga mulai dari: Rp ${gigData?.packages?.basic?.price?.toLocaleString('id-ID') || 'Tidak disebutkan'}
⏱️ Delivery time: ${gigData?.packages?.basic?.deliveryTime || 'Tidak disebutkan'} hari

Untuk membantu Anda lebih baik, bisa ceritakan tentang project spesifik yang Anda kerjakan? Saya akan memberikan rekomendasi package yang paling sesuai!`;
  }

  getFallbackResponse() {
    return `Terima kasih atas pertanyaannya! Saya sedang memproses informasi Anda dan akan memberikan rekomendasi terbaik. 

Jika Anda memiliki pertanyaan spesifik tentang layanan atau ingin mencari freelancer tertentu, silakan jelaskan lebih detail dan saya akan membantu!`;
  }
}

export default new GeminiService(); 