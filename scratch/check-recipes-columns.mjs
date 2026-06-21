import { createClient } from '@supabase/supabase-js';

const url = 'https://cjfpqikdjejtklihaeen.supabase.co';
const key = 'sb_publishable_u8KofljuRCHc9Hpqi4yCJg_peMohvOa';

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('recipes_db').select('user_id').limit(1);
  console.log('Querying recipes_db.user_id:');
  console.log('Data:', data);
  console.log('Error:', error);
}

check();
