'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Sparkles, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import Webcam from 'react-webcam';
import { AIIngredientAnalyzer, IngredientAnalysisResult } from '@/lib/aiService';
import { CocktailService, CocktailWithAnalysis } from '@/lib/cocktailService';
import { Cocktail } from '@/lib/cocktailData';
import { useAuth } from '@/contexts/AuthContext';

interface IngredientPhotoAnalyzerProps {
  onCocktailsFound?: (cocktails: CocktailWithAnalysis[]) => void;
}

export default function IngredientPhotoAnalyzer({ onCocktailsFound }: IngredientPhotoAnalyzerProps) {
  const [mode, setMode] = useState<'upload' | 'camera' | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<IngredientAnalysisResult | null>(null);
  const [suggestedCocktails, setSuggestedCocktails] = useState<CocktailWithAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useMockAnalysis, setUseMockAnalysis] = useState(true); // Toggle for development
  const { user } = useAuth();

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeIngredients = async (analysisResult: IngredientAnalysisResult) => {
    setResult(analysisResult);
    try {
      const cocktails = await CocktailService.findCocktailsByIngredients(analysisResult.ingredients);
      setSuggestedCocktails(cocktails);
      onCocktailsFound?.(cocktails);
      
      // Save analysis if user is logged in
      if (user && cocktails.length > 0) {
        await CocktailService.saveIngredientAnalysis(
          user.uid,
          analysisResult.ingredients,
          cocktails.map(c => c.id)
        );
      }
    } catch (error) {
      console.error('Error finding cocktails:', error);
      setError('Failed to find cocktail matches. Please try again.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setAnalyzing(true);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const analysisResult = await AIIngredientAnalyzer.analyzeImageSmart(file, useMockAnalysis);
      await analyzeIngredients(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  const capturePhoto = useCallback(async () => {
    const webcam = webcamRef.current;
    if (!webcam) return;

    setAnalyzing(true);
    setError(null);

    try {
      const imageSrc = webcam.getScreenshot();
      if (!imageSrc) throw new Error('Failed to capture image');
      
      setPreviewImage(imageSrc);
      
      // Convert data URL to file for analysis
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      
      const analysisResult = await AIIngredientAnalyzer.analyzeImageSmart(file, useMockAnalysis);
      
      await analyzeIngredients(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture and analyze image');
    } finally {
      setAnalyzing(false);
    }
  }, [useMockAnalysis]);

  const resetAnalyzer = () => {
    setMode(null);
    setResult(null);
    setSuggestedCocktails([]);
    setError(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const CocktailCard = ({ cocktail }: { cocktail: CocktailWithAnalysis }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:border-purple-400/50 transition-all duration-200">
      <h3 className="font-semibold text-lg text-white mb-2">{cocktail.name}</h3>
      <p className="text-gray-300 text-sm mb-3">{cocktail.description}</p>
      
      <div className="mb-3">
        <h4 className="text-sm font-medium text-purple-300 mb-1">Ingredients:</h4>
        <div className="flex flex-wrap gap-1">
          {cocktail.ingredients.map((ingredient, idx) => (
            <span 
              key={idx} 
              className={`text-xs px-2 py-1 rounded-full ${
                result?.ingredients.some(detected => 
                  detected.toLowerCase().includes(ingredient.toLowerCase()) ||
                  ingredient.toLowerCase().includes(detected.toLowerCase())
                ) 
                ? 'bg-green-500/30 text-green-200 border border-green-500/50' 
                : 'bg-gray-500/30 text-gray-300 border border-gray-500/50'
              }`}
            >
              {ingredient}
              {result?.ingredients.some(detected => 
                detected.toLowerCase().includes(ingredient.toLowerCase()) ||
                ingredient.toLowerCase().includes(detected.toLowerCase())
              ) && <CheckCircle2 className="w-3 h-3 ml-1 inline" />}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>Difficulty: {cocktail.difficulty}</span>
        <span>{cocktail.category}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* AI Configuration Notice */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-blue-200 font-medium mb-2">AI Analysis Mode</h3>
            <label className="flex items-center gap-2 text-gray-300 mb-2">
              <input
                type="checkbox"
                checked={useMockAnalysis}
                onChange={(e) => setUseMockAnalysis(e.target.checked)}
                className="rounded"
              />
              Use demo analysis (simulated AI responses)
            </label>
            {!AIIngredientAnalyzer.hasAPIKey() && !useMockAnalysis && (
              <div className="mt-2 p-2 bg-yellow-500/20 rounded text-yellow-200 text-sm">
                <p><strong>Real AI requires setup:</strong></p>
                <p>1. Get free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="underline">Google AI Studio</a></p>
                <p>2. Add NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_key to .env.local</p>
                <p>3. Restart development server</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">AI Ingredient Analyzer</h2>
          </div>
          <p className="text-gray-300">
            Take a photo of your ingredients and discover what cocktails you can make!
          </p>
        </div>

        {!mode && !result && (
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('camera')}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-400/50 rounded-lg hover:border-purple-400 hover:bg-purple-500/10 transition-all duration-200 text-white"
            >
              <Camera className="w-12 h-12 text-purple-400 mb-3" />
              <span className="text-lg font-medium">Use Camera</span>
              <span className="text-sm text-gray-400 mt-1">Take a photo of your ingredients</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-400/50 rounded-lg hover:border-purple-400 hover:bg-purple-500/10 transition-all duration-200 text-white"
            >
              <Upload className="w-12 h-12 text-purple-400 mb-3" />
              <span className="text-lg font-medium">Upload Photo</span>
              <span className="text-sm text-gray-400 mt-1">Select an image from your device</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {mode === 'camera' && !result && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full max-h-96 object-cover"
                videoConstraints={{
                  facingMode: 'environment' // Use back camera on mobile
                }}
              />
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={capturePhoto}
                disabled={analyzing}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Capture & Analyze
                  </>
                )}
              </button>
              
              <button
                onClick={resetAnalyzer}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {analyzing && !result && (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Analyzing your ingredients...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 text-center">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {previewImage && (
              <div className="text-center">
                <img
                  src={previewImage}
                  alt="Analyzed ingredients"
                  className="max-h-48 mx-auto rounded-lg border border-white/20"
                />
              </div>
            )}

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Detected Ingredients</h3>
                <span className="text-sm text-gray-400">
                  (Confidence: {Math.round(result.confidence * 100)}%)
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {result.ingredients.map((ingredient, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-sm border border-green-500/50"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>

            {suggestedCocktails.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  Cocktails You Can Make ({suggestedCocktails.length})
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestedCocktails.slice(0, 6).map((cocktail) => (
                    <CocktailCard key={cocktail.id} cocktail={cocktail} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-300 text-lg">
                  No cocktail matches found for these ingredients.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adding more common cocktail ingredients like spirits, citrus, or mixers.
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={resetAnalyzer}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                Analyze Another Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
