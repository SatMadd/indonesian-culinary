'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  Heart,
  Clock,
  User,
  ChefHat,
  ArrowLeft,
  CheckCircle,
  Play
} from 'lucide-react';
import { Recipe } from '@/types';

interface RecipeDetailClientProps {
  recipe: Recipe | null;
  slug: string;
}

export default function RecipeDetailClient({ recipe: initialRecipe, slug }: RecipeDetailClientProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe);
  const [loadingLocal, setLoadingLocal] = useState(!initialRecipe);
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const supabase = createClient();

  useEffect(() => {
    if (!recipe && slug) {
      const localRecipes = JSON.parse(localStorage.getItem('enaknyo_local_recipes') || '[]');
      const found = localRecipes.find((r: any) => r.slug === slug);
      if (found) {
        setRecipe(found);
      }
      setLoadingLocal(false);
    }
  }, [recipe, slug]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!recipe) return;
      
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

    const handleFavUpdate = () => {
      checkFavoriteStatus();
    };
    window.addEventListener('favorites-updated', handleFavUpdate);
    return () => {
      window.removeEventListener('favorites-updated', handleFavUpdate);
    };
  }, [recipe, supabase]);

  const toggleFavorite = async () => {
    if (!recipe) return;

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
        updatedFavorites = favorites.filter((s: string) => s !== recipe.slug);
        setIsFavorited(false);
      } else {
        updatedFavorites = [...favorites, recipe.slug];
        setIsFavorited(true);
      }
      localStorage.setItem('enaknyo_favorites', JSON.stringify(updatedFavorites));
    }

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('favorites-updated'));
  };

  const toggleIngredient = (index: number) => {
    if (checkedIngredients.includes(index)) {
      setCheckedIngredients(checkedIngredients.filter((i) => i !== index));
    } else {
      setCheckedIngredients([...checkedIngredients, index]);
    }
  };

  if (loadingLocal) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6b00]" />
        <p className="text-xs text-zinc-400 font-semibold">Memuat resep lokal...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="w-full max-w-md mx-auto py-24 text-center flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm mt-8">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-lg">
          !
        </div>
        <h2 className="text-lg font-black text-zinc-900">Resep Tidak Ditemukan</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Resep yang Anda cari tidak tersedia atau belum dibuat di browser ini.
        </p>
        <Link
          href="/"
          className="mt-2 px-4 py-2 rounded-full bg-orange-50 hover:bg-orange-100 text-[#ff6b00] text-xs font-bold transition-all"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 flex flex-col gap-6 font-sans">
      {/* Back Button */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#ff6b00] dark:hover:text-orange-400 transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Resep</span>
      </Link>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image and Specs Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Photo */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Quick Specs Dashboard Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4 transition-colors">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Informasi Resep
              </span>
              <button
                onClick={toggleFavorite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900 text-[#ff6b00] dark:text-orange-400 text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-colors ${
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-[#ff6b00] dark:text-orange-400'
                  }`}
                />
                <span>{isFavorited ? 'Tersimpan' : 'Simpan'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                  Waktu Persiapan
                </span>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  {recipe.prep_time} menit
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                  Waktu Masak
                </span>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                  {recipe.cook_time} menit
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                  Porsi
                </span>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                  {recipe.servings} porsi
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                  Tingkat Kesulitan
                </span>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 capitalize">
                  <ChefHat className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                  {recipe.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recipe details (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm transition-colors">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <span className="px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-[#ff6b00] dark:text-orange-400 text-[10px] font-extrabold uppercase tracking-wide self-start">
              Khas {recipe.region}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
              {recipe.title}
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
              {recipe.description}
            </p>
          </div>

          <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800" />

          {/* Ingredients Checklist */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#ff6b00] dark:bg-orange-500" />
              Bahan-Bahan
            </h2>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
              Klik bahan yang sudah Anda siapkan untuk mencentangnya.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              {recipe.ingredients.map((ingredient, idx) => {
                const isChecked = checkedIngredients.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className={`flex items-start gap-3 text-left py-2 px-3 rounded-xl border transition-all text-xs font-semibold select-none cursor-pointer ${
                      isChecked
                        ? 'bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-500'
                        : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950'
                      }`}
                    >
                      {isChecked && <CheckCircle className="w-3.5 h-3.5 fill-current" />}
                    </div>
                    <span className={isChecked ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}>{ingredient}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800" />

          {/* Steps Instructions */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#ff6b00] dark:bg-orange-500" />
              Langkah Pembuatan
            </h2>
            <div className="flex flex-col gap-4 mt-2">
              {recipe.steps.map((step, idx) => {
                const isDone = activeStep > idx;
                const isActive = activeStep === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-orange-50/20 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/60'
                        : isDone
                        ? 'bg-zinc-50/50 dark:bg-zinc-950/10 border-zinc-100 dark:border-zinc-800/80 opacity-60'
                        : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
                    }`}
                  >
                    {/* Step number marker */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-all ${
                        isActive
                          ? 'bg-[#ff6b00] dark:bg-orange-500 text-white shadow-md shadow-orange-500/20'
                          : isDone
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                          : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex flex-col gap-1">
                      <p
                        className={`text-xs font-semibold leading-relaxed ${
                          isActive
                            ? 'text-zinc-800 dark:text-zinc-100'
                            : isDone
                            ? 'text-zinc-400 dark:text-zinc-500 line-through'
                            : 'text-zinc-600 dark:text-zinc-300'
                        }`}
                      >
                        {step}
                      </p>
                      {isActive && (
                        <span className="text-[9px] text-[#ff6b00] dark:text-orange-400 font-bold flex items-center gap-1 mt-1">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          Langkah aktif - klik langkah berikutnya saat selesai
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
