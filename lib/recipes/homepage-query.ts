import { SupabaseClient } from '@supabase/supabase-js';
import { Recipe } from '@/types';

export const PAGE_SIZE = 20;

const NON_REGION_CATEGORIES = ['kue', 'lauk pauk', 'sayuran', 'seafood'] as const;

export type HomepageFilters = {
  searchQuery: string;
  selectedRegion: string;
  selectedDifficulty: string;
  selectedCategory: string;
};

/** Escape PostgREST ilike / .or() metacharacters in user input. */
function escapeIlike(value: string): string {
  return value.replace(/[%_\\,]/g, (m) => `\\${m}`);
}

function applyHomepageFilters<T extends { or: Function; ilike: Function }>(
  query: T,
  filters: HomepageFilters,
): T {
  const { searchQuery, selectedRegion, selectedDifficulty, selectedCategory } = filters;

  if (searchQuery.trim()) {
    const q = `%${escapeIlike(searchQuery.trim())}%`;
    query = query.or(`title.ilike.${q},description.ilike.${q},region.ilike.${q}`) as T;
  }

  if (selectedRegion) {
    query = query.ilike('region', escapeIlike(selectedRegion)) as T;
  }

  if (selectedDifficulty) {
    query = query.ilike('difficulty', escapeIlike(selectedDifficulty)) as T;
  }

  if (selectedCategory) {
    const category = selectedCategory.toLowerCase();

    if (!NON_REGION_CATEGORIES.includes(category as (typeof NON_REGION_CATEGORIES)[number])) {
      query = query.ilike('region', escapeIlike(category)) as T;
    } else if (category === 'kue') {
      query = query.or(
        'title.ilike.%kue%,description.ilike.%kue%,description.ilike.%jajanan%',
      ) as T;
    } else if (category === 'lauk pauk') {
      query = query.or(
        'title.ilike.%ayam%,title.ilike.%daging%,title.ilike.%rendang%,title.ilike.%sate%,title.ilike.%udang%,title.ilike.%lauk%',
      ) as T;
    } else if (category === 'sayuran') {
      query = query.or('title.ilike.%sayur%,title.ilike.%sambal%,title.ilike.%gado%') as T;
    } else if (category === 'seafood') {
      query = query.or('title.ilike.%udang%,title.ilike.%ikan%,title.ilike.%cumi%') as T;
    }
  }

  return query;
}

export function hasActiveFilters(filters: HomepageFilters): boolean {
  return !!(
    filters.searchQuery.trim() ||
    filters.selectedRegion ||
    filters.selectedDifficulty ||
    filters.selectedCategory
  );
}

export async function fetchHomepageRecipes(
  supabase: SupabaseClient,
  filters: HomepageFilters,
  page: number,
): Promise<{ data: Recipe[]; count: number; error: Error | null }> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('recipes_db')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  query = applyHomepageFilters(query, filters);

  const { data, error, count } = await query.range(from, to);

  return {
    data: (data as Recipe[]) ?? [],
    count: count ?? 0,
    error: error as Error | null,
  };
}

export async function getExistingFallbackSlugs(
  supabase: SupabaseClient,
  slugs: string[],
): Promise<Set<string>> {
  if (slugs.length === 0) return new Set();

  const { data } = await supabase.from('recipes_db').select('slug').in('slug', slugs);
  return new Set((data ?? []).map((row: { slug: string }) => row.slug));
}
