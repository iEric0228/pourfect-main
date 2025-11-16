'use client';

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, MapPin, Calendar, Edit3, Settings, LogOut } from "lucide-react";
import Layout from "@/components/Layout";
import EditProfileModal from "@/components/EditProfileModal";
import SettingsModal from "@/components/SettingsModal";
import ProfileStats from "@/components/ProfileStats";
import { firebase, UserProfile } from "@/lib/firebaseService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Profile() {
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await firebase.entities.UserProfile.filter({ uid: user.uid });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: userPosts } = useQuery({
    queryKey: ['userPosts', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      return await firebase.entities.Post.filter(
        { user_id: user.uid },
        { orderBy: { field: 'created_at', direction: 'desc' } }
      );
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    // Update the cache
    queryClient.setQueryData(['userProfile', user?.uid], updatedProfile);
  };

  if (!user || !userProfile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2">
              {/* Profile Header */}
              <div className="bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {userProfile.avatar_url ? (
                  <img 
                    src={userProfile.avatar_url} 
                    alt={userProfile.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {userProfile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                      {userProfile.display_name || 'Anonymous User'}
                    </h1>
                    <p className="text-gray-400">@{userProfile.username || 'user'}</p>
                  </div>
                  
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => setShowSettingsModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                </div>

                {/* Bio */}
                {userProfile.bio && (
                  <p className="text-gray-300 mb-4">{userProfile.bio}</p>
                )}

                {/* Stats */}
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-white text-lg">{userProfile.posts_count || 0}</div>
                    <div className="text-gray-400">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-white text-lg">{userProfile.followers_count || 0}</div>
                    <div className="text-gray-400">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-white text-lg">{userProfile.following_count || 0}</div>
                    <div className="text-gray-400">Following</div>
                  </div>
                </div>

                {/* Join Date */}
                <div className="flex items-center gap-2 text-gray-400 text-sm mt-4">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {userProfile.created_at?.toDate?.()?.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    }) || 'Recently'}
                  </span>
                </div>
              </div>
            </div>
          </div>

              {/* Profile Tabs */}
              <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
            {/* Tab Headers */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'posts', label: 'Posts', count: userPosts?.length || 0 },
                { id: 'liked', label: 'Liked', count: 0 },
                { id: 'saved', label: 'Saved', count: 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-purple-400 border-b-2 border-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'posts' && (
                <div>
                  {userPosts && userPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userPosts.map((post) => (
                        <div key={post.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.type === 'recipe' ? 'bg-green-500/20 text-green-400' :
                              post.type === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                              post.type === 'photo' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {post.type}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {post.created_at?.toDate?.()?.toLocaleDateString() || 'Recently'}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-white mb-2">{post.title}</h3>
                          <p className="text-gray-300 text-sm mb-3 line-clamp-2">{post.content}</p>
                          
                          {post.images && post.images.length > 0 && (
                            <div className="mb-3">
                              <img 
                                src={post.images[0]} 
                                alt={post.title}
                                className="w-full h-32 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 text-gray-400 text-sm">
                            <span>♥ {post.likes_count || 0}</span>
                            <span>💬 {post.comments_count || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">No posts yet</h3>
                      <p className="text-gray-500">Share your first drink experience!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'liked' && (
                <div className="text-center py-12">
                  <div className="text-gray-500">Liked posts will appear here</div>
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="text-center py-12">
                  <div className="text-gray-500">Saved posts will appear here</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Profile Stats */}
          <div className="lg:col-span-1">
            <ProfileStats userProfile={userProfile} isOwnProfile={true} />
          </div>
        </div>
      </div>
      </div>

      {/* Modals */}
      {userProfile && (
        <>
          <EditProfileModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            userProfile={userProfile}
            onUpdate={handleProfileUpdate}
          />
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
          />
        </>
      )}
    </Layout>
  );
}
