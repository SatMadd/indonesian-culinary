'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return { user, supabase };
}

export async function approveRecipe(recipeId: number) {
  try {
    const { user, supabase } = await getAdminUser();

    const { error } = await supabase
      .from('recipes_db')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', recipeId);

    if (error) throw new Error(error.message);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function rejectRecipe(recipeId: number, reason: string) {
  try {
    if (!reason.trim()) throw new Error('Alasan penolakan harus diisi');
    const { user, supabase } = await getAdminUser();

    const { error } = await supabase
      .from('recipes_db')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason.trim(),
      })
      .eq('id', recipeId);

    if (error) throw new Error(error.message);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function approveChangeRequest(requestId: number) {
  try {
    const { user, supabase } = await getAdminUser();

    // 1. Fetch the change request details
    const { data: cr, error: fetchError } = await supabase
      .from('recipe_change_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !cr) {
      throw new Error(fetchError?.message || 'Change request not found');
    }

    const now = new Date().toISOString();

    if (cr.type === 'edit') {
      // Apply proposed_data to recipes_db
      const { error: updateRecipeError } = await supabase
        .from('recipes_db')
        .update(cr.proposed_data)
        .eq('id', cr.recipe_id);

      if (updateRecipeError) throw new Error(updateRecipeError.message);
    } else if (cr.type === 'delete') {
      // Fetch the current recipe details
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes_db')
        .select('*')
        .eq('id', cr.recipe_id)
        .single();

      if (recipeError || !recipe) {
        throw new Error(recipeError?.message || 'Recipe not found');
      }

      // Copy to recipes_archive
      const archiveData = {
        id: recipe.id,
        created_at: recipe.created_at,
        title: recipe.title,
        slug: recipe.slug,
        description: recipe.description,
        image_url: recipe.image_url,
        region: recipe.region,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        is_popular: recipe.is_popular,
        difficulty: recipe.difficulty,
        user_id: recipe.user_id,
        status: recipe.status,
        reviewed_by: recipe.reviewed_by,
        reviewed_at: recipe.reviewed_at,
        rejection_reason: recipe.rejection_reason,
        author_name: recipe.author_name,
        deleted_at: now,
        deleted_by: user.id,
        original_id: recipe.id,
      };

      const { error: archiveError } = await supabase
        .from('recipes_archive')
        .insert([archiveData]);

      if (archiveError) throw new Error(archiveError.message);

      // Delete from recipes_db
      const { error: deleteError } = await supabase
        .from('recipes_db')
        .delete()
        .eq('id', cr.recipe_id);

      if (deleteError) throw new Error(deleteError.message);
    }

    // Mark change request approved
    const { error: updateCrError } = await supabase
      .from('recipe_change_requests')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: now,
      })
      .eq('id', requestId);

    if (updateCrError) throw new Error(updateCrError.message);

    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function rejectChangeRequest(requestId: number, reason: string) {
  try {
    if (!reason.trim()) throw new Error('Alasan penolakan harus diisi');
    const { user, supabase } = await getAdminUser();

    const { error } = await supabase
      .from('recipe_change_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason.trim(),
      })
      .eq('id', requestId);

    if (error) throw new Error(error.message);
    revalidatePath('/admin');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
