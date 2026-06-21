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
  user_id?: string;
}

export interface Favorite {
  id?: string;
  created_at?: string;
  user_id: string;
  recipe_id: number;
}
