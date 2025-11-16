'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import IngredientPhotoAnalyzer from '@/components/IngredientPhotoAnalyzer';
import { CocktailWithAnalysis } from '@/lib/cocktailService';
import { Camera, Sparkles, ChefHat, Clock, Star } from 'lucide-react';

export default function IngredientAnalyzer() {
  const [foundCocktails, setFoundCocktails] = useState<CocktailWithAnalysis[]>([]);

  const handleCocktailsFound = (cocktails: CocktailWithAnalysis[]) => {
    setFoundCocktails(cocktails);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pt-20">
        {/* Header Section */}
        <div className="max-w-4xl mx-auto text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-600/20 rounded-full">
              <Camera className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Smart Ingredient Scanner
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Point your camera at your ingredients and let AI discover all the amazing cocktails you can create!
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <Camera className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Smart Recognition</h3>
              <p className="text-sm text-gray-400">AI-powered ingredient detection from photos</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Instant Matching</h3>
              <p className="text-sm text-gray-400">Find cocktails that match your ingredients</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <ChefHat className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Expert Recipes</h3>
              <p className="text-sm text-gray-400">Professional cocktail recipes and instructions</p>
            </div>
          </div>
        </div>

        {/* Main Analyzer Component */}
        <IngredientPhotoAnalyzer onCocktailsFound={handleCocktailsFound} />

        {/* Tips Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400" />
              Pro Tips for Better Results
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-purple-300 mb-2">Photography Tips:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Ensure good lighting for clear ingredient recognition</li>
                  <li>• Include bottle labels when possible</li>
                  <li>• Arrange ingredients in a single layer</li>
                  <li>• Keep the camera steady for sharp images</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-purple-300 mb-2">Best Ingredients to Include:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Spirits (vodka, gin, rum, whiskey, tequila)</li>
                  <li>• Fresh citrus fruits (limes, lemons, oranges)</li>
                  <li>• Herbs (mint, basil, rosemary)</li>
                  <li>• Mixers and syrups</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Display */}
        {foundCocktails.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-8 text-white">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">{foundCocktails.length} Cocktails Found</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">
                    {foundCocktails.filter(c => c.difficulty === 'Easy').length} Easy Recipes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">AI Powered</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
