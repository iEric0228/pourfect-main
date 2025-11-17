import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  DocumentData,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, db } from './firebase';

// Auth Service
export const authService = {
  async signUp(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async signOut() {
    await signOut(auth);
  },

  async me(): Promise<User | null> {
    return auth.currentUser;
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};

// Generic Entity Service
class EntityService<T extends DocumentData> {
  constructor(private collectionName: string) {}

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...data,
      created_at: now,
      updated_at: now
    });
    return docRef.id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updated_at: Timestamp.now()
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async get(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as unknown as T;
    }
    return null;
  }

  async filter(conditions: Record<string, any> = {}, options: {
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    limit?: number;
  } = {}): Promise<T[]> {
    const collectionRef = collection(db, this.collectionName);
    const constraints: QueryConstraint[] = [];

    // Add where conditions
    Object.entries(conditions).forEach(([field, value]) => {
      constraints.push(where(field, '==', value));
    });

    // Add ordering
    if (options.orderBy) {
      constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
    }

    // Add limit
    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as unknown as T[];
  }

  async getAll(): Promise<T[]> {
    return this.filter();
  }
}

// Entity Types
export interface Post {
  id: string;
  type: 'experience' | 'review' | 'recipe' | 'photo';
  title: string;
  content: string;
  images: string[];
  location?: {
    name: string;
    coordinates: { lat: number; lng: number };
  };
  rating?: number;
  ingredients?: string[];
  instructions?: string[];
  user_id: string;
  likes_count: number;
  comments_count: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
  start_date: Timestamp;
  end_date: Timestamp;
  price?: number;
  tickets_available?: number;
  tickets_sold: number;
  rsvp_count: number;
  likes_count: number;
  saves_count: number;
  organizer_id: string;
  organizer_name: string;
  organizer_avatar?: string;
  category: 'tasting' | 'workshop' | 'happy-hour' | 'networking' | 'competition' | 'other';
  tags: string[];
  policy: {
    age_restriction?: number;
    dress_code?: string;
    refund_policy: string;
    terms: string;
  };
  capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: Timestamp;
}

export interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'interested' | 'not_going';
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SavedItem {
  id: string;
  user_id: string;
  item_type: 'post' | 'event';
  item_id: string;
  created_at: Timestamp;
}

export interface Ticket {
  id: string;
  event_id: string;
  event_title: string;
  event_date: Timestamp;
  event_location: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  quantity: number;
  total_price: number;
  purchase_date: Timestamp;
  ticket_code: string;
  qr_code: string;
  status: 'active' | 'used' | 'transferred' | 'refunded';
  transferred_to?: string;
  payment_method: 'apple_pay' | 'google_pay' | 'card';
  payment_id: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  onboarding_completed: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface EventLike {
  id: string;
  event_id: string;
  user_id: string;
  created_at: Timestamp;
}

export interface EventSave {
  id: string;
  event_id: string;
  user_id: string;
  created_at: Timestamp;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  event_id: string;
  calendar_provider: 'google' | 'apple' | 'outlook';
  synced_at: Timestamp;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: Timestamp;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message?: string;
  last_message_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image';
  read_by: string[];
  created_at: Timestamp;
}

// Entity Services
export const entities = {
  Post: new EntityService<Post>('posts'),
  Event: new EntityService<Event>('events'),
  Comment: new EntityService<Comment>('comments'),
  Like: new EntityService<Like>('likes'),
  RSVP: new EntityService<RSVP>('rsvps'),
  SavedItem: new EntityService<SavedItem>('saved_items'),
  Ticket: new EntityService<Ticket>('tickets'),
  UserProfile: new EntityService<UserProfile>('user_profiles'),
  Follow: new EntityService<Follow>('follows'),
  Conversation: new EntityService<Conversation>('conversations'),
  Message: new EntityService<Message>('messages'),
  EventLike: new EntityService<EventLike>('event_likes'),
  EventSave: new EntityService<EventSave>('event_saves'),
  CalendarEvent: new EntityService<CalendarEvent>('calendar_events')
};

// Firebase service object (to replace base44)
export const firebase = {
  auth: authService,
  entities
};
