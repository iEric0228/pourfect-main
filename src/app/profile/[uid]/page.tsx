'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { firebase } from '@/lib/firebaseService';
import { UserService } from '@/lib/userService';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, User as UserIcon, Users, Heart, MessageCircle } from 'lucide-react';

export default function PublicProfilePage() {
  const params = useParams();
  const uid = params?.uid as string;
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('posts');

  // Redirect if viewing own profile
  React.useEffect(() => {
    if (user && uid === user.uid) {
      router.push('/profile');
    }
  }, [user, uid, router]);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['publicProfile', uid],
    queryFn: async () => {
      if (!uid) return null;
      const profiles = await firebase.entities.UserProfile.filter({ uid: uid });
      return profiles[0] || null;
    },
    enabled: !!uid
  });

  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ['publicPosts', uid],
    queryFn: async () => {
      if (!uid) return [];
      return await firebase.entities.Post.filter({ user_id: uid }, { orderBy: { field: 'created_at', direction: 'desc' } });
    },
    enabled: !!uid
  });

  const { data: isFollowing } = useQuery({
    queryKey: ['isFollowing', user?.uid, uid],
    queryFn: async () => {
      if (!user || !uid || user.uid === uid) return false;
      return await UserService.isFollowing(user.uid, uid);
    },
    enabled: !!user && !!uid && user.uid !== uid
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !uid) throw new Error('Not authenticated');
      if (isFollowing) {
        await UserService.unfollowUser(user.uid, uid);
      } else {
        await UserService.followUser(user.uid, uid);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', user?.uid, uid] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile', uid] });
    }
  });

  if (loadingProfile) {
    return (
      <Layout>
        <div className='min-h-screen flex items-center justify-center text-white'>
          <div className="animate-pulse">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className='min-h-screen flex items-center justify-center'>
          <div className="text-center">
            <UserIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl text-white mb-2">Profile not found</h2>
            <p className="text-gray-400 mb-4">This user doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/feed')}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const formatJoinDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Layout>
      <div className='max-w-5xl mx-auto px-6 py-8'>
        {/* Profile Header */}
        <div className='bg-white/5 rounded-xl p-6 border border-white/10 mb-6'>
          <div className='flex flex-col md:flex-row items-start gap-6'>
            {/* Avatar */}
            <div className='w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0'>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} className='w-full h-full object-cover' />
              ) : (
                <span className='text-white text-3xl font-bold'>{profile.display_name?.charAt(0)?.toUpperCase() || 'U'}</span>
              )}
            </div>

            {/* Profile Info */}
            <div className='flex-1'>
              <h1 className='text-3xl font-bold text-white mb-1'>{profile.display_name || 'Anonymous User'}</h1>
              <p className='text-gray-400 mb-3'>@{profile.username || 'user'}</p>
              
              {profile.bio && (
                <p className='text-gray-300 mb-4'>{profile.bio}</p>
              )}

              {/* Stats */}
              <div className='flex gap-6 text-sm mb-4'>
                <div className='text-center'>
                  <div className='text-white font-bold text-lg'>{profile.posts_count || 0}</div>
                  <div className='text-gray-400'>Posts</div>
                </div>
                <div className='text-center'>
                  <div className='text-white font-bold text-lg'>{profile.followers_count || 0}</div>
                  <div className='text-gray-400'>Followers</div>
                </div>
                <div className='text-center'>
                  <div className='text-white font-bold text-lg'>{profile.following_count || 0}</div>
                  <div className='text-gray-400'>Following</div>
                </div>
              </div>

              {/* Join Date */}
              <div className='flex items-center gap-2 text-gray-400 text-sm'>
                <Calendar className='h-4 w-4' />
                Joined {formatJoinDate(profile.created_at)}
              </div>
            </div>

            {/* Action Buttons */}
            {user && user.uid !== uid && (
              <div className='flex flex-col gap-2 w-full md:w-auto'>
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {followMutation.isPending ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={() => router.push('/messages')}
                  className='px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center justify-center gap-2'
                >
                  <MessageCircle className='h-4 w-4' />
                  Message
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div className='bg-white/5 border border-white/10 rounded-xl'>
          <div className='flex border-b border-white/10'>
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'posts' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Posts ({posts?.length || 0})
            </button>
          </div>

          <div className='p-6'>
            {loadingPosts ? (
              <div className="text-center py-12 text-gray-400">Loading posts...</div>
            ) : activeTab === 'posts' && posts && posts.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {posts.map(post => (
                  <div key={post.id} className='bg-white/10 rounded-lg p-4 border border-white/20 hover:border-white/30 transition-colors'>
                    <div className='flex items-center gap-2 mb-3'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.type === 'recipe' ? 'bg-green-500/20 text-green-400' :
                        post.type === 'review' ? 'bg-yellow-500/20 text-yellow-400' :
                        post.type === 'photo' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {post.type}
                      </span>
                      <span className='text-gray-400 text-xs'>
                        {post.created_at?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </span>
                    </div>
                    
                    <h3 className='font-semibold text-white mb-2'>{post.title}</h3>
                    <p className='text-gray-300 text-sm mb-3 line-clamp-2'>{post.content}</p>
                    
                    {post.images && post.images.length > 0 && (
                      <div className='mb-3'>
                        <img 
                          src={post.images[0]} 
                          alt={post.title}
                          className='w-full h-32 object-cover rounded'
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className='flex items-center gap-4 text-gray-400 text-xs'>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.comments_count || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <UserIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className='text-xl font-semibold text-gray-300 mb-2'>No posts yet</h3>
                <p className='text-gray-500'>
                  {profile.display_name} hasn't shared any posts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}