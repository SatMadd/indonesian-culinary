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
  const [hasError, setHasError] = useState(false);
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
    setHasError(false);

    if (currentUser) {
      try {
        // Fetch favorites matching the user's ID
        const { data: userFavs, error: favsError } = await supabase
          .from('favorites')
          .select('recipe_id')
          .eq('user_id', currentUser.id);

        if (favsError) {
          console.error('Failed to load DB favorites:', favsError);
          setHasError(true);
          return;
        }

        if (userFavs && userFavs.length > 0) {
          const favRecipeIds = userFavs.map((f: any) => Number(f.recipe_id));
          
          // Fetch the details of the favorited recipes from recipes_db
          const { data: dbRecipes, error: dbRecipesError } = await supabase
            .from('recipes_db')
            .select('*')
            .in('id', favRecipeIds);

          if (dbRecipesError) {
            console.error('Failed to load DB recipes:', dbRecipesError);
            setHasError(true);
            return;
          }

          if (dbRecipes) {
            favRecipes = dbRecipes;
          }
        }
      } catch (e) {
        console.error('Failed to load DB favorites:', e);
        setHasError(true);
      }
    } else {
      // Guest mode - load from localStorage using slug
      const localFavSlugs = JSON.parse(localStorage.getItem('enaknyo_favorites') || '[]');
      const localRecipesStr = typeof window !== 'undefined' ? localStorage.getItem('enaknyo_local_recipes') : null;
      const localRecipes: Recipe[] = localRecipesStr ? JSON.parse(localRecipesStr) : [];
      const allRecipes = [...localRecipes, ...FALLBACK_RECIPES];
      favRecipes = allRecipes.filter(r => localFavSlugs.includes(r.slug));
    }

    setFavorites(favRecipes);
  };

  return (
    <aside className="fixed left-0 top-[56px] bottom-0 z-40 w-[175px] border-r border-border bg-surface p-4 hidden md:flex flex-col gap-4 overflow-y-auto transition-colors">
      {/* Top Item */}
      <Link
        href="/"
        className="flex items-center justify-between text-ink hover:text-primary transition-colors group"
      >
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-ink-muted group-hover:text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Menu Utama
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-border group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="h-[1px] bg-border my-1" />

      {/* Collection Section */}
      {!user ? (
        /* Unauthenticated Card */
        <div className="rounded-xl border border-border bg-surface-muted p-3 flex flex-col gap-2 hover:border-primary transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Koleksi Resep</span>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-muted">
            Untuk mulai membuat koleksi resep, silakan{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              daftar atau masuk.
            </Link>
          </p>
        </div>
      ) : (
        /* Authenticated List */
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Koleksi Saya ({favorites.length})</span>
          </div>

          {hasError ? (
            <p className="text-[11px] leading-relaxed text-accent font-semibold italic">
              Gagal memuat koleksi
            </p>
          ) : favorites.length === 0 ? (
            <p className="text-[11px] leading-relaxed text-ink-muted italic">
              Belum ada resep yang disimpan. Klik ikon hati pada resep untuk menyimpan!
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
              {favorites.map((recipe) => (
                <Link
                  key={recipe.slug}
                  href={`/recipes/${recipe.slug}`}
                  className="group flex flex-col gap-0.5 p-1.5 rounded-xl hover:bg-surface-muted text-[11px] font-medium text-ink-muted hover:text-ink transition-all border border-transparent hover:border-border"
                >
                  <span className="truncate block font-semibold text-ink group-hover:text-primary">
                    {recipe.title}
                  </span>
                  <span className="text-[9px] text-ink-muted font-normal">
                    {recipe.region}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Extra decor block */}
      <div className="mt-auto rounded-xl border border-border bg-surface-muted p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1 text-[10px] font-bold text-secondary">
          <Sparkles className="w-3 h-3 fill-current" />
          <span>Rasa Nusantara</span>
        </div>
        <p className="text-[9px] leading-relaxed text-ink-muted">
          Jelajahi dan lestarikan warisan kuliner Indonesia!
        </p>
      </div>
    </aside>
  );
}
