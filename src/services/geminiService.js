import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    console.log('[GeminiService] Initializing...');
    console.log('[GeminiService] API Key exists:', !!this.apiKey);
    console.log('[GeminiService] API Key length:', this.apiKey ? this.apiKey.length : 0);
    
    if (!this.apiKey) {
      console.warn('❌ Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env file');
      console.warn('📝 To get a Gemini API key:');
      console.warn('   1. Go to https://makersuite.google.com/app/apikey');
      console.warn('   2. Create a new API key');
      console.warn('   3. Create a .env file in your project root');
      console.warn('   4. Add REACT_APP_GEMINI_API_KEY=your-key-here to the .env file');
      console.warn('   5. Restart the development server (npm start)');
      console.warn('📁 Make sure the .env file is in the same directory as package.json');
      this.isAvailable = false;
      return;
    }
    
    // Validate API key format (basic check)
    if (this.apiKey.length < 30) {
      console.warn('⚠️ API key seems too short. Please verify your REACT_APP_GEMINI_API_KEY');
      this.isAvailable = false;
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      this.isAvailable = true;
      console.log('✅ GeminiService: Successfully initialized with gemini-1.5-flash model');
      console.log('🌐 GeminiService: Ready to handle AI requests');
    } catch (error) {
      console.error('❌ GeminiService: Failed to initialize:', error);
      this.isAvailable = false;
    }
    
    // System prompts for different contexts
    this.systemPrompts = {
      welcome: `Kamu adalah SkillBot, asisten AI yang HANYA membantu klien mencari freelancer di platform SkillNusa. 

ATURAN PENTING:
- HANYA rekomendasikan layanan yang tersedia di platform SkillNusa
- JANGAN PERNAH menyebutkan aplikasi, platform, atau layanan lain seperti Fiverr, Upwork, Freelancer.com, dsb
- Jika user tanya tentang platform lain, alihkan ke SkillNusa
- Fokus pada layanan freelancer yang ada di SkillNusa saja

Personality: Casual, ramah, dan ringkas. Hindari teks terlalu panjang.

Tugas utama:
1. Sambut user dengan singkat dan hangat
2. Tanya apa yang bisa dibantu
3. Berikan respons yang to-the-point
4. Promosikan layanan SkillNusa

Gunakan bahasa Indonesia yang natural dan tidak formal.`,

      projectAnalysis: `Kamu adalah SkillBot, AI assistant yang membantu analisis project dan rekomendasi freelancer di platform SkillNusa.

ATURAN PENTING:
- HANYA rekomendasikan freelancer dan layanan yang tersedia di platform SkillNusa
- JANGAN PERNAH menyebutkan atau menyarankan platform lain (Fiverr, Upwork, Freelancer.com, dsb)
- Jika tidak ada gigs yang sesuai, KATAKAN DENGAN JELAS bahwa belum ada layanan yang cocok di SkillNusa
- Jika user bertanya tentang platform lain, alihkan ke SkillNusa: "Di SkillNusa ada banyak freelancer berkualitas, yuk cari yang cocok!"
- Fokus pada analisis kebutuhan project dan carikan solusi dari SkillNusa

ALUR CONVERSATION YANG BENAR:
1. WAJIB tanya PROJECT/LAYANAN APA yang dibutuhkan user terlebih dahulu
2. BARU setelah tau projectnya, tanya detail seperti budget/timeline jika perlu
3. JANGAN langsung tanya budget/timeline kalau belum tau projectnya apa

RESPONS GUIDELINES:
- Berikan respons SINGKAT dan CONVERSATIONAL 
- Maksimal 2-3 kalimat per poin
- Hindari format panjang seperti daftar bertingkat
- Fokus pada 1-2 hal paling penting saja
- WAJIB tanya PROJECT DULU sebelum detail lain
- Kalau user udah kasih info project, baru boleh tanya detail atau langsung carikan gigs
- Tanya balik HANYA jika benar-benar perlu info lebih lanjut

Gaya bicara: Casual, ramah, seperti ngobrol dengan teman, tapi tetap profesional tentang layanan SkillNusa.`,

      gigAnalysis: `Kamu adalah SkillBot yang membantu analisis gigs di platform SkillNusa.

ATURAN PENTING:
- HANYA bahas layanan yang ada di platform SkillNusa
- JANGAN bandingkan dengan platform lain
- JANGAN menyebutkan aplikasi atau platform lain
- Fokus pada kualitas dan value dari layanan SkillNusa

RESPONS GUIDELINES:
- Respons SINGKAT dan LANGSUNG
- Fokus pada hal yang paling relevan dengan pertanyaan user
- Maksimal 3-4 kalimat
- Hindari analisis yang terlalu detail
- Gunakan bahasa conversational

Jika user tanya hal spesifik, jawab langsung tanpa basa-basi panjang tentang layanan SkillNusa.`
    };
  }

  // Check if the service is available
  isServiceAvailable() {
    return this.isAvailable && this.model;
  }

  // Generate welcome message for new users
  async generateWelcomeMessage(userName) {
    console.log('[GeminiService] generateWelcomeMessage called for:', userName);
    
    if (!this.isServiceAvailable()) {
      console.log('[GeminiService] Service not available, using fallback');
      return this.getFallbackWelcomeMessage(userName);
    }

    try {
      const prompt = `${this.systemPrompts.welcome}

Buat welcome message singkat untuk user bernama ${userName}. 

PENTING: 
- Maksimal 2 kalimat 
- Sebutkan bahwa kamu dari SkillNusa
- Langsung tanya ada project apa
- Casual dan ramah
- Jangan berlebihan dengan emoji
- JANGAN menyebutkan platform lain`;

              console.log('[GeminiService] Sending welcome message request to Gemini API...');
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('[GeminiService] Successfully generated welcome message');
        console.log('[GeminiService] Response length:', text.length);
      return text;
    } catch (error) {
      console.error('❌ GeminiService: Error generating welcome message:', error);
      console.error('❌ GeminiService: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's an API key issue
      if (error.message && (error.message.includes('API_KEY') || error.message.includes('API key'))) {
        console.error('❌ GeminiService: API Key issue detected - please check your REACT_APP_GEMINI_API_KEY');
      }
      
      // Check if it's a quota issue
      if (error.message && error.message.includes('quota')) {
        console.error('❌ GeminiService: API quota exceeded - please check your usage limits');
      }
      
      return this.getFallbackWelcomeMessage(userName);
    }
  }

  // Analyze project requirements and ask follow-up questions
  async analyzeProjectRequirements(userMessage, conversationHistory = []) {
    if (!this.model) return this.getFallbackProjectAnalysis();

    try {
      const conversationContext = conversationHistory.length > 0 
        ? `\n\nPercakapan sebelumnya:\n${conversationHistory.slice(-2).map(msg => `${msg.sender}: ${msg.content}`).join('\n')}`
        : '';

      const prompt = `${this.systemPrompts.projectAnalysis}

User bilang: "${userMessage}"${conversationContext}

INGAT: Kamu adalah SkillBot dari platform SkillNusa. JANGAN menyebutkan platform lain seperti Upwork, Fiverr, dll.

Analisis projectnya secara SINGKAT dan tanya 1-2 hal yang paling penting aja untuk carikan freelancer di SkillNusa. Maksimal 3 kalimat.`;

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
        ? `\n\nGigs tersedia:\n${availableGigs.slice(0, 5).map(gig => 
            `- ${gig.title} (Rp ${gig.packages?.basic?.price?.toLocaleString('id-ID')})`
          ).join('\n')}`
        : '\n\nBelum ada gigs tersedia.';

      const prompt = `${this.systemPrompts.projectAnalysis}

Project: ${projectRequirements}${gigsContext}

INGAT: Kamu adalah SkillBot dari platform SkillNusa. JANGAN menyebutkan platform lain.

${availableGigs.length > 0 ? 
  'Rekomendasikan 2-3 gigs terbaik yang tersedia di SkillNusa secara SINGKAT. Fokus pada yang paling relevan aja. Maksimal 4 kalimat.' :
  'Belum ada gigs yang cocok di SkillNusa untuk kebutuhan ini. Sampaikan dengan ramah bahwa belum ada layanan yang sesuai, dan sarankan user untuk cek lagi nanti atau sesuaikan kebutuhan. Maksimal 3 kalimat.'
}`;

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
Basic: Rp ${gigData.packages?.basic?.price?.toLocaleString('id-ID')} - ${gigData.packages?.basic?.deliveryTime} hari
Standard: Rp ${gigData.packages?.standard?.price?.toLocaleString('id-ID')} - ${gigData.packages?.standard?.deliveryTime} hari  
Premium: Rp ${gigData.packages?.premium?.price?.toLocaleString('id-ID')} - ${gigData.packages?.premium?.deliveryTime} hari
Rating: ${gigData.rating || 'Belum ada rating'}
`;

      const userContext = userQuery ? `\n\nPertanyaan user: "${userQuery}"` : '';

      const prompt = `${this.systemPrompts.gigAnalysis}

Info gig: ${gigInfo}${userContext}

${userQuery ? `Jawab pertanyaan user secara SINGKAT dan LANGSUNG. Jangan berikan analisis panjang.` : `Berikan comment singkat (maksimal 2-3 kalimat) tentang gig ini. Tanya ada yang mau ditanyakan lebih lanjut?`}

INGAT: Respons maksimal 3-4 kalimat saja!`;

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
    console.log('[GeminiService] generateResponse called');
    console.log('[GeminiService] User message:', userMessage);
    console.log('[GeminiService] Context keys:', Object.keys(context));
    
    if (!this.isServiceAvailable()) {
      console.log('[GeminiService] Service not available, using fallback');
      return this.getFallbackResponse();
    }

    // Add retry logic for connection issues
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { conversationHistory = [], currentGig = null, availableGigs = [] } = context;
        
        let systemPrompt = this.systemPrompts.projectAnalysis;
        let contextInfo = '';

        if (currentGig) {
          systemPrompt = this.systemPrompts.gigAnalysis;
          contextInfo = `\n\nKontext: User sedang lihat gig "${currentGig.title}"`;
        }

        if (conversationHistory.length > 0) {
          contextInfo += `\n\nContext:\n${conversationHistory.slice(-1).map(msg => 
            `${msg.senderId === 'skillbot' ? 'Bot' : 'User'}: ${msg.content.slice(0, 100)}`
          ).join('\n')}`;
        }

        const prompt = `Kamu SkillBot dari SkillNusa. User: "${userMessage}"${contextInfo}

ATURAN:
- Jangan sebut platform lain (Upwork, Fiverr, dll)
- Tanya project apa dulu sebelum detail lain
- Kalau udah tau project, baru carikan/tanya detail
- Respons 2-3 kalimat, casual, friendly
- Fokus layanan SkillNusa

Jawab singkat & helpful!`;

        console.log('[GeminiService] Sending request to Gemini API...');
        console.log('[GeminiService] Prompt length:', prompt.length, 'chars');
        console.log('[GeminiService] Estimated tokens:', Math.ceil(prompt.length / 4));
        
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('[GeminiService] Successfully generated response');
        console.log('[GeminiService] Response length:', text.length);
        return text;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ GeminiService: Error on attempt ${attempt}/${maxRetries}:`, error);
        
        // Check for specific error types
        if (error.message) {
          if (error.message.includes('API_KEY') || error.message.includes('API key')) {
            console.error('❌ API Key Error: Please check REACT_APP_GEMINI_API_KEY environment variable');
            break; // Don't retry for API key errors
          } else if (error.message.includes('quota') || error.message.includes('limit')) {
            console.error('❌ Quota Error: API usage limit exceeded');
            break; // Don't retry for quota errors
          } else if (error.message.includes('blocked')) {
            console.error('❌ Content Policy Error: Message may have been blocked by content policy');
            break; // Don't retry for content policy errors
          } else if (error.message.includes('ERR_CONNECTION_CLOSED') || 
                     error.message.includes('Failed to fetch') ||
                     error.message.includes('network') ||
                     error.message.includes('timeout')) {
            console.error(`❌ Network Error (attempt ${attempt}): Connection issue, will retry...`);
            
            if (attempt < maxRetries) {
              // Wait before retrying (exponential backoff)
              const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.log(`⏳ Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else {
            console.error('❌ Unknown API Error:', error.message);
          }
        }
        
        // If this is the last attempt, break out of retry loop
        if (attempt === maxRetries) {
          break;
        }
      }
    }
    
    console.error('❌ All retry attempts failed, using fallback response');
    return this.getFallbackResponse();
  }

  // Fallback messages when API is not available
  getFallbackWelcomeMessage(userName) {
    return `Hai ${userName}! Saya SkillBot dari SkillNusa, siap bantu cari freelancer terbaik di platform kami buat project kamu. Ada project apa yang lagi direncanakan?`;
  }

  getFallbackProjectAnalysis() {
    return `Oke, lagi butuh bantuan analisis project ya? Cerita aja detail projectnya, nanti saya bantu cariin freelancer yang cocok di SkillNusa!`;
  }

  getFallbackGigRecommendation() {
    return `Lagi nyari gigs yang pas di SkillNusa ya? Coba kasih tau kebutuhan projectnya lebih detail, biar saya bisa rekomendasi freelancer yang tepat dari platform kami!`;
  }

  getFallbackGigAnalysis(gigData) {
    if (gigData?.title) {
      return `Gig "${gigData.title}" di SkillNusa ini terlihat menarik! Harga mulai dari Rp ${gigData?.packages?.basic?.price?.toLocaleString('id-ID') || '???'}. Ada yang mau ditanyakan tentang layanan ini?`;
    }
    return `Layanan di SkillNusa ini cukup bagus kok. Ada pertanyaan spesifik yang mau ditanyakan?`;
  }

  getFallbackResponse() {
    return `Hmm, lagi ada gangguan teknis nih. Coba tanya lagi ya, atau kasih tau apa yang bisa saya bantu cari di SkillNusa!`;
  }
}

export default new GeminiService(); 