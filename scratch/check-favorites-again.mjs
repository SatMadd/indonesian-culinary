import { createClient } from '@supabase/supabase-js';

const url = 'https://cjfpqikdjejtklihaeen.supabase.co';
const key = 'sb_publishable_u8KofljuRCHc9Hpqi4yCJg_peMohvOa';

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('favorites').select('*').limit(1);
  console.log('favorites data:', data);
  console.log('favorites error:', error);
}

check();
