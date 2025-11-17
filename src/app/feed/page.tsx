'use client';

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MapPin, TrendingUp, Users, Search, Wine, UserCheck, UserPlus, Filter, Calendar, Tag } from "lucide-react";
import Layout from "@/components/Layout";
import { firebase } from "@/lib/firebaseService";
import { UserService } from "@/lib/userService";
import { useAuth } from "@/contexts/AuthContext";

export default function Feed() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"posts" | "users">("posts");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState("all");
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
  }, [user, router]);

  const handleUserClick = (userId: string) => {
    if (userId === user?.uid) {
      router.push('/profile');
    } else {
      router.push(`/profile/${userId}`);
    }
  };

  const { data: posts, isLoading: loadingPosts } = useQuery({
    queryKey: ['posts', activeTab, user?.uid],
    queryFn: async () => {
      const allPosts = await firebase.entities.Post.filter({}, {
        orderBy: { field: 'created_at', direction: 'desc' },
        limit: 50
      });
      
      if (activeTab === "following" && user) {
        const follows = await firebase.entities.Follow.filter({ follower_id: user.uid });
        const followingIds = follows.map(f => f.following_id);
        return allPosts.filter(p => followingIds.includes(p.user_id));
      }
      
      if (activeTab === "recipes") {
        return allPosts.filter(p => p.type === "recipe");
      }
      
      return allPosts;
    },
    initialData: [],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: userProfiles } = useQuery({
    queryKey: ['suggested-users', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const profiles = await firebase.entities.UserProfile.filter({}, { limit: 5 });
      return profiles.filter(p => p.uid !== user.uid);
    },
    enabled: !!user,
  });

  // User search query
  const { data: searchResults } = useQuery({
    queryKey: ['search-users', searchQuery, searchType],
    queryFn: async () => {
      if (searchType !== 'users' || !searchQuery.trim()) return [];
      return await UserService.searchUsers(searchQuery, 20);
    },
    enabled: searchType === 'users' && searchQuery.trim().length > 0,
  });

  // Follow status query for suggested users and search results
  const { data: followStatuses } = useQuery({
    queryKey: ['follow-statuses', user?.uid, userProfiles, searchResults],
    queryFn: async () => {
      if (!user) return {};
      const usersToCheck = [
        ...(userProfiles || []),
        ...(searchResults || [])
      ];
      const statuses: { [key: string]: boolean } = {};
      
      for (const profile of usersToCheck) {
        if (profile.uid !== user.uid) {
          statuses[profile.uid] = await UserService.isFollowing(user.uid, profile.uid);
        }
      }
      return statuses;
    },
    enabled: !!user && (!!userProfiles?.length || !!searchResults?.length),
  });

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: async ({ followingId }: { followingId: string }) => {
      if (!user) throw new Error('User not authenticated');
      await UserService.followUser(user.uid, followingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async ({ followingId }: { followingId: string }) => {
      if (!user) throw new Error('User not authenticated');
      await UserService.unfollowUser(user.uid, followingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleFollow = async (followingId: string) => {
    const isCurrentlyFollowing = followStatuses?.[followingId];
    if (isCurrentlyFollowing) {
      await unfollowMutation.mutateAsync({ followingId });
    } else {
      await followMutation.mutateAsync({ followingId });
    }
  };

  const filteredPosts = posts?.filter(post => {
    // Basic search match
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.ingredients && post.ingredients.some((ingredient: string) => 
        ingredient.toLowerCase().includes(searchQuery.toLowerCase())
      ));

    // Advanced filters
    const passesAdvancedFilters = !showAdvancedFilters || (
      // Category filter
      (selectedCategory === 'all' || post.type === selectedCategory) &&
      
      // Date range filter
      (dateRange === 'all' || (() => {
        const now = new Date();
        const postDate = post.created_at?.toDate ? post.created_at.toDate() : 
                        (post.created_at ? new Date(post.created_at as any) : new Date());
        
        switch (dateRange) {
          case 'today':
            return postDate.toDateString() === now.toDateString();
          case 'this_week':
            return postDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'this_month':
            return postDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          default:
            return true;
        }
      })())
    );

    return matchesSearch && passesAdvancedFilters;
  }) || [];

  // Sort filtered posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const getPostDate = (post: any) => post.created_at?.toDate ? post.created_at.toDate() : 
                                      (post.created_at ? new Date(post.created_at as any) : new Date());
    
    switch (sortBy) {
      case 'oldest':
        return getPostDate(a).getTime() - getPostDate(b).getTime();
      case 'most_liked':
        return (b.likes_count || 0) - (a.likes_count || 0);
      case 'most_commented':
        return (b.comments_count || 0) - (a.comments_count || 0);
      case 'newest':
      default:
        return getPostDate(b).getTime() - getPostDate(a).getTime();
    }
  });

  const tabs = [
    { id: "all", label: "All Posts", icon: Wine },
    { id: "following", label: "Following", icon: Users },
    { id: "recipes", label: "Recipes", icon: TrendingUp },
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Welcome to Pourfect
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Discover amazing drinks, share your experiences, and connect with fellow enthusiasts
              </p>
              
              {/* Search Bar */}
              <div className="max-w-lg mx-auto space-y-4">
                {/* Search Type Toggle */}
                <div className="flex bg-white/10 rounded-lg p-1 backdrop-blur-sm">
                  <button
                    onClick={() => setSearchType("posts")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      searchType === "posts"
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setSearchType("users")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      searchType === "users"
                        ? "bg-purple-600 text-white"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Users
                  </button>
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={searchType === "posts" ? "Search posts, recipes, or ingredients..." : "Search users by name or username..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                  />
                  {searchType === "posts" && (
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                        showAdvancedFilters ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && searchType === "posts" && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Category Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Category
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="all">All Posts</option>
                          <option value="recipe">Recipes</option>
                          <option value="review">Reviews</option>
                          <option value="photo">Photos</option>
                        </select>
                      </div>

                      {/* Sort Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Sort By
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="most_liked">Most Liked</option>
                          <option value="most_commented">Most Comments</option>
                        </select>
                      </div>

                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Date Range
                        </label>
                        <select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="this_week">This Week</option>
                          <option value="this_month">This Month</option>
                        </select>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setSortBy('newest');
                          setDateRange('all');
                        }}
                        className="text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-3">
              {/* Tabs */}
              <div className="flex space-x-1 bg-white/5 p-1 rounded-xl mb-8 backdrop-blur-sm border border-white/10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="space-y-6">
                {/* Results Counter for Posts */}
                {searchType === "posts" && (searchQuery || showAdvancedFilters) && (
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                    <div className="text-sm text-gray-300">
                      {sortedPosts.length} {sortedPosts.length === 1 ? 'post' : 'posts'} found
                      {searchQuery && ` for "${searchQuery}"`}
                    </div>
                    {showAdvancedFilters && (
                      <div className="text-xs text-gray-400">
                        Filters: {selectedCategory !== 'all' && `${selectedCategory} • `}
                        {sortBy !== 'newest' && `${sortBy.replace('_', ' ')} • `}
                        {dateRange !== 'all' && dateRange.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                )}

                {searchType === "users" && searchQuery ? (
                  /* User Search Results */
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="w-5 h-5 text-purple-400" />
                      <h2 className="text-lg font-semibold text-white">
                        Search Results for "{searchQuery}"
                      </h2>
                    </div>
                    {searchResults && searchResults.length > 0 ? (
                      <div className="grid gap-4">
                        {searchResults.map((profile) => (
                          <div 
                            key={profile.uid} 
                            className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10"
                          >
                            <UserProfileCard 
                              user={profile} 
                              onFollow={() => handleFollow(profile.uid)}
                              isFollowing={followStatuses?.[profile.uid]}
                              isLoading={followMutation.isPending || unfollowMutation.isPending}
                              onUserClick={handleUserClick}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No users found</h3>
                        <p className="text-gray-500">
                          No users match your search. Try different keywords.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Posts */
                  <>
                    {loadingPosts ? (
                      <>
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                            <div className="animate-pulse">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="h-4 bg-gray-600 rounded w-1/4 mb-2"></div>
                                  <div className="h-3 bg-gray-600 rounded w-1/6"></div>
                                </div>
                              </div>
                              <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                              <div className="h-4 bg-gray-600 rounded w-1/2 mb-4"></div>
                              <div className="h-48 bg-gray-600 rounded-lg"></div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : sortedPosts.length > 0 ? (
                      sortedPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Wine className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No posts found</h3>
                        <p className="text-gray-500">
                          {searchQuery 
                            ? "No posts match your search. Try different keywords."
                            : activeTab === "following" 
                            ? "Follow some users to see their posts here."
                            : "Be the first to share something amazing!"
                          }
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Suggested Users */}
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Suggested Users
                </h3>
                <div className="space-y-3">
                  {userProfiles?.slice(0, 5).map((profile) => (
                    <div key={profile.id} className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
                        onClick={() => handleUserClick(profile.uid)}
                      >
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-bold">{profile.display_name?.charAt(0) || 'U'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-medium text-white text-sm truncate cursor-pointer hover:text-purple-400 transition-colors"
                          onClick={() => handleUserClick(profile.uid)}
                        >
                          {profile.display_name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">@{profile.username}</div>
                      </div>
                      {profile.uid !== user?.uid && (
                        <button
                          onClick={() => handleFollow(profile.uid)}
                          disabled={followMutation.isPending || unfollowMutation.isPending}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            followStatuses?.[profile.uid]
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {followStatuses?.[profile.uid] ? '✓' : '+'}
                        </button>
                      )}
                    </div>
                  )) || (
                    <div className="text-gray-500 text-sm">No suggestions available</div>
                  )}
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Trending
                </h3>
                <div className="space-y-3">
                  {["#CraftCocktails", "#WhiskeyWednesday", "#MixologyTips", "#LocalBars", "#RecipeShare"].map((tag) => (
                    <div key={tag} className="flex items-center justify-between">
                      <span className="text-purple-400 font-medium">{tag}</span>
                      <span className="text-gray-500 text-sm">2.3k posts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Events */}
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Nearby Events
                </h3>
                <div className="space-y-3">
                  <div className="text-gray-500 text-sm">
                    Check the Events page for upcoming drink experiences near you!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Placeholder components that we'll create next
function PostCard({ post }: { post: any }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const { data: postAuthor } = useQuery({
    queryKey: ['post-author', post.user_id],
    queryFn: async () => {
      const profiles = await firebase.entities.UserProfile.filter({ uid: post.user_id });
      return profiles[0] || null;
    },
    enabled: !!post.user_id,
  });

  const handleUserClick = (userId: string) => {
    if (userId === currentUser?.uid) {
      router.push('/profile');
    } else {
      router.push(`/profile/${userId}`);
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all overflow-hidden"
          onClick={() => handleUserClick(post.user_id)}
        >
          {postAuthor?.avatar_url ? (
            <img src={postAuthor.avatar_url} alt={postAuthor.display_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-semibold text-sm">
              {postAuthor?.display_name?.charAt(0)?.toUpperCase() || post.user_id?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div 
            className="font-semibold text-white cursor-pointer hover:text-purple-400 transition-colors"
            onClick={() => handleUserClick(post.user_id)}
          >
            {postAuthor?.display_name || 'Anonymous User'}
          </div>
          <div className="text-gray-400 text-sm">
            {post.created_at?.toDate?.()?.toLocaleDateString() || 'Recently'}
          </div>
        </div>
      </div>
      
      <h3 className="font-semibold text-white text-lg mb-2">{post.title}</h3>
      <p className="text-gray-300 mb-4">{post.content}</p>
      
      {post.images && post.images.length > 0 && (
        <div className="mb-4">
          <img 
            src={post.images[0]} 
            alt={post.title}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="flex items-center gap-4 text-gray-400">
        <button className="flex items-center gap-1 hover:text-purple-400 transition-colors">
          <span>♥</span>
          <span>{post.likes_count || 0}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-purple-400 transition-colors">
          <span>💬</span>
          <span>{post.comments_count || 0}</span>
        </button>
      </div>
    </div>
  );
}

function UserProfileCard({ 
  user, 
  compact, 
  onFollow, 
  isFollowing, 
  isLoading,
  onUserClick
}: { 
  user: any; 
  compact?: boolean; 
  onFollow?: () => void; 
  isFollowing?: boolean; 
  isLoading?: boolean;
  onUserClick?: (uid: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {user.avatar_url ? (
        <img 
          src={user.avatar_url} 
          alt={user.display_name} 
          className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
          onClick={() => onUserClick?.(user.uid)}
        />
      ) : (
        <div 
          className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
          onClick={() => onUserClick?.(user.uid)}
        >
          <span className="text-white font-semibold text-xs">
            {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium text-white text-sm truncate cursor-pointer hover:text-purple-400 transition-colors"
          onClick={() => onUserClick?.(user.uid)}
        >
          {user.display_name || 'Anonymous'}
        </div>
        <div className="text-gray-400 text-xs truncate">@{user.username || 'user'}</div>
        {!compact && user.bio && (
          <div className="text-gray-500 text-xs mt-1 line-clamp-2">{user.bio}</div>
        )}
        {!compact && (
          <div className="flex gap-4 text-xs text-gray-400 mt-1">
            <span>{user.followers_count || 0} followers</span>
            <span>{user.following_count || 0} following</span>
          </div>
        )}
      </div>
      {onFollow && (
        <button 
          onClick={onFollow}
          disabled={isLoading}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isFollowing 
              ? "bg-gray-600 text-white hover:bg-gray-700" 
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {isLoading ? (
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : isFollowing ? (
            <>
              <UserCheck className="w-3 h-3" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3" />
              Follow
            </>
          )}
        </button>
      )}
    </div>
  );
}
