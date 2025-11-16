'use client';

import React, { useState, useEffect } from 'react';
import { MessageService } from '@/lib/messageService';
import { firebase, UserProfile } from '@/lib/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  X, 
  Search, 
  User, 
  Users, 
  Plus,
  Hash,
  MessageSquare,
  Check
} from 'lucide-react';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export default function CreateChatModal({ isOpen, onClose, onChatCreated }: CreateChatModalProps) {
  const [mode, setMode] = useState<'select' | 'direct' | 'group' | 'join'>('select');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (mode === 'direct' || mode === 'group') {
      loadUsers();
    }
  }, [mode]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await firebase.entities.UserProfile.getAll();
      // Filter out current user
      const otherUsers = allUsers.filter(u => u.uid !== user?.uid);
      setUsers(otherUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (userId: string) => {
    if (mode === 'direct') {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const createDirectMessage = async () => {
    if (!user || selectedUsers.length !== 1) return;

    try {
      setLoading(true);
      const otherUser = users.find(u => u.uid === selectedUsers[0]);
      if (!otherUser) return;

      const userProfile = await getUserProfile(user.uid);
      const chatId = await MessageService.createDirectChat(
        user.uid,
        otherUser.uid,
        userProfile,
        otherUser
      );

      onChatCreated(chatId);
      handleClose();
    } catch (error) {
      console.error('Error creating direct message:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroupChat = async () => {
    if (!user || !groupName.trim()) return;

    try {
      setLoading(true);
      const userProfile = await getUserProfile(user.uid);
      const chatId = await MessageService.createGroupChat(
        user.uid,
        groupName.trim(),
        groupDescription.trim(),
        selectedUsers,
        userProfile
      );

      onChatCreated(chatId);
      handleClose();
    } catch (error) {
      console.error('Error creating group chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinGroupByCode = async () => {
    if (!user || !inviteCode.trim()) return;

    try {
      setLoading(true);
      setJoinError('');
      const userProfile = await getUserProfile(user.uid);
      const chatId = await MessageService.joinGroupByInviteCode(
        inviteCode.trim().toUpperCase(),
        user.uid,
        userProfile
      );

      if (chatId) {
        onChatCreated(chatId);
        handleClose();
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setJoinError(error instanceof Error ? error.message : 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async (userId: string) => {
    const profiles = await firebase.entities.UserProfile.filter({ uid: userId });
    return profiles[0] || { display_name: 'User', avatar_url: '' };
  };

  const handleClose = () => {
    setMode('select');
    setSelectedUsers([]);
    setSearchQuery('');
    setGroupName('');
    setGroupDescription('');
    setInviteCode('');
    setJoinError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {mode === 'select' && 'Start a Conversation'}
            {mode === 'direct' && 'New Direct Message'}
            {mode === 'group' && 'Create Group Chat'}
            {mode === 'join' && 'Join Group Chat'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode Selection */}
          {mode === 'select' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('direct')}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Direct Message</h3>
                    <p className="text-sm text-gray-400">Send a private message to someone</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('group')}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Group Chat</h3>
                    <p className="text-sm text-gray-400">Create a group conversation</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('join')}
                className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <Hash className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Join Group</h3>
                    <p className="text-sm text-gray-400">Join an existing group with invite code</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Direct Message */}
          {mode === 'direct' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.uid}
                      onClick={() => handleUserSelect(user.uid)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.includes(user.uid)
                          ? 'bg-purple-600/20 border border-purple-400/30'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{user.display_name}</h3>
                        <p className="text-sm text-gray-400">@{user.username}</p>
                      </div>
                      {selectedUsers.includes(user.uid) && (
                        <Check className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => setMode('select')}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 rounded hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={createDirectMessage}
                  disabled={selectedUsers.length !== 1 || loading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  {loading ? 'Creating...' : 'Start Chat'}
                </button>
              </div>
            </div>
          )}

          {/* Group Chat */}
          {mode === 'group' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  rows={2}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add Members (optional)
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedUsers.map(userId => {
                      const selectedUser = users.find(u => u.uid === userId);
                      return (
                        <div
                          key={userId}
                          className="flex items-center gap-2 px-3 py-1 bg-purple-600/20 rounded-full text-sm"
                        >
                          <span className="text-white">{selectedUser?.display_name}</span>
                          <button
                            onClick={() => handleUserSelect(userId)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.uid}
                      onClick={() => handleUserSelect(user.uid)}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedUsers.includes(user.uid)
                          ? 'bg-purple-600/20'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{user.display_name}</p>
                      </div>
                      {selectedUsers.includes(user.uid) && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => setMode('select')}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 rounded hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={createGroupChat}
                  disabled={!groupName.trim() || loading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          )}

          {/* Join Group */}
          {mode === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character invite code..."
                  maxLength={8}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Ask a group member for the invite code
                </p>
              </div>

              {joinError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {joinError}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => setMode('select')}
                  className="flex-1 px-4 py-2 border border-white/20 text-gray-300 rounded hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={joinGroupByCode}
                  disabled={inviteCode.length !== 8 || loading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  {loading ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
