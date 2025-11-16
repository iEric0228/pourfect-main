'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { MessageService } from '@/lib/messageService';
import { firebase } from '@/lib/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Hash, Clock, User, CheckCircle, AlertCircle } from 'lucide-react';

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inviteCode = params.code as string;

  useEffect(() => {
    if (!user || !inviteCode) return;
    loadGroupInfo();
  }, [user, inviteCode]);

  const loadGroupInfo = async () => {
    try {
      setLoading(true);
      // Try to get group info by invite code
      const groupChat = await MessageService.getChatByInviteCode(inviteCode);

      if (groupChat) {
        setGroupInfo(groupChat);
      } else {
        setError('Invalid or expired invite link');
      }
    } catch (err) {
      setError('Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !groupInfo) return;

    try {
      setJoining(true);
      setError('');

      // Get user profile
      const userProfiles = await firebase.entities.UserProfile.filter({ uid: user.uid });
      const userProfile = userProfiles[0] || { display_name: 'User', avatar_url: '' };

      const chatId = await MessageService.joinGroupByInviteCode(
        inviteCode,
        user.uid,
        userProfile
      );

      if (chatId) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/messages');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pt-20">
          <div className="max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center">
              <User className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Sign In Required</h1>
              <p className="text-gray-300 mb-6">
                You need to sign in to join this group chat.
              </p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pt-20">
          <div className="max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
              <p className="text-gray-300">Checking invite link...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pt-20">
          <div className="max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Cannot Join Group</h1>
              <p className="text-gray-300 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/messages')}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Go to Messages
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pt-20">
          <div className="max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4">Welcome to the Group!</h1>
              <p className="text-gray-300 mb-6">
                You've successfully joined <strong>{groupInfo.name}</strong>. Redirecting to messages...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const isAlreadyMember = groupInfo?.participants?.includes(user.uid);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pt-20">
        <div className="max-w-md mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            {/* Group Info */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {groupInfo.avatar ? (
                  <img
                    src={groupInfo.avatar}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Hash className="w-10 h-10 text-white" />
                )}
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                {groupInfo.name}
              </h1>
              
              {groupInfo.description && (
                <p className="text-gray-300 mb-4">{groupInfo.description}</p>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{groupInfo.participants?.length || 0} members</span>
                </div>
                {groupInfo.createdAt && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      Created {new Date(groupInfo.createdAt.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-4">
              {isAlreadyMember ? (
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <p className="text-green-300 mb-4">You're already a member of this group</p>
                  <button
                    onClick={() => router.push('/messages')}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Open Messages
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleJoinGroup}
                    disabled={joining}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {joining ? 'Joining...' : `Join ${groupInfo.name}`}
                  </button>
                  
                  <button
                    onClick={() => router.push('/messages')}
                    className="w-full px-6 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            {/* Invite Code Display */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Invite Code</p>
                <div className="px-4 py-2 bg-white/10 rounded-lg text-white font-mono text-lg tracking-widest">
                  {inviteCode}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
