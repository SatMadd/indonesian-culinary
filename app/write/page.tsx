'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
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
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
    };
    checkUser();
  }, [supabase]);

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
        user_id: user?.id || null
      };

      // If user is authenticated, we write to Supabase recipes_db table.
      // If not, we will save to localStorage as a custom recipe, and redirect! This keeps the UI fully functional even for unauthenticated users checking the app out!
      if (user) {
        const { data, error } = await supabase
          .from('recipes_db')
          .insert([recipeData])
          .select();

        if (error) {
          throw new Error(error.message);
        }
        setSuccessMsg('Resep berhasil dipublikasikan!');
        setTimeout(() => {
          router.push(`/recipes/${finalSlug}`);
          router.refresh();
        }, 1500);
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
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col">
      <Navbar />

      <div className="flex flex-1 pt-[56px]">
        <Sidebar />

        <main className="flex-1 min-w-0 md:pl-[175px] px-6 md:px-8 bg-zinc-50/50">
          <div className="w-full max-w-3xl mx-auto py-6 flex flex-col gap-6">
            {/* Back Arrow */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-[#ff6b00] transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            {/* Main Editor Card */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-1.5 pb-4 border-b border-zinc-100">
                <h1 className="text-2xl font-black text-zinc-900 leading-tight">
                  Tulis Resep Baru
                </h1>
                <p className="text-xs text-zinc-400">
                  Bagikan warisan kuliner Anda dengan ribuan pencinta rasa Nusantara.
                </p>
              </div>

              {/* Warnings/Success */}
              {!user && !checkingAuth && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mode Pengunjung (Belum Masuk)</span>
                    <p className="font-medium text-amber-700/90 mt-0.5">
                      Anda belum masuk. Resep yang Anda buat akan disimpan secara lokal di browser Anda. Untuk membagikannya ke database publik, silakan{' '}
                      <Link href="/login" className="text-[#ff6b00] font-bold hover:underline">
                        masuk atau daftar.
                      </Link>
                    </p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-green-50 border border-green-100 text-green-600 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Section 1: Basic info */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#ff6b00]" />
                    1. Informasi Utama
                  </h2>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500">Judul Resep</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Soto Betawi Asli Daging Sapi"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-500">Deskripsi Singkat</label>
                    <textarea
                      placeholder="Ceritakan sejarah singkat atau cita rasa resep buatan Anda..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full h-24 p-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-800 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500">Asal Wilayah</label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-700 bg-white"
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
                      <label className="text-xs font-bold text-zinc-500">Tingkat Kesulitan</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-700 bg-white"
                      >
                        <option value="mudah">Mudah (Cocok untuk Pemula)</option>
                        <option value="sedang">Sedang</option>
                        <option value="sulit">Sulit (Perlu Teknik Khusus)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500">Persiapan (Mnt)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={prepTime}
                        onChange={(e) => setPrepTime(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500">Masak (Mnt)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={cookTime}
                        onChange={(e) => setCookTime(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-500">Porsi (Orang)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={servings}
                        onChange={(e) => setServings(Number(e.target.value))}
                        className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Photo selection */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#ff6b00]" />
                    2. Foto Kuliner
                  </h2>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-500">Pilih Preset Gambar atau Masukkan URL Sendiri</label>
                    <div className="grid grid-cols-4 gap-3">
                      {presetImages.map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => setImageUrl(img.url)}
                          className={`h-14 rounded-xl overflow-hidden border-2 text-[9px] font-bold relative group flex items-end justify-center pb-1 text-white bg-zinc-800 transition-all ${
                            imageUrl === img.url ? 'border-[#ff6b00] ring-2 ring-orange-500/20' : 'border-transparent opacity-80'
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
                      className="w-full h-11 px-4 rounded-xl border border-zinc-200 text-xs mt-2 focus:outline-none focus:border-[#ff6b00] text-zinc-700"
                    />
                  </div>
                </div>

                {/* Section 3: Ingredients */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-4 rounded-full bg-[#ff6b00]" />
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
                          className="flex-1 h-11 px-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-800"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(idx)}
                          disabled={ingredients.length === 1}
                          className="p-3 hover:text-red-500 text-zinc-400 disabled:opacity-40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addIngredient}
                    className="flex items-center gap-1 text-xs font-bold text-[#ff6b00] hover:text-orange-600 transition-colors mt-1 self-start"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Bahan</span>
                  </button>
                </div>

                {/* Section 4: Steps */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-4 rounded-full bg-[#ff6b00]" />
                    4. Langkah Pembuatan
                  </h2>

                  <div className="flex flex-col gap-2">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-6 h-11 flex items-center justify-center text-xs font-bold text-zinc-400">
                          {idx + 1}
                        </span>
                        <textarea
                          placeholder={`Deskripsikan langkah ke-${idx + 1}...`}
                          value={step}
                          onChange={(e) => handleStepChange(idx, e.target.value)}
                          className="flex-1 min-h-[44px] max-h-24 p-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#ff6b00] text-zinc-800 resize-y"
                        />
                        <button
                          type="button"
                          onClick={() => removeStep(idx)}
                          disabled={steps.length === 1}
                          className="p-3 hover:text-red-500 text-zinc-400 disabled:opacity-40 transition-colors mt-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addStep}
                    className="flex items-center gap-1 text-xs font-bold text-[#ff6b00] hover:text-orange-600 transition-colors mt-1 self-start"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Langkah</span>
                  </button>
                </div>

                <div className="h-[1px] bg-zinc-100" />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#ff6b00] hover:bg-orange-600 disabled:bg-zinc-300 text-white font-bold text-sm shadow-md shadow-orange-500/10 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Menyimpan...' : 'Terbitkan Resep'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
