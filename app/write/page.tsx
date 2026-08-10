'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon
} from 'lucide-react';

export default function WriteRecipePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <WriteRecipeForm />
    </Suspense>
  );
}

function WriteRecipeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('edit');
  
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [recipeIdToEdit, setRecipeIdToEdit] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const supabase = createClient();

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('Jawa');
  const [difficulty, setDifficulty] = useState<'mudah' | 'sedang' | 'sulit'>('mudah');
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(20);
  const [servings, setServings] = useState(2);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);

  const [authorName, setAuthorName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sample preset images
  const presetImages = [
    { name: 'Nusantara Mix', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80' },
    { name: 'Sate & Bakaran', url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop&q=80' },
    { name: 'Soto & Kuah', url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800&auto=format&fit=crop&q=80' },
    { name: 'Nasi Goreng', url: 'https://images.unsplash.com/photo-1617692518154-15697f288849?w=800&auto=format&fit=crop&q=80' }
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        // Fetch display_name from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (profile?.display_name) {
          setAuthorName(profile.display_name);
        } else {
          // Fallback to email username if display_name is not set
          setAuthorName(currentUser.email?.split('@')[0] || '');
        }
      }
      setCheckingAuth(false);
    };
    checkUser();
  }, [supabase]);

  useEffect(() => {
    const fetchRecipeToEdit = async () => {
      if (!editSlug || !user) return;
      const { data: recipe, error } = await supabase
        .from('recipes_db')
        .select('*')
        .eq('slug', editSlug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching recipe to edit:', error.message);
        return;
      }

      if (recipe) {
        // Verify owner match
        if (recipe.user_id !== user.id) {
          setErrorMsg('Anda bukan pemilik resep ini.');
          return;
        }

        setRecipeIdToEdit(Number(recipe.id));
        setIsEditMode(true);
        setTitle(recipe.title);
        setDescription(recipe.description);
        setRegion(recipe.region || 'Jawa');
        setDifficulty(recipe.difficulty as any || 'mudah');
        setPrepTime(recipe.prep_time || 15);
        setCookTime(recipe.cook_time || 20);
        setServings(recipe.servings || 2);
        setImageUrl(recipe.image_url);
        setIngredients(recipe.ingredients || ['']);
        setSteps(recipe.steps || ['']);
        if (recipe.author_name) {
          setAuthorName(recipe.author_name);
        }
      }
    };

    if (user && editSlug) {
      fetchRecipeToEdit();
    }
  }, [user, editSlug, supabase]);

  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, idx) => idx !== index));
    }
  };
  const handleIngredientChange = (index: number, val: string) => {
    const next = [...ingredients];
    next[index] = val;
    setIngredients(next);
  };

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, idx) => idx !== index));
    }
  };
  const handleStepChange = (index: number, val: string) => {
    const next = [...steps];
    next[index] = val;
    setSteps(next);
  };

  const slugify = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!title.trim()) {
      setErrorMsg('Judul resep tidak boleh kosong.');
      return;
    }
    if (ingredients.some((ing) => !ing.trim())) {
      setErrorMsg('Semua kolom bahan harus diisi, atau hapus kolom yang kosong.');
      return;
    }
    if (steps.some((step) => !step.trim())) {
      setErrorMsg('Semua kolom langkah pembuatan harus diisi, atau hapus kolom yang kosong.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const finalSlug = `${slugify(title)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const recipeData = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim() || `Resep khas ${region} yang lezat dan otentik.`,
        image_url: imageUrl,
        region,
        prep_time: Number(prepTime),
        cook_time: Number(cookTime),
        servings: Number(servings),
        ingredients: ingredients.map((i) => i.trim()),
        steps: steps.map((s) => s.trim()),
        is_popular: false,
        difficulty,
        user_id: currentUser?.id || null,
        author_name: authorName.trim() || null,
        status: currentUser ? 'pending' : 'approved' // Locally saved ones can remain immediately approved/accessible
      };

      // If user is authenticated, we write to Supabase recipes_db table.
      if (currentUser) {
        if (isEditMode && recipeIdToEdit) {
          const changeRequest = {
            recipe_id: recipeIdToEdit,
            requested_by: currentUser.id,
            type: 'edit',
            proposed_data: {
              title: title.trim(),
              slug: editSlug, // preserve original slug in proposed data
              description: description.trim() || `Resep khas ${region} yang lezat dan otentik.`,
              image_url: imageUrl,
              region,
              prep_time: Number(prepTime),
              cook_time: Number(cookTime),
              servings: Number(servings),
              ingredients: ingredients.map((i) => i.trim()),
              steps: steps.map((s) => s.trim()),
              difficulty,
              author_name: authorName.trim() || null
            },
            status: 'pending'
          };

          const { error } = await supabase
            .from('recipe_change_requests')
            .insert([changeRequest]);

          if (error) {
            throw new Error(error.message);
          }

          setSuccessMsg('Usulan perubahan resep berhasil dikirim! Sedang menunggu peninjauan oleh admin.');
          setTimeout(() => {
            router.push(`/recipes/${editSlug}`);
            router.refresh();
          }, 3000);
        } else {
          const { data, error } = await supabase
            .from('recipes_db')
            .insert([recipeData])
            .select();

          if (error) {
            throw new Error(error.message);
          }

          // Auto-favorite the created recipe so it appears in "Koleksi Saya" in Sidebar
          if (data && data[0]) {
            const newRecipeId = Number(data[0].id);
            const { error: favError } = await supabase
              .from('favorites')
              .insert([{ user_id: currentUser.id, recipe_id: newRecipeId }]);

            if (favError) {
              console.error('Failed to auto-favorite created recipe:', favError);
            } else {
              // Dispatch a custom event to notify Sidebar
              window.dispatchEvent(new Event('favorites-updated'));
            }
          }

          setSuccessMsg('Resep berhasil dikirim! Resep Anda sedang menunggu peninjauan oleh admin sebelum dipublikasikan.');
          setTimeout(() => {
            router.push(`/recipes/${finalSlug}`);
            router.refresh();
          }, 3000);
        }
      } else {
        // Unauthenticated local save fallback
        const localRecipes = JSON.parse(localStorage.getItem('enaknyo_local_recipes') || '[]');
        localStorage.setItem('enaknyo_local_recipes', JSON.stringify([...localRecipes, recipeData]));

        // Also add to favorites so it appears in the sidebar collection!
        const favorites = JSON.parse(localStorage.getItem('enaknyo_favorites') || '[]');
        localStorage.setItem('enaknyo_favorites', JSON.stringify([...favorites, finalSlug]));
        window.dispatchEvent(new Event('favorites-updated'));

        setSuccessMsg('Resep berhasil disimpan di browser Anda! (Mode Demo Lokal)');
        setTimeout(() => {
          router.push(`/recipes/${finalSlug}`);
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirimkan resep.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col transition-colors">
      <Navbar />

      <div className="flex flex-1 pt-[56px]">
        <Sidebar />

        <main className="flex-1 min-w-0 md:pl-[175px] px-6 md:px-8 bg-bg">
          <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-6">
            {/* Back Arrow */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            {/* Main Editor Card */}
            <div className="bg-surface p-6 md:p-8 rounded-2xl border border-border flex flex-col gap-6 transition-colors">
              <div className="flex flex-col gap-1.5 pb-4 border-b border-border">
                <h1
                  className="text-2xl font-semibold text-ink leading-tight"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {isEditMode ? 'Edit Resep' : 'Tulis Resep Baru'}
                </h1>
                <p className="text-xs text-ink-muted">
                  {isEditMode 
                    ? 'Ajukan usulan perubahan resep Anda untuk ditinjau oleh admin.' 
                    : 'Bagikan warisan kuliner Anda dengan ribuan pencinta rasa Nusantara.'}
                </p>
              </div>

              {/* Warnings/Success */}
              {!user && !checkingAuth && (
                <div className="p-4 rounded-xl bg-surface-muted border border-border text-ink-muted text-xs font-semibold leading-relaxed flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-ink">Mode Pengunjung (Belum Masuk)</span>
                    <p className="font-medium text-ink-muted mt-0.5">
                      Anda belum masuk. Resep yang Anda buat akan disimpan secara lokal di browser Anda. Untuk membagikannya ke database publik, silakan{' '}
                      <Link href="/login" className="text-primary font-bold hover:underline">
                        masuk atau daftar.
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-surface-muted border border-accent/30 text-accent text-xs font-semibold">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3.5 rounded-xl bg-surface-muted border border-primary/30 text-primary text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Section 1: Basic info */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-sm font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    1. Informasi Utama
                  </h2>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted">Judul Resep</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Soto Betawi Asli Daging Sapi"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-bg text-ink"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted">Nama Penulis</label>
                    <input
                      type="text"
                      placeholder="Nama Anda yang akan ditampilkan di resep..."
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-bg text-ink"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-muted">Deskripsi Singkat</label>
                    <textarea
                      placeholder="Ceritakan sejarah singkat atau cita rasa resep buatan Anda..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full h-24 p-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-bg text-ink resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-ink-muted">Asal Wilayah</label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary text-ink bg-bg"
                      >
                        <option value="Jawa">Jawa</option>
                        <option value="Padang">Padang</option>
                        <option value="Sunda">Sunda</option>
                        <option value="Betawi">Betawi</option>
                        <option value="Sumatera">Sumatera</option>
                        <option value="Bali">Bali & Nusa Tenggara</option>
                        <option value="Sulawesi">Sulawesi</option>
                        <option value="Kalimantan">Kalimantan</option>
                        <option value="Maluku">Maluku & Papua</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-ink-muted">Tingkat Kesulitan</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary text-ink bg-bg"
                      >
                        <option value="mudah">Mudah (Cocok untuk Pemula)</option>
                        <option value="sedang">Sedang</option>
                        <option value="sulit">Sulit (Perlu Teknik Khusus)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-ink-muted">Persiapan (Mnt)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={prepTime}
                        onChange={(e) => setPrepTime(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-bg text-ink font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-ink-muted">Masak (Mnt)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={cookTime}
                        onChange={(e) => setCookTime(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-bg text-ink font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-ink-muted">Porsi (Orang)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={servings}
                        onChange={(e) => setServings(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-bg text-ink font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Photo selection */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-secondary" />
                    2. Foto Kuliner
                  </h2>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-ink-muted">Pilih Preset Gambar atau Masukkan URL Sendiri</label>
                    <div className="grid grid-cols-4 gap-3">
                      {presetImages.map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => setImageUrl(img.url)}
                          className={`h-14 rounded-xl overflow-hidden border-2 text-[9px] font-bold relative group flex items-end justify-center pb-1 text-white bg-surface-muted transition-all cursor-pointer ${imageUrl === img.url ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-80'
                            }`}
                        >
                          <img src={img.url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40" />
                          <span className="relative z-10">{img.name}</span>
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Masukkan URL foto kuliner kustom Anda..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-border text-xs mt-2 focus:outline-none focus:border-primary bg-bg text-ink"
                    />
                  </div>
                </div>

                {/* Section 3: Ingredients */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-4 rounded-full bg-primary" />
                    3. Bahan-Bahan
                  </h2>

                  <div className="flex flex-col gap-2">
                    {ingredients.map((ingredient, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Bahan ke-${idx + 1} (contoh: 2 siung bawang putih, memarkan)`}
                          value={ingredient}
                          onChange={(e) => handleIngredientChange(idx, e.target.value)}
                          className="flex-1 h-11 px-4 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-bg text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(idx)}
                          disabled={ingredients.length === 1}
                          className="p-3 hover:text-accent text-ink-muted disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addIngredient}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors mt-1 self-start cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bahan</span>
                  </button>
                </div>

                {/* Section 4: Steps */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-4 rounded-full bg-primary" />
                    4. Langkah Pembuatan
                  </h2>

                  <div className="flex flex-col gap-2">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-6 h-11 flex items-center justify-center text-xs font-bold text-ink-muted font-mono">
                          {idx + 1}
                        </span>
                        <textarea
                          placeholder={`Deskripsikan langkah ke-${idx + 1}...`}
                          value={step}
                          onChange={(e) => handleStepChange(idx, e.target.value)}
                          className="flex-1 min-h-[44px] max-h-24 p-3 rounded-xl border border-border text-sm focus:outline-none focus:border-primary bg-bg text-ink resize-y"
                        />
                        <button
                          type="button"
                          onClick={() => removeStep(idx)}
                          disabled={steps.length === 1}
                          className="p-3 hover:text-accent text-ink-muted disabled:opacity-40 transition-colors mt-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addStep}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors mt-1 self-start cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Langkah</span>
                  </button>
                </div>

                <div className="h-[1px] bg-border" />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-surface-muted disabled:text-ink-muted text-white font-bold text-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? 'Menyimpan...' : (isEditMode ? 'Kirim Usulan Perubahan' : 'Terbitkan Resep')}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
