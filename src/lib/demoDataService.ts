import { firebase } from './firebaseService';
import { Timestamp } from 'firebase/firestore';

export class DemoDataService {
  static async createSampleUserProfile(userId: string, email: string) {
    try {
      // Check if profile already exists
      const existingProfiles = await firebase.entities.UserProfile.filter({ uid: userId });
      if (existingProfiles.length > 0) {
        return existingProfiles[0];
      }

      // Create sample profile
      const sampleProfile = {
        uid: userId,
        username: `user_${Date.now()}`,
        display_name: 'Demo User',
        bio: 'Welcome to Pourfect! I love discovering new cocktail recipes and sharing my mixology adventures with friends.',
        avatar_url: '',
        followers_count: 42,
        following_count: 28,
        posts_count: 15,
        onboarding_completed: true,
        created_at: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 days ago
        updated_at: Timestamp.fromDate(new Date()),
      };

      const profile = await firebase.entities.UserProfile.create(sampleProfile);
      return profile;
    } catch (error) {
      console.error('Error creating sample profile:', error);
      throw error;
    }
  }

  static async createSamplePosts(userId: string, profileId: string) {
    try {
      const samplePosts = [
        {
          user_id: userId,
          title: 'Perfect Old Fashioned Recipe',
          content: 'Just perfected my Old Fashioned recipe! The key is using a good bourbon and not over-muddling the sugar. The orange peel makes all the difference.',
          type: 'recipe' as const,
          images: [],
          likes_count: 23,
          comments_count: 5,
          shares_count: 2,
          recipe: {
            ingredients: ['2 oz Bourbon', '1 sugar cube', '2-3 dashes Angostura bitters', 'Orange peel'],
            instructions: ['Muddle sugar with bitters', 'Add bourbon and stir with ice', 'Strain over large ice cube', 'Express orange peel and garnish']
          },
          created_at: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
          updated_at: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        },
        {
          user_id: userId,
          title: 'Amazing Cocktail Bar Discovery',
          content: 'Found this incredible speakeasy downtown! Their bartender makes the most amazing Negroni variations. Definitely coming back here soon.',
          type: 'review' as const,
          images: [],
          likes_count: 15,
          comments_count: 3,
          shares_count: 1,
          location: {
            name: 'The Secret Bar',
            address: '123 Hidden Street',
            coordinates: { lat: 40.7128, lng: -74.0060 }
          },
          created_at: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
          updated_at: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        },
        {
          user_id: userId,
          title: 'Homemade Simple Syrup',
          content: 'Made some lavender simple syrup today. Perfect for adding a floral note to gin cocktails. Recipe: equal parts sugar and water, add dried lavender, simmer for 10 minutes.',
          type: 'recipe' as const,
          images: [],
          likes_count: 31,
          comments_count: 8,
          shares_count: 12,
          recipe: {
            ingredients: ['1 cup sugar', '1 cup water', '2 tbsp dried lavender'],
            instructions: ['Combine sugar and water in saucepan', 'Add lavender and bring to boil', 'Simmer 10 minutes', 'Strain and cool']
          },
          created_at: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
          updated_at: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        }
      ];

      const createdPosts = [];
      for (const post of samplePosts) {
        const createdPost = await firebase.entities.Post.create(post);
        createdPosts.push(createdPost);
      }

      return createdPosts;
    } catch (error) {
      console.error('Error creating sample posts:', error);
      throw error;
    }
  }

  static async initializeDemoData(userId: string, email: string) {
    try {
      console.log('Initializing demo data for user:', userId);
      
      // Create profile
      const profileId = await this.createSampleUserProfile(userId, email);
      console.log('Created profile:', profileId);

      // Create posts
      const posts = await this.createSamplePosts(userId, typeof profileId === 'string' ? profileId : profileId.id);
      console.log('Created posts:', posts.length);

      return { profile: profileId, posts };
    } catch (error) {
      console.error('Error initializing demo data:', error);
      throw error;
    }
  }

  static async clearUserData(userId: string) {
    try {
      // Delete user posts
      const posts = await firebase.entities.Post.filter({ user_id: userId });
      for (const post of posts) {
        await firebase.entities.Post.delete(post.id);
      }

      // Delete user profile
      const profiles = await firebase.entities.UserProfile.filter({ uid: userId });
      for (const profile of profiles) {
        await firebase.entities.UserProfile.delete(profile.id);
      }

      console.log('Cleared user data for:', userId);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }

  // Create multiple demo users for testing messaging
  static async createDemoUsers() {
    try {
      const demoUsers = [
        {
          uid: 'demo-user-1',
          username: 'mixmaster_jake',
          display_name: 'Jake Martinez',
          bio: 'Professional bartender with over 10 years of experience. Love crafting classic cocktails with a modern twist.',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          followers_count: 156,
          following_count: 89,
          posts_count: 23,
          onboarding_completed: true,
          created_at: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
          updated_at: Timestamp.fromDate(new Date()),
        },
        {
          uid: 'demo-user-2',
          username: 'cocktail_sarah',
          display_name: 'Sarah Chen',
          bio: 'Home mixologist and cocktail enthusiast. Always experimenting with new flavors and ingredients.',
          avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b169e9b0?w=150&h=150&fit=crop&crop=face',
          followers_count: 234,
          following_count: 167,
          posts_count: 31,
          onboarding_completed: true,
          created_at: Timestamp.fromDate(new Date(Date.now() - 22 * 24 * 60 * 60 * 1000)),
          updated_at: Timestamp.fromDate(new Date()),
        },
        {
          uid: 'demo-user-3',
          username: 'spirit_guide_mike',
          display_name: 'Mike Thompson',
          bio: 'Whiskey connoisseur and craft cocktail lover. Here to share the perfect pour with fellow enthusiasts.',
          avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          followers_count: 98,
          following_count: 123,
          posts_count: 18,
          onboarding_completed: true,
          created_at: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)),
          updated_at: Timestamp.fromDate(new Date()),
        }
      ];

      for (const user of demoUsers) {
        // Check if user already exists
        const existing = await firebase.entities.UserProfile.filter({ uid: user.uid });
        if (existing.length === 0) {
          await firebase.entities.UserProfile.create(user);
          console.log(`Created demo user: ${user.display_name}`);
        } else {
          console.log(`Demo user already exists: ${user.display_name}`);
        }
      }

      console.log('Demo users created successfully!');
      return true;
    } catch (error) {
      console.error('Error creating demo users:', error);
      return false;
    }
  }
}
