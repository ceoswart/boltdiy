/*
  # Initial Schema Setup

  1. New Tables
    - profiles: User profile information
    - action_paths: Sales action path definitions
    - action_path_territories: Junction table for territories
    - action_path_products: Junction table for products
    - actions: Individual sales actions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Set up triggers for user creation

  3. Changes
    - Initial schema creation
    - Set up foreign key relationships
    - Configure row level security
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name text,
  last_name text,
  image_url text,
  is_admin boolean DEFAULT false,
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Create action paths table
CREATE TABLE IF NOT EXISTS public.action_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  deal_size text NOT NULL,
  created_by uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Create action path territories junction table
CREATE TABLE IF NOT EXISTS public.action_path_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_path_id uuid REFERENCES action_paths ON DELETE CASCADE NOT NULL,
  territory_id text NOT NULL
);

-- Create action path products junction table
CREATE TABLE IF NOT EXISTS public.action_path_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_path_id uuid REFERENCES action_paths ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL
);

-- Create actions table
CREATE TABLE IF NOT EXISTS public.actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  target_date date NOT NULL,
  assigned_to uuid REFERENCES auth.users ON DELETE SET NULL,
  action_path_id uuid REFERENCES action_paths ON DELETE CASCADE,
  methodology text,
  source text,
  created_by uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_path_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_path_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$ BEGIN
  CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Action paths policies
CREATE POLICY "Users can view own action paths"
  ON public.action_paths
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own action paths"
  ON public.action_paths
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own action paths"
  ON public.action_paths
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own action paths"
  ON public.action_paths
  FOR DELETE
  USING (auth.uid() = created_by);

-- Action path territories policies
CREATE POLICY "Users can manage territories for own action paths"
  ON public.action_path_territories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.action_paths
      WHERE id = action_path_id
      AND created_by = auth.uid()
    )
  );

-- Action path products policies
CREATE POLICY "Users can manage products for own action paths"
  ON public.action_path_products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.action_paths
      WHERE id = action_path_id
      AND created_by = auth.uid()
    )
  );

-- Actions policies
CREATE POLICY "Users can view assigned actions"
  ON public.actions
  FOR SELECT
  USING (
    auth.uid() = created_by OR
    auth.uid() = assigned_to OR
    action_path_id IN (
      SELECT id FROM public.action_paths
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create own actions"
  ON public.actions
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own actions"
  ON public.actions
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own actions"
  ON public.actions
  FOR DELETE
  USING (auth.uid() = created_by);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (new.id, '', '');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();