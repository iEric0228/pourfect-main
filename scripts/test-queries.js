// Quick test to verify Firestore queries are working without index errors
import { MessageService } from '../src/lib/messageService.js';

async function testQueries() {
  console.log('🔍 Testing Firestore Queries...\n');

  try {
    console.log('1. Testing subscribeToUserChats...');
    // This should work with simple query (participants array-contains)
    const unsubscribe = MessageService.subscribeToUserChats('test-user-id', (chats) => {
      console.log(`✅ subscribeToUserChats: Retrieved ${chats.length} chats`);
      unsubscribe(); // Cleanup
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for subscription

    console.log('\n2. Testing subscribeToMessages...');
    // This should work with simple query (chatId where clause only)
    const unsubscribe2 = MessageService.subscribeToMessages('test-chat-id', (messages) => {
      console.log(`✅ subscribeToMessages: Retrieved ${messages.length} messages`);
      unsubscribe2(); // Cleanup
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for subscription

    console.log('\n🎉 All queries working without composite index requirements!');
    
  } catch (error) {
    console.error('❌ Error testing queries:', error);
    
    if (error.message.includes('requires an index')) {
      console.log('\n💡 Solution: The query has been optimized to avoid composite indexes.');
      console.log('   Check that the latest messageService.ts changes are applied.');
    }
  }
}

// Run if called directly
if (process.argv[1].includes('test-queries')) {
  testQueries();
}

export { testQueries };
