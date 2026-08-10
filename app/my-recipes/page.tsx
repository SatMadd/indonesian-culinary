'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Edit, Trash2, AlertCircle, ChefHat } from 'lucide-react';

export default function MyRecipesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndFetch = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Fetch user's recipes
      const { data: userRecipes, error: recError } = await supabase
        .from('recipes_db')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!recError && userRecipes) {
        setRecipes(userRecipes);
      }

      // Fetch user's change requests
      const { data: crs, error: crError } = await supabase
        .from('recipe_change_requests')
        .select('*')
        .eq('requested_by', currentUser.id)
        .order('created_at', { ascending: false });

      if (!crError && crs) {
        setChangeRequests(crs);
      }

      setLoading(false);
    };

    checkUserAndFetch();
  }, [supabase, router]);

  const handleDelete = async (recipe: any) => {
    if (!confirm(`Apakah Anda yakin ingin mengajukan penghapusan resep "${recipe.title}"?`)) return;

    const { error } = await supabase
      .from('recipe_change_requests')
      .insert([{
        recipe_id: recipe.id,
        requested_by: user.id,
        type: 'delete',
        proposed_data: null,
        status: 'pending'
      }]);

    if (error) {
      alert('Gagal mengirim usulan penghapusan: ' + error.message);
    } else {
      alert('Usulan penghapusan berhasil dikirim.');
      // Refresh change requests
      const { data: crs } = await supabase
        .from('recipe_change_requests')
        .select('*')
        .eq('requested_by', user.id)
        .order('created_at', { ascending: false });
      if (crs) setChangeRequests(crs);
    }
  };

  const getPendingChangeRequest = (recipeId: number) => {
    return changeRequests.find(cr => Number(cr.recipe_id) === Number(recipeId) && cr.status === 'pending');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg font-sans flex flex-col transition-colors">
        <Navbar />
        <div className="flex flex-1 pt-[56px]">
          <Sidebar />
          <main className="flex-1 min-w-0 md:pl-[175px] px-6 md:px-8 bg-bg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col transition-colors">
      <Navbar />

      <div className="flex flex-1 pt-[56px]">
        <Sidebar />

        <main className="flex-1 min-w-0 md:pl-[175px] px-6 md:px-8 bg-bg">
          <div className="w-full max-w-4xl mx-auto py-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1 pb-4 border-b border-border">
              <h1
                className="text-2xl font-semibold text-ink leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Resep Saya
              </h1>
              <p className="text-xs text-ink-muted">
                Kelola resep yang telah Anda kirimkan dan pantau status persetujuannya.
              </p>
            </div>

            {recipes.length === 0 ? (
              <div className="bg-surface border border-border p-8 rounded-2xl text-center flex flex-col items-center gap-4">
                <ChefHat className="w-12 h-12 text-ink-muted" />
                <h3 className="text-base font-bold text-ink">Belum Ada Resep</h3>
                <p className="text-xs text-ink-muted max-w-sm">
                  Anda belum menulis resep di database. Mulai bagikan cita rasa Nusantara Anda sekarang!
                </p>
                <Link
                  href="/write"
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold transition-all hover:bg-primary/90"
                >
                  Tulis Resep Pertama
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recipes.map((recipe) => {
                  const pendingRequest = getPendingChangeRequest(recipe.id);
                  return (
                    <div
                      key={recipe.id}
                      className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
                    >
                      {/* Left: Info */}
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-ink leading-snug">
                            {recipe.status === 'approved' ? (
                              <Link href={`/recipes/${recipe.slug}`} className="hover:text-primary transition-colors">
                                {recipe.title}
                              </Link>
                            ) : (
                              recipe.title
                            )}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            recipe.status === 'approved' ? 'bg-primary/10 text-primary border border-primary/20' :
                            recipe.status === 'rejected' ? 'bg-accent/10 text-accent border border-accent/20' :
                            'bg-secondary/10 text-secondary border border-secondary/20'
                          }`}>
                            {recipe.status === 'approved' ? 'Publik' :
                             recipe.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                          </span>
                          
                          {pendingRequest && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                              Pending {pendingRequest.type === 'edit' ? 'Perubahan' : 'Penghapusan'}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                          {recipe.description}
                        </p>

                        {recipe.status === 'rejected' && recipe.rejection_reason && (
                          <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/10 flex items-start gap-2 mt-1">
                            <AlertCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-accent font-semibold leading-relaxed">
                              Alasan Penolakan: <span className="font-normal text-ink-muted">{recipe.rejection_reason}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <Link
                          href={`/write?edit=${recipe.slug}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border hover:border-primary hover:text-primary text-xs font-bold transition-all bg-surface cursor-pointer text-ink-muted"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(recipe)}
                          disabled={!!pendingRequest}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border hover:border-accent hover:text-accent text-xs font-bold transition-all bg-surface cursor-pointer text-ink-muted disabled:opacity-40 disabled:hover:border-border disabled:hover:text-ink-muted"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
