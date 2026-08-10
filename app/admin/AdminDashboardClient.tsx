'use client';

import { useState } from 'react';
import Link from 'next/link';
import { approveRecipe, rejectRecipe, approveChangeRequest, rejectChangeRequest } from './actions';
import { ChefHat, AlertCircle, Sparkles, BookOpen, Clock, BarChart, User } from 'lucide-react';

interface AdminDashboardClientProps {
  pendingRecipes: any[];
  pendingRequests: any[];
}

export default function AdminDashboardClient({
  pendingRecipes: initialRecipes,
  pendingRequests: initialRequests,
}: AdminDashboardClientProps) {
  const [recipes, setRecipes] = useState<any[]>(initialRecipes);
  const [requests, setRequests] = useState<any[]>(initialRequests);
  
  const [activeTab, setActiveTab] = useState<'recipes' | 'requests'>('recipes');
  
  // Rejection state
  const [recipeRejectId, setRecipeRejectId] = useState<number | null>(null);
  const [recipeReason, setRecipeReason] = useState('');
  
  const [requestRejectId, setRequestRejectId] = useState<number | null>(null);
  const [requestReason, setRequestReason] = useState('');
  
  const [actionError, setActionError] = useState('');

  const handleApproveRecipe = async (id: number) => {
    setActionError('');
    const res = await approveRecipe(id);
    if (res.error) {
      setActionError(res.error);
    } else {
      setRecipes(recipes.filter(r => r.id !== id));
    }
  };

  const handleRejectRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeRejectId || !recipeReason.trim()) return;
    setActionError('');

    const res = await rejectRecipe(recipeRejectId, recipeReason);
    if (res.error) {
      setActionError(res.error);
    } else {
      setRecipes(recipes.filter(r => r.id !== recipeRejectId));
      setRecipeRejectId(null);
      setRecipeReason('');
    }
  };

  const handleApproveRequest = async (id: number) => {
    setActionError('');
    const res = await approveChangeRequest(id);
    if (res.error) {
      setActionError(res.error);
    } else {
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  const handleRejectRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestRejectId || !requestReason.trim()) return;
    setActionError('');

    const res = await rejectChangeRequest(requestRejectId, requestReason);
    if (res.error) {
      setActionError(res.error);
    } else {
      setRequests(requests.filter(r => r.id !== requestRejectId));
      setRequestRejectId(null);
      setRequestReason('');
    }
  };

  function RecipeDiff({ current, proposed }: { current: any; proposed: any }) {
    if (!current || !proposed) return null;
    const fields = Object.keys(proposed).filter(f => f !== 'slug'); // hide slug from diff
    return (
      <div className="overflow-x-auto border border-border rounded-xl mt-3 bg-surface">
        <table className="min-w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted border-b border-border">
              <th className="p-3 font-bold text-ink">Field</th>
              <th className="p-3 font-bold text-ink">Data Sekarang (Live)</th>
              <th className="p-3 font-bold text-ink">Usulan Perubahan</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(field => {
              let oldVal = current[field];
              let newVal = proposed[field];
              
              if (Array.isArray(oldVal)) oldVal = oldVal.join(', ');
              if (Array.isArray(newVal)) newVal = newVal.join(', ');
              
              const isChanged = JSON.stringify(current[field]) !== JSON.stringify(proposed[field]);

              return (
                <tr key={field} className={`border-b border-border last:border-0 ${isChanged ? 'bg-secondary/5' : ''}`}>
                  <td className="p-3 border-r border-border text-ink font-bold capitalize">{field.replace('_', ' ')}</td>
                  <td className="p-3 border-r border-border text-ink-muted/80 line-through truncate max-w-xs">{String(oldVal ?? '-')}</td>
                  <td className={`p-3 font-medium ${isChanged ? 'text-primary' : 'text-ink-muted'}`}>{String(newVal ?? '-')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-4 border-b border-border">
        <h1 className="text-2xl font-semibold text-ink leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
          Panel Admin Moderasi
        </h1>
        <p className="text-xs text-ink-muted">
          Tinjau kiriman resep baru dan usulan perubahan dari para pengguna.
        </p>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-surface-muted border border-accent/20 text-accent text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Error: {actionError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('recipes')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'recipes'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Resep Baru ({recipes.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 cursor-pointer transition-colors ${
            activeTab === 'requests'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Usulan Perubahan ({requests.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'recipes' ? (
        <div className="flex flex-col gap-6">
          {recipes.length === 0 ? (
            <div className="bg-surface border border-border p-10 rounded-2xl text-center flex flex-col items-center gap-4">
              <ChefHat className="w-12 h-12 text-ink-muted" />
              <h3 className="text-sm font-bold text-ink">Tidak Ada Antrean Resep Baru</h3>
              <p className="text-xs text-ink-muted">
                Semua resep baru yang dikirimkan pengguna sudah selesai ditinjau.
              </p>
            </div>
          ) : (
            recipes.map((recipe) => (
              <div key={recipe.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="px-2 py-0.5 rounded bg-surface-muted text-secondary text-[9px] font-bold uppercase border border-border self-start">
                      Khas {recipe.region || 'Nusantara'}
                    </span>
                    <h3 className="text-base font-extrabold text-ink mt-1">{recipe.title}</h3>
                    <p className="text-xs text-ink-muted">
                      Penulis: <span className="font-semibold">{recipe.author_name || 'Anonim'}</span> | Dikirim pada:{' '}
                      {new Date(recipe.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  {recipeRejectId !== recipe.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveRecipe(recipe.id)}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => setRecipeRejectId(recipe.id)}
                        className="px-3 py-1.5 rounded-xl border border-border hover:border-accent hover:text-accent bg-surface text-xs font-bold text-ink-muted transition-all cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-ink-muted">{recipe.description}</p>

                {/* Recipe Preview Details */}
                <div className="p-3 bg-surface-muted rounded-xl border border-border flex flex-col gap-2.5">
                  <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-secondary" /> Detail Resep
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-border pb-2.5">
                    <div>
                      <span className="text-[9px] text-ink-muted uppercase block">Prep Time</span>
                      <span className="font-bold flex items-center gap-1 font-mono mt-0.5"><Clock className="w-3 h-3 text-secondary"/>{recipe.prep_time} mnt</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-ink-muted uppercase block">Cook Time</span>
                      <span className="font-bold flex items-center gap-1 font-mono mt-0.5"><Clock className="w-3 h-3 text-secondary"/>{recipe.cook_time} mnt</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-ink-muted uppercase block">Porsi</span>
                      <span className="font-bold flex items-center gap-1 font-mono mt-0.5"><User className="w-3 h-3 text-secondary"/>{recipe.servings} porsi</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-ink-muted uppercase block">Kesulitan</span>
                      <span className="font-bold flex items-center gap-1 capitalize font-mono mt-0.5"><BarChart className="w-3 h-3 text-secondary"/>{recipe.difficulty}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-1">
                    <div>
                      <span className="font-bold text-ink block mb-1">Bahan-bahan ({recipe.ingredients?.length}):</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-ink-muted">
                        {recipe.ingredients?.map((ing: string, i: number) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-ink block mb-1">Langkah Pembuatan ({recipe.steps?.length}):</span>
                      <ol className="list-decimal pl-4 space-y-1 text-ink-muted">
                        {recipe.steps?.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>

                {recipeRejectId === recipe.id && (
                  <form onSubmit={handleRejectRecipeSubmit} className="border-t border-border pt-4 mt-1 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-accent">Alasan Penolakan (Wajib)</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bahan tidak lengkap atau judul mengandung spam..."
                        value={recipeReason}
                        onChange={(e) => setRecipeReason(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-bg text-ink"
                      />
                    </div>
                    <div className="flex items-center gap-2 self-end">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/95 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Kirim Penolakan
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRecipeRejectId(null); setRecipeReason(''); }}
                        className="px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-ink-muted hover:bg-surface-muted transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {requests.length === 0 ? (
            <div className="bg-surface border border-border p-10 rounded-2xl text-center flex flex-col items-center gap-4">
              <ChefHat className="w-12 h-12 text-ink-muted" />
              <h3 className="text-sm font-bold text-ink">Tidak Ada Usulan Perubahan Pending</h3>
              <p className="text-xs text-ink-muted">
                Semua usulan edit/hapus resep sudah selesai ditinjau.
              </p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-border ${
                        req.type === 'edit' 
                          ? 'bg-secondary/10 text-secondary border-secondary/20' 
                          : 'bg-accent/10 text-accent border-accent/20'
                      }`}>
                        Usulan {req.type === 'edit' ? 'Edit' : 'Hapus'}
                      </span>
                      <span className="text-xs text-ink-muted">
                        Resep: <span className="font-semibold text-ink">"{req.recipes_db?.title}"</span> (ID: {req.recipe_id})
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      Pengusul ID: <span className="font-mono">{req.requested_by}</span> | Tanggal:{' '}
                      {new Date(req.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  
                  {requestRejectId !== req.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => setRequestRejectId(req.id)}
                        className="px-3 py-1.5 rounded-xl border border-border hover:border-accent hover:text-accent bg-surface text-xs font-bold text-ink-muted transition-all cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>

                {req.type === 'edit' ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-ink mt-2 block">Perbandingan Perubahan:</span>
                    <RecipeDiff current={req.recipes_db} proposed={req.proposed_data} />
                  </div>
                ) : (
                  <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl flex items-start gap-2.5 mt-2">
                    <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-accent block">Resep ini diusulkan untuk dihapus secara permanen</span>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Menyetujui usulan ini akan memindahkan data resep ini ke tabel arsip dan menghapusnya dari koleksi publik.
                      </p>
                    </div>
                  </div>
                )}

                {requestRejectId === req.id && (
                  <form onSubmit={handleRejectRequestSubmit} className="border-t border-border pt-4 mt-1 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-accent">Alasan Penolakan Usulan (Wajib)</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Perubahan informasi melanggar ketentuan, atau data yang diusulkan tidak valid..."
                        value={requestReason}
                        onChange={(e) => setRequestReason(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-bg text-ink"
                      />
                    </div>
                    <div className="flex items-center gap-2 self-end">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent/95 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Kirim Penolakan
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRequestRejectId(null); setRequestReason(''); }}
                        className="px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-bold text-ink-muted hover:bg-surface-muted transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
