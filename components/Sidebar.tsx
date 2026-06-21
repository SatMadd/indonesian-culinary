'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { BookMarked, ChevronRight, Heart, Star, Sparkles } from 'lucide-react';
import { Recipe } from '@/types';
import { FALLBACK_RECIPES } from '@/lib/data/recipes';

export default function Sidebar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const supabase = createClient();

  const userRef = useRef<any>(null);
  userRef.current = user;

  useEffect(() => {
    const checkUserAndFavs = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      loadFavorites(currentUser);
    };

    checkUserAndFavs();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        loadFavorites(currentUser);
      }
    );

    // Watch for localStorage favorites updates (custom event)
    const handleFavChange = () => {
      loadFavorites(userRef.current);
    };
    window.addEventListener('favorites-updated', handleFavChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('favorites-updated', handleFavChange);
    };
  }, [supabase]);

  const loadFavorites = async (currentUser: any) => {
    let favRecipes: Recipe[] = [];

    if (currentUser) {
      try {
        // Fetch favorites matching the user's ID
        const { data: userFavs, error: favsError } = await supabase
          .from('favorites')
          .select('recipe_id')
          .eq('user_id', currentUser.id);

        if (!favsError && userFavs && userFavs.length > 0) {
          const favRecipeIds = userFavs.map((f: any) => Number(f.recipe_id));
          
          // Fetch the details of the favorited recipes from recipes_db
          const { data: dbRecipes, error: dbRecipesError } = await supabase
            .from('recipes_db')
            .select('*')
            .in('id', favRecipeIds);

          if (!dbRecipesError && dbRecipes) {
            favRecipes = dbRecipes;
          }
        }
      } catch (e) {
        console.error('Failed to load DB favorites:', e);
      }
    } else {
      // Guest mode - load from localStorage using slug
      const localFavSlugs = JSON.parse(localStorage.getItem('enaknyo_favorites') || '[]');
      favRecipes = FALLBACK_RECIPES.filter(r => localFavSlugs.includes(r.slug));
    }

    setFavorites(favRecipes);
  };

  return (
    <aside className="fixed left-0 top-[56px] bottom-0 z-40 w-[175px] border-r border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 hidden md:flex flex-col gap-4 overflow-y-auto transition-colors">
      {/* Top Item */}
      <Link
        href="/"
        className="flex items-center justify-between text-zinc-800 dark:text-zinc-200 hover:text-[#ff6b00] dark:hover:text-orange-400 transition-colors group"
      >
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-zinc-500 dark:text-zinc-400 group-hover:text-[#ff6b00] dark:group-hover:text-orange-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Menu Utama
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-[#ff6b00] dark:group-hover:text-orange-400 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />

      {/* Collection Section */}
      {!user ? (
        /* Unauthenticated Card */
        <div className="rounded-xl border border-orange-100 dark:border-orange-950 bg-orange-50/40 dark:bg-orange-950/10 p-3 flex flex-col gap-2 shadow-sm shadow-orange-500/5 hover:border-orange-200 dark:hover:border-orange-900 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff6b00] dark:text-orange-400">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Koleksi Resep</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Untuk mulai membuat koleksi resep, silakan{' '}
            <Link href="/login" className="text-[#ff6b00] dark:text-orange-400 font-bold hover:underline">
              daftar atau masuk.
            </Link>
          </p>
        </div>
      ) : (
        /* Authenticated List */
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff6b00] dark:text-orange-400">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Koleksi Saya ({favorites.length})</span>
          </div>

          {favorites.length === 0 ? (
            <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500 italic">
              Belum ada resep yang disimpan. Klik ikon hati pada resep untuk menyimpan!
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
              {favorites.map((recipe) => (
                <Link
                  key={recipe.slug}
                  href={`/recipes/${recipe.slug}`}
                  className="group flex flex-col gap-0.5 p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800"
                >
                  <span className="truncate block font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-[#ff6b00] dark:group-hover:text-orange-400">
                    {recipe.title}
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-normal">
                    {recipe.region}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Extra decor block */}
      <div className="mt-auto rounded-xl border border-purple-100 dark:border-purple-950 bg-purple-50/20 dark:bg-purple-950/5 p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
          <Sparkles className="w-3 h-3 fill-current" />
          <span>Rasa Nusantara</span>
        </div>
        <p className="text-[9px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Jelajahi dan lestarikan warisan kuliner Indonesia!
        </p>
      </div>
    </aside>
  );
}
