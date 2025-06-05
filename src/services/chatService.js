import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { Chat, Message } from '../models/Chat';
import firebaseMonitor from '../utils/firebaseMonitor';

class ChatService {
  constructor() {
    this.chatsCollection = 'chats';
    this.messagesCollection = 'messages';
    
    // Add caching to reduce redundant reads
    this.userCache = new Map();
    this.cacheExpiration = 5 * 60 * 1000; // 5 minutes
  }

  // Cached user fetch to reduce redundant reads
  async getCachedUser(userId) {
    const cached = this.userCache.get(userId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheExpiration) {
      return cached.data;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() };
        this.userCache.set(userId, { data: userData, timestamp: now });
        
        // Track read for monitoring
        firebaseMonitor.trackRead('getCachedUser', 'users', 1);
        
        return userData;
      }
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
    }
    
    return null;
  }

  // Clear user cache
  clearUserCache() {
    this.userCache.clear();
  }

  // Create or get existing chat between two users with enhanced context
  async createOrGetChat(user1Id, user2Id, gigId = null, orderId = null) {
    try {
      // Check if chat already exists between these users for this context
      let existingChat = null;
      
      if (gigId) {
        // Look for existing chat with same gig context
        existingChat = await this.findChatWithGigContext(user1Id, user2Id, gigId);
      }
      
      if (!existingChat) {
        // Look for any existing chat between users
        existingChat = await this.findChatBetweenUsers(user1Id, user2Id);
      }
      
      if (existingChat) {
        // Update context if needed
        if (gigId && !existingChat.gigId) {
          await updateDoc(doc(db, this.chatsCollection, existingChat.id), {
            gigId,
            updatedAt: serverTimestamp()
          });
          existingChat.gigId = gigId;
        }
        
        if (orderId && !existingChat.orderId) {
          await updateDoc(doc(db, this.chatsCollection, existingChat.id), {
            orderId,
            updatedAt: serverTimestamp()
          });
          existingChat.orderId = orderId;
        }
        
        return existingChat;
      }

      // Get user details for chat creation
      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(doc(db, 'users', user1Id)),
        getDoc(doc(db, 'users', user2Id))
      ]);

      const user1Data = user1Doc.exists() ? user1Doc.data() : null;
      const user2Data = user2Doc.exists() ? user2Doc.data() : null;

      // Create new chat with enhanced structure
      const chat = {
        participants: [user1Id, user2Id],
        participantDetails: {
          [user1Id]: {
            displayName: user1Data?.displayName || 'User',
            profilePhoto: user1Data?.profilePhoto || null,
            role: user1Data?.roles?.[0] || 'client'
          },
          [user2Id]: {
            displayName: user2Data?.displayName || 'User',
            profilePhoto: user2Data?.profilePhoto || null,
            role: user2Data?.roles?.[0] || 'freelancer'
          }
        },
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        lastMessageSender: '',
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0
        },
        gigId,
        orderId,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.chatsCollection), chat);
      
      // Send contextual welcome message if gig context is provided
      if (gigId) {
        await this.sendGigContextMessage(docRef.id, user1Id, gigId);
      }
      
      return { id: docRef.id, ...chat };
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      throw error;
    }
  }

  // Find chat with specific gig context
  async findChatWithGigContext(user1Id, user2Id, gigId) {
    try {
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', 'array-contains', user1Id),
        where('gigId', '==', gigId)
      );

      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const chatData = doc.data();
        if (chatData.participants.includes(user2Id)) {
          return { id: doc.id, ...chatData };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding chat with gig context:', error);
      return null;
    }
  }

  // Find chat between two users
  async findChatBetweenUsers(user1Id, user2Id) {
    try {
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', 'array-contains', user1Id)
      );

      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const chatData = doc.data();
        if (chatData.participants.includes(user2Id)) {
          return { id: doc.id, ...chatData };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding chat between users:', error);
      throw error;
    }
  }

  // Send gig context message
  async sendGigContextMessage(chatId, senderId, gigId) {
    try {
      // Get gig details
      const gigDoc = await getDoc(doc(db, 'gigs', gigId));
      if (!gigDoc.exists()) {
        return null;
      }

      const gigData = gigDoc.data();
      
      // Create context message content with proper line breaks
      const contextContent = `🎯 Diskusi tentang layanan:\n\n${gigData.title}\n\n📋 Kategori: ${gigData.category}\n💰 Mulai dari: Rp ${gigData.packages?.basic?.price?.toLocaleString('id-ID') || 'N/A'}\n⏱️ Delivery: ${gigData.packages?.basic?.deliveryTime || 'N/A'} hari\n\nSilakan diskusikan kebutuhan project Anda!`;

      const message = {
        chatId,
        senderId,
        content: contextContent,
        messageType: 'gig_context',
        metadata: {
          gigId,
          gigTitle: gigData.title,
          gigThumbnail: gigData.images?.[0] || null,
          packages: gigData.packages
        },
        isRead: false,
        createdAt: serverTimestamp()
      };

      return await this.addMessage(message);
    } catch (error) {
      console.error('Error sending gig context message:', error);
      return null;
    }
  }

  // Send order notification message
  async sendOrderNotificationMessage(chatId, senderId, orderId, orderData) {
    try {
      const { gigTitle, packageType, price, clientRequirements } = orderData;
      
      // Clean formatting with explicit line breaks
      const notificationContent = `🎉 Pesanan Baru Dibuat!\n\n📋 Layanan: ${gigTitle}\n📦 Paket: ${packageType}\n💰 Total: Rp ${price?.toLocaleString('id-ID') || 'N/A'}\n\n📝 Kebutuhan Client:\n"${clientRequirements}"\n\n✅ Pesanan telah dibuat dan menunggu konfirmasi freelancer.`;

      const message = {
        chatId,
        senderId,
        content: notificationContent,
        messageType: 'order_notification',
        metadata: {
          orderId,
          orderData,
          type: 'order_created'
        },
        isRead: false,
        createdAt: serverTimestamp()
      };

      return await this.addMessage(message);
    } catch (error) {
      console.error('Error sending order notification message:', error);
      return null;
    }
  }

  // Send order status update message
  async sendOrderStatusMessage(chatId, senderId, orderId, newStatus, additionalInfo = '') {
    try {
      const statusMessages = {
        'active': '🚀 Pesanan Diterima\n\nFreelancer telah menerima pesanan dan akan segera memulai pengerjaan.',
        'confirmed': '✅ Pesanan Dikonfirmasi\n\nFreelancer telah mengkonfirmasi pesanan Anda dan akan segera memulai pengerjaan.',
        'in_progress': '🚀 Pengerjaan Dimulai\n\nFreelancer telah memulai mengerjakan pesanan Anda.',
        'delivered': '📦 Pekerjaan Dikirim\n\nFreelancer telah mengirimkan hasil pekerjaan. Silakan review dan berikan feedback.',
        'in_review': '👀 Menunggu Review\n\nPekerjaan telah diselesaikan dan menunggu review dari client.',
        'in_revision': '🔄 Revisi Diminta\n\nClient meminta revisi pada pekerjaan. Freelancer akan melakukan perbaikan.',
        'completed': '🎊 Pesanan Selesai\n\nPesanan telah selesai dikerjakan dan diterima oleh client.',
        'cancelled': '❌ Pesanan Dibatalkan\n\nPesanan telah dibatalkan.',
        'revision_requested': '🔄 Revisi Diminta\n\nClient meminta revisi pada pekerjaan.'
      };

      const content = statusMessages[newStatus] || `📈 Status Update\n\nStatus pesanan: ${newStatus}`;
      const fullContent = additionalInfo ? `${content}\n\n📝 Catatan:\n${additionalInfo}` : content;

      const message = {
        chatId,
        senderId,
        content: fullContent,
        messageType: 'order_status',
        metadata: {
          orderId,
          newStatus,
          additionalInfo,
          type: 'status_update'
        },
        isRead: false,
        createdAt: serverTimestamp()
      };

      return await this.addMessage(message);
    } catch (error) {
      console.error('Error sending order status message:', error);
      return null;
    }
  }

  // Enhanced send message with better handling
  async sendMessage(chatId, senderId, content, messageType = 'text', fileUrl = null, fileName = null, metadata = {}) {
    try {
      const message = {
        chatId,
        senderId,
        content,
        messageType,
        fileUrl,
        fileName,
        metadata,
        isRead: false,
        createdAt: serverTimestamp()
      };

      return await this.addMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Add message and update chat
  async addMessage(messageData) {
    try {
      // Add message to messages collection
      const messageRef = await addDoc(collection(db, this.messagesCollection), messageData);

      // Update chat with last message info
      const chatRef = doc(db, this.chatsCollection, messageData.chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        
        // Check if participants array exists and is valid
        if (!chatData.participants || !Array.isArray(chatData.participants)) {
          console.error('Chat participants array is missing or invalid:', chatData.participants);
          return { id: messageRef.id, ...messageData };
        }
        
        const otherParticipants = chatData.participants.filter(id => id !== messageData.senderId);
        
        // Update unread count for other participants
        const newUnreadCount = { ...chatData.unreadCount };
        otherParticipants.forEach(participantId => {
          newUnreadCount[participantId] = (newUnreadCount[participantId] || 0) + 1;
        });

        await updateDoc(chatRef, {
          lastMessage: messageData.content,
          lastMessageTime: serverTimestamp(),
          lastMessageSender: messageData.senderId,
          unreadCount: newUnreadCount,
          updatedAt: serverTimestamp()
        });
      }

      return { id: messageRef.id, ...messageData };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Get user chats with enhanced data
  async getUserChats(userId) {
    try {
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', 'array-contains', userId)
      );

      const querySnapshot = await getDocs(q);
      const chats = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const chatData = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Check if participants array exists and is valid
        if (!chatData.participants || !Array.isArray(chatData.participants)) {
          console.error('Chat participants array is missing or invalid for chat:', chatData.id, chatData.participants);
          continue; // Skip this chat
        }
        
        // Get other participant details
        const otherParticipantId = chatData.participants.find(id => id !== userId);
        if (otherParticipantId) {
          try {
            // Use cached participant details if available
            if (chatData.participantDetails && chatData.participantDetails[otherParticipantId]) {
              chatData.otherParticipant = {
                id: otherParticipantId,
                ...chatData.participantDetails[otherParticipantId]
              };
            } else {
              // Fallback to fetching user details
              const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
              if (userDoc.exists()) {
                chatData.otherParticipant = { id: userDoc.id, ...userDoc.data() };
              }
            }
          } catch (error) {
            console.error(`Error getting user details for ${otherParticipantId}:`, error);
          }
        }

        // Get gig details if gig context exists
        if (chatData.gigId) {
          try {
            const gigDoc = await getDoc(doc(db, 'gigs', chatData.gigId));
            if (gigDoc.exists()) {
              chatData.gigContext = {
                id: gigDoc.id,
                title: gigDoc.data().title,
                images: gigDoc.data().images,
                category: gigDoc.data().category
              };
            }
          } catch (error) {
            console.error(`Error getting gig details for ${chatData.gigId}:`, error);
          }
        }

        // Get order details if order context exists
        if (chatData.orderId) {
          try {
            const orderDoc = await getDoc(doc(db, 'orders', chatData.orderId));
            if (orderDoc.exists()) {
              const orderData = orderDoc.data();
              chatData.orderContext = {
                id: orderDoc.id,
                status: orderData.status,
                packageType: orderData.packageType,
                price: orderData.price
              };
            }
          } catch (error) {
            console.error(`Error getting order details for ${chatData.orderId}:`, error);
          }
        }
        
        chats.push(chatData);
      }

      // Sort by lastMessageTime in JavaScript instead of Firestore
      chats.sort((a, b) => {
        const aTime = a.lastMessageTime?.toDate?.() || a.lastMessageTime || new Date(0);
        const bTime = b.lastMessageTime?.toDate?.() || b.lastMessageTime || new Date(0);
        return bTime - aTime; // desc order (newest first)
      });
      
      return chats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  // Get chat messages with pagination
  async getChatMessages(chatId, limitCount = 50, startAfter = null) {
    try {
      let q = query(
        collection(db, this.messagesCollection),
        where('chatId', '==', chatId),
        limit(limitCount)
        // Removed orderBy to avoid composite index requirement
      );

      if (startAfter) {
        q = query(q, startAfter(startAfter));
      }

      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((docSnapshot) => {
        messages.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      // Sort by createdAt in JavaScript instead of Firestore
      messages.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return aTime - bTime; // asc order (oldest first for messages)
      });
      
      return messages;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId, userId) {
    try {
      const chatRef = doc(db, this.chatsCollection, chatId);
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
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Subscribe to chat messages (real-time)
  subscribeToChatMessages(chatId, callback) {
    const q = query(
      collection(db, this.messagesCollection),
      where('chatId', '==', chatId)
      // Removed orderBy to avoid potential composite index requirement
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((docSnapshot) => {
        messages.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      // Sort by createdAt in JavaScript
      messages.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return aTime - bTime; // asc order (oldest first for messages)
      });

      callback(messages);
    });
  }

  // Subscribe to user chats (real-time) - OPTIMIZED to reduce reads
  subscribeToUserChats(userId, callback) {
    // Global subscription safety check
    const currentStats = firebaseMonitor.getSubscriptionStats();
    if (currentStats.active >= 10) {
      console.error('🚨 [ChatService] Subscription limit reached! Blocking new subscription creation.');
      console.error('🚨 [ChatService] Current active subscriptions:', currentStats.active);
      console.table(currentStats.byCollection);
      
      // Return a dummy unsubscribe function
      return () => {
        console.log('🚨 [ChatService] Dummy unsubscribe called for blocked subscription');
      };
    }

    const q = query(
      collection(db, this.chatsCollection),
      where('participants', 'array-contains', userId)
    );

    // Track subscription for monitoring
    const subscriptionId = `chats_${userId}_${Date.now()}`;
    console.log('📡 [ChatService] Creating subscription:', subscriptionId, 'Current active:', currentStats.active);
    firebaseMonitor.trackSubscription(subscriptionId, this.chatsCollection, userId);

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      // Track reads for monitoring
      firebaseMonitor.trackRead('subscribeToUserChats', this.chatsCollection, querySnapshot.size);
      
      const chats = [];
      
      // Use cached users to reduce reads
      const userIdsToFetch = new Set();
      const chatDataArray = [];
      
      querySnapshot.docs.forEach(docSnapshot => {
        const chatData = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Check if participants array exists and is valid
        if (!chatData.participants || !Array.isArray(chatData.participants)) {
          console.error('Chat participants array is missing or invalid for chat:', chatData.id, chatData.participants);
          return; // Skip this chat
        }
        
        const otherParticipantId = chatData.participants.find(id => id !== userId);
        if (otherParticipantId) {
          // Check if we have cached participant details first
          if (chatData.participantDetails && chatData.participantDetails[otherParticipantId]) {
            chatData.otherParticipant = {
              id: otherParticipantId,
              ...chatData.participantDetails[otherParticipantId]
            };
          } else {
            // Check cache before marking for fetch
            const cachedUser = this.userCache.get(otherParticipantId);
            if (cachedUser && (Date.now() - cachedUser.timestamp) < this.cacheExpiration) {
              chatData.otherParticipant = cachedUser.data;
            } else {
              // Mark for batch fetch only if not cached
              userIdsToFetch.add(otherParticipantId);
            }
          }
        }
        
        chatDataArray.push(chatData);
      });
      
      // Batch fetch user details only for uncached users
      if (userIdsToFetch.size > 0) {
        console.log(`🔄 [ChatService] Batch fetching ${userIdsToFetch.size} uncached user details`);
        
        // Use cached fetch method
        const userFetchPromises = Array.from(userIdsToFetch).map(async (userId) => {
          return await this.getCachedUser(userId);
        });
        
        const userResults = await Promise.all(userFetchPromises);
        
        // Create a map for quick lookup
        const userDetailsMap = new Map();
        Array.from(userIdsToFetch).forEach((userId, index) => {
          if (userResults[index]) {
            userDetailsMap.set(userId, userResults[index]);
          }
        });
        
        // Process chats with fetched user details
        for (const chatData of chatDataArray) {
          const otherParticipantId = chatData.participants.find(id => id !== userId);
          
          if (otherParticipantId && !chatData.otherParticipant) {
            const userDetails = userDetailsMap.get(otherParticipantId);
            if (userDetails) {
              chatData.otherParticipant = userDetails;
            }
          }
          
          chats.push(chatData);
        }
      } else {
        // No users to fetch, just add all chats
        chats.push(...chatDataArray);
      }

      // Sort by lastMessageTime in JavaScript instead of Firestore
      chats.sort((a, b) => {
        const aTime = a.lastMessageTime?.toDate?.() || a.lastMessageTime || new Date(0);
        const bTime = b.lastMessageTime?.toDate?.() || b.lastMessageTime || new Date(0);
        return bTime - aTime; // desc order (newest first)
      });
      
      callback(chats);
    });

    // Return enhanced unsubscribe function with proper logging
    return () => {
      console.log(`🧹 [ChatService] Cleaning up subscription: ${subscriptionId}`);
      firebaseMonitor.trackSubscriptionCleanup(subscriptionId);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }

  // Get total unread count for user
  async getUserUnreadCount(userId) {
    try {
      const chats = await this.getUserChats(userId);
      let totalUnread = 0;
      
      chats.forEach(chat => {
        totalUnread += chat.unreadCount?.[userId] || 0;
      });
      
      return totalUnread;
    } catch (error) {
      console.error('Error getting user unread count:', error);
      return 0;
    }
  }

  // Subscribe to user's unread count (real-time)
  subscribeToUnreadCount(userId, callback) {
    try {
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', 'array-contains', userId)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        
        snapshot.forEach((doc) => {
          const chatData = doc.data();
          const userUnreadCount = chatData.unreadCount?.[userId] || 0;
          totalUnread += userUnreadCount;
        });
        
        console.log('Real-time unread count update:', totalUnread);
        callback(totalUnread);
      }, (error) => {
        console.error('Error in unread count subscription:', error);
        callback(0);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up unread count subscription:', error);
      callback(0);
      return null;
    }
  }
}

const chatService = new ChatService();
export default chatService; 