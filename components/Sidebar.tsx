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
      (_event, session) => {
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
    // 1. Get from localStorage
    const localFavSlugs = JSON.parse(localStorage.getItem('enaknyo_favorites') || '[]');
    let favRecipes = FALLBACK_RECIPES.filter(r => localFavSlugs.includes(r.slug));

    // 2. Try fetching from Supabase if logged in
    if (currentUser) {
      try {
        const { data: userFavs, error } = await supabase
          .from('favorites_db')
          .select('recipe_id');

        if (!error && userFavs && userFavs.length > 0) {
          // If we had database favorites, merge/use them. For now, since we have localStorage,
          // we use localStorage as source of truth or merge it.
        }
      } catch (e) {
        console.error('Failed to load DB favorites:', e);
      }
    }

    setFavorites(favRecipes);
  };

  return (
    <aside className="fixed left-0 top-[56px] bottom-0 z-40 w-[175px] border-r border-zinc-100 bg-white p-4 hidden md:flex flex-col gap-4 overflow-y-auto">
      {/* Top Item */}
      <Link
        href="/"
        className="flex items-center justify-between text-zinc-800 hover:text-[#ff6b00] transition-colors group"
      >
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-zinc-500 group-hover:text-[#ff6b00]" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Menu Utama
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#ff6b00] transition-transform group-hover:translate-x-0.5" />
      </Link>

      <div className="h-[1px] bg-zinc-100 my-1" />

      {/* Collection Section */}
      {!user ? (
        /* Unauthenticated Card */
        <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3 flex flex-col gap-2 shadow-sm shadow-orange-500/5 hover:border-orange-200 transition-colors">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff6b00]">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Koleksi Resep</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Untuk mulai membuat koleksi resep, silakan{' '}
            <Link href="/login" className="text-[#ff6b00] font-bold hover:underline">
              daftar atau masuk.
            </Link>
          </p>
        </div>
      ) : (
        /* Authenticated List */
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff6b00]">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Koleksi Saya ({favorites.length})</span>
          </div>

          {favorites.length === 0 ? (
            <p className="text-[11px] leading-relaxed text-zinc-400 italic">
              Belum ada resep yang disimpan. Klik ikon hati pada resep untuk menyimpan!
            </p>
          ) : (
            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
              {favorites.map((recipe) => (
                <Link
                  key={recipe.slug}
                  href={`/recipes/${recipe.slug}`}
                  className="group flex flex-col gap-0.5 p-1.5 rounded-lg hover:bg-zinc-50 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 transition-all border border-transparent hover:border-zinc-100"
                >
                  <span className="truncate block font-semibold text-zinc-700 group-hover:text-[#ff6b00]">
                    {recipe.title}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-normal">
                    {recipe.region}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Extra decor block */}
      <div className="mt-auto rounded-xl border border-purple-100 bg-purple-50/20 p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600">
          <Sparkles className="w-3 h-3 fill-current" />
          <span>Rasa Nusantara</span>
        </div>
        <p className="text-[9px] leading-relaxed text-zinc-400">
          Jelajahi dan lestarikan warisan kuliner Indonesia!
        </p>
      </div>
    </aside>
  );
}
