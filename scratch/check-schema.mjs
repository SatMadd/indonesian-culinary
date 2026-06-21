import { createClient } from '@supabase/supabase-js';

const url = 'https://cjfpqikdjejtklihaeen.supabase.co';
const key = 'sb_publishable_u8KofljuRCHc9Hpqi4yCJg_peMohvOa';

const supabase = createClient(url, key);

async function check() {
  console.log('--- Querying "favorites" ---');
  const res1 = await supabase.from('favorites').select('*').limit(1);
  console.log('favorites data:', res1.data);
  console.log('favorites error:', res1.error);

  console.log('\n--- Querying "favorites_db" ---');
  const res2 = await supabase.from('favorites_db').select('*').limit(1);
  console.log('favorites_db data:', res2.data);
  console.log('favorites_db error:', res2.error);

  console.log('\n--- Querying "recipes" ---');
  const res3 = await supabase.from('recipes').select('*').limit(1);
  console.log('recipes data:', res3.data);
  console.log('recipes error:', res3.error);

  console.log('\n--- Querying "recipes_db" ---');
  const res4 = await supabase.from('recipes_db').select('*').limit(1);
  console.log('recipes_db data:', res4.data);
  console.log('recipes_db error:', res4.error);
}

check();
