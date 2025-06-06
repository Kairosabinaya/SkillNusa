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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, skillBotTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize chat with gig analysis
  useEffect(() => {
    const initializeGigAnalysis = async () => {
      if (!gig || !currentUser) return;
      
      setLoading(true);
      try {
        // Generate initial analysis of the gig
        const gigAnalysis = await geminiService.analyzeGig(gig);
        
        // Create initial messages
        const welcomeMessage = {
          id: `gig-welcome-${Date.now()}`,
          content: `Hai! Saya lihat layanan "${gig.title}" ini. ${gigAnalysis}

Ada yang mau ditanyakan tentang layanan ini?`,
          senderId: 'skillbot',
          createdAt: new Date(),
          messageType: 'gig_analysis'
        };

        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Error initializing gig analysis:', error);
        // Fallback message
        const fallbackMessage = {
          id: `gig-fallback-${Date.now()}`,
          content: `Hai! Saya lihat layanan "${gig.title}" ini. Terlihat menarik! Ada yang mau ditanyakan?`,
          senderId: 'skillbot',
          createdAt: new Date(),
          messageType: 'welcome'
        };
        setMessages([fallbackMessage]);
      } finally {
        setLoading(false);
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

    setMessages(prev => [...prev, userMessage]);
    setSkillBotTyping(true);

    try {
      // Get AI response with gig context
      const aiResponse = await geminiService.analyzeGig(gig, messageContent);
      
      // Create bot response message
      const botMessage = {
        id: `bot-${Date.now()}`,
        content: aiResponse,
        senderId: 'skillbot',
        createdAt: new Date(Date.now() + 1000),
        messageType: 'gig_response'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting SkillBot response:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      // Add error response
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: 'Maaf, saya sedang mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat untuk analisis layanan SkillNusa.',
        senderId: 'skillbot',
        createdAt: new Date(),
        messageType: 'error'
      };

      setMessages(prev => [...prev, userMessage, errorMessage]);
    } finally {
      setSending(false);
      setSkillBotTyping(false);
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
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[600px] max-h-[800px] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">SkillBot AI</h3>
            <p className="text-xs text-gray-500">Analisis Layanan</p>
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
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          const isSkillBot = message.senderId === 'skillbot';
          const isCurrentUser = message.senderId === currentUser.uid;
          
          return (
            <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
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