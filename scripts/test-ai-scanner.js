// Test script for AI Ingredient Scanner functionality
// Run with: npm run test-ai-scanner

import { AIIngredientAnalyzer } from '../src/lib/aiService';
import { CocktailService } from '../src/lib/cocktailService';
import { COCKTAIL_DATABASE } from '../src/lib/cocktailData';

async function testAIScanner() {
  console.log('🧪 Testing AI Ingredient Scanner...\n');

  // Test 1: Mock Analysis
  console.log('📸 Test 1: Mock Analysis');
  try {
    const mockResult = await AIIngredientAnalyzer.analyzeMockImage();
    console.log('✅ Mock analysis successful');
    console.log(`   Ingredients: ${mockResult.ingredients.join(', ')}`);
    console.log(`   Confidence: ${Math.round(mockResult.confidence * 100)}%`);
    console.log(`   Response: ${mockResult.rawResponse.substring(0, 100)}...\n`);
  } catch (error) {
    console.error('❌ Mock analysis failed:', error);
  }

  // Test 2: API Key Check
  console.log('🔑 Test 2: API Key Configuration');
  const hasKey = AIIngredientAnalyzer.hasAPIKey();
  console.log(`   API Key Available: ${hasKey ? '✅ Yes' : '⚠️ No (using mock mode)'}\n`);

  // Test 3: Cocktail Database
  console.log('🍹 Test 3: Cocktail Database');
  console.log(`   Total Cocktails: ${COCKTAIL_DATABASE.length}`);
  console.log(`   Sample Cocktails: ${COCKTAIL_DATABASE.slice(0, 3).map(c => c.name).join(', ')}`);
  
  // Test ingredient matching
  const testIngredients = ['vodka', 'lime', 'mint'];
  try {
    const matches = await CocktailService.findCocktailsByIngredients(testIngredients);
    console.log(`   Matches for [${testIngredients.join(', ')}]: ${matches.length} cocktails`);
    if (matches.length > 0) {
      console.log(`   Top match: ${matches[0].name} (${Math.round((matches[0].matchPercentage || 0) * 100)}% match)`);
    }
  } catch (error) {
    console.error('❌ Cocktail matching failed:', error);
  }

  console.log('\n🎉 AI Scanner test complete!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Visit /demo to initialize cocktail database');
  console.log('   2. Visit /ingredient-analyzer to test the UI');
  console.log('   3. Upload a photo and see the magic happen!');
}

// Export for use in development
export { testAIScanner };

// Run if called directly
if (require.main === module) {
  testAIScanner().catch(console.error);
}
