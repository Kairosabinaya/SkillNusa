import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';
import geminiService from './geminiService';
import { getGigs, searchGigs } from './gigService';

const SKILLBOT_ID = 'skillbot';

class SkillBotService {
  // Initialize SkillBot conversation for a user
  async initializeSkillBotForUser(userId, userName) {
    try {
      // Check if user already has SkillBot conversation
      const existingConversation = await this.getSkillBotConversation(userId);
      
      if (existingConversation && existingConversation.messages.length > 0) {
        return existingConversation;
      }

      // Generate welcome message using Gemini AI
      const welcomeMessage = await geminiService.generateWelcomeMessage(userName);
      
      // Create or update SkillBot conversation
      const conversationId = `${userId}_${SKILLBOT_ID}`;
      const welcomeMessages = [
        {
          id: `welcome-${Date.now()}`,
          content: welcomeMessage,
          senderId: SKILLBOT_ID,
          createdAt: new Date(),
          messageType: 'welcome'
        }
      ];

      // Save to SkillBot conversations collection - Use setDoc to ensure document is created
      const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
      await setDoc(conversationRef, {
        id: conversationId,
        userId,
        botId: SKILLBOT_ID,
        messages: welcomeMessages,
        lastMessageTime: new Date(),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Also create/update entry in regular chats collection for notification system
      await this.createOrUpdateChatEntry(userId, welcomeMessage, true);

      return {
        id: conversationId,
        messages: welcomeMessages,
        lastMessageTime: new Date()
      };
    } catch (error) {
      console.error('Error initializing SkillBot for user:', error);
      throw error;
    }
  }

  // Create or update SkillBot entry in regular chats collection for notifications
  async createOrUpdateChatEntry(userId, lastMessage = '', incrementUnread = true) {
    try {
      const chatId = `${userId}_${SKILLBOT_ID}`;
      const chatRef = doc(db, 'chats', chatId);
      
      const chatDoc = await getDoc(chatRef);
      
      const chatData = {
        id: chatId,
        participants: [userId, SKILLBOT_ID],
        participantDetails: {
          [userId]: {
            displayName: 'User',
            profilePhoto: null,
            role: 'client'
          },
          [SKILLBOT_ID]: {
            displayName: 'SkillBot AI',
            profilePhoto: '/images/robot.png',
            role: 'bot'
          }
        },
        lastMessage: lastMessage,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: SKILLBOT_ID,
        isActive: true,
        isSkillBot: true,
        updatedAt: serverTimestamp()
      };

      if (!chatDoc.exists()) {
        // Create new chat entry using setDoc
        await setDoc(chatRef, {
          ...chatData,
          unreadCount: {
            [userId]: incrementUnread ? 1 : 0,
            [SKILLBOT_ID]: 0
          },
          createdAt: serverTimestamp()
        });
      } else {
        // Update existing chat entry
        const existingData = chatDoc.data();
        const newUnreadCount = { ...existingData.unreadCount };
        
        if (incrementUnread) {
          newUnreadCount[userId] = (newUnreadCount[userId] || 0) + 1;
        }

        await updateDoc(chatRef, {
          lastMessage: lastMessage,
          lastMessageTime: serverTimestamp(),
          lastMessageSender: SKILLBOT_ID,
          unreadCount: newUnreadCount,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error creating/updating chat entry:', error);
      throw error; // Re-throw to handle upstream
    }
  }

  // Mark SkillBot messages as read
  async markSkillBotAsRead(userId) {
    try {
      const chatId = `${userId}_${SKILLBOT_ID}`;
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const newUnreadCount = { ...chatData.unreadCount };
        newUnreadCount[userId] = 0;

        await updateDoc(chatRef, {
          unreadCount: newUnreadCount,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create the chat document if it doesn't exist
        await this.createOrUpdateChatEntry(userId, '', false);
      }
    } catch (error) {
      console.error('Error marking SkillBot as read:', error);
      // Silently fail - this is not critical for core functionality
    }
  }

  // Get SkillBot conversation for a user
  async getSkillBotConversation(userId) {
    try {
      const conversationId = `${userId}_${SKILLBOT_ID}`;
      const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        return {
          id: conversationDoc.id,
          ...conversationDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting SkillBot conversation:', error);
      return null;
    }
  }

  // Send message to SkillBot and get AI response
  async sendMessageToSkillBot(userId, userMessage, context = {}) {
    try {
      const conversationId = `${userId}_${SKILLBOT_ID}`;
      
      // Get existing conversation
      let conversation = await this.getSkillBotConversation(userId);
      if (!conversation) {
        // Initialize if doesn't exist
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userName = userDoc.exists() ? userDoc.data().displayName : 'User';
        conversation = await this.initializeSkillBotForUser(userId, userName);
      }

      // Add user message
      const userMessageObj = {
        id: `user-${Date.now()}`,
        content: userMessage,
        senderId: userId,
        createdAt: new Date(),
        messageType: 'user'
      };

      // Get conversation history for context
      const conversationHistory = conversation.messages || [];
      
      // Generate AI response in parallel with database operations
      const aiResponsePromise = this.generateAIResponse(userMessage, conversationHistory, context);

      // Create bot response message
      const botMessageObj = {
        id: `bot-${Date.now() + 1}`,
        content: '', // Will be filled after AI response
        senderId: SKILLBOT_ID,
        createdAt: new Date(Date.now() + 1000),
        messageType: 'response'
      };

      // Wait for AI response
      const aiResponse = await aiResponsePromise;
      
      // Check if we should show gig recommendations based on conversation
      const shouldShowGigs = this.shouldShowGigRecommendations(conversationHistory, userMessage);
      console.log('🤖 SkillBot: shouldShowGigs =', shouldShowGigs, 'for message:', userMessage);
      
      // Also check if AI response mentions specific gigs (fallback detection)
      const aiResponseMentionsGigs = aiResponse && (
        aiResponse.toLowerCase().includes('rp ') || 
        aiResponse.toLowerCase().includes('hari') || 
        aiResponse.toLowerCase().includes('gig ') ||
        aiResponse.toLowerCase().includes('freelancer') ||
        aiResponse.toLowerCase().includes('skillnusa')
      );
      console.log('🤖 SkillBot: aiResponseMentionsGigs =', aiResponseMentionsGigs);
      
      if (shouldShowGigs || aiResponseMentionsGigs) {
        // Get suitable gigs and generate recommendations
        const gigs = await this.findSuitableGigs(userMessage, conversationHistory);
        console.log('🤖 SkillBot: Found gigs:', gigs.length);
        if (gigs.length > 0) {
          const gigRecommendations = await this.generateGigRecommendations(userMessage, gigs);
          console.log('🤖 SkillBot: Generated gig recommendations with', gigRecommendations.recommendedGigs?.length || 0, 'gigs');
          botMessageObj.content = gigRecommendations.content;
          botMessageObj.recommendedGigs = gigRecommendations.recommendedGigs;
          botMessageObj.messageType = 'gig_recommendations';
        } else {
          console.log('🤖 SkillBot: No gigs found, using AI response only');
          botMessageObj.content = aiResponse;
        }
      } else {
        botMessageObj.content = aiResponse;
      }

      // Update conversation in SkillBot collection with batch operation
      const updatedMessages = [...conversationHistory, userMessageObj, botMessageObj];
      
      // Use batch write for better performance
      const batch = writeBatch(db);
      
      // Update SkillBot conversation
      const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
      batch.set(conversationRef, {
        id: conversationId,
        userId,
        botId: SKILLBOT_ID,
        messages: updatedMessages,
        lastMessageTime: new Date(),
        isActive: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update chat entry for notifications
      const chatId = `${userId}_${SKILLBOT_ID}`;
      const chatRef = doc(db, 'chats', chatId);
      
      // Get current chat data to update unread count
      const chatDoc = await getDoc(chatRef);
      let newUnreadCount = { [userId]: 1, [SKILLBOT_ID]: 0 };
      
      if (chatDoc.exists()) {
        const existingData = chatDoc.data();
        newUnreadCount = { ...existingData.unreadCount };
        newUnreadCount[userId] = (newUnreadCount[userId] || 0) + 1;
      }
      
      batch.update(chatRef, {
        lastMessage: botMessageObj.content,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: SKILLBOT_ID,
        unreadCount: newUnreadCount,
        updatedAt: serverTimestamp()
      });

      // Commit batch
      await batch.commit();

      return {
        userMessage: userMessageObj,
        botResponse: botMessageObj
      };
    } catch (error) {
      console.error('Error sending message to SkillBot:', error);
      throw error;
    }
  }

  // Extract AI response generation to separate method for better performance
  async generateAIResponse(userMessage, conversationHistory, context) {
    try {
      const lowercaseMessage = userMessage.toLowerCase();
      
      // Check if user mentions other platforms
      if (this.mentionsOtherPlatforms(lowercaseMessage)) {
        return "Di SkillNusa aja, banyak freelancer berkualitas dengan harga terjangkau kok! Ada project apa yang lagi kamu butuhkan? Saya bantu carikan freelancer yang tepat 😊";
      }
      
      if (this.isProjectDiscussion(lowercaseMessage)) {
        // Project analysis and recommendation
        return await this.handleProjectDiscussion(userMessage, conversationHistory, context);
      } else if (context.currentGig) {
        // Gig-specific analysis
        return await geminiService.analyzeGig(context.currentGig, userMessage);
      } else {
        // General conversation
        return await geminiService.generateResponse(userMessage, {
          conversationHistory,
          availableGigs: context.availableGigs || []
        });
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat untuk mencari freelancer di SkillNusa.';
    }
  }

  // Handle project discussion and gig recommendations
  async handleProjectDiscussion(userMessage, conversationHistory, context) {
    try {
      const messageCount = conversationHistory.length;
      
      // If this is early in conversation, ask clarifying questions first
      if (messageCount <= 2 && !this.hasSpecificProjectRequirements(userMessage)) {
        return await this.generateClarifyingQuestions(userMessage, conversationHistory);
      }
      
      // If user has provided details or specific requirements, proceed with gig search
      const searchKeywords = this.extractSearchKeywords(userMessage);
      const relevantGigs = await this.findRelevantGigs(searchKeywords, userMessage);
      
      // Create conversation context for the AI
      const conversationContext = conversationHistory.length > 0 
        ? `\n\nPercakapan sebelumnya:\n${conversationHistory.slice(-2).map(msg => `${msg.senderId === SKILLBOT_ID ? 'SkillBot' : 'User'}: ${msg.content}`).join('\n')}`
        : '';

      // Prepare gigs context if any are found
      const gigsContext = relevantGigs.length > 0 
        ? `\n\nGigs tersedia yang relevan di SkillNusa:\n${relevantGigs.slice(0, 5).map(gig => 
            `- ${gig.title} (Rp ${gig.packages?.basic?.price?.toLocaleString('id-ID') || 'N/A'}) - ${gig.packages?.basic?.deliveryTime || 'N/A'} hari`
          ).join('\n')}`
        : '\n\nBelum ada gigs tersedia yang sesuai dengan kebutuhan ini di SkillNusa.';

      // Create a comprehensive prompt for a single API call
      const comprehensivePrompt = `${geminiService.systemPrompts.projectAnalysis}

User bilang: "${userMessage}"${conversationContext}${gigsContext}

INGAT: Kamu adalah SkillBot dari platform SkillNusa. JANGAN menyebutkan platform lain!

${relevantGigs.length > 0 ? 
  'Analisis projectnya secara SINGKAT, lalu rekomendasikan 2-3 gigs terbaik yang tersedia di SkillNusa yang paling relevan. Fokus pada yang paling cocok saja. Maksimal 4 kalimat total.' :
  'Sampaikan dengan ramah bahwa belum ada layanan yang cocok untuk kebutuhan ini di SkillNusa saat ini. Sarankan untuk cek lagi nanti atau mungkin sesuaikan kebutuhannya. Jangan menyebutkan platform lain. Maksimal 3 kalimat.'
}`;

      // Make a single API call to get comprehensive response
      const result = await geminiService.model.generateContent(comprehensivePrompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error('Error handling project discussion:', error);
      return this.getFallbackProjectAnalysis();
    }
  }

  // Extract search keywords from user message
  extractSearchKeywords(message) {
    const keywords = [];
    const lowercaseMessage = message.toLowerCase();
    
    // Common service categories
    const serviceKeywords = {
      'web': ['website', 'web', 'landing page', 'situs'],
      'mobile': ['aplikasi', 'app', 'mobile', 'android', 'ios'],
      'design': ['desain', 'design', 'logo', 'grafis', 'ui', 'ux'],
      'marketing': ['marketing', 'seo', 'social media', 'iklan'],
      'content': ['konten', 'content', 'artikel', 'blog', 'copywriting'],
      'video': ['video', 'editing', 'animasi', 'motion'],
      'photography': ['foto', 'photography', 'product photo']
    };

    Object.entries(serviceKeywords).forEach(([category, terms]) => {
      if (terms.some(term => lowercaseMessage.includes(term))) {
        keywords.push(category);
      }
    });

    return keywords;
  }

  // Find relevant gigs based on user requirements
  async findRelevantGigs(keywords, userMessage) {
    try {
      let relevantGigs = [];
      
      // Search by keywords first
      if (keywords.length > 0) {
        for (const keyword of keywords) {
          const gigs = await searchGigs(keyword, {}, { limit: 10 });
          relevantGigs = [...relevantGigs, ...gigs];
        }
      }
      
      // If no results from keywords, try broader search
      if (relevantGigs.length === 0) {
        const generalGigs = await getGigs({}, { limit: 20 });
        relevantGigs = generalGigs;
      }
      
      // Remove duplicates
      const uniqueGigs = relevantGigs.filter((gig, index, self) => 
        index === self.findIndex(g => g.id === gig.id)
      );
      
      // Sort by relevance (rating, active status)
      return uniqueGigs
        .filter(gig => gig.isActive)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 10);
    } catch (error) {
      console.error('Error finding relevant gigs:', error);
      return [];
    }
  }

  // Check if message mentions other platforms
  mentionsOtherPlatforms(message) {
    const otherPlatforms = [
      'upwork', 'fiverr', 'freelancer.com', 'projects.co.id', '99designs',
      'guru.com', 'toptal', 'peopleperhour', 'workana', 'freelance'
    ];
    
    const lowercaseMessage = message.toLowerCase();
    return otherPlatforms.some(platform => lowercaseMessage.includes(platform));
  }

  // Check if message is about project discussion
  isProjectDiscussion(message) {
    const projectKeywords = [
      'project', 'proyek', 'butuh', 'ingin', 'mau', 'bikin', 'buat',
      'develop', 'design', 'website', 'aplikasi', 'app', 'sistem',
      'platform', 'landing page', 'e-commerce', 'toko online'
    ];
    
    return projectKeywords.some(keyword => message.includes(keyword));
  }

  // Check if we should show gig recommendations
  shouldShowGigRecommendations(conversationHistory, userMessage) {
    // Show gig recommendations ONLY when user has provided CLEAR project details
    // Don't show gigs just because they mentioned general keywords
    
    const messageCount = conversationHistory.length;
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Check if user provides very specific project requirements
    const hasSpecificRequirements = this.hasSpecificProjectRequirements(userMessage);
    
    // Check if user has explicitly described their project needs
    const hasExplicitProjectDescription = this.hasExplicitProjectDescription(userMessage, conversationHistory);
    
    // Check if SkillBot has asked about project type and user has responded
    const hasAskedAboutProject = conversationHistory.some(msg => 
      msg.senderId === SKILLBOT_ID && 
      (msg.content.toLowerCase().includes('project apa') || 
       msg.content.toLowerCase().includes('layanan apa') ||
       msg.content.toLowerCase().includes('butuh apa') ||
       msg.content.toLowerCase().includes('butuhkan apa'))
    );
    
    const hasRespondedToProjectQuestion = hasAskedAboutProject && 
      conversationHistory.slice(-2).some(msg => 
        msg.senderId !== SKILLBOT_ID && 
        (msg.content.toLowerCase().includes('website') ||
         msg.content.toLowerCase().includes('aplikasi') ||
         msg.content.toLowerCase().includes('design') ||
         msg.content.toLowerCase().includes('app') ||
         msg.content.toLowerCase().includes('mobile') ||
         msg.content.toLowerCase().includes('content') ||
         msg.content.toLowerCase().includes('blog') ||
         msg.content.toLowerCase().includes('logo') ||
         msg.content.toLowerCase().includes('video') ||
         msg.content.toLowerCase().includes('marketing'))
      );
    
    // Special case: if user is very early but has explicit project description, allow it
    if (hasExplicitProjectDescription || hasSpecificRequirements) {
      return true;
    }
    
    // For other cases, need more conversation context
    if (messageCount <= 2) return false;
    
    // Show recommendations if user has responded to project question
    return hasRespondedToProjectQuestion;
  }

  // Check if user has explicitly described their project 
  hasExplicitProjectDescription(userMessage, conversationHistory) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Look for explicit project descriptions like:
    // "saya mau bikin website e-commerce", "butuh aplikasi mobile untuk bisnis", etc.
    const explicitPatterns = [
      /saya (mau|ingin|butuh|perlu) (bikin|buat|develop|design).+(website|aplikasi|app|mobile|design|logo|video|content|blog|marketing)/,
      /butuh.+(website|aplikasi|app|mobile|design|logo|video|content|blog|marketing).+(untuk|buat|dengan)/,
      /mau (bikin|buat).+(website|aplikasi|app|mobile|toko online|e-commerce|landing page)/,
      /project.+(website|aplikasi|app|mobile|design|logo|video|content|blog|marketing)/,
      /develop.+(website|aplikasi|app|mobile|sistem|platform)/
    ];
    
    return explicitPatterns.some(pattern => pattern.test(lowerMessage));
  }

  // Check if user message contains specific project requirements
  hasSpecificProjectRequirements(message) {
    const specificKeywords = [
      'budget', 'rp', 'ribu', 'juta', 'rupiah',
      'deadline', 'minggu', 'bulan', 'hari',
      'fitur', 'feature', 'fungsi', 'halaman',
      'responsive', 'mobile', 'admin panel',
      'database', 'payment', 'pembayaran'
    ];
    
    const lowerMessage = message.toLowerCase();
    const hasSpecificKeywords = specificKeywords.filter(keyword => 
      lowerMessage.includes(keyword)
    ).length >= 2; // Need at least 2 specific keywords
    
    return hasSpecificKeywords;
  }

  // Generate clarifying questions based on user's initial project description
  async generateClarifyingQuestions(userMessage, conversationHistory) {
    try {
      const lowerMessage = userMessage.toLowerCase();
      
      // If user asks about "gig apa yang cocok" but hasn't mentioned specific project
      if ((lowerMessage.includes('gig apa') || lowerMessage.includes('cocok untuk project')) && 
          !this.hasProjectTypeInMessage(userMessage)) {
        return "Project apa yang lagi kamu butuhkan? Website, aplikasi mobile, design, atau yang lain?";
      }
      
      // If user mentions project but vague, ask for more specific type
      if (lowerMessage.includes('project') && !this.hasProjectTypeInMessage(userMessage)) {
        return "Menarik! Project seperti apa yang kamu rencanakan? Bisa kasih tau lebih detail?";
      }
      
      // If user has mentioned project type, then can ask for details
      const projectType = this.detectProjectType(userMessage);
      
      const typeSpecificQuestions = {
        'website': [
          "Website seperti apa yang kamu butuhkan? Company profile, e-commerce, atau blog?",
          "Ada fitur khusus yang diperlukan untuk website ini?"
        ],
        'mobile': [
          "Aplikasi mobile untuk platform apa? Android, iOS, atau keduanya?", 
          "Aplikasi ini untuk keperluan bisnis atau personal?"
        ],
        'design': [
          "Design apa yang kamu butuhkan? Logo, banner, atau design produk?",
          "Ada style tertentu yang kamu inginkan?"
        ],
        'content': [
          "Content untuk platform apa? Blog, social media, atau website?",
          "Berapa banyak content yang kamu butuhkan?"
        ],
        'general': [
          "Bisa cerita lebih detail tentang layanan yang kamu butuhkan?",
          "Project apa yang sedang kamu rencanakan?"
        ]
      };
      
      const questions = typeSpecificQuestions[projectType] || typeSpecificQuestions['general'];
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      return randomQuestion;
      
    } catch (error) {
      console.error('Error generating clarifying questions:', error);
      return "Project apa yang lagi kamu butuhkan? Bisa kasih tau lebih detail? 😊";
    }
  }

  // Check if message contains specific project type
  hasProjectTypeInMessage(message) {
    const lowerMessage = message.toLowerCase();
    const projectTypes = [
      'website', 'web', 'landing page', 'company profile', 'e-commerce', 'toko online',
      'aplikasi', 'app', 'mobile', 'android', 'ios',
      'design', 'logo', 'banner', 'grafis', 'poster',
      'content', 'artikel', 'blog', 'copywriting',
      'video', 'editing', 'animation', 'motion',
      'marketing', 'sosmed', 'social media', 'digital marketing',
      'testing', 'qa', 'quality assurance'
    ];
    
    return projectTypes.some(type => lowerMessage.includes(type));
  }

  // Detect project type from user message
  detectProjectType(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('website') || lowerMessage.includes('web') || lowerMessage.includes('landing page')) {
      return 'website';
    } else if (lowerMessage.includes('aplikasi') || lowerMessage.includes('app') || lowerMessage.includes('mobile')) {
      return 'mobile';
    } else if (lowerMessage.includes('design') || lowerMessage.includes('logo') || lowerMessage.includes('grafis')) {
      return 'design';
    } else if (lowerMessage.includes('content') || lowerMessage.includes('artikel') || lowerMessage.includes('blog')) {
      return 'content';
    } else {
      return 'general';
    }
  }

  // Find suitable gigs based on user requirements
  async findSuitableGigs(userMessage, conversationHistory) {
    try {
      // Import gigService here to avoid circular dependency
      const { searchGigs } = await import('./gigService');
      
      // Extract keywords from user message and conversation
      const allMessages = conversationHistory.concat([{ content: userMessage }]);
      const fullContext = allMessages.map(msg => msg.content).join(' ');
      
      // Simple keyword matching for gig categories
      const categoryMapping = {
        'website': ['Web Development', 'UI/UX Design'],
        'web': ['Web Development', 'UI/UX Design'],
        'app': ['Mobile Development', 'UI/UX Design'],
        'aplikasi': ['Mobile Development', 'Web Development'],
        'mobile': ['Mobile Development'],
        'design': ['UI/UX Design', 'Graphic Design'],
        'logo': ['Graphic Design', 'Brand Design'],
        'video': ['Video Editing', 'Animation'],
        'editing': ['Video Editing', 'Content Writing'],
        'content': ['Content Writing', 'Digital Marketing'],
        'artikel': ['Content Writing'],
        'blog': ['Content Writing'],
        'marketing': ['Digital Marketing', 'Content Writing'],
        'sosmed': ['Digital Marketing', 'Graphic Design'],
        'social media': ['Digital Marketing', 'Graphic Design'],
        'e-commerce': ['Web Development', 'Digital Marketing'],
        'toko online': ['Web Development', 'Digital Marketing'],
        'testing': ['Mobile Development', 'Web Development', 'Quality Assurance'],
        'test': ['Mobile Development', 'Web Development', 'Quality Assurance'],
        'qa': ['Quality Assurance', 'Mobile Development'],
        'bug': ['Quality Assurance', 'Web Development'],
        'debug': ['Quality Assurance', 'Web Development', 'Mobile Development']
      };
      
      let searchCategories = [];
      Object.keys(categoryMapping).forEach(keyword => {
        if (fullContext.toLowerCase().includes(keyword)) {
          searchCategories.push(...categoryMapping[keyword]);
        }
      });
      
      // Remove duplicates
      searchCategories = [...new Set(searchCategories)];
      
      // If no specific categories found, try keyword-based search first
      if (searchCategories.length === 0) {
        // Try searching with keywords from the message
        const searchWords = userMessage.toLowerCase().split(' ').filter(word => word.length > 2);
        for (const word of searchWords) {
          try {
            const keywordGigs = await searchGigs(word, '', 'popular', 3);
            if (keywordGigs && keywordGigs.length > 0) {
              return keywordGigs.slice(0, 5);
            }
          } catch (error) {
            console.log(`No gigs found for keyword: ${word}`);
          }
        }
        
        // Fallback to popular gigs
        const popularGigs = await searchGigs('', '', 'popular', 5);
        return popularGigs || [];
      }
      
      // Search for gigs in relevant categories
      let foundGigs = [];
      for (const category of searchCategories) {
        const categoryGigs = await searchGigs('', category, 'popular', 3);
        if (categoryGigs) {
          foundGigs.push(...categoryGigs);
        }
      }
      
      // Remove duplicates and limit to 5
      const uniqueGigs = foundGigs.filter((gig, index, self) => 
        index === self.findIndex(g => g.id === gig.id)
      );
      
      return uniqueGigs.slice(0, 5);
    } catch (error) {
      console.error('Error finding suitable gigs:', error);
      return [];
    }
  }

  // Generate gig recommendations with action buttons
  async generateGigRecommendations(userRequirements, gigs) {
    try {
              // Generate shorter, more focused recommendations with actual gig data
        const gigSummaries = gigs.map(gig => 
          `${gig.title} - ${gig.packages?.basic?.price ? `Rp ${gig.packages.basic.price.toLocaleString('id-ID')}` : 'Mulai dari Rp 100k'} (⭐ ${gig.averageRating || gig.rating || 0})`
        ).join('\n');
      
      const recommendationText = `Nih, saya nemuin beberapa freelancer yang cocok buat kebutuhan kamu:\n\n${gigSummaries}\n\nTinggal pilih yang mana nih? 😊`;
      
              // Format with action buttons
        const formattedRecommendations = {
          content: recommendationText,
          recommendedGigs: gigs.map(gig => ({
            id: gig.id,
            title: gig.title,
            category: gig.category,
            price: gig.packages?.basic?.price || 100000,
            rating: gig.averageRating || gig.rating || 4.8,
            deliveryTime: gig.packages?.basic?.deliveryTime || 7,
            freelancer: gig.freelancer,
            freelancerId: gig.freelancerId || gig.freelancer?.uid, // Add freelancerId
            image: gig.images?.[0] || gig.image,
            description: gig.description,
            tags: gig.tags,
            reviewCount: gig.reviewCount || 0
          })),
        actionButtons: [
          {
            type: 'view_details',
            label: 'Lihat Detail',
            action: 'view_details'
          },
          {
            type: 'add_to_favorites',
            label: 'Favorit',
            action: 'add_to_favorites'
          },
          {
            type: 'add_to_cart',
            label: 'Tambah ke Keranjang',
            action: 'add_to_cart'
          }
        ]
      };
      
      return formattedRecommendations;
    } catch (error) {
      console.error('Error generating gig recommendations:', error);
      return {
        content: 'Maaf, terjadi kesalahan saat mencari rekomendasi. Coba ceritain kebutuhan project kamu lagi ya!',
        recommendedGigs: [],
        actionButtons: []
      };
    }
  }

  // Mark user as having interacted with SkillBot
  async markUserAsSkillBotInteracted(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        hasInteractedWithSkillBot: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking user as SkillBot interacted:', error);
    }
  }

  // Check if user needs SkillBot welcome message
  async checkIfUserNeedsWelcome(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      return !userData.hasInteractedWithSkillBot;
    } catch (error) {
      console.error('Error checking if user needs welcome:', error);
      return false;
    }
  }

  // Auto-send welcome message for new users
  async autoSendWelcomeMessage(userId, userName) {
    try {
      const needsWelcome = await this.checkIfUserNeedsWelcome(userId);
      
      if (needsWelcome) {
        await this.initializeSkillBotForUser(userId, userName);
        await this.markUserAsSkillBotInteracted(userId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error auto-sending welcome message:', error);
      return false;
    }
  }

  // Subscribe to SkillBot unread count (real-time)
  subscribeToSkillBotUnreadCount(userId, callback) {
    try {
      const chatId = `${userId}_${SKILLBOT_ID}`;
      const chatRef = doc(db, 'chats', chatId);
      
      const unsubscribe = onSnapshot(chatRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const chatData = docSnapshot.data();
          const unreadCount = chatData.unreadCount?.[userId] || 0;
          callback(unreadCount);
        } else {
          callback(0);
        }
      }, (error) => {
        console.error('Error in SkillBot unread count subscription:', error);
        callback(0);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up SkillBot unread count subscription:', error);
      callback(0);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Subscribe to SkillBot conversation changes (real-time)
  subscribeToSkillBotConversation(conversationId, callback) {
    try {
      const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
      
      return onSnapshot(conversationRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const conversationData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
          callback(conversationData);
        } else {
          // Document doesn't exist, return null
          callback(null);
        }
      }, (error) => {
        console.error('Error in SkillBot conversation subscription:', error);
        callback(null);
      });
    } catch (error) {
      console.error('Error setting up SkillBot conversation subscription:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Reset SkillBot conversation
  async resetSkillBotConversation(userId) {
    try {
      const conversationId = `${userId}_${SKILLBOT_ID}`;
      const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
      
      // Delete the conversation document
      await deleteDoc(conversationRef);
      
      // Also clean up the chat entry
      const chatId = `${userId}_${SKILLBOT_ID}`;
      const chatRef = doc(db, 'chats', chatId);
      await deleteDoc(chatRef);
      
      return true;
    } catch (error) {
      console.error('Error resetting SkillBot conversation:', error);
      throw error;
    }
  }

  // Fallback response when AI fails
  getFallbackProjectAnalysis() {
    return "Saya akan bantu carikan freelancer yang cocok untuk project kamu di SkillNusa! Bisa cerita lebih detail tentang kebutuhan dan budget yang kamu punya? 😊";
  }
}

export default new SkillBotService(); 