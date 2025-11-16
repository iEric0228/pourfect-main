import { firebase } from './firebaseService';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  limit,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'recipe' | 'system';
  timestamp: any;
  edited?: boolean;
  editedAt?: any;
  replyTo?: string; // Message ID being replied to
  reactions?: { [emoji: string]: string[] }; // emoji -> array of user IDs
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name?: string; // For group chats
  description?: string; // For group chats
  avatar?: string; // For group chats
  participants: string[]; // User IDs
  participantNames: { [userId: string]: string };
  participantAvatars: { [userId: string]: string };
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: any;
  };
  createdBy?: string; // For group chats
  createdAt: any;
  updatedAt: any;
  isActive: boolean;
  inviteCode?: string; // For group chats
  settings?: {
    allowInvites: boolean;
    isPublic: boolean;
    maxMembers: number;
  };
}

export interface ChatMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: any;
  lastSeen?: any;
  isOnline?: boolean;
}

export class MessageService {
  // Create a direct message chat
  static async createDirectChat(userId1: string, userId2: string, user1Data: any, user2Data: any): Promise<string> {
    try {
      // Check if direct chat already exists
      const existingChat = await this.findDirectChat(userId1, userId2);
      if (existingChat) {
        return existingChat.id;
      }

      const chatData: Omit<Chat, 'id'> = {
        type: 'direct',
        participants: [userId1, userId2],
        participantNames: {
          [userId1]: user1Data.display_name || 'User',
          [userId2]: user2Data.display_name || 'User'
        },
        participantAvatars: {
          [userId1]: user1Data.avatar_url || '',
          [userId2]: user2Data.avatar_url || ''
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating direct chat:', error);
      throw error;
    }
  }

  // Create a group chat
  static async createGroupChat(
    creatorId: string, 
    name: string, 
    description: string,
    participants: string[],
    creatorData: any
  ): Promise<string> {
    try {
      const inviteCode = this.generateInviteCode();
      
      const chatData: Omit<Chat, 'id'> = {
        type: 'group',
        name,
        description,
        participants: [creatorId, ...participants],
        participantNames: {
          [creatorId]: creatorData.display_name || 'User'
        },
        participantAvatars: {
          [creatorId]: creatorData.avatar_url || ''
        },
        createdBy: creatorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        inviteCode,
        settings: {
          allowInvites: true,
          isPublic: false,
          maxMembers: 100
        }
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      
      // Add system message for group creation
      await this.sendSystemMessage(docRef.id, `${creatorData.display_name} created the group`);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  }

  // Find existing direct chat between two users
  static async findDirectChat(userId1: string, userId2: string): Promise<Chat | null> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('type', '==', 'direct'),
        where('participants', 'array-contains', userId1)
      );

      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        const chat = { id: docSnap.id, ...docSnap.data() } as Chat;
        if (chat.participants.includes(userId2)) {
          return chat;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding direct chat:', error);
      return null;
    }
  }

  // Get user's chats
  static async getUserChats(userId: string): Promise<Chat[]> {
    try {
      // Simplified query to avoid index requirement
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId)
      );

      const querySnapshot = await getDocs(q);
      const chats = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Chat[];

      // Filter and sort in memory to avoid composite index requirement
      return chats
        .filter(chat => chat.isActive)
        .sort((a, b) => {
          const aTime = a.updatedAt?.seconds || 0;
          const bTime = b.updatedAt?.seconds || 0;
          return bTime - aTime; // Descending order
        });
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  }

  // Subscribe to user's chats (real-time)
  static subscribeToUserChats(userId: string, callback: (chats: Chat[]) => void) {
    // Simplified query to avoid index requirement
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Chat[];

      // Filter and sort in memory to avoid composite index requirement
      const filteredAndSortedChats = chats
        .filter(chat => chat.isActive)
        .sort((a, b) => {
          const aTime = a.updatedAt?.seconds || 0;
          const bTime = b.updatedAt?.seconds || 0;
          return bTime - aTime; // Descending order
        });

      callback(filteredAndSortedChats);
    });
  }

  // Subscribe to messages in a chat (real-time)
  static subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
    // Simplified query to avoid composite index requirement
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];

      // Sort and limit in memory to avoid composite index requirement
      const sortedMessages = messages
        .sort((a, b) => {
          const aTime = a.timestamp?.seconds || 0;
          const bTime = b.timestamp?.seconds || 0;
          return aTime - bTime; // Ascending order (oldest first)
        })
        .slice(-50); // Keep only the last 50 messages

      callback(sortedMessages);
    });
  }

  // Send a message
  static async sendMessage(
    chatId: string, 
    senderId: string, 
    content: string, 
    senderData: any,
    type: 'text' | 'image' | 'recipe' = 'text',
    replyTo?: string
  ): Promise<void> {
    try {
      const messageData: Omit<Message, 'id'> = {
        chatId,
        senderId,
        senderName: senderData.display_name || 'User',
        senderAvatar: senderData.avatar_url || '',
        content,
        type,
        timestamp: serverTimestamp(),
        ...(replyTo && { replyTo })
      };

      await addDoc(collection(db, 'messages'), messageData);

      // Update chat's last message
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: {
          content: content.substring(0, 100),
          senderId,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send system message
  static async sendSystemMessage(chatId: string, content: string): Promise<void> {
    try {
      const messageData: Omit<Message, 'id'> = {
        chatId,
        senderId: 'system',
        senderName: 'System',
        content,
        type: 'system',
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'messages'), messageData);
    } catch (error) {
      console.error('Error sending system message:', error);
      throw error;
    }
  }

  // Join group chat by invite code
  static async joinGroupByInviteCode(inviteCode: string, userId: string, userData: any): Promise<string | null> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('inviteCode', '==', inviteCode),
        where('type', '==', 'group'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid invite code');
      }

      const chatDoc = querySnapshot.docs[0];
      const chat = { id: chatDoc.id, ...chatDoc.data() } as Chat;

      if (chat.participants.includes(userId)) {
        return chat.id; // Already a member
      }

      if (chat.participants.length >= (chat.settings?.maxMembers || 100)) {
        throw new Error('Group is full');
      }

      // Add user to chat
      const updatedParticipants = [...chat.participants, userId];
      const updatedParticipantNames = {
        ...chat.participantNames,
        [userId]: userData.display_name || 'User'
      };
      const updatedParticipantAvatars = {
        ...chat.participantAvatars,
        [userId]: userData.avatar_url || ''
      };

      await updateDoc(doc(db, 'chats', chat.id), {
        participants: updatedParticipants,
        participantNames: updatedParticipantNames,
        participantAvatars: updatedParticipantAvatars,
        updatedAt: serverTimestamp()
      });

      // Send system message
      await this.sendSystemMessage(chat.id, `${userData.display_name} joined the group`);

      return chat.id;
    } catch (error) {
      console.error('Error joining group by invite code:', error);
      throw error;
    }
  }

  // Generate random invite code
  static generateInviteCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  // Get chat by ID
  static async getChatById(chatId: string): Promise<Chat | null> {
    try {
      const docRef = doc(db, 'chats', chatId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Chat;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting chat by ID:', error);
      return null;
    }
  }

  // Add reaction to message
  static async addReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const message = messageDoc.data() as Message;
        const reactions = message.reactions || {};
        
        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }
        
        if (!reactions[emoji].includes(userId)) {
          reactions[emoji].push(userId);
        }
        
        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  // Remove reaction from message
  static async removeReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const message = messageDoc.data() as Message;
        const reactions = message.reactions || {};
        
        if (reactions[emoji]) {
          reactions[emoji] = reactions[emoji].filter(id => id !== userId);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        }
        
        await updateDoc(messageRef, { reactions });
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }

  // Leave group chat
  static async leaveGroup(chatId: string, userId: string, userData: any): Promise<void> {
    try {
      const chat = await this.getChatById(chatId);
      if (!chat || chat.type !== 'group') {
        throw new Error('Chat not found or not a group');
      }

      const updatedParticipants = chat.participants.filter(id => id !== userId);
      const updatedParticipantNames = { ...chat.participantNames };
      const updatedParticipantAvatars = { ...chat.participantAvatars };
      
      delete updatedParticipantNames[userId];
      delete updatedParticipantAvatars[userId];

      await updateDoc(doc(db, 'chats', chatId), {
        participants: updatedParticipants,
        participantNames: updatedParticipantNames,
        participantAvatars: updatedParticipantAvatars,
        updatedAt: serverTimestamp()
      });

      // Send system message
      await this.sendSystemMessage(chatId, `${userData.display_name} left the group`);
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  // Get chat by invite code
  static async getChatByInviteCode(inviteCode: string): Promise<Chat | null> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('inviteCode', '==', inviteCode),
        where('type', '==', 'group'),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const chatDoc = querySnapshot.docs[0];
      return {
        id: chatDoc.id,
        ...chatDoc.data()
      } as Chat;
    } catch (error) {
      console.error('Error getting chat by invite code:', error);
      return null;
    }
  }
}
