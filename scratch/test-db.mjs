import { createClient } from '@supabase/supabase-js';

const url = 'https://cjfpqikdjejtklihaeen.supabase.co';
const key = 'sb_publishable_u8KofljuRCHc9Hpqi4yCJg_peMohvOa';

const supabase = createClient(url, key);

async function test() {
  console.log('Inserting test recipe...');
  const testRecipe = {
    title: 'Test Recipe',
    slug: 'test-recipe',
    description: 'Test description',
    image_url: 'https://example.com/test.jpg',
    region: 'Jawa',
    prep_time: 15,
    cook_time: 15,
    servings: 2,
    ingredients: ['bahan 1', 'bahan 2'],
    steps: ['langkah 1', 'langkah 2'],
    is_popular: true,
    difficulty: 'mudah'
  };

  const { data, error } = await supabase.from('recipes_db').insert([testRecipe]).select();
  if (error) {
    console.error('Error inserting recipe:', error);
  } else {
    console.log('Successfully inserted:', data);
  }
}

test();
