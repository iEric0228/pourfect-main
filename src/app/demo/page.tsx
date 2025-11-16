'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DemoDataService } from '@/lib/demoDataService';
import { CocktailService } from '@/lib/cocktailService';
import { User, Users, Play, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';

export default function DemoPage() {
  const { user, signIn, signUp, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [credentials, setCredentials] = useState({
    email: 'demo@pourfect.com',
    password: 'demo123456'
  });

  const handleSignIn = async () => {
    setLoading(true);
    setMessage('');
    try {
      await signIn(credentials.email, credentials.password);
      setMessage('Signed in successfully!');
    } catch (error) {
      console.error('Sign in error:', error);
      setMessage(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    try {
      await signUp(credentials.email, credentials.password);
      setMessage('Account created successfully!');
    } catch (error) {
      console.error('Sign up error:', error);
      setMessage(`Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setMessage('');
    try {
      await signOut();
      setMessage('Signed out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      setMessage(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeDemoData = async () => {
    if (!user) {
      setMessage('Please sign in first');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await DemoDataService.initializeDemoData(user.uid, user.email || '');
      setMessage('Demo data initialized successfully! Check your profile page.');
    } catch (error) {
      console.error('Demo data error:', error);
      setMessage(`Failed to initialize demo data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeCocktailDatabase = async () => {
    setLoading(true);
    setMessage('');
    try {
      const success = await CocktailService.initializeCocktailDatabase();
      if (success) {
        setMessage('Cocktail database initialized successfully! AI Scanner is now ready.');
      } else {
        setMessage('Cocktail database already exists.');
      }
    } catch (error) {
      console.error('Cocktail database error:', error);
      setMessage(`Failed to initialize cocktail database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createDemoUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const success = await DemoDataService.createDemoUsers();
      if (success) {
        setMessage('Demo users created successfully! You can now test messaging with Jake, Sarah, and Mike.');
      } else {
        setMessage('Failed to create demo users.');
      }
    } catch (error) {
      console.error('Demo users error:', error);
      setMessage(`Failed to create demo users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createSampleEvents = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { EventService } = await import('@/lib/eventService');
      const events = await EventService.createSampleEvents();
      setMessage(`Sample events created successfully! ${events.length} events added to the system.`);
    } catch (error) {
      console.error('Sample events error:', error);
      setMessage(`Failed to create sample events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const clearDemoData = async () => {
    if (!user) {
      setMessage('Please sign in first');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await DemoDataService.clearUserData(user.uid);
      setMessage('Demo data cleared successfully!');
    } catch (error) {
      console.error('Clear data error:', error);
      setMessage(`Failed to clear demo data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pt-20">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Demo & Testing</h1>
            
            {/* User Status */}
            <div className="bg-white/10 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">User Status</span>
              </div>
              {user ? (
                <div className="text-green-400">
                  ✅ Signed in as: {user.email}
                  <br />
                  <span className="text-gray-400 text-sm">UID: {user.uid}</span>
                </div>
              ) : (
                <div className="text-red-400">❌ Not signed in</div>
              )}
            </div>

            {/* Credentials */}
            {!user && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                    placeholder="Enter password"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {!user ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                    Sign Up
                  </button>
                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={initializeCocktailDatabase}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Setup AI Cocktail Database
                  </button>
                  
                  <button
                    onClick={initializeDemoData}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Initialize Demo Data
                  </button>
                  
                  <button
                    onClick={createDemoUsers}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    Create Demo Users (for Messaging)
                  </button>
                  
                  <button
                    onClick={createSampleEvents}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Create Sample Events (for Testing)
                  </button>
                  
                  <button
                    onClick={clearDemoData}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Clear Demo Data
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-lg hover:from-gray-700 hover:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg ${
                message.includes('success') 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-200'
                  : 'bg-red-500/20 border border-red-500/50 text-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Quick Links */}
            {user && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href="/profile"
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center text-white transition-colors"
                  >
                    View Profile
                  </a>
                  <a
                    href="/ingredient-analyzer"
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center text-white transition-colors"
                  >
                    AI Analyzer
                  </a>
                  <a
                    href="/feed"
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center text-white transition-colors"
                  >
                    Feed
                  </a>
                  <a
                    href="/create"
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center text-white transition-colors"
                  >
                    Create Post
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
