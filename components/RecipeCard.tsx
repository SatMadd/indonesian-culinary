'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Heart, Clock, BarChart } from 'lucide-react';
import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Authenticated user check
        let recipeId = recipe.id;
        if (!recipeId) {
          // Fallback recipe (no id in hardcoded data) - check db by slug
          const { data: dbRecipe } = await supabase
            .from('recipes_db')
            .select('id')
            .eq('slug', recipe.slug)
            .maybeSingle();
          recipeId = dbRecipe?.id;
        }

        if (recipeId) {
          const { data, error } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('recipe_id', Number(recipeId))
            .maybeSingle();
          if (!error && data) {
            setIsFavorited(true);
            return;
          }
        }
        setIsFavorited(false);
      } else {
        // Guest mode check
        const favorites = JSON.parse(localStorage.getItem('enaknyo_favorites') || '[]');
        setIsFavorited(favorites.includes(recipe.slug));
      }
    };

    checkFavoriteStatus();

    // Watch for global updates
    const handleFavUpdate = () => {
      checkFavoriteStatus();
    };
    window.addEventListener('favorites-updated', handleFavUpdate);
    return () => {
      window.removeEventListener('favorites-updated', handleFavUpdate);
    };
  }, [recipe, supabase]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Authenticated database toggle
      if (isFavorited) {
        let recipeId = recipe.id;
        if (!recipeId) {
          const { data: dbRecipe } = await supabase
            .from('recipes_db')
            .select('id')
            .eq('slug', recipe.slug)
            .maybeSingle();
          recipeId = dbRecipe?.id;
        }

        if (recipeId) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('recipe_id', Number(recipeId));
            
          if (!error) {
            setIsFavorited(false);
          } else {
            console.error('Error removing favorite:', error);
          }
        }
      } else {
        // Insert into favorites
        let recipeId = recipe.id;
        if (!recipeId) {
          // If the recipe is a fallback recipe, search for existing in db first
          const { data: existingRecipe } = await supabase
            .from('recipes_db')
            .select('id')
            .eq('slug', recipe.slug)
            .maybeSingle();
            
          if (existingRecipe) {
            recipeId = existingRecipe.id;
          } else {
            // Seed the fallback recipe to database so it has a bigint id
            const { id, created_at, ...recipeData } = recipe;
            const { data: newRecipe, error: insertError } = await supabase
              .from('recipes_db')
              .insert([recipeData])
              .select('id')
              .single();
              
            if (!insertError && newRecipe) {
              recipeId = newRecipe.id;
            } else {
              console.error('Failed to seed fallback recipe to DB:', insertError);
            }
          }
        }

        if (recipeId) {
          const { error } = await supabase
            .from('favorites')
            .insert([{ user_id: user.id, recipe_id: Number(recipeId) }]);
            
          if (!error) {
            setIsFavorited(true);
          } else {
            console.error('Error saving favorite:', error);
          }
        }
      }
    } else {
      // Guest mode (localStorage)
      const favorites = JSON.parse(localStorage.getItem('enaknyo_favorites') || '[]');
      let updatedFavorites;
      if (favorites.includes(recipe.slug)) {
        updatedFavorites = favorites.filter((slug: string) => slug !== recipe.slug);
        setIsFavorited(false);
      } else {
        updatedFavorites = [...favorites, recipe.slug];
        setIsFavorited(true);
      }
      localStorage.setItem('enaknyo_favorites', JSON.stringify(updatedFavorites));
    }

    // Dispatch a custom event to notify other components of updates
    window.dispatchEvent(new Event('favorites-updated'));
  };

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group relative block w-full h-[150px] rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 border border-zinc-100 transition-all duration-300 bg-zinc-100 cursor-pointer"
    >
      {/* Background Image */}
      <Image
        src={recipe.image_url}
        alt={recipe.title}
        fill
        sizes="(max-width: 768px) 100vw, 25vw"
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />

      {/* Region Badge */}
      <span className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-md bg-white/10 text-white backdrop-blur-sm text-[10px] font-semibold border border-white/10">
        {recipe.region}
      </span>

      {/* Heart / Favorite Button */}
      <button
        onClick={toggleFavorite}
        className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 text-white hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-sm border border-white/10 transition-all"
        title="Simpan Resep"
      >
        <Heart
          className={`w-3.5 h-3.5 transition-colors ${
            isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
          }`}
        />
      </button>

      {/* Bottom Content */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col gap-1">
        <h3 className="text-sm font-extrabold text-white leading-snug tracking-tight truncate drop-shadow-sm group-hover:text-orange-300 transition-colors">
          {recipe.title}
        </h3>

        {/* Small metadata stats */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-300 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-orange-400" />
            <span>{recipe.prep_time + recipe.cook_time} mnt</span>
          </span>
          <span className="flex items-center gap-1">
            <BarChart className="w-3 h-3 text-orange-400" />
            <span className="capitalize">{recipe.difficulty}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
