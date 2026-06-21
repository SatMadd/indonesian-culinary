'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Hero from '@/components/Hero';
import RecipeCard from '@/components/RecipeCard';
import SearchFilters from '@/components/SearchFilters';
import { FALLBACK_RECIPES } from '@/lib/data/recipes';
import { Recipe } from '@/types';
import { ChefHat, ArrowRight, Grid3X3, Sparkles } from 'lucide-react';

function HomepageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const selectedRegion = searchParams.get('region') || '';
  const selectedDifficulty = searchParams.get('difficulty') || '';
  const selectedCategory = searchParams.get('category') || '';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    const fetchRecipes = async () => {
      setLoading(true);
      try {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('recipes_db')
          .select('*')
          .order('created_at', { ascending: false });

        if (cancelled) return;

        // Load custom local recipes from localStorage
        const localRecipesStr = typeof window !== 'undefined' ? localStorage.getItem('enaknyo_local_recipes') : null;
        const localRecipes: Recipe[] = localRecipesStr ? JSON.parse(localRecipesStr) : [];

        if (error || !data || data.length === 0) {
          // If empty or error, use fallback + local custom recipes
          setRecipes([...localRecipes, ...FALLBACK_RECIPES]);
        } else {
          // Combine custom local, Supabase db, and defaults
          const dbSlugs = new Set(data.map((r: any) => r.slug));
          const uniqueFallbacks = FALLBACK_RECIPES.filter(r => !dbSlugs.has(r.slug));
          setRecipes([...localRecipes, ...data, ...uniqueFallbacks]);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching recipes:', err);
        // Load custom local recipes from localStorage
        const localRecipesStr = typeof window !== 'undefined' ? localStorage.getItem('enaknyo_local_recipes') : null;
        const localRecipes: Recipe[] = localRecipesStr ? JSON.parse(localRecipesStr) : [];
        setRecipes([...localRecipes, ...FALLBACK_RECIPES]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRecipes();

    return () => { cancelled = true; };
  }, [supabase]);

  // Apply filters client-side for immediate responsive feel
  const filteredRecipes = recipes.filter((recipe) => {
    // 1. Search Query (Title, Description, Region, or Ingredients)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = recipe.title.toLowerCase().includes(query);
      const matchDesc = recipe.description.toLowerCase().includes(query);
      const matchRegion = recipe.region.toLowerCase().includes(query);
      const matchIngredients = recipe.ingredients.some(ing => ing.toLowerCase().includes(query));
      if (!matchTitle && !matchDesc && !matchRegion && !matchIngredients) return false;
    }

    // 2. Region Filter
    if (selectedRegion && recipe.region.toLowerCase() !== selectedRegion.toLowerCase()) {
      return false;
    }

    // 3. Difficulty Filter
    if (selectedDifficulty && recipe.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) {
      return false;
    }

    // 4. Category Filter (e.g. Sayuran, Seafood, Kue, Lauk Pauk, or specific region categories)
    if (selectedCategory) {
      const category = selectedCategory.toLowerCase();
      
      // Regions
      if (['jawa', 'padang', 'sunda', 'betawi'].includes(category)) {
        if (recipe.region.toLowerCase() !== category) return false;
      } 
      // Main categories
      else if (category === 'kue') {
        // Kue & Jajanan
        const isKue = recipe.title.toLowerCase().includes('kue') || 
                      recipe.description.toLowerCase().includes('kue') || 
                      recipe.description.toLowerCase().includes('jajanan');
        if (!isKue) return false;
      } else if (category === 'lauk pauk') {
        // Lauk pauk (Meat/fish/poultry - e.g. Ayam, Sapi, Daging, Udang, Sate, Rendang)
        const isLauk = recipe.title.toLowerCase().includes('ayam') || 
                      recipe.title.toLowerCase().includes('daging') || 
                      recipe.title.toLowerCase().includes('rendang') || 
                      recipe.title.toLowerCase().includes('sate') || 
                      recipe.title.toLowerCase().includes('udang') ||
                      recipe.title.toLowerCase().includes('lauk');
        if (!isLauk) return false;
      } else if (category === 'sayuran') {
        const isSayur = recipe.title.toLowerCase().includes('sayur') || 
                       recipe.title.toLowerCase().includes('sambal') || // Sambal / Gado-Gado (veggies)
                       recipe.title.toLowerCase().includes('gado');
        if (!isSayur) return false;
      } else if (category === 'seafood') {
        const isSeafood = recipe.title.toLowerCase().includes('udang') || 
                          recipe.title.toLowerCase().includes('ikan') || 
                          recipe.title.toLowerCase().includes('cumi');
        if (!isSeafood) return false;
      }
    }

    return true;
  });

  const categoriesList = [
    { name: 'Masakan Jawa', value: 'jawa', color: 'from-red-500 to-rose-600 shadow-red-500/20' },
    { name: 'Masakan Padang', value: 'padang', color: 'from-orange-500 to-amber-600 shadow-orange-500/20' },
    { name: 'Masakan Sunda', value: 'sunda', color: 'from-green-500 to-emerald-600 shadow-green-500/20' },
    { name: 'Masakan Betawi', value: 'betawi', color: 'from-blue-500 to-indigo-600 shadow-blue-500/20' },
    { name: 'Kue & Jajanan', value: 'kue', color: 'from-pink-500 to-purple-600 shadow-pink-500/20' },
    { name: 'Lauk Pauk', value: 'lauk pauk', color: 'from-purple-600 to-violet-700 shadow-purple-500/20' },
    { name: 'Sayuran', value: 'sayuran', color: 'from-teal-500 to-emerald-600 shadow-teal-500/20' },
    { name: 'Seafood', value: 'seafood', color: 'from-cyan-500 to-teal-600 shadow-cyan-500/20' }
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-6">
      {/* Hero section */}
      <Hero />

      {/* Filter component */}
      <SearchFilters
        currentRegion={selectedRegion}
        currentDifficulty={selectedDifficulty}
        currentSearch={searchQuery}
      />

      {/* Category List Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#ff6b00] dark:text-orange-400" />
          <h2 className="text-lg font-extrabold text-[#15233b] dark:text-zinc-100 tracking-tight">
            Kategori Pilihan
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categoriesList.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.value.toLowerCase();
            return (
              <a
                key={cat.name}
                href={isActive ? '/' : `/?category=${encodeURIComponent(cat.value)}`}
                className={`relative flex items-center justify-center h-14 rounded-2xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer bg-gradient-to-r overflow-hidden ${cat.color} ${
                  isActive ? 'ring-4 ring-orange-500 dark:ring-orange-400 ring-offset-2 dark:ring-offset-zinc-950' : ''
                }`}
              >
                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                <span className="relative z-10">{cat.name}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Popular Recipes Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-[#ff6b00] dark:text-orange-400" />
            <h2 className="text-lg font-extrabold text-[#15233b] dark:text-zinc-100 tracking-tight">
              {searchQuery || selectedRegion || selectedDifficulty || selectedCategory
                ? 'Hasil Pencarian'
                : 'Pencarian Populer'}
            </h2>
          </div>
          {(searchQuery || selectedRegion || selectedDifficulty || selectedCategory) && (
            <a
              href="/"
              className="text-xs font-bold text-[#ff6b00] dark:text-orange-400 hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-full h-[150px] rounded-2xl bg-zinc-200 dark:bg-zinc-800 animate-pulse border border-zinc-100 dark:border-zinc-800"
              />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="w-full text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col items-center gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
              Tidak ada resep yang cocok dengan kriteria pencarian atau filter Anda.
            </p>
            <a
              href="/"
              className="px-4 py-2 rounded-full bg-orange-50 dark:bg-zinc-800 hover:bg-orange-100 dark:hover:bg-zinc-700 text-[#ff6b00] dark:text-orange-400 text-xs font-bold transition-colors"
            >
              Kembali ke Semua Resep
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans flex flex-col transition-colors">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container: Sidebar + Page Content */}
      <div className="flex flex-1 pt-[56px]">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Scrollable Page Body */}
        <main className="flex-1 min-w-0 md:pl-[175px] px-6 md:px-8 bg-zinc-50/50 dark:bg-zinc-950/50">
          <Suspense
            fallback={
              <div className="w-full flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b00]" />
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
