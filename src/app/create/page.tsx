'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Star, Upload, X } from "lucide-react";
import Layout from "@/components/Layout";
import { firebase } from "@/lib/firebaseService";
import { useAuth } from "@/contexts/AuthContext";

export default function Create() {
  const [postType, setPostType] = useState<'experience' | 'review' | 'recipe' | 'photo'>('experience');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    images: [] as string[],
    location: { name: '', coordinates: { lat: 0, lng: 0 } },
    rating: 0,
    ingredients: [] as string[],
    instructions: [] as string[]
  });
  const [newIngredient, setNewIngredient] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        name: e.target.value
      }
    }));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...prev.instructions, newInstruction.trim()]
      }));
      setNewInstruction('');
    }
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // For demo purposes, we'll use placeholder URLs
      // In a real app, you'd upload to Firebase Storage
      const imageUrls = Array.from(files).map((_, index) => 
        `https://via.placeholder.com/400x300?text=Image+${index + 1}`
      );
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const postData: any = {
        type: postType,
        title: formData.title,
        content: formData.content,
        images: formData.images,
        user_id: user.uid,
        likes_count: 0,
        comments_count: 0
      };

      if (formData.location.name) {
        postData.location = formData.location;
      }

      if (postType === 'review' && formData.rating > 0) {
        postData.rating = formData.rating;
      }

      if (postType === 'recipe') {
        postData.ingredients = formData.ingredients;
        postData.instructions = formData.instructions;
      }

      await firebase.entities.Post.create(postData);
      
      // Update user's post count
      const userProfile = await firebase.entities.UserProfile.filter({ uid: user.uid });
      if (userProfile.length > 0) {
        await firebase.entities.UserProfile.update(userProfile[0].id, {
          posts_count: (userProfile[0].posts_count || 0) + 1
        });
      }

      router.push('/feed');
    } catch (error: any) {
      setError(error.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const postTypes = [
    { id: 'experience', label: 'Experience', description: 'Share your drink experience' },
    { id: 'review', label: 'Review', description: 'Review a drink or bar' },
    { id: 'recipe', label: 'Recipe', description: 'Share a drink recipe' },
    { id: 'photo', label: 'Photo', description: 'Share a photo with caption' }
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Create Post
            </h1>
            <p className="text-gray-300">Share your drink experiences with the community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Post Type Selection */}
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Post Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {postTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPostType(type.id as any)}
                    className={`p-4 rounded-lg border transition-all ${
                      postType === type.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white"
                        : "bg-white/10 border-white/20 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs mt-1 opacity-80">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Give your post a catchy title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Tell us about your experience..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.location.name}
                      onChange={handleLocationChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Where was this?"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rating (for reviews) */}
            {postType === 'review' && (
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Rating</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating }))}
                      className={`p-2 ${
                        formData.rating >= rating ? 'text-yellow-400' : 'text-gray-500'
                      } hover:text-yellow-300 transition-colors`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 text-gray-300">
                    {formData.rating > 0 ? `${formData.rating}/5` : 'No rating'}
                  </span>
                </div>
              </div>
            )}

            {/* Recipe Details */}
            {postType === 'recipe' && (
              <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Recipe Details</h3>
                
                {/* Ingredients */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ingredients
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newIngredient}
                      onChange={(e) => setNewIngredient(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add an ingredient"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                    />
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className="bg-white/10 px-3 py-1 rounded-full text-sm text-white flex items-center gap-2"
                      >
                        {ingredient}
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Instructions
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newInstruction}
                      onChange={(e) => setNewInstruction(e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Add an instruction step"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInstruction())}
                    />
                    <button
                      type="button"
                      onClick={addInstruction}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.instructions.map((instruction, index) => (
                      <div
                        key={index}
                        className="bg-white/10 p-3 rounded-lg flex items-start gap-3"
                      >
                        <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-white">{instruction}</span>
                        <button
                          type="button"
                          onClick={() => removeInstruction(index)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Images */}
            <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Images</h3>
              
              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                {loading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
