import { Recipe } from '../types/recipe'

export const sampleRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta dish with eggs, cheese, and pancetta',
    prepTimeMinutes: 20,
    servings: 4,
    ingredients: [
      '400g spaghetti',
      '200g pancetta or guanciale, diced',
      '4 large eggs',
      '100g Pecorino Romano cheese, grated',
      '50g Parmesan cheese, grated',
      'Black pepper to taste',
      'Salt for pasta water'
    ],
    instructions: [
      'Bring a large pot of salted water to boil and cook spaghetti until al dente.',
      'While pasta cooks, fry pancetta in a large pan until crispy.',
      'In a bowl, whisk together eggs, Pecorino Romano, Parmesan, and black pepper.',
      'Drain pasta, reserving 1 cup pasta water.',
      'Add hot pasta to the pan with pancetta.',
      'Remove from heat and quickly toss with egg mixture, adding pasta water as needed.',
      'Serve immediately with extra cheese and black pepper.'
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Thai Green Curry',
    description: 'Aromatic and spicy Thai curry with coconut milk and fresh herbs',
    prepTimeMinutes: 30,
    servings: 4,
    ingredients: [
      '2 tbsp green curry paste',
      '400ml coconut milk',
      '500g chicken thigh, sliced',
      '2 Thai eggplants, quartered',
      '100g green beans, trimmed',
      '2 tbsp fish sauce',
      '1 tbsp palm sugar',
      '4-5 Thai basil leaves',
      '2 kaffir lime leaves',
      '1 red chili, sliced',
      'Jasmine rice for serving'
    ],
    instructions: [
      'Heat 2 tbsp coconut milk in a wok over medium-high heat.',
      'Add green curry paste and fry until fragrant, about 2 minutes.',
      'Add chicken and cook until just done.',
      'Pour in remaining coconut milk and bring to a simmer.',
      'Add eggplant and green beans, cook for 5-7 minutes.',
      'Season with fish sauce and palm sugar.',
      'Add Thai basil, lime leaves, and chili.',
      'Serve hot over jasmine rice.'
    ],
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z'
  },
  {
    id: '3',
    name: 'Classic Caesar Salad',
    description: 'Fresh romaine lettuce with homemade Caesar dressing and croutons',
    prepTimeMinutes: 15,
    servings: 4,
    ingredients: [
      '2 large romaine lettuce heads, chopped',
      '1/2 cup Parmesan cheese, grated',
      '2 cups day-old bread, cubed',
      '3 cloves garlic, minced',
      '2 anchovy fillets',
      '1 egg yolk',
      '2 tbsp lemon juice',
      '1 tsp Dijon mustard',
      '1/3 cup olive oil',
      '2 tbsp olive oil for croutons',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Preheat oven to 375°F (190°C).',
      'Toss bread cubes with 2 tbsp olive oil and bake for 10-12 minutes until golden.',
      'For dressing, mash anchovies and garlic into a paste.',
      'Whisk in egg yolk, lemon juice, and Dijon mustard.',
      'Slowly drizzle in olive oil while whisking until emulsified.',
      'Season with salt and pepper.',
      'Toss romaine lettuce with dressing.',
      'Top with croutons and Parmesan cheese.',
      'Serve immediately.'
    ],
    createdAt: '2024-01-17T12:15:00Z',
    updatedAt: '2024-01-17T12:15:00Z'
  }
]