'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthProvider as AP, User } from 'firebase/auth';
import { authService } from '@/lib/firebaseService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleSignIn: (provider : AP) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const googleSignIn = async (provider : AP) => {
    const user = await authService.googleSignIn(provider);
    return user;
  }

  const signIn = async (email: string, password: string) => {
    const user = await authService.signIn(email, password);
    return user;
  };

  const signUp = async (email: string, password: string) => {
    const user = await authService.signUp(email, password);
    return user;
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const value = {
    user,
    loading,
    googleSignIn,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
