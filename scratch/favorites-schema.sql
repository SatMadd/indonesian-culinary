-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to create the 'favorites' table and enable Row Level Security (RLS) policies.

-- Drop the table if you want to recreate it (Warning: will delete existing favorites data)
-- DROP TABLE IF EXISTS favorites;

CREATE TABLE IF NOT EXISTS favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES recipes_db(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, recipe_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Policy: Users can only insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Policy: Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Grant access permissions to authenticated users
GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;
