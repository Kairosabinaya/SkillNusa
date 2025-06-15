import { GoogleGenAI } from '@google/genai';

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
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      this.modelName = "gemini-2.5-flash-preview-05-20";
      this.isAvailable = true;
      console.log('✅ GeminiService: Successfully initialized with', this.modelName);
      console.log('🌐 GeminiService: Ready to handle AI requests');
    } catch (error) {
      console.error('❌ GeminiService: Failed to initialize:', error);
      this.isAvailable = false;
    }
    
    // Enhanced system prompts with proper context and conversation flow
    this.systemPrompts = {
      main: `You are SkillBot, an AI assistant on a freelancer marketplace app called SkillNusa. Your job is to help customers find suitable freelancers based on their project needs.

You should:
- Greet the user personally if their name is available.
- Ask what kind of project they need help with (e.g., website, logo, mobile app).
- Understand their intent clearly before giving recommendations.
- Show up to 3 relevant freelancer gigs, sorted by best match.
- If user input is unclear, ask follow-up questions.
- Use friendly, helpful tone in Bahasa Indonesia.

Always respond in Bahasa Indonesia unless the user uses English.

Context:
- SkillNusa offers freelance services such as web development, mobile apps, graphic design, writing, etc.
- Gigs include title, price, duration, rating, and a short description.

IMPORTANT RULES:
- ONLY recommend services available on SkillNusa platform
- NEVER mention other platforms like Fiverr, Upwork, Freelancer.com, etc.
- If user asks about other platforms, redirect to SkillNusa: "Di SkillNusa ada banyak freelancer berkualitas dengan harga terjangkau!"
- Focus on understanding project requirements first before recommending gigs
- Keep responses conversational and helpful (2-3 sentences max)
- Ask clarifying questions if project needs are unclear

Conversation Flow:
1. Greet user warmly and ask about their project
2. Listen to their requirements and ask follow-up questions if needed
3. Once you understand their needs, recommend relevant gigs
4. Provide helpful information about recommended services
5. Assist with any additional questions about the gigs or platform`,

      welcome: `You are SkillBot, an AI assistant on a freelancer marketplace app called SkillNusa. Your job is to help customers find suitable freelancers based on their project needs.

Create a warm, personal welcome message that:
- Greets the user by name if available
- Introduces yourself as SkillBot from SkillNusa
- Asks what kind of project they need help with
- Keep it friendly and conversational (max 2 sentences)
- Use Bahasa Indonesia

Example: "Hai [Name]! Saya SkillBot dari SkillNusa, siap bantu cari freelancer terbaik untuk project kamu. Ada project apa yang lagi direncanakan?"`,

      gigAnalysis: `You are SkillBot helping users understand specific gig offerings on SkillNusa platform.

CONTEXT: User is viewing a specific gig and may have questions about it.

GUIDELINES:
- Answer questions directly and helpfully
- Focus on the gig's value proposition
- Explain pricing, timeline, and deliverables clearly
- Suggest next steps if appropriate
- Keep responses concise (max 3-4 sentences)
- Use friendly, conversational Bahasa Indonesia
- NEVER mention other platforms or competitors

If user asks about the gig, provide helpful insights about quality, pricing, timeline, or what to expect.`
    };
  }

  // Check if the service is available
  isServiceAvailable() {
    return this.isAvailable && this.ai;
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
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });
      const text = response.text;
      
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
    if (!this.ai) return this.getFallbackProjectAnalysis();

    try {
      const conversationContext = conversationHistory.length > 0 
        ? `\n\nPercakapan sebelumnya:\n${conversationHistory.slice(-2).map(msg => `${msg.sender}: ${msg.content}`).join('\n')}`
        : '';

      const prompt = `${this.systemPrompts.main}

User bilang: "${userMessage}"${conversationContext}

INGAT: Kamu adalah SkillBot dari platform SkillNusa. JANGAN menyebutkan platform lain seperti Upwork, Fiverr, dll.

Analisis projectnya secara SINGKAT dan tanya 1-2 hal yang paling penting aja untuk carikan freelancer di SkillNusa. Maksimal 3 kalimat.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error('Error analyzing project requirements:', error);
      return this.getFallbackProjectAnalysis();
    }
  }

  // Recommend gigs based on project requirements
  async recommendGigs(projectRequirements, availableGigs = []) {
    if (!this.ai) return this.getFallbackGigRecommendation();

    try {
      const gigsContext = availableGigs.length > 0 
        ? `\n\nGigs tersedia:\n${availableGigs.slice(0, 5).map(gig => 
            `- ${gig.title} (Rp ${gig.packages?.basic?.price?.toLocaleString('id-ID')})`
          ).join('\n')}`
        : '\n\nBelum ada gigs tersedia.';

      const prompt = `${this.systemPrompts.main}

Project: ${projectRequirements}${gigsContext}

INGAT: Kamu adalah SkillBot dari platform SkillNusa. JANGAN menyebutkan platform lain.

${availableGigs.length > 0 ? 
  'Rekomendasikan 2-3 gigs terbaik yang tersedia di SkillNusa secara SINGKAT. Fokus pada yang paling relevan aja. Maksimal 4 kalimat.' :
  'Belum ada gigs yang cocok di SkillNusa untuk kebutuhan ini. Sampaikan dengan ramah bahwa belum ada layanan yang sesuai, dan sarankan user untuk cek lagi nanti atau sesuaikan kebutuhan. Maksimal 3 kalimat.'
}`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });
      return response.text;
    } catch (error) {
      console.error('Error recommending gigs:', error);
      return this.getFallbackGigRecommendation();
    }
  }

  // Analyze specific gig for user
  async analyzeGig(gigData, userQuery = '') {
    if (!this.ai) return this.getFallbackGigAnalysis(gigData);

    try {
      const gigInfo = `
Title: ${gigData.title}
Category: ${gigData.category}
Basic Package: Rp ${gigData.packages?.basic?.price?.toLocaleString('id-ID')} - ${gigData.packages?.basic?.deliveryTime} days - ${gigData.packages?.basic?.description || 'Basic service'}
Standard Package: Rp ${gigData.packages?.standard?.price?.toLocaleString('id-ID')} - ${gigData.packages?.standard?.deliveryTime} days - ${gigData.packages?.standard?.description || 'Standard service'}
Premium Package: Rp ${gigData.packages?.premium?.price?.toLocaleString('id-ID')} - ${gigData.packages?.premium?.deliveryTime} days - ${gigData.packages?.premium?.description || 'Premium service'}
Rating: ${gigData.rating ? `${gigData.rating}/5 (${gigData.reviewCount || 0} reviews)` : 'Belum ada rating'}
Freelancer: ${gigData.freelancerName || 'N/A'}`;

      const userContext = userQuery ? `\n\nUser question: "${userQuery}"` : '';

      const prompt = `${this.systemPrompts.gigAnalysis}

Gig Information:${gigInfo}${userContext}

${userQuery ? 
        `Answer the user's question about this gig. Be specific and helpful. Focus on what they asked about.` : 
        `Provide a brief, helpful analysis of this gig. Mention what makes it good value and ask if they want to know anything specific about it.`}

Keep your response conversational and in Bahasa Indonesia (2-3 sentences max).

Response:`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });
      return response.text;
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
        const { 
          conversationHistory = [], 
          currentGig = null, 
          availableGigs = [], 
          userName = '',
          userId = ''
        } = context;
        
        // Build conversation context with proper formatting
        let conversationContext = '';
        if (conversationHistory.length > 0) {
          // Include more context for better understanding (last 6 messages)
          const recentMessages = conversationHistory.slice(-6);
          conversationContext = '\n\nPrevious conversation:\n' + 
            recentMessages.map(msg => 
              `${msg.senderId === 'skillbot' ? 'SkillBot' : 'User'}: ${msg.content}`
            ).join('\n');
        }

        // Add user context if available
        let userContext = '';
        if (userName) {
          userContext = `\n\nUser: ${userName}`;
        }

        // Add available gigs context if relevant
        let gigsContext = '';
        if (availableGigs && availableGigs.length > 0) {
          gigsContext = '\n\nAvailable gigs on SkillNusa:\n' + 
            availableGigs.slice(0, 5).map(gig => 
              `- ${gig.title} (${gig.packages?.basic?.price ? 'Rp ' + gig.packages.basic.price.toLocaleString('id-ID') : 'Price TBD'}, ${gig.packages?.basic?.deliveryTime || 'N/A'} days)`
            ).join('\n');
        }

        // Use gig-specific prompt if viewing a gig
        let systemPrompt = this.systemPrompts.main;
        if (currentGig) {
          systemPrompt = this.systemPrompts.gigAnalysis;
          userContext += `\n\nCurrently viewing gig: "${currentGig.title}"`;
        }

        const prompt = `${systemPrompt}${userContext}${conversationContext}${gigsContext}

User message: "${userMessage}"

Instructions:
- Respond in Bahasa Indonesia (unless user uses English)
- Be helpful, friendly, and conversational
- Focus on understanding their project need first
- If you have relevant gigs available, mention them naturally
- Keep response concise (2-3 sentences max)
- Ask follow-up questions if project requirements are unclear

Response:`;

        console.log('[GeminiService] Sending request to Gemini API...');
        console.log('[GeminiService] Prompt length:', prompt.length, 'chars');
        console.log('[GeminiService] Estimated tokens:', Math.ceil(prompt.length / 4));
        
        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt
        });
        const text = response.text;
        
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