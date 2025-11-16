import { firebase, UserProfile } from './firebaseService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface UserSettings {
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLocation: boolean;
    allowMessageFromStrangers: boolean;
  };
  notifications: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    followNotifications: boolean;
    likeNotifications: boolean;
    commentNotifications: boolean;
    messageNotifications: boolean;
    eventInvitations: boolean;
    eventReminders: boolean;
  };
  content: {
    autoplayVideos: boolean;
    showSensitiveContent: boolean;
    dataUsage: 'wifi' | 'cellular' | 'both';
  };
  account: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    downloadData: boolean;
  };
}

export const defaultUserSettings: UserSettings = {
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    allowMessageFromStrangers: true,
  },
  notifications: {
    pushNotifications: true,
    emailNotifications: true,
    followNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    messageNotifications: true,
    eventInvitations: true,
    eventReminders: true,
  },
  content: {
    autoplayVideos: true,
    showSensitiveContent: false,
    dataUsage: 'both',
  },
  account: {
    twoFactorAuth: false,
    loginAlerts: true,
    downloadData: false,
  },
};

export class UserService {
  static async checkUsernameAvailability(username: string, currentUserId?: string): Promise<boolean> {
    try {
      const normalizedUsername = username.toLowerCase().trim();
      
      // Basic validation
      if (!normalizedUsername || normalizedUsername.length < 3) {
        return false;
      }
      
      // Check for invalid characters (only allow alphanumeric, underscores, and dots)
      if (!/^[a-zA-Z0-9_.]+$/.test(normalizedUsername)) {
        return false;
      }
      
      // Check if username is already taken
      const q = query(
        collection(db, 'user_profiles'),
        where('username', '==', normalizedUsername)
      );
      
      const querySnapshot = await getDocs(q);
      
      // If no documents found, username is available
      if (querySnapshot.empty) {
        return true;
      }
      
      // If current user is checking their own username, it's available
      if (currentUserId) {
        const existingUser = querySnapshot.docs[0];
        return existingUser.data().uid === currentUserId;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  static async updateUserProfile(
    userId: string, 
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    try {
      // If username is being updated, check availability first
      if (updates.username) {
        const isAvailable = await this.checkUsernameAvailability(updates.username, userId);
        if (!isAvailable) {
          throw new Error('Username is not available');
        }
        // Normalize username
        updates.username = updates.username.toLowerCase().trim();
      }

      // Get current profile
      const profiles = await firebase.entities.UserProfile.filter({ uid: userId });
      if (profiles.length === 0) {
        throw new Error('User profile not found');
      }

      const currentProfile = profiles[0];
      
      // Update profile
      await firebase.entities.UserProfile.update(currentProfile.id, {
        ...updates,
        updated_at: new Date() as any,
      });

      // Return updated profile
      return await firebase.entities.UserProfile.get(currentProfile.id);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const settings = await firebase.entities.UserProfile.filter({ uid: userId });
      if (settings.length > 0 && (settings[0] as any).settings) {
        return { ...defaultUserSettings, ...(settings[0] as any).settings };
      }
      return defaultUserSettings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return defaultUserSettings;
    }
  }

  static async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    try {
      const profiles = await firebase.entities.UserProfile.filter({ uid: userId });
      if (profiles.length === 0) {
        throw new Error('User profile not found');
      }

      const currentProfile = profiles[0];
      const currentSettings = (currentProfile as any).settings || defaultUserSettings;
      const updatedSettings = this.deepMerge(currentSettings, settings);

      await firebase.entities.UserProfile.update(currentProfile.id, {
        settings: updatedSettings,
        updated_at: new Date() as any,
      } as any);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  static async deleteUserAccount(userId: string): Promise<void> {
    try {
      // This would need to be implemented based on your data deletion policy
      // For now, we'll just mark the account as deleted
      const profiles = await firebase.entities.UserProfile.filter({ uid: userId });
      if (profiles.length > 0) {
        await firebase.entities.UserProfile.update(profiles[0].id, {
          display_name: 'Deleted User',
          username: `deleted_${Date.now()}`,
          bio: '',
          avatar_url: '',
          updated_at: new Date() as any,
        } as any);
      }
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }

  private static deepMerge(target: any, source: any): any {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private static isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  static validateUsername(username: string): { isValid: boolean; error?: string } {
    const normalizedUsername = username.toLowerCase().trim();
    
    if (!normalizedUsername) {
      return { isValid: false, error: 'Username is required' };
    }
    
    if (normalizedUsername.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters long' };
    }
    
    if (normalizedUsername.length > 30) {
      return { isValid: false, error: 'Username must be less than 30 characters long' };
    }
    
    if (!/^[a-zA-Z0-9_.]+$/.test(normalizedUsername)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and dots' };
    }
    
    if (normalizedUsername.startsWith('.') || normalizedUsername.endsWith('.')) {
      return { isValid: false, error: 'Username cannot start or end with a dot' };
    }
    
    if (normalizedUsername.includes('..')) {
      return { isValid: false, error: 'Username cannot contain consecutive dots' };
    }
    
    // Reserved usernames
    const reserved = ['admin', 'administrator', 'root', 'api', 'www', 'mail', 'support', 'help', 'info'];
    if (reserved.includes(normalizedUsername)) {
      return { isValid: false, error: 'This username is reserved' };
    }
    
    return { isValid: true };
  }

  // Follow/Unfollow functionality
  static async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Check if already following
      const existingFollow = await firebase.entities.Follow.filter({
        follower_id: followerId,
        following_id: followingId
      });

      if (existingFollow.length > 0) {
        throw new Error('Already following this user');
      }

      // Create follow relationship
      await firebase.entities.Follow.create({
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date() as any
      });

      // Update follower count for the followed user
      const followingUser = await firebase.entities.UserProfile.filter({ uid: followingId });
      if (followingUser.length > 0) {
        const profile = followingUser[0];
        await firebase.entities.UserProfile.update(profile.id, {
          followers_count: (profile.followers_count || 0) + 1
        });
      }

      // Update following count for the follower
      const followerUser = await firebase.entities.UserProfile.filter({ uid: followerId });
      if (followerUser.length > 0) {
        const profile = followerUser[0];
        await firebase.entities.UserProfile.update(profile.id, {
          following_count: (profile.following_count || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Find and delete follow relationship
      const existingFollow = await firebase.entities.Follow.filter({
        follower_id: followerId,
        following_id: followingId
      });

      if (existingFollow.length === 0) {
        throw new Error('Not following this user');
      }

      await firebase.entities.Follow.delete(existingFollow[0].id);

      // Update follower count for the unfollowed user
      const followingUser = await firebase.entities.UserProfile.filter({ uid: followingId });
      if (followingUser.length > 0) {
        const profile = followingUser[0];
        await firebase.entities.UserProfile.update(profile.id, {
          followers_count: Math.max((profile.followers_count || 0) - 1, 0)
        });
      }

      // Update following count for the follower
      const followerUser = await firebase.entities.UserProfile.filter({ uid: followerId });
      if (followerUser.length > 0) {
        const profile = followerUser[0];
        await firebase.entities.UserProfile.update(profile.id, {
          following_count: Math.max((profile.following_count || 0) - 1, 0)
        });
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const existingFollow = await firebase.entities.Follow.filter({
        follower_id: followerId,
        following_id: followingId
      });
      return existingFollow.length > 0;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  static async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      if (!query.trim()) return [];
      
      const allUsers = await firebase.entities.UserProfile.getAll();
      const normalizedQuery = query.toLowerCase();
      
      return allUsers
        .filter(user => 
          user.display_name?.toLowerCase().includes(normalizedQuery) ||
          user.username?.toLowerCase().includes(normalizedQuery) ||
          user.bio?.toLowerCase().includes(normalizedQuery)
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}
