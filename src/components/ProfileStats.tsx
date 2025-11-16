'use client';

import React from 'react';
import { Trophy, Star, Calendar, MapPin, Link as LinkIcon, Verified } from 'lucide-react';
import { UserProfile } from '@/lib/firebaseService';

interface ProfileStatsProps {
  userProfile: UserProfile;
  isOwnProfile: boolean;
}

export default function ProfileStats({ userProfile, isOwnProfile }: ProfileStatsProps) {
  const achievements = [
    { 
      id: 'first_post', 
      name: 'First Steps', 
      description: 'Created your first post',
      icon: '🎉',
      unlocked: (userProfile.posts_count || 0) > 0
    },
    { 
      id: 'social_butterfly', 
      name: 'Social Butterfly', 
      description: 'Followed 10 people',
      icon: '🦋',
      unlocked: (userProfile.following_count || 0) >= 10
    },
    { 
      id: 'popular', 
      name: 'Popular', 
      description: 'Gained 50 followers',
      icon: '⭐',
      unlocked: (userProfile.followers_count || 0) >= 50
    },
    { 
      id: 'content_creator', 
      name: 'Content Creator', 
      description: 'Posted 25 times',
      icon: '📸',
      unlocked: (userProfile.posts_count || 0) >= 25
    },
    { 
      id: 'trendsetter', 
      name: 'Trendsetter', 
      description: 'Gained 100 followers',
      icon: '🔥',
      unlocked: (userProfile.followers_count || 0) >= 100
    }
  ];

  const stats = [
    {
      label: 'Posts',
      value: userProfile.posts_count || 0,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      label: 'Followers',
      value: userProfile.followers_count || 0,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      label: 'Following',
      value: userProfile.following_count || 0,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20'
    }
  ];

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const profileCompleteness = Math.round(
    ((userProfile.display_name ? 20 : 0) +
     (userProfile.username ? 20 : 0) +
     (userProfile.bio ? 20 : 0) +
     (userProfile.avatar_url ? 20 : 0) +
     ((userProfile.posts_count || 0) > 0 ? 20 : 0)) 
  );

  return (
    <div className="space-y-6">
      {/* Profile Completeness - Only show to profile owner */}
      {isOwnProfile && profileCompleteness < 100 && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-yellow-200">Complete Your Profile</h3>
          </div>
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">{profileCompleteness}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Complete your profile to get more visibility and connect with others!
          </p>
        </div>
      )}

      {/* Enhanced Stats */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Profile Stats
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className={`font-bold text-lg ${stat.color}`}>
                  {stat.value > 999 ? `${Math.floor(stat.value / 1000)}k` : stat.value}
                </span>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Member Since */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>
            Member since {userProfile.created_at?.toDate?.()?.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            }) || 'Recently'}
          </span>
        </div>
      </div>

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Achievements ({unlockedAchievements.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlockedAchievements.map((achievement) => (
              <div 
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <h4 className="font-medium text-white">{achievement.name}</h4>
                  <p className="text-xs text-gray-400">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>

          {achievements.length > unlockedAchievements.length && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400 text-center">
                {achievements.length - unlockedAchievements.length} more achievements to unlock
              </p>
            </div>
          )}
        </div>
      )}

      {/* Profile Verification Status */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Verified className="w-5 h-5 text-blue-400" />
            <div>
              <h4 className="font-medium text-white">Profile Verification</h4>
              <p className="text-sm text-gray-400">
                {userProfile.avatar_url && userProfile.bio && userProfile.posts_count && userProfile.posts_count > 0
                  ? 'Your profile looks authentic!'
                  : 'Complete your profile to build trust'
                }
              </p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            userProfile.avatar_url && userProfile.bio && userProfile.posts_count && userProfile.posts_count > 0
              ? 'bg-green-400'
              : 'bg-yellow-400'
          }`} />
        </div>
      </div>

      {/* Quick Actions for Profile Owner */}
      {isOwnProfile && (
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <h3 className="font-semibold text-white mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors text-left">
              <LinkIcon className="w-4 h-4 text-purple-400" />
              <div>
                <div className="font-medium">Share Profile</div>
                <div className="text-xs text-gray-400">Get your profile link</div>
              </div>
            </button>
            <button className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors text-left">
              <MapPin className="w-4 h-4 text-green-400" />
              <div>
                <div className="font-medium">Add Location</div>
                <div className="text-xs text-gray-400">Show where you're from</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
