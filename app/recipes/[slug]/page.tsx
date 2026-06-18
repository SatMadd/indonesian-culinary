import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import RecipeDetailClient from '@/components/RecipeDetailClient';
import { FALLBACK_RECIPES } from '@/lib/data/recipes';
import { Recipe } from '@/types';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getRecipe(slug: string): Promise<Recipe | null> {
  // 1. Try finding in fallback static list first
  const fallback = FALLBACK_RECIPES.find((r) => r.slug === slug);
  if (fallback) return fallback;

  // 2. Try fetching from Supabase
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from('recipes_db')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      return data as Recipe;
    }
  } catch (err) {
    console.error('Error fetching recipe from Supabase:', err);
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  if (!recipe) {
    return {
      title: 'Resep Tidak Ditemukan | Enaknyo',
    };
  }

  return {
    title: `${recipe.title} - Resep Khas ${recipe.region} | Enaknyo`,
    description: recipe.description,
    openGraph: {
      title: `${recipe.title} - Enaknyo`,
      description: recipe.description,
      images: [
        {
          url: recipe.image_url,
          width: 800,
          height: 600,
          alt: recipe.title,
        },
      ],
    },
  };
}

export default async function RecipePage({ params }: PageProps) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans flex flex-col">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="flex flex-1 pt-[56px]">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Page Content */}
        <main className="flex-1 min-w-0 md:pl-[175px] px-6 md:px-8 bg-zinc-50/50">
          <RecipeDetailClient recipe={recipe} slug={slug} />
        </main>
      </div>
    </div>
  );
}
