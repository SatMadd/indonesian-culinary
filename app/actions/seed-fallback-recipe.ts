'use server';

import { createClient } from '@supabase/supabase-js';

// This server action is the ONLY place that may insert a recipe with status: 'approved'
// without a user_id. It is exclusively for seeding known hardcoded FALLBACK_RECIPES into
// the DB when a user first favorites them. Uses the service role key to bypass RLS,
// since this operation represents system-seeded public content — not a user submission.

export async function seedFallbackRecipe(recipeData: Record<string, unknown>): Promise<{ id: number } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error('Missing Supabase service role environment variables');
    return null;
  }

  // Service-role client: bypasses RLS entirely. Intentional for this narrow, trusted operation.
  const supabase = createClient(url, serviceRoleKey);

  const { data, error } = await supabase
    .from('recipes_db')
    .insert([{ ...recipeData, status: 'approved' }])
    .select('id')
    .single();

  if (error) {
    console.error('seedFallbackRecipe: insert failed', error.message);
    return null;
  }

  return { id: data.id };
}
