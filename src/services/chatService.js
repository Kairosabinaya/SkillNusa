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
import { COLLECTIONS } from '../utils/constants';

class ChatService {
  constructor() {
    this.chatsCollection = COLLECTIONS.CHATS;
    this.messagesCollection = COLLECTIONS.MESSAGES;
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

      // Get user details for chat creation using standardized collections
      const [user1Doc, user2Doc] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.USERS, user1Id)),
        getDoc(doc(db, COLLECTIONS.USERS, user2Id))
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
            role: user1Data?.isFreelancer ? 'freelancer' : 'client'
          },
          [user2Id]: {
            displayName: user2Data?.displayName || 'User',
            profilePhoto: user2Data?.profilePhoto || null,
            role: user2Data?.isFreelancer ? 'freelancer' : 'client'
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
      // Get gig details using standardized collection
      const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, gigId));
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
          gigThumbnail: gigData.images?.[0] || null
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
      const notificationContent = `📦 Pesanan Baru!\n\n🎯 ${orderData.gigTitle}\n📋 Paket: ${orderData.packageType}\n💰 Harga: Rp ${orderData.price?.toLocaleString('id-ID')}\n\n📝 Kebutuhan Client:\n${orderData.clientRequirements}\n\nSilakan konfirmasi pesanan ini!`;

      const message = {
        chatId,
        senderId,
        content: notificationContent,
        messageType: 'order_notification',
        metadata: {
          orderId,
          orderData: {
            gigTitle: orderData.gigTitle,
            packageType: orderData.packageType,
            price: orderData.price,
            clientRequirements: orderData.clientRequirements
          }
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
  async sendOrderStatusMessage(chatId, senderId, orderId, newStatus, additionalInfo = '', orderData = {}) {
    try {
      let statusContent = '';
      
      switch (newStatus) {
        case 'confirmed':
          statusContent = `✅ Pesanan Dikonfirmasi!\n\n🎯 ${orderData.title || 'Pesanan Anda'}\n⏱️ Estimasi: ${orderData.deliveryTime || 'Sesuai paket'}\n\nPekerjaan akan segera dimulai!`;
          break;
        case 'delivered':
          statusContent = `🚀 Pekerjaan Diserahkan!\n\n🎯 ${orderData.title || 'Pesanan Anda'}\nPekerjaan telah selesai dan siap untuk review.\n\n${additionalInfo}`;
          break;
        case 'in_revision':
          statusContent = `🔄 Revisi Diminta\n\n🎯 ${orderData.title || 'Pesanan Anda'}\n\n📝 Catatan revisi:\n${additionalInfo}`;
          break;
        case 'completed':
          statusContent = `🎉 Pesanan Selesai!\n\n🎯 ${orderData.title || 'Pesanan Anda'}\nTerima kasih atas kerjasamanya!\n\n${additionalInfo}`;
          break;
        case 'cancelled':
          statusContent = `❌ Pesanan Dibatalkan\n\n🎯 ${orderData.title || 'Pesanan Anda'}\n\n📝 Alasan:\n${additionalInfo}`;
          break;
        default:
          statusContent = `📋 Update Status Pesanan\n\n🎯 ${orderData.title || 'Pesanan Anda'}\nStatus: ${newStatus}\n\n${additionalInfo}`;
      }

      const message = {
        chatId,
        senderId,
        content: statusContent,
        messageType: 'order_status',
        metadata: {
          orderId,
          newStatus,
          additionalInfo
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

  // Send regular message
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

  // Add message to database and update chat
  async addMessage(messageData) {
    try {
      // Add message to messages collection
      const messageRef = await addDoc(collection(db, this.messagesCollection), messageData);
      
      // Update chat with last message info
      const chatRef = doc(db, this.chatsCollection, messageData.chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const unreadCount = { ...chatData.unreadCount };
        
        // Increment unread count for all participants except sender
        chatData.participants.forEach(participantId => {
          if (participantId !== messageData.senderId) {
            unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
          }
        });
        
        await updateDoc(chatRef, {
          lastMessage: messageData.content.substring(0, 100), // Truncate for preview
          lastMessageSender: messageData.senderId,
          lastMessageTime: serverTimestamp(),
          unreadCount,
          updatedAt: serverTimestamp()
        });
      }
      
      return { id: messageRef.id, ...messageData };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Get user chats
  async getUserChats(userId) {
    try {
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', 'array-contains', userId),
        where('isActive', '==', true),
        orderBy('lastMessageTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const chats = [];

      for (const doc of querySnapshot.docs) {
        const chatData = { id: doc.id, ...doc.data() };
        
        // Get the other participant's current data
        const otherParticipantId = chatData.participants.find(id => id !== userId);
        if (otherParticipantId) {
          const otherUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, otherParticipantId));
          if (otherUserDoc.exists()) {
            const otherUserData = otherUserDoc.data();
            // Update participant details with current data
            chatData.participantDetails[otherParticipantId] = {
              displayName: otherUserData.displayName,
              profilePhoto: otherUserData.profilePhoto,
              role: otherUserData.isFreelancer ? 'freelancer' : 'client'
            };
          }
        }
        
        chats.push(chatData);
      }

      return chats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  // Get chat messages
  async getChatMessages(chatId, limitCount = 50, startAfter = null) {
    try {
      let q = query(
        collection(db, this.messagesCollection),
        where('chatId', '==', chatId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (startAfter) {
        q = query(q, startAfter(startAfter));
      }

      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return messages.reverse(); // Return in chronological order
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
        const unreadCount = { ...chatData.unreadCount };
        unreadCount[userId] = 0;
        
        await updateDoc(chatRef, {
          unreadCount,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Subscribe to chat messages
  subscribeToChatMessages(chatId, callback) {
    const q = query(
      collection(db, this.messagesCollection),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages.reverse());
    });
  }

  // Subscribe to user chats
  subscribeToUserChats(userId, callback) {
    const q = query(
      collection(db, this.chatsCollection),
      where('participants', 'array-contains', userId),
      where('isActive', '==', true),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, async (querySnapshot) => {
      const chats = [];
      
      for (const doc of querySnapshot.docs) {
        const chatData = { id: doc.id, ...doc.data() };
        
        // Get the other participant's current data
        const otherParticipantId = chatData.participants.find(id => id !== userId);
        if (otherParticipantId) {
          const otherUserDoc = await getDoc(doc(db, COLLECTIONS.USERS, otherParticipantId));
          if (otherUserDoc.exists()) {
            const otherUserData = otherUserDoc.data();
            // Update participant details with current data
            chatData.participantDetails[otherParticipantId] = {
              displayName: otherUserData.displayName,
              profilePhoto: otherUserData.profilePhoto,
              role: otherUserData.isFreelancer ? 'freelancer' : 'client'
            };
          }
        }
        
        chats.push(chatData);
      }
      
      callback(chats);
    });
  }

  // Get user unread count
  async getUserUnreadCount(userId) {
    try {
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', 'array-contains', userId),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      let totalUnread = 0;

      querySnapshot.docs.forEach(doc => {
        const chatData = doc.data();
        totalUnread += chatData.unreadCount?.[userId] || 0;
      });

      return totalUnread;
    } catch (error) {
      console.error('Error getting user unread count:', error);
      return 0;
    }
  }

  // Subscribe to unread count
  subscribeToUnreadCount(userId, callback) {
    const q = query(
      collection(db, this.chatsCollection),
      where('participants', 'array-contains', userId),
      where('isActive', '==', true)
    );

    return onSnapshot(q, (querySnapshot) => {
      let totalUnread = 0;
      
      querySnapshot.docs.forEach(doc => {
        const chatData = doc.data();
        totalUnread += chatData.unreadCount?.[userId] || 0;
      });
      
      callback(totalUnread);
    });
  }
}

export default new ChatService(); 