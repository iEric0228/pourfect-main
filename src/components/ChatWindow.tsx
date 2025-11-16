'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message, MessageService } from '@/lib/messageService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Send, 
  Hash, 
  Users, 
  User, 
  Phone, 
  Video, 
  MoreVertical,
  Smile,
  Paperclip,
  Reply,
  Copy,
  Link
} from 'lucide-react';

interface ChatWindowProps {
  chat: Chat;
  onBack?: () => void;
}

export default function ChatWindow({ chat, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!chat) return;

    const unsubscribe = MessageService.subscribeToMessages(chat.id, (chatMessages) => {
      setMessages(chatMessages);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [chat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    try {
      // Get user profile data
      const userProfile = await getUserProfile(user.uid);
      
      await MessageService.sendMessage(
        chat.id,
        user.uid,
        newMessage.trim(),
        userProfile,
        'text',
        replyingTo?.id
      );
      
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getUserProfile = async (userId: string) => {
    // This should ideally come from a context or service
    return {
      display_name: chat.participantNames[userId] || 'User',
      avatar_url: chat.participantAvatars[userId] || ''
    };
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getChatDisplayName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Unnamed Group';
    } else {
      const otherParticipant = Object.entries(chat.participantNames)
        .find(([id]) => id !== user?.uid);
      return otherParticipant?.[1] || 'Unknown User';
    }
  };

  const copyInviteCode = () => {
    if (chat.inviteCode) {
      navigator.clipboard.writeText(chat.inviteCode);
      // You might want to show a toast notification here
    }
  };

  const copyInviteLink = () => {
    if (chat.inviteCode) {
      const inviteLink = `${window.location.origin}/messages/join/${chat.inviteCode}`;
      navigator.clipboard.writeText(inviteLink);
      // You might want to show a toast notification here
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      await MessageService.addReaction(messageId, emoji, user.uid);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true;
    
    const currentDate = currentMessage.timestamp?.toDate?.() || new Date(currentMessage.timestamp);
    const previousDate = previousMessage.timestamp?.toDate?.() || new Date(previousMessage.timestamp);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              {chat.type === 'group' ? (
                <Hash className="w-5 h-5 text-white" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-white flex items-center gap-2">
                {getChatDisplayName()}
                {chat.type === 'group' && (
                  <span className="text-sm text-gray-400">
                    ({chat.participants.length} members)
                  </span>
                )}
              </h2>
              {chat.type === 'direct' ? (
                <p className="text-sm text-green-400">Online</p>
              ) : (
                <p className="text-sm text-gray-400">{chat.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {chat.type === 'direct' && (
              <>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Phone className="w-5 h-5 text-gray-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <Video className="w-5 h-5 text-gray-400" />
                </button>
              </>
            )}
            {chat.type === 'group' && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-full transition-colors"
              >
                Invite
              </button>
            )}
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwn = message.senderId === user?.uid;
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
          const isSystem = message.type === 'system';

          return (
            <div key={message.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-400">
                    {formatMessageDate(message.timestamp)}
                  </div>
                </div>
              )}

              {/* System Message */}
              {isSystem ? (
                <div className="flex justify-center">
                  <div className="px-3 py-1 bg-white/5 rounded-full text-sm text-gray-400">
                    {message.content}
                  </div>
                </div>
              ) : (
                /* Regular Message */
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    {/* Replied Message Preview */}
                    {message.replyTo && (
                      <div className="mb-2 p-2 bg-white/5 rounded border-l-2 border-purple-400">
                        <p className="text-xs text-gray-400">Replying to message</p>
                      </div>
                    )}

                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {/* Sender Name (for group chats) */}
                      {!isOwn && chat.type === 'group' && (
                        <p className="text-xs text-purple-300 mb-1">{message.senderName}</p>
                      )}
                      
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Reactions */}
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {Object.entries(message.reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(message.id, emoji)}
                              className="px-2 py-1 bg-white/10 rounded-full text-xs hover:bg-white/20 transition-colors"
                            >
                              {emoji} {users.length}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {!isOwn && (
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="p-1 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Reply className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="p-3 bg-white/5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">
                Replying to {replyingTo.senderName}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-300 mt-1 truncate">
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${getChatDisplayName()}...`}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
            />
          </div>

          <button
            type="button"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5 text-gray-400" />
          </button>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>

      {/* Invite Modal */}
      {showInviteModal && chat.type === 'group' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Invite to Group</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Invite Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chat.inviteCode || ''}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white"
                    />
                    <button
                      onClick={copyInviteCode}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Invite Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/messages/join/${chat.inviteCode}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 rounded hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    copyInviteLink();
                    setShowInviteModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
