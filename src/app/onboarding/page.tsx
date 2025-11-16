'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, User, ArrowRight } from "lucide-react";
import { firebase } from "@/lib/firebaseService";
import { useAuth } from "@/contexts/AuthContext";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    interests: [] as string[],
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const interests = [
    'Cocktails', 'Wine', 'Beer', 'Whiskey', 'Rum', 'Vodka', 'Gin', 'Tequila',
    'Mixology', 'Bartending', 'Wine Tasting', 'Craft Beer', 'Home Brewing',
    'Bar Culture', 'Drink Photography', 'Recipe Creation'
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update user profile with onboarding data
      const userProfiles = await firebase.entities.UserProfile.filter({ uid: user.uid });
      if (userProfiles.length > 0) {
        await firebase.entities.UserProfile.update(userProfiles[0].id, {
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          onboarding_completed: true
        });
      }

      router.push('/feed');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4">
      <div className="max-w-md w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to Pourfect!</h2>
              <p className="text-gray-300 mb-8">
                Let's set up your profile to help you connect with fellow drink enthusiasts.
              </p>
              
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tell us about yourself
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="I'm passionate about craft cocktails and love exploring new flavors..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">What are your interests?</h2>
              <p className="text-gray-300 mb-8">
                Select the topics you're most interested in to personalize your experience.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {interests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      formData.interests.includes(interest)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">You're all set!</h2>
              <p className="text-gray-300 mb-8">
                Your profile is ready. You can always update it later in your profile settings.
              </p>
              
              <div className="bg-white/10 rounded-lg p-4 mb-6">
                <div className="text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Bio:</span>
                    <span className="text-white text-sm">
                      {formData.bio ? '✓ Added' : '- Skipped'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Interests:</span>
                    <span className="text-white text-sm">
                      {formData.interests.length} selected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            
            <div className="flex-1" />
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                {loading ? 'Completing...' : 'Get Started'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
