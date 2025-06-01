import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckSolid } from '@heroicons/react/24/solid';

export default function FreelancerChat() {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(conversationsQuery, async (snapshot) => {
      const conversationsData = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const otherUserId = data.participants.find(id => id !== currentUser.uid);
        
        // Get other user's info
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        const userData = userDoc.data();
        
        conversationsData.push({
          id: doc.id,
          ...data,
          otherUser: userData,
          lastMessageTime: data.lastMessageTime?.toDate()
        });
      }
      
      setConversations(conversationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load selected conversation and messages
  useEffect(() => {
    if (!chatId) return;

    const conversation = conversations.find(conv => conv.id === chatId);
    setSelectedConversation(conversation);

    // Load order info if conversation has orderId
    if (conversation?.orderId) {
      loadOrderInfo(conversation.orderId);
    }

    // Load messages
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', chatId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = [];
      snapshot.forEach((doc) => {
        messagesData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });
      setMessages(messagesData);

      // Mark messages as read
      markMessagesAsRead(messagesData);
    });

    return () => unsubscribe();
  }, [chatId, conversations]);

  const loadOrderInfo = async (orderId) => {
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        
        // Get gig info
        const gigDoc = await getDoc(doc(db, 'gigs', orderData.gigId));
        const gigData = gigDoc.data();
        
        setOrderInfo({
          ...orderData,
          gig: gigData
        });
      }
    } catch (error) {
      console.error('Error loading order info:', error);
    }
  };

  const markMessagesAsRead = async (messagesData) => {
    const unreadMessages = messagesData.filter(
      msg => msg.senderId !== currentUser.uid && !msg.read
    );

    for (const message of unreadMessages) {
      await updateDoc(doc(db, 'messages', message.id), {
        read: true,
        readAt: serverTimestamp()
      });
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Add message
      await addDoc(collection(db, 'messages'), {
        conversationId: selectedConversation.id,
        senderId: currentUser.uid,
        content: newMessage,
        type: 'text',
        createdAt: serverTimestamp(),
        read: false
      });

      // Update conversation
      await updateDoc(doc(db, 'conversations', selectedConversation.id), {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: currentUser.uid
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: selectedConversation.otherUser.uid,
        type: 'message',
        message: `Pesan baru dari ${currentUser.displayName || 'Freelancer'}`,
        conversationId: selectedConversation.id,
        createdAt: serverTimestamp(),
        read: false
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('id-ID');
    } else if (days > 0) {
      return `${days} hari yang lalu`;
    } else if (hours > 0) {
      return `${hours} jam yang lalu`;
    } else if (minutes > 0) {
      return `${minutes} menit yang lalu`;
    } else {
      return 'Baru saja';
    }
  };

  const formatMessageTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'in_revision':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Conversations List */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${
          chatId ? 'hidden md:flex' : 'flex'
        } w-full md:w-96 flex-col bg-white border-r border-gray-200`}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chat</h2>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/dashboard/freelancer/chat/${conversation.id}`}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                  conversation.id === chatId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-[#010042]/10 flex items-center justify-center">
                      {conversation.otherUser?.profilePhoto ? (
                        <img 
                          src={conversation.otherUser.profilePhoto} 
                          alt={conversation.otherUser.displayName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-[#010042] font-semibold">
                          {conversation.otherUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.otherUser?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageTime)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessageSender === currentUser.uid && 'Anda: '}
                      {conversation.lastMessage}
                    </p>
                    {conversation.orderId && (
                      <p className="text-xs text-[#010042] mt-1">
                        📦 Terkait pesanan
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">Belum ada percakapan</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Area */}
      {chatId && selectedConversation ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col"
        >
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link 
                  to="/dashboard/freelancer/chat"
                  className="md:hidden mr-4"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                </Link>
                <div className="h-10 w-10 rounded-full bg-[#010042]/10 flex items-center justify-center">
                  {selectedConversation.otherUser?.profilePhoto ? (
                    <img 
                      src={selectedConversation.otherUser.profilePhoto} 
                      alt={selectedConversation.otherUser.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-[#010042] font-semibold text-sm">
                      {selectedConversation.otherUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.otherUser?.displayName || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.otherUser?.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {orderInfo && (
                  <button 
                    onClick={() => setShowOrderDetails(!showOrderDetails)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <InformationCircleIcon className="h-5 w-5" />
                  </button>
                )}
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Order Info Bar */}
            {orderInfo && showOrderDetails && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {orderInfo.gig?.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Order #{orderInfo.id?.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(orderInfo.status)}`}>
                      {orderInfo.status === 'pending' && 'Menunggu'}
                      {orderInfo.status === 'active' && 'Aktif'}
                      {orderInfo.status === 'in_revision' && 'Revisi'}
                      {orderInfo.status === 'delivered' && 'Terkirim'}
                      {orderInfo.status === 'completed' && 'Selesai'}
                      {orderInfo.status === 'cancelled' && 'Dibatalkan'}
                    </span>
                    <Link 
                      to={`/dashboard/freelancer/orders/${orderInfo.id}`}
                      className="text-xs text-[#010042] hover:underline"
                    >
                      Lihat detail
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUser.uid;
              const showDate = index === 0 || 
                new Date(messages[index - 1]?.createdAt).toDateString() !== 
                new Date(message.createdAt).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {new Date(message.createdAt).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${
                      isOwnMessage 
                        ? 'bg-[#010042] text-white' 
                        : 'bg-gray-100 text-gray-900'
                    } rounded-lg px-4 py-2`}>
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                        isOwnMessage ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {isOwnMessage && (
                          message.read ? (
                            <CheckSolid className="h-4 w-4 text-blue-400" />
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <PaperClipIcon className="h-5 w-5" />
              </button>
              <button 
                type="button"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-[#010042] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Pilih percakapan
            </h3>
            <p className="text-gray-500">
              Pilih percakapan dari daftar untuk mulai chatting
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 