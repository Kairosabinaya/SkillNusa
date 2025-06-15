import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import skillBotService from '../../services/skillBotService';
import geminiService from '../../services/geminiService';
import { MarkdownText } from '../../utils/markdownUtils';

export default function GigAnalysisChat({ gig, onClose }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [skillBotTyping, setSkillBotTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, skillBotTyping]);

  // Monitor messages changes for debugging
  useEffect(() => {
    console.log('[SkillBot] Messages state changed:', {
      count: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        type: m.messageType,
        sender: m.senderId,
        contentPreview: m.content.substring(0, 50) + '...'
      }))
    });
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current && messagesEndRef.current) {
      // Scroll within the chat container only
      const container = scrollContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const height = container.clientHeight;
      const maxScrollTop = scrollHeight - height;
      
      container.scrollTo({
        top: maxScrollTop,
        behavior: 'smooth'
      });
    }
  };

  // Initialize chat with gig analysis
  useEffect(() => {
    const initializeGigAnalysis = async () => {
      if (!gig || !currentUser) return;
      
      setLoading(true);
      console.log('[SkillBot] Initializing gig analysis...');
      console.log('[SkillBot] Gemini service available:', geminiService.isServiceAvailable());
      
      try {
        // Generate initial analysis of the gig
        const gigAnalysis = await geminiService.analyzeGig(gig);
        console.log('[SkillBot] Initial analysis received:', gigAnalysis?.substring(0, 100) + '...');
        
        // Create initial messages
        const welcomeMessage = {
          id: `gig-welcome-${Date.now()}`,
          content: `Hai! Saya lihat layanan "${gig.title}" ini. ${gigAnalysis}

Ada yang mau ditanyakan tentang layanan ini?`,
          senderId: 'skillbot',
          createdAt: new Date(),
          messageType: 'gig_analysis'
        };

        console.log('[SkillBot] Setting initial welcome message');
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('[SkillBot] Error initializing gig analysis:', error);
        console.error('[SkillBot] Error details:', {
          name: error.name,
          message: error.message,
          apiAvailable: geminiService.isServiceAvailable()
        });
        
        // Fallback message
        const fallbackMessage = {
          id: `gig-fallback-${Date.now()}`,
          content: `Hai! Saya lihat layanan "${gig.title}" ini. Terlihat menarik! Ada yang mau ditanyakan?`,
          senderId: 'skillbot',
          createdAt: new Date(),
          messageType: 'welcome'
        };
        
        console.log('[SkillBot] Setting fallback message');
        setMessages([fallbackMessage]);
      } finally {
        setLoading(false);
        console.log('[SkillBot] Initialization completed');
      }
    };

    initializeGigAnalysis();
  }, [gig, currentUser]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Optimistic update: Add user message immediately to UI
    const userMessage = {
      id: `user-${Date.now()}`,
      content: messageContent,
      senderId: currentUser.uid,
      createdAt: new Date(),
      messageType: 'user'
    };

    console.log('[SkillBot] Adding user message:', userMessage);
    setMessages(prev => {
      console.log('[SkillBot] Previous messages:', prev.length);
      const newMessages = [...prev, userMessage];
      console.log('[SkillBot] New messages after user:', newMessages.length);
      return newMessages;
    });
    setSkillBotTyping(true);

    try {
      console.log('[SkillBot] Calling geminiService.analyzeGig...');
      // Get AI response with gig context
      const aiResponse = await geminiService.analyzeGig(gig, messageContent);
      console.log('[SkillBot] Got AI response:', aiResponse?.substring(0, 100) + '...');
      
      // Create bot response message
      const botMessage = {
        id: `bot-${Date.now()}`,
        content: aiResponse,
        senderId: 'skillbot',
        createdAt: new Date(Date.now() + 1000),
        messageType: 'gig_response'
      };

      console.log('[SkillBot] Adding bot message:', botMessage);
      setMessages(prev => {
        console.log('[SkillBot] Previous messages before bot:', prev.length);
        const newMessages = [...prev, botMessage];
        console.log('[SkillBot] New messages after bot:', newMessages.length);
        return newMessages;
      });
    } catch (error) {
      console.error('[SkillBot] Error getting SkillBot response:', error);
      console.error('[SkillBot] Error type:', error.name);
      console.error('[SkillBot] Error message:', error.message);
      
      // DON'T remove the user message - keep it visible
      // setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      let errorContent = 'Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat untuk analisis layanan SkillNusa.';
      
             // Handle specific error types
       if (error.message && error.message.includes('size limit')) {
         errorContent = '📝 Conversation telah dipangkas otomatis. Pesan Anda sedang diproses ulang...';
       } else if (error.message && error.message.includes('quota')) {
        errorContent = '⏰ API quota habis sementara. Silakan coba lagi dalam beberapa menit.';
      } else if (error.message && error.message.includes('network')) {
        errorContent = '🌐 Masalah koneksi. Silakan cek internet Anda dan coba lagi.';
      }
      
      // Add error response
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: errorContent,
        senderId: 'skillbot',
        createdAt: new Date(),
        messageType: 'error'
      };

      console.log('[SkillBot] Adding error message:', errorMessage);
      setMessages(prev => {
        console.log('[SkillBot] Messages before error:', prev.length);
        const newMessages = [...prev, errorMessage];
        console.log('[SkillBot] Messages after error:', newMessages.length);
        return newMessages;
      });
    } finally {
      setSending(false);
      setSkillBotTyping(false);
      console.log('[SkillBot] handleSendMessage completed');
    }
  };

  // Quick question buttons
  const quickQuestions = [
    "Cocok buat project saya?",
    "Package mana yang bagus?", 
    "Berapa lama totalnya?",
    "Freelancernya gimana?",
    "Ada yang perlu disiapkan?"
  ];

  const handleQuickQuestion = (question) => {
    setNewMessage(question);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Menganalisis layanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[600px] max-h-[800px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900">SkillBot AI</h3>
              <div className={`w-2 h-2 rounded-full ${geminiService.isServiceAvailable() ? 'bg-green-500' : 'bg-red-500'}`} 
                   title={geminiService.isServiceAvailable() ? 'API Connected' : 'API Disconnected'}></div>
            </div>
            <p className="text-xs text-gray-500">
              Analisis Layanan {!geminiService.isServiceAvailable() && ' - API Error'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {!geminiService.isServiceAvailable() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">API Tidak Tersedia</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Kemungkinan penyebab: API key belum diset, quota habis, atau masalah koneksi. 
                  Cek console browser untuk detail error.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message) => {
          const isSkillBot = message.senderId === 'skillbot';
          const isCurrentUser = message.senderId === currentUser.uid;
          const isSystemMessage = message.messageType === 'system_archive_notice' || message.messageType === 'system_trim_notice' || message.messageType === 'system_cleanup_notice';
          
          return (
            <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              {isSystemMessage ? (
                <div className="w-full max-w-md mx-auto">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-medium text-blue-700">System Notice</span>
                    </div>
                    <p className="text-xs text-blue-600">{message.content}</p>
                    <p className="text-xs text-blue-500 mt-1">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`max-w-sm px-4 py-3 rounded-lg text-sm ${
                  isCurrentUser 
                    ? 'bg-blue-500 text-white' 
                    : isSkillBot 
                    ? 'bg-gray-100 text-gray-900 skillbot-message'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  {isSkillBot && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-medium text-blue-600">SkillBot</span>
                    </div>
                  )}
                  {isSkillBot ? (
                    <MarkdownText className="text-sm leading-relaxed">
                      {message.content}
                    </MarkdownText>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  )}
                  <p className={`text-xs mt-2 ${
                    isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        
        {skillBotTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-blue-600">SkillBot</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-500 mb-2">Pertanyaan cepat:</p>
          <div className="flex flex-wrap gap-1">
            {quickQuestions.slice(0, 3).map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tanyakan tentang layanan ini..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending || skillBotTyping}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || skillBotTyping}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {sending ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 