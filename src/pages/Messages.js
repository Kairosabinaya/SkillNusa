import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import skillBotService from '../services/skillBotService';
import { MarkdownText } from '../utils/markdownUtils';
import PageContainer from '../components/common/PageContainer';

// Constants for SkillBot
const SKILLBOT_ID = 'skillbot';

export default function Messages() {
  const { chatId: paramChatId } = useParams();
  const [searchParams] = useSearchParams();
  const chatId = paramChatId || searchParams.get('chatId');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [skillBotTyping, setSkillBotTyping] = useState(false);
  
  // Real-time listeners cleanup functions
  const [chatsUnsubscribe, setChatsUnsubscribe] = useState(null);
  const [messagesUnsubscribe, setMessagesUnsubscribe] = useState(null);
  
  // Flag to prevent StrictMode double-mounting issues
  const isInitialized = useRef(false);

  // Load user chats and initialize SkillBot if needed
  useEffect(() => {
    if (!currentUser) return;

    // Prevent StrictMode double-mounting and multiple instances
    if (isInitialized.current) {
      console.log('⚠️ [Messages] Already initialized, skipping (likely StrictMode double-mount)');
      return;
    }
    
    // Check if there's already an active subscription for this user (global check)
    const existingSubscriptionCount = window.firebaseMonitor?.getSubscriptionStats?.()?.active || 0;
    if (existingSubscriptionCount >= 5) {
      console.error('🚨 [Messages] Too many active subscriptions detected, aborting initialization');
      console.log('🚨 [Messages] Current subscription count:', existingSubscriptionCount);
      return;
    }
    
    isInitialized.current = true;
    console.log('✅ [Messages] Initializing with subscription count:', existingSubscriptionCount);

    let isMounted = true; // Flag to prevent state updates on unmounted component
    
    const loadChats = async () => {
      try {
        // Auto-send welcome message for new users
        await skillBotService.autoSendWelcomeMessage(
          currentUser.uid, 
          currentUser.displayName || 'User'
        );
        
        // Clean up any existing subscription before creating new one
        if (chatsUnsubscribe) {
          chatsUnsubscribe();
          setChatsUnsubscribe(null);
        }
        
        // Set up real-time listener for chats
        const unsubscribe = chatService.subscribeToUserChats(currentUser.uid, (userChats) => {
          if (!isMounted) return; // Prevent state update if component is unmounted
          
          setChats(userChats);
          
          // If chatId is provided and chat hasn't been selected yet, select it
          if (chatId && !selectedChat) {
            // Handle SkillBot chatId - support both 'skillbot' and 'userId_skillbot' formats
            const isSkillBotChat = chatId === SKILLBOT_ID || chatId.includes(SKILLBOT_ID);
            
            if (isSkillBotChat) {
              // Find SkillBot chat in the loaded chats
              const skillBotChat = userChats.find(chat => 
                chat.id.includes(SKILLBOT_ID) || chat.isSkillBot
              );
              if (skillBotChat) {
                setSelectedChat(skillBotChat);
                loadSkillBotMessages();
              } else {
                // Create a virtual SkillBot chat if not found in list
                const virtualSkillBotChat = {
                  id: `${currentUser.uid}_${SKILLBOT_ID}`,
                  isSkillBot: true,
                  otherParticipant: {
                    displayName: 'SkillBot AI',
                    profilePhoto: '/images/robot.png'
                  }
                };
                setSelectedChat(virtualSkillBotChat);
                loadSkillBotMessages();
              }
            } else {
              const chat = userChats.find(c => c.id === chatId);
              if (chat) {
                setSelectedChat(chat);
                loadChatMessages(chatId);
              }
            }
          }
        });
        
        setChatsUnsubscribe(() => unsubscribe);
        
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadChats();

    // Cleanup on component unmount or dependency change
    return () => {
      isMounted = false;
      isInitialized.current = false; // Reset for potential re-initialization
      
      console.log('🧹 [Messages] Cleaning up subscriptions...');
      
      if (chatsUnsubscribe) {
        console.log('🧹 [Messages] Cleaning up chats subscription');
        chatsUnsubscribe();
        setChatsUnsubscribe(null);
      }
      if (messagesUnsubscribe) {
        console.log('🧹 [Messages] Cleaning up messages subscription');
        messagesUnsubscribe();
        setMessagesUnsubscribe(null);
      }
    };
  }, [currentUser?.uid]); // Only depend on user ID, not chatId or selectedChat

  // Separate effect for handling chatId changes
  useEffect(() => {
    if (!currentUser || !chatId || chats.length === 0) return;
    
    // Handle SkillBot chatId - support both 'skillbot' and 'userId_skillbot' formats
    const isSkillBotChat = chatId === SKILLBOT_ID || chatId.includes(SKILLBOT_ID);
    
    if (isSkillBotChat) {
      // Find SkillBot chat in the loaded chats
      const skillBotChat = chats.find(chat => 
        chat.id.includes(SKILLBOT_ID) || chat.isSkillBot
      );
      if (skillBotChat && skillBotChat.id !== selectedChat?.id) {
        setSelectedChat(skillBotChat);
        loadSkillBotMessages();
      } else if (!skillBotChat && (!selectedChat || !selectedChat.isSkillBot)) {
        // Create a virtual SkillBot chat if not found in list
        const virtualSkillBotChat = {
          id: `${currentUser.uid}_${SKILLBOT_ID}`,
          isSkillBot: true,
          otherParticipant: {
            displayName: 'SkillBot AI',
            profilePhoto: '/images/robot.png'
          }
        };
        setSelectedChat(virtualSkillBotChat);
        loadSkillBotMessages();
      }
    } else {
      const chat = chats.find(c => c.id === chatId);
      if (chat && chat.id !== selectedChat?.id) {
        setSelectedChat(chat);
        loadChatMessages(chatId);
      }
    }
  }, [chatId, chats, currentUser?.uid]); // Don't include selectedChat to prevent loops

  // Load SkillBot messages with real-time updates
  const loadSkillBotMessages = async () => {
    try {
      // Clean up existing message listener first
      if (messagesUnsubscribe) {
        console.log('🧹 [Messages] Cleaning up existing SkillBot subscription');
        messagesUnsubscribe();
        setMessagesUnsubscribe(null);
      }

      const conversation = await skillBotService.getSkillBotConversation(currentUser.uid);
      if (conversation && conversation.messages) {
        setMessages(conversation.messages);
      } else {
        // Initialize conversation if it doesn't exist
        const newConversation = await skillBotService.initializeSkillBotForUser(
          currentUser.uid,
          currentUser.displayName || 'User'
        );
        setMessages(newConversation.messages);
      }
      
      // Mark SkillBot messages as read
      await skillBotService.markSkillBotAsRead(currentUser.uid);
      
      // Set up real-time listener for SkillBot conversation
      const conversationId = `${currentUser.uid}_${SKILLBOT_ID}`;
      console.log('📡 [Messages] Setting up SkillBot subscription for:', conversationId);
      
      const unsubscribe = skillBotService.subscribeToSkillBotConversation(conversationId, (conversationData) => {
        if (conversationData && conversationData.messages) {
          setMessages(conversationData.messages);
        }
      });
      
      setMessagesUnsubscribe(() => unsubscribe);
      
    } catch (error) {
      console.error('Error loading SkillBot messages:', error);
      // Fallback to welcome message
      const fallbackMessage = {
        id: 'fallback-welcome',
        content: 'Hai! Saya SkillBot, asisten AI yang akan membantu Anda menemukan freelancer yang tepat untuk project Anda. Ceritakan tentang project yang Anda butuhkan!',
        senderId: SKILLBOT_ID,
        createdAt: new Date(),
        messageType: 'welcome'
      };
      setMessages([fallbackMessage]);
    }
  };

  // Load messages for selected chat with real-time updates
  const loadChatMessages = async (chatId) => {
    // Check if this is a SkillBot chat (support both 'skillbot' and 'userId_skillbot' formats)
    const isSkillBotChat = chatId === SKILLBOT_ID || chatId.includes(SKILLBOT_ID);
    
    if (isSkillBotChat) {
      await loadSkillBotMessages();
      return;
    }

    try {
      // Clean up existing message listener first
      if (messagesUnsubscribe) {
        console.log('🧹 [Messages] Cleaning up existing chat subscription');
        messagesUnsubscribe();
        setMessagesUnsubscribe(null);
      }

      console.log('📡 [Messages] Setting up chat subscription for:', chatId);

      // Set up real-time listener for regular chat messages
      const unsubscribe = chatService.subscribeToChatMessages(chatId, (chatMessages) => {
        setMessages(chatMessages);
      });
      
      setMessagesUnsubscribe(() => unsubscribe);
      
      // Mark messages as read
      await chatService.markMessagesAsRead(chatId, currentUser.uid);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle chat selection
  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    
    // Use consistent chatId format for navigation
    let navigationChatId = chat.id;
    if (chat.isSkillBot || chat.id.includes(SKILLBOT_ID)) {
      // Always use simple 'skillbot' format for URL navigation
      navigationChatId = SKILLBOT_ID;
    }
    
    navigate(`/messages?chatId=${navigationChatId}`);
    loadChatMessages(chat.id);
    
    // Mark SkillBot as read if selecting SkillBot chat
    if (chat.isSkillBot || chat.id.includes(SKILLBOT_ID)) {
      skillBotService.markSkillBotAsRead(currentUser.uid);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    
    try {
      // Check if this is SkillBot chat (support both formats)
      const isSkillBotChat = selectedChat.isSkillBot || selectedChat.id.includes(SKILLBOT_ID);
      
      if (isSkillBotChat) {
        // Optimistic update: Add user message immediately to UI
        const userMessage = {
          id: `user-${Date.now()}`,
          content: messageContent,
          senderId: currentUser.uid,
          createdAt: new Date(),
          messageType: 'user'
        };
        
        setMessages(prev => [...prev, userMessage]);
        setSkillBotTyping(true);
        
        try {
          // Handle SkillBot chat with real AI
          const result = await skillBotService.sendMessageToSkillBot(
            currentUser.uid,
            messageContent,
            {
              // Add any context that might be helpful
              availableGigs: [], // Could fetch relevant gigs based on message
              currentGig: null
            }
          );
          
          // Messages will be updated automatically through real-time listener
          // The optimistic user message will be replaced by the real one from database
          
        } catch (error) {
          console.error('Error sending message to SkillBot:', error);
          
          // Remove optimistic message and show error
          setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
          
          // Add error response
          const errorMessage = {
            id: `error-${Date.now()}`,
            content: "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat.",
            senderId: SKILLBOT_ID,
            createdAt: new Date(),
            messageType: 'error'
          };
          
          setMessages(prev => [...prev, userMessage, errorMessage]);
        } finally {
          setSkillBotTyping(false);
        }
      } else {
        // Handle regular chat
        await chatService.sendMessage(
          selectedChat.id,
          currentUser.uid,
          messageContent
        );
        // Messages will be updated automatically through real-time listener
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hari ini';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Kemarin';
    } else {
      return date.toLocaleDateString('id-ID');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042] mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat percakapan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageContainer padding="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm h-[80vh] flex">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Percakapan</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 relative">
                      {(chat.isSkillBot || chat.id.includes(SKILLBOT_ID)) ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={chat.otherParticipant?.profilePhoto || '/images/default-avatar.png'}
                          alt={chat.otherParticipant?.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.otherParticipant?.displayName}
                        {(chat.isSkillBot || chat.id.includes(SKILLBOT_ID)) && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                            🤖 AI Assistant
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 relative">
                      {(selectedChat.isSkillBot || selectedChat.id.includes(SKILLBOT_ID)) ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={selectedChat.otherParticipant?.profilePhoto || '/images/default-avatar.png'}
                          alt={selectedChat.otherParticipant?.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedChat.otherParticipant?.displayName}
                      </h3>
                      {(selectedChat.isSkillBot || selectedChat.id.includes(SKILLBOT_ID)) && (
                        <p className="text-sm text-green-600">
                          {skillBotTyping ? 'Mengetik...' : 'Online • AI Assistant'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => {
                    const isSkillBot = message.senderId === SKILLBOT_ID;
                    const isCurrentUser = message.senderId === currentUser.uid;
                    
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-[#010042] text-white' 
                            : isSkillBot 
                            ? 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900 border border-blue-200 skillbot-message shadow-md'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {isSkillBot && (
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                </svg>
                              </div>
                              <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SkillBot AI</span>
                            </div>
                          )}
                          {isSkillBot ? (
                            <MarkdownText className="text-sm">
                              {message.content}
                            </MarkdownText>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {skillBotTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 px-4 py-2 rounded-lg shadow-md">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SkillBot AI</span>
                        </div>
                        <div className="flex space-x-1 mt-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        (selectedChat.isSkillBot || selectedChat.id.includes(SKILLBOT_ID))
                          ? "Ceritakan tentang project yang Anda butuhkan..."
                          : "Ketik pesan..."
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent"
                      disabled={sending || skillBotTyping}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending || skillBotTyping}
                      className="px-6 py-2 bg-[#010042] text-white rounded-lg hover:bg-[#0100a3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? 'Mengirim...' : 'Kirim'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Percakapan</h3>
                  <p className="text-gray-500">Pilih percakapan dari daftar untuk mulai berkirim pesan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
} 