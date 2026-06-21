-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to add the 'user_id' column to the 'recipes_db' table.

-- 1. Add the column
ALTER TABLE recipes_db 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. (Optional) Create/update RLS policies for recipes_db to support user submissions
-- Enable RLS (already enabled, but good practice)
ALTER TABLE recipes_db ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view recipes (public read)
CREATE POLICY "Allow public read access to recipes" 
  ON recipes_db FOR SELECT 
  TO public 
  USING (true);

-- Policy: Authenticated users can insert their own recipes
CREATE POLICY "Allow authenticated users to insert recipes" 
  ON recipes_db FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can update their own recipes
CREATE POLICY "Allow users to update own recipes" 
  ON recipes_db FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can delete their own recipes
CREATE POLICY "Allow users to delete own recipes" 
  ON recipes_db FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);
