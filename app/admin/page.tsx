import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Verify Authorization (Role === 'admin')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // 3. Query Pending New Recipes (status = 'pending' and not in pending change requests)
  // Fetch pending change requests first to extract recipe_ids to exclude
  const { data: pendingCRs } = await supabase
    .from('recipe_change_requests')
    .select('recipe_id')
    .eq('status', 'pending');
  const excludedIds = (pendingCRs ?? []).map((cr: any) => Number(cr.recipe_id));

  let recipeQuery = supabase
    .from('recipes_db')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (excludedIds.length > 0) {
    recipeQuery = recipeQuery.not('id', 'in', `(${excludedIds.join(',')})`);
  }

  const { data: pendingRecipes } = await recipeQuery;

  // 4. Query Pending Change Requests joined with original recipe info
  const { data: pendingRequests } = await supabase
    .from('recipe_change_requests')
    .select('*, recipes_db(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-bg font-sans flex flex-col transition-colors">
      <Navbar />

      <div className="flex flex-1 pt-[56px]">
        <Sidebar />

        <main className="flex-1 min-w-0 md:pl-[175px] px-6 md:px-8 bg-bg">
          <AdminDashboardClient
            pendingRecipes={pendingRecipes ?? []}
            pendingRequests={pendingRequests ?? []}
          />
        </main>
      </div>
    </div>
  );
}
