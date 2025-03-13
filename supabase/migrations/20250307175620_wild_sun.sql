/*
  # Initial Schema Setup for SalesV2 Kanban

  1. Tables
    - profiles: User profiles with admin flag
    - action_paths: Sales action paths
    - actions: Individual sales actions
    - action_path_territories: Territory mappings
    - action_path_products: Product mappings
    - assignees: Team member assignments
    - tags: Action categorization
    - action_tags: Many-to-many relationship for actions and tags

  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users
    - Domain-based access control for assignees

  3. Triggers
    - Updated at timestamps
    - New user handling
*/

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing policies
DO $$ 
BEGIN
  -- Profiles policies
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  
  -- Action paths policies
  DROP POLICY IF EXISTS "Users can manage own action paths" ON action_paths;
  
  -- Action path territories policies
  DROP POLICY IF EXISTS "Users can manage territories for own action paths" ON action_path_territories;
  
  -- Action path products policies
  DROP POLICY IF EXISTS "Users can manage products for own action paths" ON action_path_products;
  
  -- Actions policies
  DROP POLICY IF EXISTS "Users can create own actions" ON actions;
  DROP POLICY IF EXISTS "Users can delete own actions" ON actions;
  DROP POLICY IF EXISTS "Users can update own actions" ON actions;
  DROP POLICY IF EXISTS "Users can view assigned actions" ON actions;
  
  -- Assignees policies
  DROP POLICY IF EXISTS "Users can view assignees" ON assignees;
  DROP POLICY IF EXISTS "Users can manage assignees in their domain" ON assignees;
  
  -- Tags policies
  DROP POLICY IF EXISTS "Users can manage own tags" ON tags;
  
  -- Action tags policies
  DROP POLICY IF EXISTS "Users can manage tags for own actions" ON action_tags;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  image_url text,
  is_admin boolean DEFAULT false,
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
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
CREATE TABLE IF NOT EXISTS action_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  deal_size text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on action_paths
ALTER TABLE action_paths ENABLE ROW LEVEL SECURITY;

-- Create policy for action_paths
CREATE POLICY "Users can manage own action paths"
  ON action_paths
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create action_path_territories table
CREATE TABLE IF NOT EXISTS action_path_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_path_id uuid REFERENCES action_paths(id) ON DELETE CASCADE,
  territory_id text NOT NULL
);

-- Enable RLS on action_path_territories
ALTER TABLE action_path_territories ENABLE ROW LEVEL SECURITY;

-- Create policy for action_path_territories
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
CREATE TABLE IF NOT EXISTS action_path_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_path_id uuid REFERENCES action_paths(id) ON DELETE CASCADE,
  product_id text NOT NULL
);

-- Enable RLS on action_path_products
ALTER TABLE action_path_products ENABLE ROW LEVEL SECURITY;

-- Create policy for action_path_products
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
CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  target_date date NOT NULL,
  assigned_to text,
  action_path_id uuid REFERENCES action_paths(id) ON DELETE CASCADE,
  methodology text,
  source text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now()),
  account text NOT NULL DEFAULT ''
);

-- Enable RLS on actions
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Create policies for actions
CREATE POLICY "Users can create own actions"
  ON actions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions"
  ON actions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
  ON actions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view assigned actions"
  ON actions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR (auth.uid())::text = assigned_to
    OR action_path_id IN (
      SELECT id FROM action_paths
      WHERE action_paths.user_id = auth.uid()
    )
  );

-- Create assignees table
CREATE TABLE IF NOT EXISTS assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  color text
);

-- Enable RLS on assignees
ALTER TABLE assignees ENABLE ROW LEVEL SECURITY;

-- Create policies for assignees
CREATE POLICY "Users can view assignees"
  ON assignees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage assignees in their domain"
  ON assignees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.email LIKE '%@' || split_part(assignees.email, '@', 2)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
      AND users.email LIKE '%@' || split_part(assignees.email, '@', 2)
    )
  );

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create policy for tags
CREATE POLICY "Users can manage own tags"
  ON tags
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create action_tags table
CREATE TABLE IF NOT EXISTS action_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid REFERENCES actions(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on action_tags
ALTER TABLE action_tags ENABLE ROW LEVEL SECURITY;

-- Create policy for action_tags
CREATE POLICY "Users can manage tags for own actions"
  ON action_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actions
      WHERE actions.id = action_tags.action_id
      AND actions.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_action_path_id ON actions(action_path_id);
CREATE INDEX IF NOT EXISTS idx_actions_assigned_to ON actions(assigned_to);
CREATE INDEX IF NOT EXISTS actions_account_idx ON actions(account);
CREATE INDEX IF NOT EXISTS idx_assignees_email_domain ON assignees(split_part(email, '@', 2));

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_action_paths_updated_at ON action_paths;
DROP TRIGGER IF EXISTS update_actions_updated_at ON actions;
DROP TRIGGER IF EXISTS update_assignees_updated_at ON assignees;
DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create updated_at triggers
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

CREATE TRIGGER update_assignees_updated_at
  BEFORE UPDATE ON assignees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, is_admin)
  VALUES (
    NEW.id,
    '',
    '',
    CASE 
      WHEN NEW.email = 'marius@7salessteps.com' THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();