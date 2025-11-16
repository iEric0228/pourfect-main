// Comprehensive cocktail database with ingredients
export interface Cocktail {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  image?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  glassware: string;
  garnish?: string;
}

export const COCKTAIL_DATABASE: Cocktail[] = [
  {
    id: '1',
    name: 'Mojito',
    description: 'A refreshing Cuban cocktail with mint, lime, and rum',
    ingredients: ['white rum', 'lime', 'mint', 'sugar', 'soda water', 'ice'],
    instructions: [
      'Muddle mint leaves and sugar in a glass',
      'Add lime juice and rum',
      'Fill with ice and top with soda water',
      'Stir gently and garnish with mint sprig'
    ],
    difficulty: 'Easy',
    category: 'Refreshing',
    glassware: 'Highball glass',
    garnish: 'Fresh mint sprig and lime wheel'
  },
  {
    id: '2',
    name: 'Old Fashioned',
    description: 'Classic whiskey cocktail with sugar and bitters',
    ingredients: ['bourbon whiskey', 'sugar', 'angostura bitters', 'orange', 'ice'],
    instructions: [
      'Muddle sugar cube with bitters and a splash of water',
      'Add whiskey and stir',
      'Add ice and stir again',
      'Garnish with orange peel'
    ],
    difficulty: 'Medium',
    category: 'Classic',
    glassware: 'Rocks glass',
    garnish: 'Orange peel'
  },
  {
    id: '3',
    name: 'Margarita',
    description: 'Tequila-based cocktail with lime and triple sec',
    ingredients: ['tequila', 'lime', 'triple sec', 'salt', 'ice'],
    instructions: [
      'Rim glass with salt',
      'Shake tequila, lime juice, and triple sec with ice',
      'Strain into glass over fresh ice',
      'Garnish with lime wheel'
    ],
    difficulty: 'Easy',
    category: 'Citrus',
    glassware: 'Margarita glass',
    garnish: 'Lime wheel'
  },
  {
    id: '4',
    name: 'Whiskey Sour',
    description: 'Balanced whiskey cocktail with lemon and simple syrup',
    ingredients: ['bourbon whiskey', 'lemon', 'simple syrup', 'egg white', 'ice'],
    instructions: [
      'Shake all ingredients vigorously without ice (dry shake)',
      'Add ice and shake again',
      'Double strain into glass',
      'Garnish with lemon wheel and cherry'
    ],
    difficulty: 'Medium',
    category: 'Sour',
    glassware: 'Coupe glass',
    garnish: 'Lemon wheel and maraschino cherry'
  },
  {
    id: '5',
    name: 'Cosmopolitan',
    description: 'Vodka cocktail with cranberry and lime',
    ingredients: ['vodka', 'cranberry juice', 'lime', 'triple sec', 'ice'],
    instructions: [
      'Shake all ingredients with ice',
      'Double strain into chilled glass',
      'Garnish with lime wheel'
    ],
    difficulty: 'Easy',
    category: 'Fruity',
    glassware: 'Martini glass',
    garnish: 'Lime wheel'
  },
  {
    id: '6',
    name: 'Manhattan',
    description: 'Classic whiskey cocktail with sweet vermouth',
    ingredients: ['rye whiskey', 'sweet vermouth', 'angostura bitters', 'ice'],
    instructions: [
      'Stir all ingredients with ice',
      'Strain into chilled glass',
      'Garnish with maraschino cherry'
    ],
    difficulty: 'Medium',
    category: 'Classic',
    glassware: 'Coupe glass',
    garnish: 'Maraschino cherry'
  },
  {
    id: '7',
    name: 'Daiquiri',
    description: 'Simple Cuban rum cocktail with lime and sugar',
    ingredients: ['white rum', 'lime', 'simple syrup', 'ice'],
    instructions: [
      'Shake all ingredients with ice',
      'Double strain into chilled glass',
      'Garnish with lime wheel'
    ],
    difficulty: 'Easy',
    category: 'Classic',
    glassware: 'Coupe glass',
    garnish: 'Lime wheel'
  },
  {
    id: '8',
    name: 'Negroni',
    description: 'Italian cocktail with gin, Campari, and sweet vermouth',
    ingredients: ['gin', 'campari', 'sweet vermouth', 'orange', 'ice'],
    instructions: [
      'Stir all ingredients with ice',
      'Strain over fresh ice in glass',
      'Garnish with orange peel'
    ],
    difficulty: 'Easy',
    category: 'Bitter',
    glassware: 'Rocks glass',
    garnish: 'Orange peel'
  },
  {
    id: '9',
    name: 'Moscow Mule',
    description: 'Vodka cocktail with ginger beer and lime',
    ingredients: ['vodka', 'ginger beer', 'lime', 'ice'],
    instructions: [
      'Fill copper mug with ice',
      'Add vodka and lime juice',
      'Top with ginger beer',
      'Stir gently and garnish with lime wheel'
    ],
    difficulty: 'Easy',
    category: 'Refreshing',
    glassware: 'Copper mug',
    garnish: 'Lime wheel and mint sprig'
  },
  {
    id: '10',
    name: 'Piña Colada',
    description: 'Tropical cocktail with rum, coconut, and pineapple',
    ingredients: ['white rum', 'coconut cream', 'pineapple juice', 'ice'],
    instructions: [
      'Blend all ingredients with ice',
      'Pour into chilled glass',
      'Garnish with pineapple wedge and cherry'
    ],
    difficulty: 'Easy',
    category: 'Tropical',
    glassware: 'Hurricane glass',
    garnish: 'Pineapple wedge and maraschino cherry'
  },
  {
    id: '11',
    name: 'Bloody Mary',
    description: 'Savory vodka cocktail with tomato juice and spices',
    ingredients: ['vodka', 'tomato juice', 'lemon', 'worcestershire sauce', 'tabasco', 'celery salt', 'black pepper', 'ice'],
    instructions: [
      'Rim glass with celery salt',
      'Build ingredients in glass over ice',
      'Stir gently',
      'Garnish with celery stalk and lemon wheel'
    ],
    difficulty: 'Medium',
    category: 'Savory',
    glassware: 'Highball glass',
    garnish: 'Celery stalk, lemon wheel, and olives'
  },
  {
    id: '12',
    name: 'Aperol Spritz',
    description: 'Italian aperitif with Aperol and prosecco',
    ingredients: ['aperol', 'prosecco', 'soda water', 'orange', 'ice'],
    instructions: [
      'Fill wine glass with ice',
      'Add Aperol and prosecco',
      'Top with soda water',
      'Garnish with orange slice'
    ],
    difficulty: 'Easy',
    category: 'Aperitif',
    glassware: 'Wine glass',
    garnish: 'Orange slice'
  }
];

