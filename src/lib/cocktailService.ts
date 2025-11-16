import { db } from './firebase';
import { collection, getDocs, addDoc, query, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { COCKTAIL_DATABASE, Cocktail } from './cocktailData';

export interface CocktailWithAnalysis extends Cocktail {
  matchingIngredients?: string[];
  matchPercentage?: number;
}

export class CocktailService {
  // Initialize cocktail database in Firebase (run once)
  static async initializeCocktailDatabase() {
    try {
      // Check if cocktails collection exists and has data
      const querySnapshot = await getDocs(collection(db, 'cocktails'));
      
      if (querySnapshot.empty) {
        console.log('Initializing cocktail database...');
        
        // Add all cocktails from our static database
        for (const cocktail of COCKTAIL_DATABASE) {
          await addDoc(collection(db, 'cocktails'), {
            ...cocktail,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
        
        console.log(`Added ${COCKTAIL_DATABASE.length} cocktails to database`);
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing cocktail database:', error);
      return false;
    }
  }

  // Get all cocktails from Firebase
  static async getAllCocktails(): Promise<Cocktail[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'cocktails'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description,
        ingredients: doc.data().ingredients || [],
        instructions: doc.data().instructions || [],
        image: doc.data().image,
        difficulty: doc.data().difficulty || 'Medium',
        category: doc.data().category || 'Classic',
        glassware: doc.data().glassware || 'Rocks glass',
        garnish: doc.data().garnish
      }));
    } catch (error) {
      console.error('Error fetching cocktails:', error);
      // Fallback to static data
      return COCKTAIL_DATABASE;
    }
  }

  // Find cocktails by ingredients with enhanced matching
  static async findCocktailsByIngredients(
    detectedIngredients: string[]
  ): Promise<CocktailWithAnalysis[]> {
    try {
      const allCocktails = await this.getAllCocktails();
      const normalizedIngredients = detectedIngredients.map(ing => ing.toLowerCase());
      
      const matchedCocktails: CocktailWithAnalysis[] = allCocktails
        .map(cocktail => {
          const cocktailIngredients = cocktail.ingredients.map(ing => ing.toLowerCase());
          const matchingIngredients: string[] = [];
          
          // Find matching ingredients
          for (const ingredient of normalizedIngredients) {
            const matchedIngredient = cocktailIngredients.find(ci => 
              ci.includes(ingredient) || 
              ingredient.includes(ci) ||
              this.areIngredientsRelated(ingredient, ci)
            );
            
            if (matchedIngredient) {
              matchingIngredients.push(matchedIngredient);
            }
          }
          
          const matchPercentage = (matchingIngredients.length / cocktail.ingredients.length) * 100;
          
          return {
            ...cocktail,
            matchingIngredients,
            matchPercentage
          };
        })
        .filter(cocktail => cocktail.matchPercentage >= 25) // At least 25% ingredient match
        .sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));

      return matchedCocktails;
    } catch (error) {
      console.error('Error finding cocktails by ingredients:', error);
      // Fallback to static method
      const { findCocktailsByIngredients } = await import('./cocktailData');
      const staticResults = findCocktailsByIngredients(detectedIngredients);
      
      return staticResults.map(cocktail => ({
        ...cocktail,
        matchingIngredients: cocktail.ingredients.filter(ing => 
          detectedIngredients.some(detected => 
            ing.toLowerCase().includes(detected.toLowerCase()) ||
            detected.toLowerCase().includes(ing.toLowerCase())
          )
        ),
        matchPercentage: (cocktail.ingredients.filter(ing => 
          detectedIngredients.some(detected => 
            ing.toLowerCase().includes(detected.toLowerCase()) ||
            detected.toLowerCase().includes(ing.toLowerCase())
          )
        ).length / cocktail.ingredients.length) * 100
      }));
    }
  }

  // Save user's ingredient analysis for future reference
  static async saveIngredientAnalysis(
    userId: string, 
    ingredients: string[], 
    foundCocktails: string[]
  ) {
    try {
      await addDoc(collection(db, 'ingredient_analyses'), {
        user_id: userId,
        detected_ingredients: ingredients,
        found_cocktails: foundCocktails,
        analysis_date: new Date(),
        created_at: new Date()
      });
    } catch (error) {
      console.error('Error saving ingredient analysis:', error);
    }
  }

  // Get user's analysis history
  static async getUserAnalysisHistory(userId: string) {
    try {
      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, 'ingredient_analyses'),
        where('user_id', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      // Sort in memory to avoid composite index requirement
      const analyses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return analyses.sort((a: any, b: any) => {
        const aTime = a.analysis_date?.seconds || 0;
        const bTime = b.analysis_date?.seconds || 0;
        return bTime - aTime; // Descending order
      });
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }

  // Helper method to check if ingredients are related
  private static areIngredientsRelated(ingredient1: string, ingredient2: string): boolean {
    const relationships: { [key: string]: string[] } = {
      'lime': ['citrus', 'lemon', 'orange'],
      'lemon': ['citrus', 'lime', 'orange'],
      'orange': ['citrus', 'lime', 'lemon'],
      'vodka': ['spirit', 'alcohol'],
      'gin': ['spirit', 'alcohol'],
      'rum': ['spirit', 'alcohol'],
      'whiskey': ['spirit', 'alcohol', 'bourbon', 'rye'],
      'tequila': ['spirit', 'alcohol'],
      'mint': ['herb', 'basil'],
      'simple syrup': ['sugar', 'sweetener'],
      'sugar': ['simple syrup', 'sweetener']
    };

    const related1 = relationships[ingredient1] || [];
    const related2 = relationships[ingredient2] || [];
    
    return related1.includes(ingredient2) || related2.includes(ingredient1);
  }

  // Add a new cocktail recipe
  static async addCocktail(cocktail: Omit<Cocktail, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'cocktails'), {
        ...cocktail,
        created_at: new Date(),
        updated_at: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding cocktail:', error);
      throw error;
    }
  }

  // Update an existing cocktail
  static async updateCocktail(id: string, updates: Partial<Cocktail>): Promise<void> {
    try {
      await updateDoc(doc(db, 'cocktails', id), {
        ...updates,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating cocktail:', error);
      throw error;
    }
  }

  // Get popular cocktails based on user analyses
  static async getPopularCocktails(limit: number = 10): Promise<Cocktail[]> {
    try {
      // This would require more complex aggregation in a real app
      // For now, return top cocktails from our database
      const allCocktails = await this.getAllCocktails();
      return allCocktails.slice(0, limit);
    } catch (error) {
      console.error('Error fetching popular cocktails:', error);
      return COCKTAIL_DATABASE.slice(0, limit);
    }
  }
}
