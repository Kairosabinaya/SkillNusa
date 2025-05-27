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

class ChatService {
  constructor() {
    this.chatsCollection = 'chats';
    this.messagesCollection = 'messages';
  }

  // Create or get existing chat between two users
  async createOrGetChat(user1Id, user2Id, gigId = null, orderId = null) {
    try {
      // Check if chat already exists between these users
      const existingChat = await this.findChatBetweenUsers(user1Id, user2Id);
      
      if (existingChat) {
        return existingChat;
      }

      // Create new chat
      const chat = new Chat({
        participants: [user1Id, user2Id],
        lastMessage: '',
        lastMessageTime: new Date(),
        lastMessageSender: '',
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0
        },
        gigId,
        orderId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const docRef = await addDoc(collection(db, this.chatsCollection), chat.toJSON());
      return { id: docRef.id, ...chat.toJSON() };
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      throw error;
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

  // Send message
  async sendMessage(chatId, senderId, content, messageType = 'text', fileUrl = null, fileName = null) {
    try {
      // Create message
      const message = new Message({
        chatId,
        senderId,
        content,
        messageType,
        fileUrl,
        fileName,
        createdAt: new Date()
      });

      // Add message to messages collection
      const messageRef = await addDoc(collection(db, this.messagesCollection), message.toJSON());

      // Update chat with last message info
      const chatRef = doc(db, this.chatsCollection, chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const otherParticipants = chatData.participants.filter(id => id !== senderId);
        
        // Update unread count for other participants
        const newUnreadCount = { ...chatData.unreadCount };
        otherParticipants.forEach(participantId => {
          newUnreadCount[participantId] = (newUnreadCount[participantId] || 0) + 1;
        });

        await updateDoc(chatRef, {
          lastMessage: content,
          lastMessageTime: new Date(),
          lastMessageSender: senderId,
          unreadCount: newUnreadCount,
          updatedAt: new Date()
        });
      }

      return { id: messageRef.id, ...message.toJSON() };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get user chats
  async getUserChats(userId) {
    try {
      const q = query(
        collection(db, this.chatsCollection),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const chats = [];
      
      for (const doc of querySnapshot.docs) {
        const chatData = { id: doc.id, ...doc.data() };
        
        // Get other participant details
        const otherParticipantId = chatData.participants.find(id => id !== userId);
        if (otherParticipantId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
            if (userDoc.exists()) {
              chatData.otherParticipant = { id: userDoc.id, ...userDoc.data() };
            }
          } catch (error) {
            console.error(`Error getting user details for ${otherParticipantId}:`, error);
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
  async getChatMessages(chatId, limitCount = 50) {
    try {
      const q = query(
        collection(db, this.messagesCollection),
        where('chatId', '==', chatId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const messages = [];
      
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Return messages in chronological order (oldest first)
      return messages.reverse();
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
          unreadCount: newUnreadCount
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
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(messages);
    });
  }

  // Subscribe to user chats (real-time)
  subscribeToUserChats(userId, callback) {
    const q = query(
      collection(db, this.chatsCollection),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    return onSnapshot(q, async (querySnapshot) => {
      const chats = [];
      
      for (const doc of querySnapshot.docs) {
        const chatData = { id: doc.id, ...doc.data() };
        
        // Get other participant details
        const otherParticipantId = chatData.participants.find(id => id !== userId);
        if (otherParticipantId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
            if (userDoc.exists()) {
              chatData.otherParticipant = { id: userDoc.id, ...userDoc.data() };
            }
          } catch (error) {
            console.error(`Error getting user details for ${otherParticipantId}:`, error);
          }
        }
        
        chats.push(chatData);
      }
      
      callback(chats);
    });
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
}

const chatService = new ChatService();
export default chatService; 