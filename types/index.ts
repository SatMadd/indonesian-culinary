export interface Recipe {
  id?: string | number;
  created_at?: string;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  region: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  is_popular: boolean;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  user_id?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  author_name?: string | null;
}

export interface Favorite {
  id?: string;
  created_at?: string;
  user_id: string;
  recipe_id: number;
}
