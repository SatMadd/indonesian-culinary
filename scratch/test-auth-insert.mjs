import { createClient } from '@supabase/supabase-js';

const url = 'https://cjfpqikdjejtklihaeen.supabase.co';
const key = 'sb_publishable_u8KofljuRCHc9Hpqi4yCJg_peMohvOa';

const supabase = createClient(url, key);

async function test() {
  const emails = [
    `culinary_${Math.floor(Math.random()*1000)}@gmail.com`,
    `user_${Math.floor(Math.random()*1000)}@culinary.id`
  ];
  const password = 'TestPassword123!';

  for (const email of emails) {
    console.log(`Trying sign up with ${email}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error(`Sign up error for ${email}:`, signUpError);
    } else {
      console.log('Sign up success. Session:', signUpData.session ? 'Yes' : 'No');
      let session = signUpData.session;
      if (!session) {
        // Sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          console.error('Sign in error:', signInError);
          continue;
        }
        session = signInData.session;
      }
      
      if (session) {
        console.log('Success! Got session.');
        const authSupabase = createClient(url, key, {
          global: {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        });
        
        console.log('Inserting recipe with authenticated client...');
        const testRecipe = {
          title: 'Soto Ayam',
          slug: `soto-ayam-${Math.floor(Math.random()*1000)}`,
          description: 'Soto ayam khas Jawa yang gurih.',
          image_url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab',
          region: 'Jawa',
          prep_time: 20,
          cook_time: 40,
          servings: 4,
          ingredients: ['1/2 ekor ayam', '1.5 liter air'],
          steps: ['Rebus ayam.', 'Sajikan.'],
          is_popular: true,
          difficulty: 'mudah'
        };

        const { data: insertData, error: insertError } = await authSupabase.from('recipes_db').insert([testRecipe]).select();
        if (insertError) {
          console.error('Error inserting recipe:', insertError);
        } else {
          console.log('Successfully inserted recipe:', insertData);
        }
        break;
      }
    }
  }
}

test();
