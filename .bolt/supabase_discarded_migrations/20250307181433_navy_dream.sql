/*
  # Bookmark V1 - Working Version

  1. Schema
    - Profiles table with RLS
    - Action Paths table with RLS
    - Actions table with RLS
    - Action Path Territories table with RLS
    - Action Path Products table with RLS

  2. Security
    - Enable RLS on all tables
    - Set up policies for authenticated users
    - Ensure proper user_id constraints
*/

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_path_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_path_products ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Action Paths policies
CREATE POLICY "Users can manage own action paths"
ON public.action_paths
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Actions policies
CREATE POLICY "Users can manage own actions"
ON public.actions
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id OR 
  assigned_to = auth.jwt()->>'email' OR
  action_path_id IN (
    SELECT id FROM action_paths WHERE user_id = auth.uid()
  )
)
WITH CHECK (auth.uid() = user_id);

-- Action Path Territories policies
CREATE POLICY "Users can manage territories for own action paths"
ON public.action_path_territories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM action_paths
    WHERE action_paths.id = action_path_territories.action_path_id
    AND action_paths.user_id = auth.uid()
  )
);

-- Action Path Products policies
CREATE POLICY "Users can manage products for own action paths"
ON public.action_path_products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM action_paths
    WHERE action_paths.id = action_path_products.action_path_id
    AND action_paths.user_id = auth.uid()
  )
);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_action_paths_updated_at'
  ) THEN
    CREATE TRIGGER update_action_paths_updated_at
    BEFORE UPDATE ON action_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_actions_updated_at'
  ) THEN
    CREATE TRIGGER update_actions_updated_at
    BEFORE UPDATE ON actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;