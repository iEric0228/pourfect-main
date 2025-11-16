'use client';

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Send, RefreshCw, Copy, Save, Camera } from "lucide-react";
import Layout from "@/components/Layout";
import { firebase } from "@/lib/firebaseService";
import { useAuth } from "@/contexts/AuthContext";

export default function AIRecipe() {
  const [prompt, setPrompt] = useState('');
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Mock AI recipe generation (in a real app, you'd call an AI API)
  const generateRecipe = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock recipe based on prompt
      const mockRecipe = {
        title: `${prompt} - AI Generated Recipe`,
        description: `A delicious ${prompt.toLowerCase()} recipe created just for you using AI.`,
        ingredients: [
          '2 oz Premium Spirit',
          '1 oz Fresh Citrus Juice',
          '0.5 oz Simple Syrup',
          'Fresh Herbs (mint or basil)',
          'Ice cubes',
          'Garnish of choice'
        ],
        instructions: [
          'Add all ingredients except garnish to a cocktail shaker',
          'Fill shaker with ice and shake vigorously for 10-15 seconds',
          'Double strain into a chilled coupe glass',
          'Garnish as desired and serve immediately'
        ],
        prep_time: '5 minutes',
        difficulty: 'Medium',
        flavor_profile: 'Balanced, Refreshing, Aromatic'
      };
      
      setRecipe(mockRecipe);
    } catch (err) {
      setError('Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipe || !user) return;
    
    try {
      await firebase.entities.Post.create({
        type: 'recipe',
        title: recipe.title,
        content: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        user_id: user.uid,
        images: [],
        likes_count: 0,
        comments_count: 0
      });
      
      alert('Recipe saved to your posts!');
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe');
    }
  };

  const copyRecipe = () => {
    if (!recipe) return;
    
    const recipeText = `${recipe.title}\n\n${recipe.description}\n\nIngredients:\n${recipe.ingredients.map((ing: string) => `• ${ing}`).join('\n')}\n\nInstructions:\n${recipe.instructions.map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n')}`;
    
    navigator.clipboard.writeText(recipeText);
    alert('Recipe copied to clipboard!');
  };

  const suggestions = [
    "Tropical summer cocktail with rum",
    "Sophisticated whiskey drink for winter",
    "Refreshing gin cocktail with herbs",
    "Sweet dessert cocktail with chocolate",
    "Low-alcohol aperitif for brunch",
    "Spicy tequila drink with jalapeño"
  ];

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Recipe Generator
              </h1>
            </div>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Describe your ideal drink and let AI create a unique recipe just for you
            </p>
          </div>

          {/* New Feature Promotion */}
          <div className="bg-gradient-to-r from-green-900/30 to-teal-900/30 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <Camera className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    New! Smart Ingredient Scanner
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Take a photo of your ingredients and instantly discover what cocktails you can make
                  </p>
                </div>
              </div>
              <Link 
                href="/ingredient-analyzer"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Try Now
              </Link>
            </div>
          </div>

          {/* Input Section */}
          <div className="bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Describe your ideal drink
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., A refreshing summer cocktail with tropical fruits and mint, not too sweet..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={generateRecipe}
                  disabled={loading || !prompt.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Recipe
                    </>
                  )}
                </button>
                
                {recipe && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyRecipe}
                      className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    {user && (
                      <button
                        onClick={saveRecipe}
                        className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Suggestions */}
          {!recipe && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Need inspiration? Try these:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(suggestion)}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left text-gray-300 hover:text-white transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generated Recipe */}
          {recipe && (
            <div className="bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white mb-2">{recipe.title}</h2>
                <p className="text-gray-300">{recipe.description}</p>
                
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Prep Time:</span>
                    <span className="text-white">{recipe.prep_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Difficulty:</span>
                    <span className="text-white">{recipe.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Flavor:</span>
                    <span className="text-white">{recipe.flavor_profile}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Ingredients */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Ingredients</h3>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient: string, index: number) => (
                        <li key={index} className="flex items-center gap-3 text-gray-300">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Instructions</h3>
                    <ol className="space-y-3">
                      {recipe.instructions.map((instruction: string, index: number) => (
                        <li key={index} className="flex gap-3">
                          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-gray-300 pt-0.5">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setRecipe(null)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Another
                    </button>
                    <div className="flex-1" />
                    <div className="flex gap-2">
                      <button
                        onClick={copyRecipe}
                        className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Recipe
                      </button>
                      {user && (
                        <button
                          onClick={saveRecipe}
                          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all"
                        >
                          <Save className="w-4 h-4" />
                          Save to Posts
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
