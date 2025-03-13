/*
  # Initial Schema Setup for SalesV2 Kanban

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - References auth.users
      - `first_name` (text)
      - `last_name` (text)
      - `image_url` (text)
      - `is_admin` (boolean)
      - `updated_at` (timestamptz)
    
    - `action_paths`
      - `id` (uuid, primary key)
      - `name` (text)
      - `deal_size` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `action_path_territories`
      - `id` (uuid, primary key)
      - `action_path_id` (uuid, references action_paths)
      - `territory_id` (text)
    
    - `action_path_products`
      - `id` (uuid, primary key)
      - `action_path_id` (uuid, references action_paths)
      - `product_id` (text)
    
    - `actions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `target_date` (date)
      - `assigned_to` (text)
      - `action_path_id` (uuid, references action_paths)
      - `methodology` (text)
      - `source` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Set up policies for authenticated users
    - Profiles can be read by the owner
    - Action paths can be managed by their owners
    - Actions can be managed by their owners and viewed by assignees
*/

-- Drop existing objects if they exist
DO $$ 
BEGIN
  -- Drop triggers
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
  DROP TRIGGER IF EXISTS update_action_paths_updated_at ON action_paths;
  DROP TRIGGER IF EXISTS update_actions_updated_at ON actions;
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Drop functions
  DROP FUNCTION IF EXISTS update_updated_at_column();
  DROP FUNCTION IF EXISTS handle_new_user();
  
  -- Drop policies
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can manage own action paths" ON action_paths;
  DROP POLICY IF EXISTS "Users can manage territories for own action paths" ON action_path_territories;
  DROP POLICY IF EXISTS "Users can manage products for own action paths" ON action_path_products;
  DROP POLICY IF EXISTS "Users can view assigned actions" ON actions;
  DROP POLICY IF EXISTS "Users can create own actions" ON actions;
  DROP POLICY IF EXISTS "Users can update own actions" ON actions;
  DROP POLICY IF EXISTS "Users can delete own actions" ON actions;
  
  -- Drop tables
  DROP TABLE IF EXISTS actions;
  DROP TABLE IF EXISTS action_path_products;
  DROP TABLE IF EXISTS action_path_territories;
  DROP TABLE IF EXISTS action_paths;
  DROP TABLE IF EXISTS profiles;
END $$;

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  first_name text,
  last_name text,
  image_url text,
  is_admin boolean DEFAULT false,
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create action_paths table
CREATE TABLE action_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  deal_size text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE action_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own action paths"
  ON action_paths
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create action_path_territories table
CREATE TABLE action_path_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_path_id uuid REFERENCES action_paths ON DELETE CASCADE,
  territory_id text NOT NULL
);

ALTER TABLE action_path_territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage territories for own action paths"
  ON action_path_territories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM action_paths
      WHERE action_paths.id = action_path_territories.action_path_id
      AND action_paths.user_id = auth.uid()
    )
  );

-- Create action_path_products table
CREATE TABLE action_path_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_path_id uuid REFERENCES action_paths ON DELETE CASCADE,
  product_id text NOT NULL
);

ALTER TABLE action_path_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage products for own action paths"
  ON action_path_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM action_paths
      WHERE action_paths.id = action_path_products.action_path_id
      AND action_paths.user_id = auth.uid()
    )
  );

-- Create actions table
CREATE TABLE actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  target_date date NOT NULL,
  assigned_to text,
  action_path_id uuid REFERENCES action_paths ON DELETE CASCADE,
  methodology text,
  source text,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned actions"
  ON actions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    auth.uid()::text = assigned_to OR
    action_path_id IN (
      SELECT id FROM action_paths
      WHERE action_paths.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own actions"
  ON actions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
  ON actions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions"
  ON actions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_paths_updated_at
  BEFORE UPDATE ON action_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to handle new user creation
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();