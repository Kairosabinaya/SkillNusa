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
  onSnapshot
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
      await this.createOrUpdateChatEntry(userId, welcomeMessage);

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
      }
    } catch (error) {
      console.error('Error marking SkillBot as read:', error);
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
      botMessageObj.content = aiResponse;

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
      batch.update(chatRef, {
        lastMessage: aiResponse,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: SKILLBOT_ID,
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
      return 'Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat.';
    }
  }

  // Handle project discussion and gig recommendations
  async handleProjectDiscussion(userMessage, conversationHistory, context) {
    try {
      // First, analyze the project requirements
      const projectAnalysis = await geminiService.analyzeProjectRequirements(userMessage, conversationHistory);
      
      // Extract potential keywords for gig search
      const searchKeywords = this.extractSearchKeywords(userMessage);
      
      // Search for relevant gigs
      const relevantGigs = await this.findRelevantGigs(searchKeywords, userMessage);
      
      if (relevantGigs.length > 0) {
        // Generate recommendations with available gigs
        const recommendations = await geminiService.recommendGigs(userMessage, relevantGigs);
        
        // Create a comprehensive response
        return `${projectAnalysis}\n\n${recommendations}`;
      } else {
        // No relevant gigs found
        return `${projectAnalysis}\n\n❌ Maaf, saat ini belum ada gigs yang sesuai dengan kebutuhan project Anda. Namun, Anda bisa:\n\n1. Posting project request di platform\n2. Menunggu freelancer baru yang sesuai\n3. Memodifikasi requirement agar lebih fleksibel\n\nApakah ada aspek lain dari project yang bisa saya bantu analisis?`;
      }
    } catch (error) {
      console.error('Error handling project discussion:', error);
      return await geminiService.getFallbackProjectAnalysis();
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

  // Check if message is about project discussion
  isProjectDiscussion(message) {
    const projectKeywords = [
      'project', 'proyek', 'butuh', 'ingin', 'mau', 'bikin', 'buat',
      'develop', 'design', 'website', 'aplikasi', 'app', 'sistem',
      'platform', 'landing page', 'e-commerce', 'toko online'
    ];
    
    return projectKeywords.some(keyword => message.includes(keyword));
  }

  // Generate gig recommendations with action buttons
  async generateGigRecommendations(userRequirements, gigs) {
    try {
      const recommendations = await geminiService.recommendGigs(userRequirements, gigs);
      
      // Format with action buttons
      const formattedRecommendations = {
        content: recommendations,
        recommendedGigs: gigs.slice(0, 5).map(gig => ({
          id: gig.id,
          title: gig.title,
          category: gig.category,
          price: gig.packages?.basic?.price,
          rating: gig.rating,
          deliveryTime: gig.packages?.basic?.deliveryTime
        })),
        actionButtons: [
          {
            type: 'add_to_cart',
            label: 'Tambah ke Keranjang',
            action: 'add_to_cart'
          },
          {
            type: 'view_details',
            label: 'Lihat Detail',
            action: 'view_details'
          },
          {
            type: 'contact_freelancer',
            label: 'Hubungi Freelancer',
            action: 'contact_freelancer'
          }
        ]
      };
      
      return formattedRecommendations;
    } catch (error) {
      console.error('Error generating gig recommendations:', error);
      return {
        content: 'Maaf, terjadi kesalahan saat menganalisis rekomendasi. Silakan coba lagi.',
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
}

export default new SkillBotService(); 