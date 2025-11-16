'use client';

import React, { useState, useEffect } from 'react';
import { Chat, MessageService } from '@/lib/messageService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  Users, 
  Search, 
  Plus, 
  Hash,
  User,
  Clock,
  MoreVertical
} from 'lucide-react';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChat: Chat | null;
  onCreateChat: () => void;
}

export default function ChatList({ onChatSelect, selectedChat, onCreateChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    setError(null);
    
    try {
      const unsubscribe = MessageService.subscribeToUserChats(user.uid, (userChats) => {
        setChats(userChats);
        setLoading(false);
        setError(null);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error subscribing to chats:', err);
      setError('Failed to load chats. Please refresh the page.');
      setLoading(false);
    }
  }, [user]);

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    if (chat.type === 'group') {
      return chat.name?.toLowerCase().includes(query);
    } else {
      // For direct messages, search by participant names
      const otherParticipant = Object.entries(chat.participantNames)
        .find(([id]) => id !== user?.uid)?.[1];
      return otherParticipant?.toLowerCase().includes(query);
    }
  });

  const formatLastMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      // Less than 24 hours - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      // Less than 7 days - show day
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // More than 7 days - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Unnamed Group';
    } else {
      // Direct message - show other participant's name
      const otherParticipant = Object.entries(chat.participantNames)
        .find(([id]) => id !== user?.uid);
      return otherParticipant?.[1] || 'Unknown User';
    }
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') {
      return chat.avatar;
    } else {
      // Direct message - show other participant's avatar
      const otherParticipant = Object.entries(chat.participantAvatars)
        .find(([id]) => id !== user?.uid);
      return otherParticipant?.[1];
    }
  };

  if (loading) {
    return (
      <div className="w-full lg:w-80 bg-white/5 backdrop-blur-sm border-r border-white/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full lg:w-80 bg-white/5 backdrop-blur-sm border-r border-white/10 flex items-center justify-center">
        <div className="text-center p-8">
          <MessageSquare className="w-12 h-12 text-red-400 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <button
            onClick={onCreateChat}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {chats.length === 0 ? 'No conversations yet' : 'No matches found'}
            </h3>
            <p className="text-gray-400 mb-4">
              {chats.length === 0 
                ? 'Start a conversation or create a group chat'
                : 'Try a different search term'
              }
            </p>
            {chats.length === 0 && (
              <button
                onClick={onCreateChat}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Start Chatting
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChat?.id === chat.id
                    ? 'bg-purple-600/20 border border-purple-400/30'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {getChatAvatar(chat) ? (
                    <img
                      src={getChatAvatar(chat)}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      {chat.type === 'group' ? (
                        <Users className="w-6 h-6 text-white" />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                  )}
                  
                  {/* Online indicator for direct messages */}
                  {chat.type === 'direct' && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white truncate flex items-center gap-1">
                      {chat.type === 'group' && <Hash className="w-4 h-4" />}
                      {getChatDisplayName(chat)}
                    </h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastMessageTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  
                  {chat.lastMessage ? (
                    <p className="text-sm text-gray-400 truncate">
                      {chat.lastMessage.senderId === user?.uid ? 'You: ' : ''}
                      {chat.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No messages yet</p>
                  )}
                </div>

                {/* Unread indicator */}
                <div className="flex items-center">
                  {/* Add unread count logic here if needed */}
                  <MoreVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
