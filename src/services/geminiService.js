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
      welcome: `Kamu adalah SkillBot, asisten AI yang ramah dan membantu klien mencari freelancer di platform SkillNusa. 

Personality: Casual, ramah, dan ringkas. Hindari teks terlalu panjang.

Tugas utama:
1. Sambut user dengan singkat dan hangat
2. Tanya apa yang bisa dibantu
3. Berikan respons yang to-the-point

Gunakan bahasa Indonesia yang natural dan tidak formal.`,

      projectAnalysis: `Kamu adalah SkillBot, AI assistant yang membantu analisis project dan rekomendasi freelancer.

PENTING: 
- Berikan respons SINGKAT dan CONVERSATIONAL 
- Maksimal 2-3 kalimat per poin
- Hindari format panjang seperti daftar bertingkat
- Fokus pada 1-2 hal paling penting saja
- Tanya balik jika perlu info lebih lanjut

Gaya bicara: Casual, ramah, seperti ngobrol dengan teman.`,

      gigAnalysis: `Kamu adalah SkillBot yang membantu analisis gigs.

PENTING:
- Respons SINGKAT dan LANGSUNG
- Fokus pada hal yang paling relevan dengan pertanyaan user
- Maksimal 3-4 kalimat
- Hindari analisis yang terlalu detail
- Gunakan bahasa conversational

Jika user tanya hal spesifik, jawab langsung tanpa basa-basi panjang.`
    };
  }

  // Check if the service is available
  isServiceAvailable() {
    return this.isAvailable && this.model;
  }

  // Generate welcome message for new users
  async generateWelcomeMessage(userName) {
    console.log('🤖 GeminiService: generateWelcomeMessage called for:', userName);
    
    if (!this.isServiceAvailable()) {
      console.log('🤖 GeminiService: Service not available, using fallback');
      return this.getFallbackWelcomeMessage(userName);
    }

    try {
      const prompt = `${this.systemPrompts.welcome}

Buat welcome message singkat untuk user bernama ${userName}. 

PENTING: 
- Maksimal 2 kalimat 
- Langsung tanya ada project apa
- Casual dan ramah
- Jangan berlebihan dengan emoji`;

      console.log('🤖 GeminiService: Sending welcome message request to Gemini API...');
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

Analisis projectnya secara SINGKAT dan tanya 1-2 hal yang paling penting aja. Maksimal 3 kalimat.`;

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

Rekomendasikan 2-3 gigs terbaik secara SINGKAT. Fokus pada yang paling relevan aja. Maksimal 4 kalimat.`;

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
    console.log('🤖 GeminiService: generateResponse called');
    console.log('🤖 GeminiService: User message:', userMessage);
    console.log('🤖 GeminiService: Context keys:', Object.keys(context));
    
    if (!this.isServiceAvailable()) {
      console.log('🤖 GeminiService: Service not available, using fallback');
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
          contextInfo += `\n\nPercakapan terakhir:\n${conversationHistory.slice(-3).map(msg => 
            `${msg.senderId === 'skillbot' ? 'SkillBot' : 'User'}: ${msg.content}`
          ).join('\n')}`;
        }

        const prompt = `${systemPrompt}

User bilang: "${userMessage}"${contextInfo}

Balas dengan SINGKAT dan NATURAL seperti ngobrol biasa. Maksimal 2-3 kalimat. Hindari format daftar atau analisis panjang.`;

        console.log(`🤖 GeminiService: Sending request to Gemini API (attempt ${attempt}/${maxRetries})...`);
        
        // Add timeout and connection handling
        const result = await Promise.race([
          this.model.generateContent(prompt),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
          )
        ]);
        
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ GeminiService: Successfully generated response');
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
    return `Hai ${userName}! 👋 Saya SkillBot, siap bantu cari freelancer terbaik buat project kamu. Ada project apa yang lagi direncanakan?`;
  }

  getFallbackProjectAnalysis() {
    return `Oke, lagi butuh bantuan analisis project ya? Cerita aja detail projectnya, nanti saya bantu cariin freelancer yang cocok! 😊`;
  }

  getFallbackGigRecommendation() {
    return `Lagi nyari gigs yang pas ya? Coba kasih tau kebutuhan projectnya lebih detail, biar saya bisa rekomendasi yang tepat!`;
  }

  getFallbackGigAnalysis(gigData) {
    if (gigData?.title) {
      return `Gig "${gigData.title}" ini terlihat menarik! Harga mulai dari Rp ${gigData?.packages?.basic?.price?.toLocaleString('id-ID') || '???'}. Ada yang mau ditanyakan tentang layanan ini?`;
    }
    return `Layanan ini cukup bagus kok. Ada pertanyaan spesifik yang mau ditanyakan?`;
  }

  getFallbackResponse() {
    return `Hmm, lagi ada gangguan teknis nih. Coba tanya lagi ya, atau kasih tau apa yang bisa saya bantu! 😅`;
  }
}

export default new GeminiService(); 