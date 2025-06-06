import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import skillBotService from '../services/skillBotService';
import cartService from '../services/cartService';
import favoriteService from '../services/favoriteService';
import gigService from '../services/gigService';
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
  const [cleanupInProgress, setCleanupInProgress] = useState(false);
  const [showCleanupNotification, setShowCleanupNotification] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [favoriteGigs, setFavoriteGigs] = useState(new Set());
  const [cartGigs, setCartGigs] = useState(new Set());
  const [ownGigs, setOwnGigs] = useState(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Real-time listeners cleanup functions
  const [chatsUnsubscribe, setChatsUnsubscribe] = useState(null);
  const [messagesUnsubscribe, setMessagesUnsubscribe] = useState(null);
  
  // Message templates for SkillBot
  const skillBotTemplates = [
    "Gig apa yang cocok untuk project saya di SkillNusa?",
    "Rekomendasi freelancer berdasarkan budget saya",
  ];
  
  // Flag to prevent StrictMode double-mounting issues
  const isInitialized = useRef(false);
  
  // Ref for scrolling to bottom of messages
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // Ref for debouncing chat selection
  const chatSelectionTimeoutRef = useRef(null);
  
    // Auto-reload handler for subscription cleanup and infinite loading detection
  useEffect(() => {
    const handleForceCleanup = (event) => {
      console.log('🔄 [Messages] Received force cleanup event, reloading page...');
      setCleanupInProgress(true);
      setShowCleanupNotification(true);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    // Listen for global cleanup events
    window.addEventListener('forceCleanupSubscriptions', handleForceCleanup);
    
    return () => {
      window.removeEventListener('forceCleanupSubscriptions', handleForceCleanup);
    };
  }, []);
  
  // Scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    // Use scrollTop instead of scrollIntoView to keep scroll within the messages container
    if (messagesContainerRef.current) {
      if (smooth) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  };

  // Load SkillBot messages with real-time updates
  const loadSkillBotMessages = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('📡 [Messages] Loading SkillBot messages...');
      
      // Set loading state
      setMessages([]); // Clear immediately
      
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
        console.log('📡 [Messages] Received SkillBot conversation update:', conversationData?.messages?.length || 0, 'messages');
        
        // Direct update - the cleanup in handleChatSelect should prevent conflicts
        if (conversationData && conversationData.messages) {
          console.log('📡 [Messages] Updating SkillBot messages');
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
  }, [currentUser]);

  // Load messages for selected chat with real-time updates
  const loadChatMessages = useCallback(async (chatId) => {
    if (!currentUser) return;
    
    // Check if this is a SkillBot chat (support both 'skillbot' and 'userId_skillbot' formats)
    const isSkillBotChat = chatId === SKILLBOT_ID || chatId.includes(SKILLBOT_ID);
    
    if (isSkillBotChat) {
      await loadSkillBotMessages();
      return;
    }

    try {
      console.log('📡 [Messages] Loading regular chat messages for:', chatId);
      
      // Set loading state
      setMessages([]); // Clear immediately

      console.log('📡 [Messages] Setting up chat subscription for:', chatId);

      // Set up real-time listener for regular chat messages
      const unsubscribe = chatService.subscribeToChatMessages(chatId, (chatMessages) => {
        console.log('📡 [Messages] Received chat messages:', chatMessages?.length || 0, 'messages for chatId:', chatId);
        
        // Direct update - the cleanup in handleChatSelect should prevent conflicts
        console.log('📡 [Messages] Updating messages for regular chat:', chatId);
        setMessages(chatMessages || []);
      });
      
      setMessagesUnsubscribe(() => unsubscribe);
      
      // Mark messages as read
      await chatService.markMessagesAsRead(chatId, currentUser.uid);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [currentUser, loadSkillBotMessages]);

  // Auto-scroll when messages change - with debouncing to prevent excessive scrolling
  useEffect(() => {
    if (messages.length === 0) return; // Don't scroll when messages are cleared
    
    // Use setTimeout to ensure DOM has been updated before scrolling
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages.length]); // Only depend on message count, not the entire messages array

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000); // 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Load user chats and initialize SkillBot if needed
  useEffect(() => {
    if (!currentUser) return;

    // Prevent StrictMode double-mounting and multiple instances
    if (isInitialized.current) {
      console.log('⚠️ [Messages] Already initialized, skipping (likely StrictMode double-mount)');
      return;
    }
    
    // Log current subscription count for debugging
    const existingSubscriptionCount = window.firebaseMonitor?.getSubscriptionStats?.()?.active || 0;
    console.log('📊 [Messages] Current subscription count:', existingSubscriptionCount);
    
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
      
      // Clear chat selection timeout
      if (chatSelectionTimeoutRef.current) {
        clearTimeout(chatSelectionTimeoutRef.current);
      }
      
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
  }, [currentUser?.uid]); // Only depend on user ID

  // Separate effect for handling chatId changes - this handles initial chat selection from URL
  useEffect(() => {
    if (!currentUser || !chatId || chats.length === 0) return;
    
    // Prevent redundant operations if chat is already selected
    if (selectedChat && (
      selectedChat.id === chatId || 
      (chatId === SKILLBOT_ID && (selectedChat.isSkillBot || selectedChat.id.includes(SKILLBOT_ID)))
    )) {
      return;
    }
    
    // Handle SkillBot chatId - support both 'skillbot' and 'userId_skillbot' formats
    const isSkillBotChat = chatId === SKILLBOT_ID || chatId.includes(SKILLBOT_ID);
    
    if (isSkillBotChat) {
      // Find SkillBot chat in the loaded chats
      const skillBotChat = chats.find(chat => 
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
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        loadChatMessages(chatId);
      }
    }
     }, [chatId, chats, currentUser?.uid, loadSkillBotMessages, loadChatMessages]); // Include the functions in dependencies

  // Handle chat selection with debouncing
  const handleChatSelect = (chat) => {
    // Clear any pending chat selection
    if (chatSelectionTimeoutRef.current) {
      clearTimeout(chatSelectionTimeoutRef.current);
    }
    
    // Immediately update UI
    setSelectedChat(chat);
    setMessages([]);
    setMessagesLoading(true);
    
    // Clean up existing subscription first
    if (messagesUnsubscribe) {
      console.log('🧹 [Messages] Cleaning up previous message subscription before switching chat');
      messagesUnsubscribe();
      setMessagesUnsubscribe(null);
    }
    
    // Use consistent chatId format for navigation
    let navigationChatId = chat.id;
    if (chat.isSkillBot || chat.id.includes(SKILLBOT_ID)) {
      // Always use simple 'skillbot' format for URL navigation
      navigationChatId = SKILLBOT_ID;
    }
    
    navigate(`/messages?chatId=${navigationChatId}`);
    
    // Debounce the actual message loading to prevent rapid switching issues
    chatSelectionTimeoutRef.current = setTimeout(() => {
      loadChatMessages(chat.id).finally(() => {
        setMessagesLoading(false);
        // Scroll to bottom immediately when switching chats (no smooth animation)
        setTimeout(() => scrollToBottom(false), 50);
      });
      
      // Mark SkillBot as read if selecting SkillBot chat
      if (chat.isSkillBot || chat.id.includes(SKILLBOT_ID)) {
        skillBotService.markSkillBotAsRead(currentUser.uid);
      }
    }, 100); // Small delay to prevent rapid switching
  };

  // Load user favorites, cart items, and own gigs
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      
      try {
        // Load favorites
        const userFavorites = await favoriteService.getUserFavorites(currentUser.uid);
        const favoriteGigIds = new Set(userFavorites.map(fav => fav.gigId));
        setFavoriteGigs(favoriteGigIds);

        // Load cart items
        const cartItems = await cartService.getCartItems(currentUser.uid);
        const cartGigIds = new Set(cartItems.map(item => item.gigId));
        setCartGigs(cartGigIds);

        // Load own gigs (check for all users, not just freelancers)
        try {
          const freelancerGigs = await gigService.getFreelancerGigs(currentUser.uid);
          const ownGigIds = new Set(freelancerGigs.map(gig => gig.id));
          setOwnGigs(ownGigIds);
        } catch (error) {
          // If getFreelancerGigs fails (user has no gigs), just set empty set
          console.log('User has no gigs or error loading gigs:', error);
          setOwnGigs(new Set());
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [currentUser]);

  // Handle template message click
  const handleTemplateClick = (template) => {
    setNewMessage(template);
  };

  // Handle reset chat
  const handleResetChat = async () => {
    if (!currentUser || !selectedChat?.isSkillBot) return;
    
    try {
      setActionLoading('reset_chat');
      
      // Reset SkillBot conversation
      await skillBotService.resetSkillBotConversation(currentUser.uid);
      
      // Initialize new conversation
      const newConversation = await skillBotService.initializeSkillBotForUser(
        currentUser.uid,
        currentUser.displayName || 'User'
      );
      
      setMessages(newConversation.messages);
      setTimeout(() => scrollToBottom(), 50);
    } catch (error) {
      console.error('Error resetting chat:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle gig card actions
  const handleGigAction = async (action, gig) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Clear previous errors/success messages
    setError('');
    setSuccess('');

    const isOwnGig = (currentUser && gig && currentUser.uid === gig.freelancerId) || ownGigs.has(gig.id);
    setActionLoading(`${action}-${gig.id}`);

    try {
      switch (action) {
        case 'view_details':
          navigate(`/gig/${gig.id}`);
          break;
          
        case 'toggle_favorite':
          // Prevent freelancer from favoriting their own gig
          if (isOwnGig) {
            setError('Anda tidak dapat menyukai gig Anda sendiri');
            return;
          }

          const isCurrentlyFavorited = favoriteGigs.has(gig.id);
          
          if (isCurrentlyFavorited) {
            await favoriteService.removeFromFavorites(currentUser.uid, gig.id);
            setFavoriteGigs(prev => {
              const newSet = new Set(prev);
              newSet.delete(gig.id);
              return newSet;
            });
            setSuccess('Dihapus dari favorit');
            
            // Send success message to SkillBot
            const removeFavMessage = {
              id: `fav-${Date.now()}`,
              content: `💔 Gig "${gig.title}" dihapus dari favorit!`,
              senderId: SKILLBOT_ID,
              createdAt: new Date(),
              messageType: 'system_notification'
            };
            setMessages(prev => [...prev, removeFavMessage]);
          } else {
            await favoriteService.addToFavorites(currentUser.uid, gig.id);
            setFavoriteGigs(prev => new Set(prev).add(gig.id));
            setSuccess('Ditambahkan ke favorit');
            
            // Send success message to SkillBot
            const favMessage = {
              id: `fav-${Date.now()}`,
              content: `✅ Gig "${gig.title}" berhasil ditambahkan ke favorit!`,
              senderId: SKILLBOT_ID,
              createdAt: new Date(),
              messageType: 'system_notification'
            };
            setMessages(prev => [...prev, favMessage]);
          }
          setTimeout(() => scrollToBottom(), 50);
          break;
          
        case 'add_to_cart':
          // Prevent freelancer from adding own gig to cart
          if (isOwnGig) {
            setError('Anda tidak dapat menambahkan gig Anda sendiri ke keranjang');
            return;
          }

          await cartService.addToCart(currentUser.uid, {
            gigId: gig.id,
            packageType: 'basic'
          });

          setCartGigs(prev => new Set(prev).add(gig.id));
          setSuccess('Item berhasil ditambahkan ke keranjang!');
          
          // Refresh cart count in dashboard if available
          if (window.refreshClientOrdersCount) {
            window.refreshClientOrdersCount();
          }
          
          // Send success message to SkillBot
          const cartMessage = {
            id: `cart-${Date.now()}`,
            content: `🛒 Gig "${gig.title}" berhasil ditambahkan ke keranjang!`,
            senderId: SKILLBOT_ID,
            createdAt: new Date(),
            messageType: 'system_notification'
          };
          setMessages(prev => [...prev, cartMessage]);
          setTimeout(() => scrollToBottom(), 50);
          break;
          
        default:
          console.warn('Unknown gig action:', action);
      }
    } catch (error) {
      console.error('Error handling gig action:', error);
      setError('Gagal memproses aksi: ' + error.message);
      
      // Send error message to SkillBot
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: `❌ Maaf, terjadi kesalahan saat memproses aksi di SkillNusa. Silakan coba lagi.`,
        senderId: SKILLBOT_ID,
        createdAt: new Date(),
        messageType: 'system_notification'
      };
      setMessages(prev => [...prev, errorMessage]);
      setTimeout(() => scrollToBottom(), 50);
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price || 0);
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
        
        // Scroll to show user's message immediately
        setTimeout(() => scrollToBottom(), 50);
        
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
            content: "Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat untuk mencari freelancer di SkillNusa.",
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

  if (loading || cleanupInProgress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042] mx-auto"></div>
          {cleanupInProgress ? (
            <div className="mt-4">
              <p className="text-gray-900 font-medium">Membersihkan koneksi...</p>
              <p className="text-sm text-gray-600 mt-1">Halaman akan dimuat ulang secara otomatis</p>
            </div>
          ) : (
            <p className="mt-4 text-gray-600">Memuat percakapan...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cleanup Notification Toast */}
      {showCleanupNotification && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          <div>
            <p className="font-medium">Membersihkan Koneksi</p>
            <p className="text-sm opacity-90">Halaman akan dimuat ulang...</p>
          </div>
        </div>
      )}
      
      <PageContainer padding="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Percakapan</h1>
          <p className="text-gray-600">Kelola semua percakapan Anda</p>
        </div>
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
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={chat.otherParticipant?.profilePhoto || '/images/default-profile.jpg'}
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
                    
                    {/* Unread Count Badge */}
                    {chat.unreadCount?.[currentUser?.uid] > 0 && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {chat.unreadCount[currentUser.uid] > 9 ? '9+' : chat.unreadCount[currentUser.uid]}
                        </span>
                      </div>
                    )}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 relative">
                        {(selectedChat.isSkillBot || selectedChat.id.includes(SKILLBOT_ID)) ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                            </svg>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={selectedChat.otherParticipant?.profilePhoto || '/images/default-profile.jpg'}
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
                    
                    {/* Reset button for SkillBot */}
                    {(selectedChat.isSkillBot || selectedChat.id.includes(SKILLBOT_ID)) && (
                      <button
                        onClick={handleResetChat}
                        disabled={actionLoading === 'reset_chat'}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        title="Reset percakapan"
                      >
                        {actionLoading === 'reset_chat' ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Reset</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                      <div className="ml-auto pl-3">
                        <button
                          onClick={() => setError('')}
                          className="inline-flex text-red-400 hover:text-red-600"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-700">{success}</p>
                      </div>
                      <div className="ml-auto pl-3">
                        <button
                          onClick={() => setSuccess('')}
                          className="inline-flex text-green-400 hover:text-green-600"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading && (
                    <div className="flex justify-center items-center py-8">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#010042]"></div>
                        <span className="text-gray-600">Memuat pesan...</span>
                      </div>
                    </div>
                  )}
                  {messages.map((message) => {
                    const isSkillBot = message.senderId === SKILLBOT_ID;
                    const isCurrentUser = message.senderId === currentUser.uid;
                    
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser 
                            ? 'bg-[#010042] text-white' 
                            : isSkillBot 
                            ? message.messageType === 'system_notification'
                              ? 'bg-gradient-to-br from-green-50 to-blue-50 text-gray-800 border border-green-200 shadow-sm'
                              : 'bg-gradient-to-br from-blue-50 to-purple-50 text-gray-900 border border-blue-200 skillbot-message shadow-md'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {isSkillBot && (
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
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
                  
                  {/* Gig Recommendation Cards */}
                  {messages.filter(msg => msg.messageType === 'gig_recommendations' && msg.recommendedGigs).map((recMsg) => (
                    <div key={`${recMsg.id}-gigs`} className="flex justify-start">
                      <div className="max-w-xs lg:max-w-md w-full">
                        <div className="space-y-3 mt-3">
                          {recMsg.recommendedGigs?.map((gig) => {
                            // Check if current user owns this gig - use freelancerId from gig data
                            const isOwnGig = currentUser && gig && (currentUser.uid === gig.freelancerId || ownGigs.has(gig.id));
                            
                            return (
                              <div key={gig.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="p-4">
                                <div className="flex items-start space-x-4">
                                  <img 
                                    src={gig.image || '/images/default-gig.jpg'} 
                                    alt={gig.title}
                                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 text-base line-clamp-2 mb-2">
                                      {gig.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-2">
                                      oleh {gig.freelancer?.displayName || 'Freelancer'}
                                      {isOwnGig && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Gig Anda</span>}
                                        </p>
                                          <div className="flex items-center space-x-3 text-sm text-gray-500 mb-3">
                                          <span className="flex items-center">
                                          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                          </svg>
                                          {gig.rating || 0} {gig.reviewCount ? `(${gig.reviewCount} review)` : ''}
                                          </span>
                                          <span>•</span>
                                          <span>{gig.deliveryTime || 7} hari pengerjaan</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 mb-3">
                                          {formatPrice(gig.price)}
                                        </p>
                                    
                                                                         {/* Action Buttons */}
                                     <div className="flex space-x-2">
                                       <button
                                         onClick={() => handleGigAction('view_details', gig)}
                                         disabled={actionLoading === `view_details-${gig.id}`}
                                         className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                       >
                                         {actionLoading === `view_details-${gig.id}` ? 'Loading...' : 'Lihat Detail'}
                                       </button>
                                       
                                       {/* Favorite Button */}
                                       <button
                                         onClick={() => handleGigAction('toggle_favorite', gig)}
                                         disabled={actionLoading === `toggle_favorite-${gig.id}` || isOwnGig}
                                         className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                           isOwnGig
                                             ? 'bg-gray-100 text-gray-400 border-gray-200'
                                             : favoriteGigs.has(gig.id)
                                             ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                             : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                         }`}
                                         title={isOwnGig ? 'Tidak dapat menyukai gig sendiri' : (favoriteGigs.has(gig.id) ? 'Hapus dari favorit' : 'Tambah ke favorit')}
                                       >
                                         {actionLoading === `toggle_favorite-${gig.id}` ? (
                                           <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-current mx-auto"></div>
                                         ) : (
                                           <div className="flex items-center justify-center">
                                             <svg 
                                               className="w-4 h-4 mr-1" 
                                               fill={favoriteGigs.has(gig.id) && !isOwnGig ? 'currentColor' : 'none'} 
                                               stroke="currentColor" 
                                               viewBox="0 0 24 24"
                                             >
                                               <path 
                                                 strokeLinecap="round" 
                                                 strokeLinejoin="round" 
                                                 strokeWidth={2} 
                                                 d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                                               />
                                             </svg>
                                                                                            {isOwnGig 
                                                ? 'Favorit' 
                                                : favoriteGigs.has(gig.id) 
                                                ? 'Favorited' 
                                                : 'Favorit'
                                               }
                                           </div>
                                         )}
                                       </button>
                                       
                                       {/* Cart Button */}
                                       <button
                                         onClick={() => handleGigAction('add_to_cart', gig)}
                                         disabled={actionLoading === `add_to_cart-${gig.id}` || cartGigs.has(gig.id) || isOwnGig}
                                         className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                           isOwnGig
                                             ? 'bg-gray-100 text-gray-400 border border-gray-200'
                                             : cartGigs.has(gig.id)
                                             ? 'bg-gray-100 text-gray-600 border border-gray-300'
                                             : 'bg-green-600 text-white hover:bg-green-700'
                                         }`}
                                         title={isOwnGig ? 'Tidak dapat menambahkan gig sendiri ke keranjang' : (cartGigs.has(gig.id) ? 'Sudah ada di keranjang' : 'Tambah ke keranjang')}
                                       >
                                         {actionLoading === `add_to_cart-${gig.id}` ? (
                                           <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-current mx-auto"></div>
                                         ) : (
                                           <div className="flex items-center justify-center">
                                                                                            {isOwnGig 
                                                ? 'Keranjang' 
                                                : cartGigs.has(gig.id) 
                                                ? 'In Cart' 
                                                : 'Keranjang'
                                               }
                                           </div>
                                         )}
                                       </button>
                                     </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {skillBotTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 px-4 py-2 rounded-lg shadow-md">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
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
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Templates for SkillBot */}
                {(selectedChat?.isSkillBot || selectedChat?.id.includes(SKILLBOT_ID)) && messages.length <= 2 && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-3">💡 Coba mulai dengan:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {skillBotTemplates.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => handleTemplateClick(template)}
                          className="text-left text-sm p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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