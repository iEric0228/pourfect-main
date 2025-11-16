'use client';

import React, { useState, useRef } from 'react';
import { X, Camera, Check, AlertCircle, Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/firebaseService';
import { UserService } from '@/lib/userService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdate: (updatedProfile: UserProfile) => void;
}

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  userProfile, 
  onUpdate 
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    display_name: userProfile.display_name || '',
    username: userProfile.username || '',
    bio: userProfile.bio || '',
    avatar_url: userProfile.avatar_url || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Check username availability when username changes
    if (field === 'username') {
      checkUsernameAvailability(value);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === userProfile.username) {
      setUsernameStatus('idle');
      return;
    }

    const validation = UserService.validateUsername(username);
    if (!validation.isValid) {
      setErrors(prev => ({ ...prev, username: validation.error || 'Invalid username' }));
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    setErrors(prev => ({ ...prev, username: '' }));

    try {
      const isAvailable = await UserService.checkUsernameAvailability(username, userProfile.uid);
      setUsernameStatus(isAvailable ? 'available' : 'taken');
      
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
      }
    } catch (error) {
      setUsernameStatus('idle');
      setErrors(prev => ({ ...prev, username: 'Error checking username availability' }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: 'Please select an image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Image size must be less than 5MB' }));
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, avatar_url: e.target?.result as string }));
      setErrors(prev => ({ ...prev, avatar: '' }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else {
      const validation = UserService.validateUsername(formData.username);
      if (!validation.isValid) {
        newErrors.username = validation.error || 'Invalid username';
      } else if (usernameStatus === 'taken') {
        newErrors.username = 'Username is already taken';
      }
    }

    if (formData.bio.length > 300) {
      newErrors.bio = 'Bio must be less than 300 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (usernameStatus === 'checking') {
      setErrors(prev => ({ ...prev, username: 'Please wait for username validation' }));
      return;
    }

    setLoading(true);

    try {
      const updatedProfile = await UserService.updateUserProfile(userProfile.uid, {
        display_name: formData.display_name.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        avatar_url: formData.avatar_url,
      });

      if (updatedProfile) {
        onUpdate(updatedProfile);
        onClose();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: error instanceof Error ? error.message : 'Failed to update profile' 
      }));
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
      case 'available':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'taken':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-2xl">
                    {formData.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            {errors.avatar && (
              <p className="text-red-400 text-sm">{errors.avatar}</p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors"
              placeholder="Your display name"
              maxLength={50}
            />
            {errors.display_name && (
              <p className="text-red-400 text-sm mt-1">{errors.display_name}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors pr-10"
                placeholder="your_username"
                maxLength={30}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getUsernameStatusIcon()}
              </div>
            </div>
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username}</p>
            )}
            {usernameStatus === 'available' && !errors.username && (
              <p className="text-green-400 text-sm mt-1">Username is available!</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none transition-colors resize-none"
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={300}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.bio && (
                <p className="text-red-400 text-sm">{errors.bio}</p>
              )}
              <span className={`text-sm ml-auto ${
                formData.bio.length > 250 ? 'text-yellow-400' : 'text-gray-400'
              }`}>
                {formData.bio.length}/300
              </span>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-200 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || usernameStatus === 'checking'}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
