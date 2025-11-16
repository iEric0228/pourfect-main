import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the AI model
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface IngredientAnalysisResult {
  ingredients: string[];
  confidence: number;
  rawResponse: string;
}

export class AIIngredientAnalyzer {
  static async analyzeImage(imageFile: File): Promise<IngredientAnalysisResult> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(imageFile);
      
      const prompt = `
        Analyze this image and identify all the cocktail ingredients visible in the photo. 
        
        Look for:
        - Spirits (vodka, gin, rum, whiskey, tequila, etc.)
        - Fresh fruits (lemons, limes, oranges, berries, etc.)
        - Herbs (mint, basil, rosemary, etc.)
        - Mixers (soda water, tonic, ginger beer, juices, etc.)
        - Syrups and sweeteners
        - Bitters and liqueurs
        - Garnishes and aromatics
        - Ice or glassware
        
        Return ONLY a JSON object in this exact format:
        {
          "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
          "confidence": 0.85
        }
        
        Be specific with ingredient names. For example, use "fresh lime" instead of just "citrus".
        Confidence should be between 0 and 1, where 1 is completely certain.
      `;

      const imagePart = {
        inlineData: {
          data: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: imageFile.type
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      try {
        // Try to parse JSON from the response
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        return {
          ingredients: parsed.ingredients || [],
          confidence: parsed.confidence || 0.5,
          rawResponse: text
        };
      } catch (parseError) {
        // Fallback: extract ingredients using regex if JSON parsing fails
        const ingredientMatches = text.match(/["']([^"']+)["']/g);
        const ingredients = ingredientMatches 
          ? ingredientMatches.map(match => match.replace(/['"]/g, ''))
          : [];
        
        return {
          ingredients: ingredients.slice(0, 10), // Limit to 10 ingredients
          confidence: 0.3,
          rawResponse: text
        };
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image. Please try again.');
    }
  }

  static async analyzeImageFromCamera(canvas: HTMLCanvasElement): Promise<IngredientAnalysisResult> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to capture image from camera'));
          return;
        }
        
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        try {
          const result = await this.analyzeImage(file);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 'image/jpeg', 0.8);
    });
  }

  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Mock version for development/testing
  static async analyzeMockImage(imageFile?: File): Promise<IngredientAnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate different mock scenarios based on random selection
    const scenarios = [
      {
        ingredients: ['vodka', 'fresh lime', 'mint leaves', 'simple syrup', 'soda water', 'ice'],
        confidence: 0.92,
        description: 'Perfect for mojitos, vodka mojitos, and lime-based cocktails'
      },
      {
        ingredients: ['gin', 'tonic water', 'lime', 'cucumber', 'ice'],
        confidence: 0.88,
        description: 'Great for gin & tonics, cucumber gin cocktails, and botanical drinks'
      },
      {
        ingredients: ['bourbon whiskey', 'orange', 'angostura bitters', 'sugar', 'ice'],
        confidence: 0.95,
        description: 'Classic ingredients for Old Fashioned, whiskey sours, and bourbon cocktails'
      },
      {
        ingredients: ['tequila', 'lime', 'orange liqueur', 'salt', 'agave syrup', 'ice'],
        confidence: 0.90,
        description: 'Perfect for margaritas, palomas, and tequila-based cocktails'
      },
      {
        ingredients: ['rum', 'coconut cream', 'pineapple juice', 'lime', 'ice'],
        confidence: 0.87,
        description: 'Tropical cocktails like Piña Coladas, Painkiller, and rum punches'
      }
    ];
    
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    return {
      ingredients: randomScenario.ingredients,
      confidence: randomScenario.confidence,
      rawResponse: `Mock AI Analysis: ${randomScenario.description}. Detected ${randomScenario.ingredients.length} ingredients with ${Math.round(randomScenario.confidence * 100)}% confidence.`
    };
  }

  // Check if API key is available
  static hasAPIKey(): boolean {
    return !!(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY !== '');
  }

  // Enhanced analyze method with fallback
  static async analyzeImageSmart(imageFile: File, forceMock: boolean = false): Promise<IngredientAnalysisResult> {
    if (forceMock || !this.hasAPIKey()) {
      console.log('Using mock analysis (API key not configured)');
      return this.analyzeMockImage(imageFile);
    }
    
    try {
      return await this.analyzeImage(imageFile);
    } catch (error) {
      console.warn('AI analysis failed, falling back to mock:', error);
      return this.analyzeMockImage(imageFile);
    }
  }
}
