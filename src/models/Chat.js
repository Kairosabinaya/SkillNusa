import BaseModel from './BaseModel';

export class Chat extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.participants = data.participants || []; // array of user IDs
    this.lastMessage = data.lastMessage || '';
    this.lastMessageTime = data.lastMessageTime || new Date();
    this.lastMessageSender = data.lastMessageSender || '';
    this.unreadCount = data.unreadCount || {};
    this.orderId = data.orderId || null;
    this.gigId = data.gigId || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static getCollectionName() {
    return 'chats';
  }

  validate() {
    const errors = {};
    
    if (!this.participants || this.participants.length < 2) {
      errors.participants = 'At least 2 participants are required';
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      participants: this.participants,
      lastMessage: this.lastMessage,
      lastMessageTime: this.lastMessageTime,
      lastMessageSender: this.lastMessageSender,
      unreadCount: this.unreadCount,
      orderId: this.orderId,
      gigId: this.gigId,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export class Message extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.chatId = data.chatId || '';
    this.senderId = data.senderId || '';
    this.content = data.content || '';
    this.messageType = data.messageType || 'text'; // text, image, file, system
    this.fileUrl = data.fileUrl || null;
    this.fileName = data.fileName || null;
    this.isRead = data.isRead || false;
    this.readBy = data.readBy || [];
    this.createdAt = data.createdAt || new Date();
  }

  static getCollectionName() {
    return 'messages';
  }

  validate() {
    const errors = {};
    
    if (!this.chatId) {
      errors.chatId = 'Chat ID is required';
    }
    
    if (!this.senderId) {
      errors.senderId = 'Sender ID is required';
    }
    
    if (!this.content && this.messageType === 'text') {
      errors.content = 'Message content is required';
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      chatId: this.chatId,
      senderId: this.senderId,
      content: this.content,
      messageType: this.messageType,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      isRead: this.isRead,
      readBy: this.readBy,
      createdAt: this.createdAt
    };
  }
}

export default Chat; 