/*
  # Fix database schema and policies

  1. Changes
    - Add is_admin column to profiles
    - Add account column to actions
    - Add updated_at triggers to all tables

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- Add is_admin column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Add account column to actions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actions' AND column_name = 'account'
  ) THEN
    ALTER TABLE actions ADD COLUMN account text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_action_paths_updated_at'
  ) THEN
    CREATE TRIGGER update_action_paths_updated_at
      BEFORE UPDATE ON action_paths
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_actions_updated_at'
  ) THEN
    CREATE TRIGGER update_actions_updated_at
      BEFORE UPDATE ON actions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable RLS on all tables if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'action_paths' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE action_paths ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'action_path_territories' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE action_path_territories ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'action_path_products' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE action_path_products ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'actions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can manage own action paths" ON action_paths;
  DROP POLICY IF EXISTS "Users can manage territories for own action paths" ON action_path_territories;
  DROP POLICY IF EXISTS "Users can manage products for own action paths" ON action_path_products;
  DROP POLICY IF EXISTS "Users can manage own actions" ON actions;
END $$;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for action_paths
CREATE POLICY "Users can manage own action paths"
  ON action_paths FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for action_path_territories
CREATE POLICY "Users can manage territories for own action paths"
  ON action_path_territories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM action_paths
      WHERE action_paths.id = action_path_territories.action_path_id
      AND action_paths.user_id = auth.uid()
    )
  );

-- Create policies for action_path_products
CREATE POLICY "Users can manage products for own action paths"
  ON action_path_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM action_paths
      WHERE action_paths.id = action_path_products.action_path_id
      AND action_paths.user_id = auth.uid()
    )
  );

-- Create policies for actions
CREATE POLICY "Users can manage own actions"
  ON actions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);