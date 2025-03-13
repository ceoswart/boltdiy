/*
  # Initial Schema Setup

  1. Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `image_url` (text)
      - `is_admin` (boolean)
      - `updated_at` (timestamp)
    - `action_paths`
      - `id` (uuid)
      - `name` (text)
      - `deal_size` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `action_path_territories`
      - `id` (uuid)
      - `action_path_id` (uuid, references action_paths)
      - `territory_id` (text)
    - `action_path_products`
      - `id` (uuid)
      - `action_path_id` (uuid, references action_paths)
      - `product_id` (text)
    - `actions`
      - `id` (uuid)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `target_date` (date)
      - `assigned_to` (text)
      - `action_path_id` (uuid, references action_paths)
      - `methodology` (text)
      - `source` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text,
  last_name text,
  image_url text,
  is_admin boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Create action_paths table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.action_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  deal_size text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create action_path_territories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.action_path_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_path_id uuid NOT NULL REFERENCES action_paths ON DELETE CASCADE,
  territory_id text NOT NULL
);

-- Create action_path_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.action_path_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_path_id uuid NOT NULL REFERENCES action_paths ON DELETE CASCADE,
  product_id text NOT NULL
);

-- Create actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  target_date date NOT NULL,
  assigned_to text,
  action_path_id uuid REFERENCES action_paths ON DELETE SET NULL,
  methodology text,
  source text,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_path_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_path_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Profiles policies
  DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  
  -- Action paths policies
  DROP POLICY IF EXISTS "Users can read own action paths" ON public.action_paths;
  DROP POLICY IF EXISTS "Users can insert own action paths" ON public.action_paths;
  DROP POLICY IF EXISTS "Users can update own action paths" ON public.action_paths;
  DROP POLICY IF EXISTS "Users can delete own action paths" ON public.action_paths;
  
  -- Action path territories policies
  DROP POLICY IF EXISTS "Users can manage territories of own action paths" ON public.action_path_territories;
  
  -- Action path products policies
  DROP POLICY IF EXISTS "Users can manage products of own action paths" ON public.action_path_products;
  
  -- Actions policies
  DROP POLICY IF EXISTS "Users can read own actions" ON public.actions;
  DROP POLICY IF EXISTS "Users can insert own actions" ON public.actions;
  DROP POLICY IF EXISTS "Users can update own actions" ON public.actions;
  DROP POLICY IF EXISTS "Users can delete own actions" ON public.actions;
END $$;

-- Create new policies
-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Action paths policies
CREATE POLICY "Users can read own action paths"
  ON public.action_paths
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own action paths"
  ON public.action_paths
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own action paths"
  ON public.action_paths
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own action paths"
  ON public.action_paths
  FOR DELETE
  USING (auth.uid() = user_id);

-- Action path territories policies
CREATE POLICY "Users can manage territories of own action paths"
  ON public.action_path_territories
  FOR ALL
  USING (
    action_path_id IN (
      SELECT id FROM action_paths WHERE user_id = auth.uid()
    )
  );

-- Action path products policies
CREATE POLICY "Users can manage products of own action paths"
  ON public.action_path_products
  FOR ALL
  USING (
    action_path_id IN (
      SELECT id FROM action_paths WHERE user_id = auth.uid()
    )
  );

-- Actions policies
CREATE POLICY "Users can read own actions"
  ON public.actions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions"
  ON public.actions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
  ON public.actions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions"
  ON public.actions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at if they don't exist
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_action_paths_updated_at ON public.action_paths;
DROP TRIGGER IF EXISTS update_actions_updated_at ON public.actions;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_paths_updated_at
  BEFORE UPDATE ON public.action_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON public.actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.action_paths TO authenticated;
GRANT ALL ON public.action_path_territories TO authenticated;
GRANT ALL ON public.action_path_products TO authenticated;
GRANT ALL ON public.actions TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.action_paths TO service_role;
GRANT ALL ON public.action_path_territories TO service_role;
GRANT ALL ON public.action_path_products TO service_role;
GRANT ALL ON public.actions TO service_role;