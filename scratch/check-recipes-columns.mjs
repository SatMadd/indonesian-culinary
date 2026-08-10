import { createClient } from '@supabase/supabase-js';

const url = 'https://cjfpqikdjejtklihaeen.supabase.co';
const key = 'sb_publishable_u8KofljuRCHc9Hpqi4yCJg_peMohvOa';

const supabase = createClient(url, key);

async function check() {
  console.log('--- Verifying profiles columns ---');
  const { error: err1 } = await supabase.from('profiles').select('id, role, display_name, created_at').limit(0);
  console.log('profiles columns status:', err1 ? `FAILED: ${err1.message}` : 'OK');

  console.log('--- Verifying recipes_db new columns ---');
  const { error: err2 } = await supabase.from('recipes_db').select('status, reviewed_by, reviewed_at, rejection_reason, author_name').limit(0);
  console.log('recipes_db columns status:', err2 ? `FAILED: ${err2.message}` : 'OK');

  console.log('--- Verifying recipe_change_requests columns ---');
  const { error: err3 } = await supabase.from('recipe_change_requests').select('id, recipe_id, requested_by, type, proposed_data, status, reviewed_by, reviewed_at, rejection_reason, created_at').limit(0);
  console.log('recipe_change_requests columns status:', err3 ? `FAILED: ${err3.message}` : 'OK');

  console.log('--- Verifying recipes_archive columns ---');
  const { error: err4 } = await supabase.from('recipes_archive').select('id, created_at, title, slug, description, image_url, region, prep_time, cook_time, servings, ingredients, steps, is_popular, difficulty, user_id, status, reviewed_by, reviewed_at, rejection_reason, author_name, deleted_at, deleted_by, original_id').limit(0);
  console.log('recipes_archive columns status:', err4 ? `FAILED: ${err4.message}` : 'OK');
}

check();
