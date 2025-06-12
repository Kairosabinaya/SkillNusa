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
  async sendMessageToSkillBot(userId, userMessage, context = {}, retryCount = 0) {
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

      // Check document size and trim if needed BEFORE adding new messages
      const shouldTrim = await this.checkAndTrimIfNeeded(conversationId, conversation);
      if (shouldTrim) {
        console.log('🗂️ [SkillBot] Conversation trimmed due to size limit, continuing with fresh space');
        // Get updated conversation after trimming
        conversation = await this.getSkillBotConversation(userId);
        if (!conversation) {
          const userDoc = await getDoc(doc(db, 'users', userId));
          const userName = userDoc.exists() ? userDoc.data().displayName : 'User';
          conversation = await this.initializeSkillBotForUser(userId, userName);
        }
      }

      // Add user message
      const userMessageObj = {
        id: `user-${Date.now()}`,
        content: userMessage,
        senderId: userId,
        createdAt: new Date(),
        messageType: 'user'
      };

      // Get conversation history for context (limit to recent messages for performance)
      const conversationHistory = (conversation.messages || []).slice(-20); // Only use last 20 messages for context
      
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
      
      // Check document size before adding gig recommendations
      const currentMessages = conversation.messages || [];
      const currentSize = this.estimateDocumentSize(currentMessages);
      const sizeLimitForGigs = 300000; // 300KB limit for gig recommendations
      
      // Check if we should show gig recommendations based on conversation
      const shouldShowGigs = this.shouldShowGigRecommendations(conversationHistory, userMessage);
      console.log('🤖 SkillBot: shouldShowGigs =', shouldShowGigs, 'for message:', userMessage);
      console.log('🤖 SkillBot: currentSize =', (currentSize / 1024).toFixed(2), 'KB');
      
      // Also check if AI response mentions specific gigs (fallback detection)
      const aiResponseMentionsGigs = aiResponse && (
        aiResponse.toLowerCase().includes('rp ') || 
        aiResponse.toLowerCase().includes('hari') || 
        aiResponse.toLowerCase().includes('gig ') ||
        aiResponse.toLowerCase().includes('freelancer') ||
        aiResponse.toLowerCase().includes('skillnusa')
      );
      console.log('🤖 SkillBot: aiResponseMentionsGigs =', aiResponseMentionsGigs);
      
      // Skip gig recommendations if document is already large
      const skipGigsForSize = currentSize > sizeLimitForGigs;
      if (skipGigsForSize) {
        console.log('⚠️ [SkillBot] Skipping gig recommendations due to document size');
      }
      
      if ((shouldShowGigs || aiResponseMentionsGigs) && !skipGigsForSize) {
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
        console.log('🤖 SkillBot: Using AI response only (no gig recommendations)');
        botMessageObj.content = aiResponse;
      }

      // Create updated messages array
      const updatedMessages = [...currentMessages, userMessageObj, botMessageObj];
      
      // Double-check size before saving
      const estimatedSize = this.estimateDocumentSize(updatedMessages);
      if (estimatedSize > 400000) { // 400KB threshold (leaving 600KB buffer)
        console.warn('⚠️ [SkillBot] Document size still too large, aggressive trimming...');
        // Keep only the most recent messages
        const trimmedMessages = updatedMessages.slice(-5); // Keep only last 5 messages
        
        // Use batch write for better performance
        const batch = writeBatch(db);
        
        // Update SkillBot conversation with trimmed messages
        const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
        batch.set(conversationRef, {
          id: conversationId,
          userId,
          botId: SKILLBOT_ID,
          messages: trimmedMessages,
          lastMessageTime: new Date(),
          isActive: true,
          updatedAt: serverTimestamp(),
          messagesTrimmed: true,
          trimmedAt: new Date()
        }, { merge: true });

        await this.updateChatAndCommit(batch, userId, botMessageObj);
        
        return {
          userMessage: userMessageObj,
          botResponse: botMessageObj
        };
      }
      
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

      await this.updateChatAndCommit(batch, userId, botMessageObj);

      return {
        userMessage: userMessageObj,
        botResponse: botMessageObj
      };
    } catch (error) {
      console.error('Error sending message to SkillBot:', error);
      
      // Check if it's a document size error
      if (error.message && error.message.includes('exceeds the maximum allowed size')) {
        console.error('📄 [SkillBot] Document size limit exceeded, attempting recovery...');
        
        // Prevent infinite recursion
        if (retryCount >= 2) {
          console.error('❌ [SkillBot] Max retry attempts reached');
          throw new Error('Failed to process message after multiple trim attempts. Please contact support.');
        }
        
        try {
          // Force trim and retry with the current message
          await this.forceTrimConversation(userId);
          console.log('🔄 [SkillBot] Conversation trimmed, retrying message...');
          
          // Retry the message after trim (with retry counter)
          return await this.sendMessageToSkillBot(userId, userMessage, context, retryCount + 1);
        } catch (trimError) {
          console.error('❌ [SkillBot] Failed to trim conversation:', trimError);
          throw new Error('Failed to process message due to storage limit. Please contact support.');
        }
      }
      
      throw error;
    }
  }

  // Helper method to update chat and commit batch
  async updateChatAndCommit(batch, userId, botMessageObj) {
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
  }

  // Check document size and trim if needed
  async checkAndTrimIfNeeded(conversationId, conversation) {
    try {
      if (!conversation || !conversation.messages) return false;
      
      const estimatedSize = this.estimateDocumentSize(conversation.messages);
      console.log(`📊 [SkillBot] Estimated conversation size: ${(estimatedSize / 1024).toFixed(2)} KB`);
      
      // Trim if size is approaching limit (300KB threshold for safety)
      if (estimatedSize > 300000) {
        console.log('🗂️ [SkillBot] Document size approaching limit, trimming conversation...');
        await this.trimConversation(conversationId, conversation, 10); // Keep only 10 messages
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking document size:', error);
      return false;
    }
  }

  // Force trim conversation when size limit exceeded
  async forceTrimConversation(userId) {
    try {
      const conversationId = `${userId}_${SKILLBOT_ID}`;
      const conversation = await this.getSkillBotConversation(userId);
      
      if (conversation) {
        await this.trimConversation(conversationId, conversation, 5); // Keep only 5 messages
        console.log('🗂️ [SkillBot] Conversation force trimmed to 5 messages');
      }
    } catch (error) {
      console.error('Error force trimming conversation:', error);
      throw error;
    }
  }

  // Trim conversation to keep only recent messages
  async trimConversation(conversationId, conversation, keepLastN = 30) {
    try {
      if (!conversation || !conversation.messages) {
        console.log('❌ [SkillBot] No conversation to trim');
        return false;
      }
      
      const messages = conversation.messages;
      const messageCount = messages.length;
      
      if (messageCount <= keepLastN) {
        console.log('✅ [SkillBot] Conversation already small enough');
        return false;
      }
      
      const oldSize = this.estimateDocumentSize(messages);
      
      // Keep only the last N messages
      const keptMessages = messages.slice(-keepLastN);
      
      // Add trim notice at the beginning
      const trimMessage = {
        id: `system-trim-${Date.now()}`,
        content: `🗂️ Percakapan telah dipangkas untuk mengoptimalkan performa (ukuran terlalu besar). ${messageCount - keepLastN} pesan lama dihapus. Tersisa ${keepLastN + 1} pesan terakhir.`,
        senderId: SKILLBOT_ID,
        createdAt: new Date(Date.now() - 1000), // Slightly earlier timestamp
        messageType: 'system_trim_notice'
      };
      
      const finalMessages = [trimMessage, ...keptMessages];
      const newSize = this.estimateDocumentSize(finalMessages);
      
      // Update conversation with trimmed messages
      const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
      await updateDoc(conversationRef, {
        messages: finalMessages,
        lastMessageTime: new Date(),
        updatedAt: serverTimestamp(),
        trimmedAt: new Date(),
        messagesTrimmed: messageCount - keepLastN,
        sizeBeforeTrim: oldSize,
        sizeAfterTrim: newSize
      });
      
      const sizeSaved = oldSize - newSize;
      
      console.log('✅ [SkillBot] Conversation trimmed successfully:');
      console.log(`   - Removed: ${messageCount - keepLastN} messages`);
      console.log(`   - Remaining: ${finalMessages.length} messages`);
      console.log(`   - Size before: ${(oldSize/1024).toFixed(2)}KB`);
      console.log(`   - Size after: ${(newSize/1024).toFixed(2)}KB`);
      console.log(`   - Size saved: ${(sizeSaved/1024).toFixed(2)}KB`);
      
      return true;
    } catch (error) {
      console.error('Error trimming conversation:', error);
      throw error;
    }
  }

  // Estimate document size in bytes
  estimateDocumentSize(messages) {
    if (!messages || !Array.isArray(messages)) return 0;
    
    // Rough estimation: JSON.stringify size
    try {
      const jsonString = JSON.stringify(messages);
      return new Blob([jsonString]).size;
    } catch (error) {
      console.error('Error estimating document size:', error);
      // Fallback estimation: assume ~500 bytes per message on average
      return messages.length * 500;
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
        // General conversation - MINIMAL CONTEXT to save tokens
        return await geminiService.generateResponse(userMessage, {
          conversationHistory: conversationHistory.slice(-2), // Only last 2 messages
          // NO availableGigs to save massive tokens
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

      // Prepare MINIMAL gigs context - ONLY essential info to save tokens
      const gigsContext = relevantGigs.length > 0 
        ? `\n\nGigs tersedia di SkillNusa:\n${relevantGigs.slice(0, 3).map(gig => 
            `- ${gig.title} (Rp ${gig.packages?.basic?.price?.toLocaleString('id-ID') || 'N/A'})`
          ).join('\n')}`
        : '\n\nBelum ada gigs yang sesuai.';

      // MINIMAL prompt to save tokens
      const comprehensivePrompt = `SkillBot SkillNusa. User: "${userMessage}"${conversationContext}${gigsContext}

${relevantGigs.length > 0 ? 
  'Analisis singkat + rekomendasikan 2-3 gigs terbaik. Max 4 kalimat.' :
  'Belum ada layanan cocok. Sarankan cek lagi nanti. Max 3 kalimat.'
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
        .sort((a, b) => {
          const aRating = a.rating || 0;
          const bRating = b.rating || 0;
          return bRating - aRating;
        })
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
        const gigSummaries = gigs.map(gig => {
          const formattedRating = gig.rating ? gig.rating.toFixed(1) : '0.0';
          return `${gig.title} - ${gig.packages?.basic?.price ? `Rp ${gig.packages.basic.price.toLocaleString('id-ID')}` : 'Mulai dari Rp 100k'} (${formattedRating}/5.0 ⭐)`;
        }).join('\n');
      
      const recommendationText = `Nih, saya nemuin beberapa freelancer yang cocok buat kebutuhan kamu:\n\n${gigSummaries}\n\nTinggal pilih yang mana nih? 😊`;
      
              // Format with action buttons - STRIPPED DOWN for size optimization
        const formattedRecommendations = {
          content: recommendationText,
          recommendedGigs: gigs.map(gig => ({
            id: gig.id,
            title: gig.title,
            category: gig.category,
            price: gig.packages?.basic?.price || 100000,
            rating: gig.rating ? parseFloat(gig.rating.toFixed(1)) : 0.0,
            deliveryTime: gig.packages?.basic?.deliveryTime || 7,
            freelancerId: gig.freelancerId || gig.freelancer?.uid,
            freelancerName: gig.freelancer?.displayName || 'Freelancer',
            image: gig.images?.[0] || gig.image,
            // Remove large objects: description, tags, full freelancer profile
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

  // Get conversation statistics
  async getConversationStats(userId) {
    try {
      const conversationId = `${userId}_${SKILLBOT_ID}`;
      const conversation = await this.getSkillBotConversation(userId);
      
      if (!conversation) {
        return {
          messageCount: 0,
          estimatedSize: 0,
          sizeStatus: 'empty'
        };
      }
      
      const messageCount = conversation.messages?.length || 0;
      const estimatedSize = this.estimateDocumentSize(conversation.messages || []);
      const sizeInKB = (estimatedSize / 1024).toFixed(2);
      
      let sizeStatus = 'normal';
      if (estimatedSize > 800000) {
        sizeStatus = 'critical'; // Needs immediate attention
      } else if (estimatedSize > 600000) {
        sizeStatus = 'warning'; // Approaching limit
      }
      
      return {
        messageCount,
        estimatedSize,
        sizeInKB,
        sizeStatus,
        trimmedConversations: conversation.messagesTrimmed || 0,
        lastTrimmed: conversation.trimmedAt || null
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return {
        messageCount: 0,
        estimatedSize: 0,
        sizeStatus: 'error'
      };
    }
  }

  // Manual cleanup conversation (remove old messages)
  async cleanupConversation(userId, keepLastN = 50) {
    try {
      const conversationId = `${userId}_${SKILLBOT_ID}`;
      const conversation = await this.getSkillBotConversation(userId);
      
      if (!conversation || !conversation.messages) {
        return { cleaned: false, reason: 'No conversation found' };
      }
      
      const messages = conversation.messages;
      if (messages.length <= keepLastN) {
        return { cleaned: false, reason: 'Conversation already small enough' };
      }
      
      // Keep only the last N messages
      const keptMessages = messages.slice(-keepLastN);
      
      // Add a system message to indicate cleanup
      const cleanupMessage = {
        id: `system-cleanup-${Date.now()}`,
        content: `🧹 Membersihkan percakapan lama. ${messages.length - keepLastN} pesan lama telah dihapus untuk mengoptimalkan performa.`,
        senderId: SKILLBOT_ID,
        createdAt: new Date(),
        messageType: 'system_cleanup_notice'
      };
      
      const finalMessages = [cleanupMessage, ...keptMessages];
      
      // Update conversation
      const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
      await updateDoc(conversationRef, {
        messages: finalMessages,
        updatedAt: serverTimestamp(),
        cleanedAt: new Date(),
        messagesRemoved: messages.length - keepLastN
      });
      
      const newSize = this.estimateDocumentSize(finalMessages);
      
      return {
        cleaned: true,
        removedCount: messages.length - keepLastN,
        remainingCount: finalMessages.length,
        oldSize: this.estimateDocumentSize(messages),
        newSize: newSize,
        sizeSavedKB: ((this.estimateDocumentSize(messages) - newSize) / 1024).toFixed(2)
      };
    } catch (error) {
      console.error('Error cleaning up conversation:', error);
      throw error;
    }
  }

  // Fallback response when AI fails
  getFallbackProjectAnalysis() {
    return "Saya akan bantu carikan freelancer yang cocok untuk project kamu di SkillNusa! Bisa cerita lebih detail tentang kebutuhan dan budget yang kamu punya? 😊";
  }
}

export default new SkillBotService(); 