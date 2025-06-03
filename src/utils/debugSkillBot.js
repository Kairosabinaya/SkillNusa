/**
 * SkillBot Debug Utility
 * Use this to troubleshoot SkillBot issues
 */

import { db } from '../firebase/config';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { COLLECTIONS } from './constants';

class SkillBotDebugger {
  static async checkEnvironment() {
    console.log('🔍 SkillBot Environment Check:');
    console.log('===============================');
    
    // Check Gemini API Key
    const geminiKey = process.env.REACT_APP_GEMINI_API_KEY;
    console.log('✅ Gemini API Key exists:', !!geminiKey);
    console.log('📏 Gemini API Key length:', geminiKey ? geminiKey.length : 0);
    
    if (!geminiKey) {
      console.error('❌ MISSING: REACT_APP_GEMINI_API_KEY');
      console.log('📝 Add this to your .env file:');
      console.log('   REACT_APP_GEMINI_API_KEY=your-api-key-here');
    }

    // Check Firebase config
    console.log('🔥 Firebase Config:');
    const firebaseKeys = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_STORAGE_BUCKET',
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID'
    ];

    firebaseKeys.forEach(key => {
      const value = process.env[key];
      console.log(`   ${key}: ${value ? '✅ Set' : '❌ Missing'}`);
    });

    return {
      geminiKeyExists: !!geminiKey,
      firebaseConfigComplete: firebaseKeys.every(key => !!process.env[key])
    };
  }

  static async checkDatabase(userId) {
    console.log('🗄️ SkillBot Database Check:');
    console.log('============================');

    if (!userId) {
      console.error('❌ No userId provided');
      return false;
    }

    try {
      // Check SkillBot conversation
      const conversationId = `${userId}_skillbot`;
      const conversationRef = doc(db, COLLECTIONS.SKILLBOT_CONVERSATIONS, conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      console.log('📋 SkillBot Conversation:');
      console.log('   Document ID:', conversationId);
      console.log('   Exists:', conversationDoc.exists());
      
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        console.log('   Messages count:', data.messages?.length || 0);
        console.log('   Last message time:', data.lastMessageTime);
        console.log('   Active:', data.isActive);
      }

      // Check chat entry
      const chatId = `${userId}_skillbot`;
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      console.log('💬 Chat Entry:');
      console.log('   Document ID:', chatId);
      console.log('   Exists:', chatDoc.exists());
      
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        console.log('   Last message:', data.lastMessage);
        console.log('   Participants:', data.participants);
        console.log('   Is SkillBot:', data.isSkillBot);
        console.log('   Unread count:', data.unreadCount);
      }

      // Check user chats
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      
      console.log('📱 User Chats:');
      console.log('   Total chats:', chatsSnapshot.size);
      
      chatsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.isSkillBot ? 'SkillBot' : 'Regular'} chat`);
      });

      return true;
    } catch (error) {
      console.error('❌ Database check failed:', error);
      return false;
    }
  }

  static async testGeminiAPI() {
    console.log('🤖 Gemini API Test:');
    console.log('===================');

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error('❌ No API key found');
        return false;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      console.log('📡 Testing API call...');
      const result = await model.generateContent("Hello, are you working?");
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ API Response:', text.substring(0, 100) + '...');
      return true;
    } catch (error) {
      console.error('❌ Gemini API test failed:', error);
      console.error('💡 Possible issues:');
      console.error('   - Invalid API key');
      console.error('   - Quota exceeded');
      console.error('   - Network connection');
      console.error('   - API service unavailable');
      return false;
    }
  }

  static async runFullDiagnostic(userId) {
    console.log('🔧 SkillBot Full Diagnostic');
    console.log('==============================\n');

    const envCheck = await this.checkEnvironment();
    console.log('\n');

    const dbCheck = await this.checkDatabase(userId);
    console.log('\n');

    const apiCheck = await this.testGeminiAPI();
    console.log('\n');

    console.log('📊 Diagnostic Summary:');
    console.log('======================');
    console.log('Environment:', envCheck.geminiKeyExists && envCheck.firebaseConfigComplete ? '✅' : '❌');
    console.log('Database:', dbCheck ? '✅' : '❌');
    console.log('Gemini API:', apiCheck ? '✅' : '❌');

    if (envCheck.geminiKeyExists && envCheck.firebaseConfigComplete && dbCheck && apiCheck) {
      console.log('\n🎉 All systems operational!');
    } else {
      console.log('\n⚠️ Issues detected. Check the logs above for details.');
    }

    return {
      environment: envCheck,
      database: dbCheck,
      api: apiCheck
    };
  }
}

// Usage examples:
// SkillBotDebugger.checkEnvironment();
// SkillBotDebugger.checkDatabase('user-id-here');
// SkillBotDebugger.testGeminiAPI();
// SkillBotDebugger.runFullDiagnostic('user-id-here');

export default SkillBotDebugger; 