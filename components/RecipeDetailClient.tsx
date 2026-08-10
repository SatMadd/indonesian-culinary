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
  Play,
  Edit,
  Trash2
} from 'lucide-react';
import { Recipe } from '@/types';
import { seedFallbackRecipe } from '@/app/actions/seed-fallback-recipe';

interface RecipeDetailClientProps {
  recipe: Recipe | null;
  slug: string;
}

export default function RecipeDetailClient({ recipe: initialRecipe, slug }: RecipeDetailClientProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe);
  const [loadingLocal, setLoadingLocal] = useState(!initialRecipe);
  const [isFavorited, setIsFavorited] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [changeRequestStatus, setChangeRequestStatus] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user && recipe) {
        setIsOwner(recipe.user_id === user.id);
        
        // Fetch any pending change requests for this recipe
        const { data: changeReqs } = await supabase
          .from('recipe_change_requests')
          .select('*')
          .eq('recipe_id', recipe.id)
          .eq('status', 'pending')
          .maybeSingle();
        if (changeReqs) {
          setChangeRequestStatus(changeReqs);
        }
      }
    };
    fetchUserAndStatus();
  }, [recipe, supabase]);

  const handleDeleteRecipe = async () => {
    if (!recipe || !currentUser) return;
    if (!confirm('Apakah Anda yakin ingin mengajukan penghapusan resep ini?')) return;
    
    setErrorMsg('');
    const { error } = await supabase
      .from('recipe_change_requests')
      .insert([{
        recipe_id: recipe.id,
        requested_by: currentUser.id,
        type: 'delete',
        proposed_data: null,
        status: 'pending'
      }]);

    if (error) {
      setErrorMsg('Gagal mengirim usulan penghapusan: ' + error.message);
    } else {
      alert('Usulan penghapusan resep berhasil dikirim dan sedang menunggu peninjauan admin.');
      router.refresh();
      // Fetch status again
      const { data: changeReqs } = await supabase
        .from('recipe_change_requests')
        .select('*')
        .eq('recipe_id', recipe.id)
        .eq('status', 'pending')
        .maybeSingle();
      if (changeReqs) {
        setChangeRequestStatus(changeReqs);
      }
    }
  };

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
            .eq('status', 'approved')
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
    setErrorMsg('');

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
            .eq('status', 'approved')
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
            setErrorMsg('Gagal menghapus');
            setTimeout(() => setErrorMsg(''), 3000);
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
            .eq('status', 'approved')
            .maybeSingle();
            
          if (existingRecipe) {
            recipeId = existingRecipe.id;
          } else {
            // Seed the fallback recipe via a trusted server action (service role, bypasses RLS)
            const { id, created_at, ...recipeData } = recipe;
            const seeded = await seedFallbackRecipe(recipeData);
              
            if (seeded) {
              recipeId = seeded.id;
            } else {
              console.error('Failed to seed fallback recipe to DB');
              setErrorMsg('Gagal menyimpan');
              setTimeout(() => setErrorMsg(''), 3000);
              return;
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
            setErrorMsg('Gagal menyimpan');
            setTimeout(() => setErrorMsg(''), 3000);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-xs text-ink-muted font-semibold">Memuat resep lokal...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="w-full max-w-md mx-auto py-24 text-center flex flex-col items-center gap-4 bg-surface p-8 rounded-2xl border border-border mt-8">
        <div className="w-12 h-12 rounded-full bg-surface-muted text-accent flex items-center justify-center font-bold text-lg">
          !
        </div>
        <h2 className="text-lg font-black text-ink">Resep Tidak Ditemukan</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          Resep yang Anda cari tidak tersedia atau belum dibuat di browser ini.
        </p>
        <Link
          href="/"
          className="mt-2 px-4 py-2 rounded-xl bg-surface-muted hover:border-primary border border-border text-primary text-xs font-bold transition-all"
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
        className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Resep</span>
      </Link>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image and Specs Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Photo */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-surface-muted">
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Quick Specs Dashboard Card */}
          <div className="bg-surface p-6 rounded-xl border border-border flex flex-col gap-4 transition-colors">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                Informasi Resep
              </span>
              <div className="flex items-center gap-2">
                {errorMsg && <span className="text-[10px] text-accent font-bold animate-pulse">{errorMsg}</span>}
                <button
                  onClick={toggleFavorite}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-muted hover:border-primary border border-border text-ink-muted text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors ${
                      isFavorited ? 'fill-accent text-accent' : 'text-ink-muted'
                    }`}
                  />
                  <span>{isFavorited ? 'Tersimpan' : 'Simpan'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-ink-muted uppercase">
                  Waktu Persiapan
                </span>
                <span className="text-sm font-bold text-ink flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-secondary" />
                  {recipe.prep_time} mnt
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-ink-muted uppercase">
                  Waktu Masak
                </span>
                <span className="text-sm font-bold text-ink flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-secondary" />
                  {recipe.cook_time} mnt
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-ink-muted uppercase">
                  Porsi
                </span>
                <span className="text-sm font-bold text-ink flex items-center gap-1 font-mono">
                  <User className="w-3.5 h-3.5 text-secondary" />
                  {recipe.servings} porsi
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-ink-muted uppercase">
                  Tingkat Kesulitan
                </span>
                <span className="text-sm font-bold text-ink flex items-center gap-1 capitalize font-mono">
                  <ChefHat className="w-3.5 h-3.5 text-secondary" />
                  {recipe.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recipe details (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 bg-surface p-6 md:p-8 rounded-xl border border-border transition-colors">
          {/* Owner Moderation Banner */}
          {isOwner && (
            <div className="p-4 rounded-xl border border-border bg-surface-muted flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink-muted">Kelola Resep Anda:</span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/write?edit=${recipe.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary hover:text-primary text-xs font-bold transition-all bg-surface cursor-pointer text-ink-muted"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Resep</span>
                  </Link>
                  <button
                    onClick={handleDeleteRecipe}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:border-accent hover:text-accent text-xs font-bold transition-all bg-surface cursor-pointer text-ink-muted"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Resep</span>
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col gap-1.5 border-t border-border pt-3 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-muted">Status Resep:</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    recipe.status === 'approved' ? 'bg-primary/10 text-primary border border-primary/20' :
                    recipe.status === 'rejected' ? 'bg-accent/10 text-accent border border-accent/20' :
                    'bg-secondary/10 text-secondary border border-secondary/20'
                  }`}>
                    {recipe.status === 'approved' ? 'Disetujui / Publik' :
                     recipe.status === 'rejected' ? 'Ditolak' : 'Menunggu Peninjauan'}
                  </span>
                </div>
                {recipe.status === 'rejected' && recipe.rejection_reason && (
                  <p className="text-xs text-accent font-semibold">
                    Alasan Penolakan: <span className="font-normal text-ink-muted">{recipe.rejection_reason}</span>
                  </p>
                )}

                {/* Change Request Status Banner */}
                {changeRequestStatus && (
                  <div className="mt-2 p-2.5 rounded-lg border border-secondary/20 bg-secondary/5 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                        Ada usulan {changeRequestStatus.type === 'edit' ? 'perubahan' : 'penghapusan'} pending
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-muted">
                      Usulan dikirim pada {new Date(changeRequestStatus.created_at).toLocaleDateString('id-ID')}. Sedang menunggu peninjauan admin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-surface-muted text-secondary text-[10px] font-extrabold uppercase tracking-wide self-start border border-border">
              Khas {recipe.region}
            </span>
            <h1
              className="text-2xl md:text-3xl font-semibold text-ink leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              {recipe.title}
            </h1>
            <p className="text-sm leading-relaxed text-ink-muted font-medium">
              {recipe.description}
            </p>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Ingredients Checklist */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-primary" />
              Bahan-Bahan
            </h2>
            <p className="text-[11px] text-ink-muted italic">
              Klik bahan yang sudah Anda siapkan untuk mencentangnya.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              {(recipe.ingredients || []).map((ingredient, idx) => {
                const isChecked = checkedIngredients.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className={`flex items-start gap-3 text-left py-2 px-3 rounded-xl border transition-all text-xs font-semibold select-none cursor-pointer ${
                      isChecked
                        ? 'bg-surface-muted border-border text-ink-muted'
                        : 'bg-surface hover:border-primary border-border text-ink'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-primary border-primary text-white'
                          : 'border-border bg-surface'
                      }`}
                    >
                      {isChecked && <CheckCircle className="w-3.5 h-3.5 fill-current" />}
                    </div>
                    <span className={isChecked ? 'line-through text-ink-muted' : ''}>{ingredient}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Steps Instructions */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-primary" />
              Langkah Pembuatan
            </h2>
            <div className="flex flex-col gap-4 mt-2">
              {(recipe.steps || []).map((step, idx) => {
                const isDone = activeStep > idx;
                const isActive = activeStep === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-surface-muted border-primary'
                        : isDone
                        ? 'bg-surface border-border opacity-60'
                        : 'bg-surface border-border'
                    }`}
                  >
                    {/* Step number marker */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 transition-all font-mono ${
                        isActive
                          ? 'bg-primary text-white'
                          : isDone
                          ? 'bg-surface-muted text-ink-muted'
                          : 'bg-surface-muted text-ink'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex flex-col gap-1">
                      <p
                        className={`text-xs font-semibold leading-relaxed ${
                          isActive
                            ? 'text-ink'
                            : isDone
                            ? 'text-ink-muted line-through'
                            : 'text-ink-muted'
                        }`}
                      >
                        {step}
                      </p>
                      {isActive && (
                        <span className="text-[9px] text-primary font-bold flex items-center gap-1 mt-1">
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