// Ingredient recognition mappings
export const INGREDIENT_MAPPINGS: { [key: string]: string[] } = {
  'lime': ['lime', 'limes', 'lime juice', 'fresh lime'],
  'lemon': ['lemon', 'lemons', 'lemon juice', 'fresh lemon'],
  'orange': ['orange', 'oranges', 'orange juice', 'fresh orange'],
  'mint': ['mint', 'fresh mint', 'mint leaves', 'spearmint'],
  'sugar': ['sugar', 'simple syrup', 'sugar cube', 'granulated sugar'],
  'ice': ['ice', 'ice cubes', 'crushed ice'],
  'vodka': ['vodka', 'premium vodka', 'grey goose', 'belvedere'],
  'gin': ['gin', 'london dry gin', 'hendricks', 'bombay'],
  'rum': ['rum', 'white rum', 'dark rum', 'spiced rum', 'bacardi'],
  'tequila': ['tequila', 'silver tequila', 'gold tequila', 'mezcal'],
  'whiskey': ['whiskey', 'bourbon', 'rye whiskey', 'scotch', 'jameson'],
  'vermouth': ['vermouth', 'sweet vermouth', 'dry vermouth'],
  'bitters': ['bitters', 'angostura bitters', 'orange bitters'],
  'soda water': ['soda water', 'club soda', 'sparkling water'],
  'ginger beer': ['ginger beer', 'ginger ale'],
  'cranberry juice': ['cranberry juice', 'cranberry'],
  'pineapple juice': ['pineapple juice', 'pineapple'],
  'tomato juice': ['tomato juice', 'tomato'],
  'coconut cream': ['coconut cream', 'coconut milk', 'coconut'],
  'triple sec': ['triple sec', 'cointreau', 'grand marnier'],
  'campari': ['campari', 'aperol'],
  'prosecco': ['prosecco', 'champagne', 'sparkling wine'],
  'egg white': ['egg white', 'egg whites', 'eggs']
};

export function findCocktailsByIngredients(detectedIngredients: string[]): Cocktail[] {
  const normalizedIngredients = detectedIngredients.map(ing => ing.toLowerCase());
  
  const matchedCocktails = COCKTAIL_DATABASE.filter(cocktail => {
    const cocktailIngredients = cocktail.ingredients.map(ing => ing.toLowerCase());
    
    // Count how many ingredients match
    let matchCount = 0;
    for (const ingredient of normalizedIngredients) {
      // Check direct match or mapping match
      const isDirectMatch = cocktailIngredients.some(ci => 
        ci.includes(ingredient) || ingredient.includes(ci)
      );
      
      const isMappingMatch = Object.entries(INGREDIENT_MAPPINGS).some(([key, variations]) => 
        variations.some(variation => 
          variation.toLowerCase().includes(ingredient) || ingredient.includes(variation.toLowerCase())
        ) && cocktailIngredients.some(ci => ci.includes(key))
      );
      
      if (isDirectMatch || isMappingMatch) {
        matchCount++;
      }
    }
    
    // Return cocktails where at least 30% of ingredients match
    return matchCount >= Math.ceil(cocktail.ingredients.length * 0.3);
  });

  // Sort by number of matching ingredients (descending)
  return matchedCocktails.sort((a, b) => {
    const aMatches = a.ingredients.filter(ing => 
      normalizedIngredients.some(detected => 
        ing.toLowerCase().includes(detected) || detected.includes(ing.toLowerCase())
      )
    ).length;
    
    const bMatches = b.ingredients.filter(ing => 
      normalizedIngredients.some(detected => 
        ing.toLowerCase().includes(detected) || detected.includes(ing.toLowerCase())
      )
    ).length;
    
    return bMatches - aMatches;
  });
}
