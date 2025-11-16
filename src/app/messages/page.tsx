'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import CreateChatModal from '@/components/CreateChatModal';
import { Chat } from '@/lib/messageService';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Users } from 'lucide-react';

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleCreateChat = () => {
    setShowCreateModal(true);
  };

  const handleChatCreated = (chatId: string) => {
    // The chat list will update automatically via real-time subscription
    setShowCreateModal(false);
    // Optionally select the newly created chat
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pt-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <MessageSquare className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
              <p className="text-gray-400 mb-6">Sign in to start messaging</p>
              <a
                href="/auth/signin"
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 pt-16">
        <div className="h-[calc(100vh-4rem)] flex">
          {/* Chat List */}
          <ChatList 
            onChatSelect={handleChatSelect}
            selectedChat={selectedChat}
            onCreateChat={handleCreateChat}
          />

          {/* Chat Window or Welcome Screen */}
          {selectedChat ? (
            <ChatWindow 
              chat={selectedChat}
              onBack={() => setSelectedChat(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-900/30">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to Messages</h2>
                <p className="text-gray-400 mb-6 max-w-md">
                  Select a conversation from the sidebar or start a new chat to begin messaging.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleCreateChat}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    New Message
                  </button>
                  <button
                    onClick={handleCreateChat}
                    className="px-6 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Chat Modal */}
        <CreateChatModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onChatCreated={handleChatCreated}
        />
      </div>
    </Layout>
  );
}