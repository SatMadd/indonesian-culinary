'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Hero from '@/components/Hero';
import RecipeCard from '@/components/RecipeCard';
import SearchFilters from '@/components/SearchFilters';
import { FALLBACK_RECIPES } from '@/lib/data/recipes';
import {
  fetchHomepageRecipes,
  getExistingFallbackSlugs,
  hasActiveFilters,
  PAGE_SIZE,
  type HomepageFilters,
} from '@/lib/recipes/homepage-query';
import { Recipe } from '@/types';
import { ChefHat, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

function buildPageUrl(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) {
    params.delete('page');
  } else {
    params.set('page', String(page));
  }
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

function HomepageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const selectedRegion = searchParams.get('region') || '';
  const selectedDifficulty = searchParams.get('difficulty') || '';
  const selectedCategory = searchParams.get('category') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const filters: HomepageFilters = useMemo(
    () => ({ searchQuery, selectedRegion, selectedDifficulty, selectedCategory }),
    [searchQuery, selectedRegion, selectedDifficulty, selectedCategory],
  );

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const filtersActive = hasActiveFilters(filters);

  useEffect(() => {
    let cancelled = false;

    const loadRecipes = async () => {
      setLoading(true);
      try {
        const { data, count, error } = await fetchHomepageRecipes(supabase, filters, page);

        if (cancelled) return;

        if (error || !data) {
          if (!filtersActive && page === 1) {
            const localRecipesStr =
              typeof window !== 'undefined' ? localStorage.getItem('enaknyo_local_recipes') : null;
            const localRecipes: Recipe[] = localRecipesStr ? JSON.parse(localRecipesStr) : [];
            setRecipes([...localRecipes, ...FALLBACK_RECIPES]);
            setTotalCount(0);
          } else {
            setRecipes([]);
            setTotalCount(0);
          }
          return;
        }

        let displayRecipes = data;
        let dbCount = count;

        // ponytail: local + fallback recipes only on unfiltered page 1; prepended outside the 20-row page slice
        if (!filtersActive && page === 1) {
          const localRecipesStr =
            typeof window !== 'undefined' ? localStorage.getItem('enaknyo_local_recipes') : null;
          const localRecipes: Recipe[] = localRecipesStr ? JSON.parse(localRecipesStr) : [];

          const existingSlugs = await getExistingFallbackSlugs(
            supabase,
            FALLBACK_RECIPES.map((r) => r.slug),
          );
          if (cancelled) return;

          const uniqueFallbacks = FALLBACK_RECIPES.filter((r) => !existingSlugs.has(r.slug));
          const dbSlugs = new Set(data.map((r) => r.slug));
          const extra = [...localRecipes, ...uniqueFallbacks].filter((r) => !dbSlugs.has(r.slug));
          displayRecipes = [...extra, ...data];
        } else if (data.length === 0 && !filtersActive && page === 1) {
          const localRecipesStr =
            typeof window !== 'undefined' ? localStorage.getItem('enaknyo_local_recipes') : null;
          const localRecipes: Recipe[] = localRecipesStr ? JSON.parse(localRecipesStr) : [];
          const existingSlugs = await getExistingFallbackSlugs(
            supabase,
            FALLBACK_RECIPES.map((r) => r.slug),
          );
          if (cancelled) return;
          const uniqueFallbacks = FALLBACK_RECIPES.filter((r) => !existingSlugs.has(r.slug));
          displayRecipes = [...localRecipes, ...uniqueFallbacks];
          dbCount = 0;
        }

        setRecipes(displayRecipes);
        setTotalCount(dbCount);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching recipes:', err);
        if (!filtersActive && page === 1) {
          const localRecipesStr =
            typeof window !== 'undefined' ? localStorage.getItem('enaknyo_local_recipes') : null;
          const localRecipes: Recipe[] = localRecipesStr ? JSON.parse(localRecipesStr) : [];
          setRecipes([...localRecipes, ...FALLBACK_RECIPES]);
        } else {
          setRecipes([]);
        }
        setTotalCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRecipes();

    return () => {
      cancelled = true;
    };
  }, [supabase, filters, page, filtersActive]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;
  const showPagination = totalCount > PAGE_SIZE;

  const buildUrl = useCallback(
    (targetPage: number) => buildPageUrl(searchParams, targetPage),
    [searchParams],
  );

  const categoriesList = [
    { name: 'Masakan Jawa', value: 'jawa' },
    { name: 'Masakan Padang', value: 'padang' },
    { name: 'Masakan Sunda', value: 'sunda' },
    { name: 'Masakan Betawi', value: 'betawi' },
    { name: 'Kue & Jajanan', value: 'kue' },
    { name: 'Lauk Pauk', value: 'lauk pauk' },
    { name: 'Sayuran', value: 'sayuran' },
    { name: 'Seafood', value: 'seafood' },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-6">
      <Hero />

      <SearchFilters
        currentRegion={selectedRegion}
        currentDifficulty={selectedDifficulty}
        currentSearch={searchQuery}
      />

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-medium font-display text-ink dark:text-ink tracking-tight">
            Kategori Pilihan
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categoriesList.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.value.toLowerCase();
            return (
              <Link
                key={cat.name}
                href={isActive ? '/' : `/?category=${encodeURIComponent(cat.value)}`}
                className={`flex items-center justify-center h-14 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer border ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface hover:border-primary border-border text-ink'
                }`}
              >
                <span>{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-medium font-display text-ink dark:text-ink tracking-tight">
              {filtersActive ? 'Hasil Pencarian' : 'Pencarian Populer'}
            </h2>
          </div>
          {filtersActive && (
            <Link
              href="/"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-full h-[150px] rounded-xl bg-surface-muted animate-pulse border border-border"
              />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="w-full text-center py-12 bg-surface rounded-2xl border border-border p-8 flex flex-col items-center gap-3">
            <p className="text-sm text-ink-muted font-medium leading-relaxed">
              Tidak ada resep yang cocok dengan kriteria pencarian atau filter Anda.
            </p>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition-colors"
            >
              Kembali ke Semua Resep
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.slug} recipe={recipe} />
              ))}
            </div>

            {showPagination && (
              <div className="flex items-center justify-center gap-3 pt-2">
                {isFirstPage ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-border bg-surface text-ink-muted opacity-50 cursor-not-allowed">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Sebelumnya
                  </span>
                ) : (
                  <Link
                    href={buildUrl(page - 1)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      isLastPage
                        ? 'bg-primary text-white border-primary hover:bg-primary/90'
                        : 'bg-surface border-border text-ink hover:border-primary'
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Sebelumnya
                  </Link>
                )}

                {isLastPage ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-border bg-surface text-ink-muted opacity-50 cursor-not-allowed">
                    Selanjutnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <Link
                    href={buildUrl(page + 1)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      isFirstPage
                        ? 'bg-primary text-white border-primary hover:bg-primary/90'
                        : 'bg-surface border-border text-ink hover:border-primary'
                    }`}
                  >
                    Selanjutnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col transition-colors">
      <Navbar />

      <div className="flex flex-1 pt-[56px]">
        <Sidebar />

        <main className="flex-1 min-w-0 md:pl-[175px] px-6 md:px-8 bg-bg">
          <Suspense
            fallback={
              <div className="w-full flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            }
          >
            <HomepageContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
